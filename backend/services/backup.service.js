
const fs = require('fs').promises;
const path = require('path');
const { dataSource } = require('../data-source');
const { getFullAppData, updateTimestamps } = require('../utils/helpers');
const { SettingEntity } = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { In } = require("typeorm");
const { version: appVersion } = require('../../../package.json');

const DATA_ROOT = path.resolve(__dirname, '..', '..', 'data');
const BACKUP_DIR = path.resolve(DATA_ROOT, 'backups');
const DB_PATH = process.env.DATABASE_PATH || path.resolve(DATA_ROOT, 'database', 'database.sqlite');
const HELP_GUIDE_PATH = path.resolve(__dirname, '..', '..', 'src', 'content', 'HelpGuide.md');


const parseBackupFilename = (filename) => {
    // Updated regex to look for a "v" before the version string for robust parsing.
    const match = filename.match(/^backup-(manual|auto-.+?)-(\d{14})-v(.+)\.(json|sqlite)$/);
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
        return backupDetails.filter(Boolean).sort((a, b) => {
            // Prioritize parsed date from filename, which is more reliable than file mtime.
            // Fallback to file modified time for older formats or parsing errors.
            const dateA = a.parsed ? new Date(a.parsed.date) : new Date(a.createdAt);
            const dateB = b.parsed ? new Date(b.parsed.date) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
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

    const version = appVersion || 'unknown';
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 14);
    // Added 'v' prefix to version for robust parsing
    const filename = `backup-${type}-${timestamp}-v${version}.${format}`;
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

const restore = async (file, actorId) => {
    console.log(`Starting restore from ${file.originalname}`);
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        const fileContent = await fs.readFile(file.path, 'utf-8');
        const data = JSON.parse(fileContent);

        await dataSource.transaction(async manager => {
            console.log('[Restore] Starting database transaction.');
            const entities = dataSource.entityMetadatas;
            await manager.query('PRAGMA foreign_keys=OFF;');
            for (const entity of entities.slice().reverse()) {
                await manager.query(`DELETE FROM \`${entity.tableName}\`;`);
            }
            console.log('[Restore] All tables cleared.');

            const saveData = async (repoName, items) => {
                if (!items || items.length === 0) return;
                const repo = manager.getRepository(repoName);
                await repo.save(items, { chunk: 100 });
            };
            
            // Insert data in order of dependency
            if (data.users) await saveData('User', data.users.map(({guildIds, ...u}) => u));
            if (data.rewardTypes) await saveData('RewardTypeDefinition', data.rewardTypes);
            if (data.ranks) await saveData('Rank', data.ranks);
            if (data.trophies) await saveData('Trophy', data.trophies);
            if (data.themes) await saveData('ThemeDefinition', data.themes);
            if (data.questGroups) await saveData('QuestGroup', data.questGroups);
            if (data.markets) await saveData('Market', data.markets);
            if (data.minigames) await saveData('Minigame', data.minigames);
            if (data.modifierDefinitions) await saveData('ModifierDefinition', data.modifierDefinitions);
            if (data.rotations) await saveData('Rotation', data.rotations);
            if (data.scheduledEvents) await saveData('ScheduledEvent', data.scheduledEvents);
            if (data.bugReports) await saveData('BugReport', data.bugReports);

            if (data.guilds) {
                for(const guild of data.guilds) {
                    const { memberIds, ...guildData } = guild;
                    const newGuild = manager.create('Guild', guildData);
                    if(memberIds) newGuild.members = await manager.findBy('User', {id: In(memberIds)});
                    await manager.save(newGuild);
                }
            }
            if (data.gameAssets) await saveData('GameAsset', data.gameAssets);
            if (data.quests) {
                for(const quest of data.quests) {
                    const { assignedUserIds, ...questData } = quest;
                    const newQuest = manager.create('Quest', questData);
                    if(assignedUserIds) newQuest.assignedUsers = await manager.findBy('User', {id: In(assignedUserIds)});
                    await manager.save(newQuest);
                }
            }
            
            if (data.questCompletions) {
                const qcs = data.questCompletions.map(qc => ({...qc, user: {id: qc.userId}, quest: {id: qc.questId}}));
                await saveData('QuestCompletion', qcs);
            }
            if (data.purchaseRequests) await saveData('PurchaseRequest', data.purchaseRequests);
            if (data.userTrophies) await saveData('UserTrophy', data.userTrophies);
            if (data.adminAdjustments) await saveData('AdminAdjustment', data.adminAdjustments);
            if (data.appliedModifiers) await saveData('AppliedModifier', data.appliedModifiers);
            if (data.tradeOffers) await saveData('TradeOffer', data.tradeOffers);
            if (data.gifts) await saveData('Gift', data.gifts);
            if (data.gameScores) await saveData('GameScore', data.gameScores);
            if (data.systemLogs) await saveData('SystemLog', data.systemLogs);
            if (data.chatMessages) await saveData('ChatMessage', data.chatMessages);
            if (data.systemNotifications) await saveData('SystemNotification', data.systemNotifications);
            if (data.chronicleEvents) await saveData('ChronicleEvent', data.chronicleEvents);
            
            if (data.settings) await manager.save('Setting', { id: 1, settings: data.settings });
            if (data.loginHistory) await manager.save('LoginHistory', { id: 1, history: data.loginHistory });
            
            await manager.query('PRAGMA foreign_keys=ON;');
        });
        
    } else if (file.originalname.endsWith('.sqlite')) {
        if(dataSource.isInitialized) await dataSource.destroy();
        await fs.copyFile(file.path, DB_PATH);
        await dataSource.initialize(); // Reconnect to the new DB file
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
            if (!backup.parsed) return false;
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