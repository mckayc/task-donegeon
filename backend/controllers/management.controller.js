const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { dataSource } = require('../data-source');
const { SettingEntity, allEntities } = require('../entities');
const { asyncMiddleware, getFullAppData } = require('../utils/helpers');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');

// === Multer Configuration ===
const UPLOADS_DIR = '/app/data/assets';
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        const finalDir = path.join(UPLOADS_DIR, sanitizedCategory);
        try {
            await fs.mkdir(finalDir, { recursive: true });
            cb(null, finalDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const restoreUpload = multer({ dest: '/tmp/' });

// === Backup/Asset Dirs ===
const BACKUP_DIR = '/app/data/backups';
const ASSET_PACKS_DIR = '/app/data/asset_packs';
const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';


// --- Scheduled Backups ---
const runScheduledBackups = async () => {
    try {
        const manager = dataSource.manager;
        const settingsRow = await manager.findOneBy(SettingEntity, { id: 1 });
        if (!settingsRow || !settingsRow.settings.automatedBackups?.enabled) {
            return;
        }

        const { schedules, format } = settingsRow.settings.automatedBackups;
        const now = Date.now();
        let settingsChanged = false;

        for (const schedule of schedules) {
            const frequencyMs = schedule.frequency * (schedule.unit === 'hours' ? 3600000 : schedule.unit === 'days' ? 86400000 : 604800000);
            const lastBackup = schedule.lastBackupTimestamp || 0;

            if (now - lastBackup > frequencyMs) {
                console.log(`[Backup] Running automated backup for schedule: ${schedule.id}`);
                const version = settingsRow.settings.contentVersion || 1;
                const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
                
                if (format === 'json' || format === 'both') {
                    const filename = `backup-auto-${schedule.id}-${timestamp}-v${version}.json`;
                    const filePath = path.join(BACKUP_DIR, filename);
                    const appData = await getFullAppData(manager);
                    await fs.writeFile(filePath, JSON.stringify(appData, null, 2));
                }
                if (format === 'sqlite' || format === 'both') {
                    const filename = `backup-auto-${schedule.id}-${timestamp}-v${version}.sqlite`;
                    const filePath = path.join(BACKUP_DIR, filename);
                    await fs.copyFile(dbPath, filePath);
                }

                schedule.lastBackupTimestamp = now;
                settingsChanged = true;

                const allBackups = await fs.readdir(BACKUP_DIR);
                const scheduleBackups = allBackups
                    .filter(file => file.startsWith(`backup-auto-${schedule.id}`))
                    .sort().reverse();

                if (scheduleBackups.length > schedule.maxBackups) {
                    const backupsToDelete = scheduleBackups.slice(schedule.maxBackups);
                    for (const fileToDelete of backupsToDelete) {
                        await fs.unlink(path.join(BACKUP_DIR, fileToDelete));
                        console.log(`[Backup] Cleaned up old backup: ${fileToDelete}`);
                    }
                }
            }
        }

        if (settingsChanged) {
            await manager.save(SettingEntity, updateTimestamps({ id: 1, settings: settingsRow.settings }));
        }
    } catch (err) {
        console.error("[Backup] Error during automated backup:", err);
    }
};


// --- Asset Packs ---
const createAssetPackSummary = (pack) => {
    const summary = {
        quests: [], gameAssets: [], trophies: [], users: [], markets: [],
        ranks: [], rewardTypes: [], questGroups: [],
    };
    if (!pack.assets) return summary;

    summary.quests = (pack.assets.quests || []).map(q => ({ title: q.title, icon: q.icon, description: q.description }));
    summary.gameAssets = (pack.assets.gameAssets || []).map(a => ({ name: a.name, icon: a.icon, description: a.description }));
    summary.trophies = (pack.assets.trophies || []).map(t => ({ name: t.name, icon: t.icon, description: t.description }));
    summary.users = (pack.assets.users || []).map(u => ({ gameName: u.gameName, role: u.role }));
    summary.markets = (pack.assets.markets || []).map(m => ({ title: m.title, icon: m.icon, description: m.description }));
    summary.ranks = (pack.assets.ranks || []).map(r => ({ name: r.name, icon: r.icon }));
    summary.rewardTypes = (pack.assets.rewardTypes || []).map(rt => ({ name: rt.name, icon: rt.icon, description: rt.description }));
    summary.questGroups = (pack.assets.questGroups || []).map(qg => ({ name: qg.name, icon: qg.icon, description: qg.description }));

    return summary;
};

const discoverAssetPacks = async (req, res) => {
    const files = await fs.readdir(ASSET_PACKS_DIR);
    const packInfos = [];
    for (const file of files) {
        if (path.extname(file) === '.json') {
            try {
                const filePath = path.join(ASSET_PACKS_DIR, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const pack = JSON.parse(content);
                if (pack.manifest && pack.assets) {
                    packInfos.push({
                        manifest: pack.manifest,
                        filename: file,
                        summary: createAssetPackSummary(pack)
                    });
                }
            } catch (err) {
                console.error(`Error processing asset pack ${file}:`, err);
            }
        }
    }
    res.json(packInfos);
};

const getAssetPack = async (req, res) => {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
        return res.status(400).json({ error: 'Invalid filename.' });
    }
    const filePath = path.join(ASSET_PACKS_DIR, safeFilename);
    try {
        await fs.access(filePath);
        res.sendFile(filePath);
    } catch (err) {
        res.status(404).json({ error: 'Asset pack not found.' });
    }
};

const fetchRemoteAssetPack = async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from URL with status ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching remote asset pack:', err);
        res.status(500).json({ error: 'Failed to fetch or parse remote asset pack.' });
    }
};

