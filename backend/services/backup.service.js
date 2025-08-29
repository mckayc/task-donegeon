

const fs = require('fs').promises;
const path = require('path');
const { dataSource } = require('../data-source');
const { getFullAppData, updateTimestamps } = require('../utils/helpers');
const { SettingEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');

const DATA_ROOT = path.resolve(__dirname, '..', '..', 'data');
const BACKUP_DIR = path.resolve(DATA_ROOT, 'backups');
const DB_PATH = process.env.DATABASE_PATH || path.resolve(DATA_ROOT, 'database', 'database.sqlite');
const HELP_GUIDE_PATH = path.resolve(__dirname, '..', '..', 'src', 'content', 'HelpGuide.md');


const parseBackupFilename = (filename) => {
    const match = filename.match(/^backup-(manual|auto-.+?)-(\d{14})-(.+)\.(json|sqlite)$/);
    if (!match) return null;
    
    const [_, type, timestamp, version, format] = match;
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);

    return {
        date: `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`,
        version,
        type,
        format,
    };
};

const list = async () => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupDetails = await Promise.all(files.map(async (filename) => {
            if (filename.startsWith('backup-') && (filename.endsWith('.json') || filename.endsWith('.sqlite'))) {
                const filePath = path.join(BACKUP_DIR, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    size: stats.size,
                    createdAt: stats.mtime.toISOString(),
                    parsed: parseBackupFilename(filename),
                };
            }
            return null;
        }));
        return backupDetails.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(BACKUP_DIR, { recursive: true });
            return [];
        }
        throw err;
    }
};

const create = async (format, type = 'manual') => {
    const manager = dataSource.manager;
    const settings = (await manager.findOneBy(SettingEntity, { id: 1 }))?.settings || {};
    const version = settings.contentVersion || 'unknown';

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const filename = `backup-${type}-${timestamp}-${version}.${format}`;
    const filePath = path.join(BACKUP_DIR, filename);

    if (format === 'json') {
        const appData = await getFullAppData(manager);
        try {
            appData.helpGuideContent = await fs.readFile(HELP_GUIDE_PATH, 'utf-8');
        } catch (err) {
            console.warn("Could not read HelpGuide.md during backup:", err.message);
            appData.helpGuideContent = '# Help Guide could not be backed up.';
        }
        await fs.writeFile(filePath, JSON.stringify(appData, null, 2));
    } else if (format === 'sqlite') {
        await fs.copyFile(DB_PATH, filePath);
    } else {
        throw new Error('Unsupported backup format');
    }

    console.log(`Backup created: ${filename}`);
    updateEmitter.emit('update');
    return { filename, filePath };
};

const remove = async (filename) => {
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) throw new Error('Invalid filename');
    const filePath = path.join(BACKUP_DIR, safeFilename);
    await fs.unlink(filePath);
    console.log(`Backup deleted: ${filename}`);
    updateEmitter.emit('update');
};

const removeMany = async (filenames) => {
    for (const filename of filenames) {
        await remove(filename);
    }
};

const restore = async (file) => {
    console.log(`Starting restore from ${file.originalname}`);
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        const fileContent = await fs.readFile(file.path, 'utf-8');
        const parsedData = JSON.parse(fileContent);

        if (parsedData.helpGuideContent) {
            try {
                await fs.writeFile(HELP_GUIDE_PATH, parsedData.helpGuideContent, 'utf-8');
                console.log("[Restore] HelpGuide.md restored successfully.");
            } catch (err) {
                console.error("Failed to restore HelpGuide.md:", err);
                // Do not throw; continue with DB restore
            }
        }
        // Complex restore logic for JSON database would go here
        console.log("JSON restore is a complex operation and is placeholder for now for database.");

    } else if (file.originalname.endsWith('.sqlite')) {
        await dataSource.destroy();
        await fs.copyFile(file.path, DB_PATH);
    } else {
        throw new Error('Unsupported backup file type.');
    }
    await fs.unlink(file.path);
    updateEmitter.emit('update');
    console.log('Restore completed.');
};

const runScheduled = async () => {
    const manager = dataSource.manager;
    const settingsRow = await manager.findOneBy(SettingEntity, { id: 1 });
    const settings = settingsRow?.settings;
    if (!settings?.automatedBackups?.enabled) return;

    // --- Per-schedule backup and cleanup ---
    for (const schedule of settings.automatedBackups.schedules) {
        const now = Date.now();
        const frequencyMs = schedule.frequency * (
            schedule.unit === 'weeks' ? 7 * 24 * 60 * 60 * 1000 :
            schedule.unit === 'days' ? 24 * 60 * 60 * 1000 :
            60 * 60 * 1000
        );
        
        if (!schedule.lastBackupTimestamp || (now - schedule.lastBackupTimestamp > frequencyMs)) {
            console.log(`Running scheduled backup: ${schedule.id}`);
            const formats = settings.automatedBackups.format;
            if (formats === 'both' || formats === 'json') await create('json', `auto-${schedule.id}`);
            if (formats === 'both' || formats === 'sqlite') await create('sqlite', `auto-${schedule.id}`);
            
            schedule.lastBackupTimestamp = now;
            await manager.save(SettingEntity, updateTimestamps({ id: 1, settings }));
            
            const allBackups = await list();
            const scheduleBackups = allBackups.filter(b => b.parsed?.type === `auto-${schedule.id}`);
            if (scheduleBackups.length > schedule.maxBackups) {
                const toDelete = scheduleBackups.slice(schedule.maxBackups);
                await removeMany(toDelete.map(b => b.filename));
            }
        }
    }

    // --- Global Orphaned Backup Cleanup ---
    console.log('[Backup Service] Starting orphaned backup cleanup...');
    const currentScheduleIds = new Set(settings.automatedBackups.schedules.map(s => s.id));
    const allBackups = await list();
    const allAutoBackups = allBackups.filter(b => b.parsed?.type && b.parsed.type.startsWith('auto-'));
    
    const orphansToDelete = allAutoBackups
        .filter(backup => {
            const scheduleId = backup.parsed.type.substring(5); // remove 'auto-'
            return !currentScheduleIds.has(scheduleId);
        })
        .map(b => b.filename);

    if (orphansToDelete.length > 0) {
        console.log(`[Backup Service] Found ${orphansToDelete.length} orphaned backups to delete.`);
        await removeMany(orphansToDelete);
    } else {
        console.log('[Backup Service] No orphaned backups found.');
    }
};

const getFilePath = async (filename) => {
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) return null;
    const filePath = path.join(BACKUP_DIR, safeFilename);
    try {
        await fs.access(filePath);
        return filePath;
    } catch {
        return null;
    }
};

module.exports = {
    list, create, remove, removeMany, restore, runScheduled, getFilePath,
};