// --- Image Packs ---
const discoverImagePacks = async (req, res) => {
    const GITHUB_REPO_URL = 'https://api.github.com/repos/google/codewithme-task-donegeon/contents/public/images/packs';
    const response = await fetch(GITHUB_REPO_URL);
    if (!response.ok) throw new Error('Failed to fetch image packs from GitHub');
    const data = await response.json();
    const packs = data
        .filter(item => item.type === 'dir')
        .map(dir => ({
            name: dir.name,
            sampleImageUrl: `https://raw.githubusercontent.com/google/codewithme-task-donegeon/main/public/images/packs/${dir.name}/sample.png`
        }));
    res.json(packs);
};

const getImagePackDetails = async (req, res) => {
    const GITHUB_REPO_URL = 'https://api.github.com/repos/google/codewithme-task-donegeon/contents/public/images/packs';
    const { packName } = req.params;
    const safePackName = path.basename(packName);
    const packUrl = `${GITHUB_REPO_URL}/${safePackName}`;
    const response = await fetch(packUrl);
    if (!response.ok) throw new Error(`Failed to fetch pack details for ${safePackName}`);
    const filesData = await response.json();
    
    const packFiles = await Promise.all(filesData
        .filter(item => item.type === 'file' && item.name !== 'sample.png')
        .map(async file => {
            const localPath = path.join(UPLOADS_DIR, safePackName, file.name);
            let exists = false;
            try {
                await fs.access(localPath);
                exists = true;
            } catch { /* File doesn't exist locally */ }
            return {
                name: file.name,
                category: safePackName,
                url: file.download_url,
                exists
            };
        }));
    res.json(packFiles);
};

const importImagePack = async (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'Invalid files data.' });
    for (const file of files) {
        try {
            const categoryDir = path.join(UPLOADS_DIR, file.category);
            await fs.mkdir(categoryDir, { recursive: true });
            const localPath = path.join(categoryDir, file.name);
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to download ${file.name}`);
            
            const buffer = Buffer.from(await response.arrayBuffer());
            await fs.writeFile(localPath, buffer);
        } catch (err) {
            console.error(`Failed to import ${file.name}:`, err);
        }
    }
    res.status(204).send();
};

// --- Backups ---
const parseBackupFilename = (filename) => {
    const match = filename.match(/backup-(manual|auto-.+?)-(.+?)-v(\d+)\.(json|sqlite)/);
    if (!match) return null;
    return {
        type: match[1],
        date: new Date(match[2].replace(/_/g, 'T').replace(/-/g, ':')).toISOString(),
        version: match[3],
        format: match[4],
    };
};

const getBackups = async (req, res) => {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    const backupInfos = await Promise.all(files.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
            filename: file,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
            parsed: parseBackupFilename(file),
        };
    }));
    backupInfos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(backupInfos);
};

const createJsonBackup = async (req, res) => {
    const manager = dataSource.manager;
    const appData = await getFullAppData(manager);
    const version = appData.settings?.contentVersion || 1;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const filename = `backup-manual-${timestamp}-v${version}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(appData, null, 2));
    res.status(201).json({ message: 'JSON backup created.', filename });
};

const createSqliteBackup = async (req, res) => {
    const manager = dataSource.manager;
    const settingsRow = await manager.findOneBy(SettingEntity, { id: 1 });
    const version = settingsRow?.settings?.contentVersion || 1;
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
    const filename = `backup-manual-${timestamp}-v${version}.sqlite`;
    const filePath = path.join(BACKUP_DIR, filename);
    await fs.copyFile(dbPath, filePath);
    res.status(201).json({ message: 'SQLite backup created.', filename });
};

const downloadBackup = async (req, res) => {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) return res.status(400).send('Invalid filename.');
    const filePath = path.join(BACKUP_DIR, safeFilename);
    try {
        await fs.access(filePath);
        res.download(filePath);
    } catch (err) {
        res.status(404).send('Backup not found.');
    }
};

const deleteBackup = async (req, res) => {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) return res.status(400).send('Invalid filename.');
    const filePath = path.join(BACKUP_DIR, safeFilename);
    try {
        await fs.unlink(filePath);
        res.status(204).send();
    } catch (err) {
        res.status(404).send('Backup not found.');
    }
};

const bulkDeleteBackups = async (req, res) => {
    const { filenames } = req.body;
    if (!filenames || !Array.isArray(filenames)) {
        return res.status(400).json({ error: 'Expected an array of filenames.' });
    }
    for (const filename of filenames) {
        const safeFilename = path.basename(filename);
        if (safeFilename !== filename) {
             console.warn(`Skipping invalid filename during bulk delete: ${filename}`);
             continue;
        }
        const filePath = path.join(BACKUP_DIR, safeFilename);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            if (err.code !== 'ENOENT') console.error(`Error deleting file ${safeFilename}:`, err);
        }
    }
    updateEmitter.emit('update');
    res.status(204).send();
};

const restoreFromBackup = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file provided.' });
    if (dataSource.isInitialized) await dataSource.destroy();
    if (req.file.originalname.endsWith('.sqlite')) {
        await fs.copyFile(req.file.path, dbPath);
    } else {
        await fs.unlink(dbPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
        await dataSource.initialize();
        const manager = dataSource.manager;
        const backupContent = await fs.readFile(req.file.path, 'utf-8');
        const backupData = JSON.parse(backupContent);
        
        for (const entity of allEntities) {
            const repo = manager.getRepository(entity);
            const pluralName = entity.options.name.toLowerCase() + 's';
            if (backupData[pluralName]) await repo.save(backupData[pluralName]);
        }
        if (backupData.settings) await manager.save(SettingEntity, { id: 1, settings: backupData.settings });
        if (backupData.loginHistory) await manager.save('LoginHistory', { id: 1, history: backupData.loginHistory });
    }
    await fs.unlink(req.file.path);
    res.json({ message: 'Restore successful! The application will now reload.' });
};

// --- Media ---
const getLocalGallery = async (req, res) => {
    const gallery = [];
    const readDirRecursive = async (dir, category) => {
        try {
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    await readDirRecursive(fullPath, file.name);
                } else if (!file.name.startsWith('.')) {
                    gallery.push({
                        url: `/uploads/${category ? `${category}/` : ''}${file.name}`,
                        category: category || 'Miscellaneous',
                        name: file.name,
                    });
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') console.error(`Error reading directory ${dir}:`, error);
        }
    };
    await readDirRecursive(UPLOADS_DIR, '');
    res.json(gallery);
};

const uploadMedia = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const category = req.body.category || 'Miscellaneous';
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
    const url = `/uploads/${sanitizedCategory}/${req.file.filename}`;
    res.status(201).json({ url });
};

module.exports = {
    runScheduledBackups,
    upload: upload.single('file'),
    restoreUpload: restoreUpload.single('backupFile'),
    discoverAssetPacks: asyncMiddleware(discoverAssetPacks),
    getAssetPack: asyncMiddleware(getAssetPack),
    fetchRemoteAssetPack: asyncMiddleware(fetchRemoteAssetPack),
    discoverImagePacks: asyncMiddleware(discoverImagePacks),
    getImagePackDetails: asyncMiddleware(getImagePackDetails),
    importImagePack: asyncMiddleware(importImagePack),
    getBackups: asyncMiddleware(getBackups),
    createJsonBackup: asyncMiddleware(createJsonBackup),
    createSqliteBackup: asyncMiddleware(createSqliteBackup),
    downloadBackup: asyncMiddleware(downloadBackup),
    deleteBackup: asyncMiddleware(deleteBackup),
    bulkDeleteBackups: asyncMiddleware(bulkDeleteBackups),
    restoreFromBackup: asyncMiddleware(restoreFromBackup),
    getLocalGallery: asyncMiddleware(getLocalGallery),
    uploadMedia: asyncMiddleware(uploadMedia),
};
