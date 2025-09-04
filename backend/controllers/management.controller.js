
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // For sync operations
const fsp = require('fs').promises; // For async operations
const { asyncMiddleware, logAdminAction } = require('../utils/helpers');
const backupService = require('../services/backup.service');
const rotationService = require('../services/rotation.service');
const { dataSource } = require('../data-source');

// === Paths Configuration ===
const DATA_ROOT = path.resolve(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.resolve(DATA_ROOT, 'assets');
const MEDIA_DIR = process.env.CONTAINER_MEDIA_PATH || '/app/media';
const ASSET_PACKS_DIR = path.resolve(DATA_ROOT, 'asset_packs');

// === Multer Configuration ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.params.category || req.body.category || 'Miscellaneous';
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
        const finalDir = path.join(UPLOADS_DIR, sanitizedCategory);
        try {
            fs.mkdirSync(finalDir, { recursive: true });
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
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// --- Scheduled Backups ---
const runScheduledBackups = () => {
    backupService.runScheduled().catch(err => {
        console.error("[Controller] Error during automated backup execution:", err);
    });
};

// --- Scheduled Rotations ---
const runScheduledRotations = () => {
    rotationService.runAllScheduled().catch(err => {
        console.error("[Controller] Error during automated rotation execution:", err);
    });
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
    const files = await fsp.readdir(ASSET_PACKS_DIR);
    const packInfos = [];
    for (const file of files) {
        if (path.extname(file) === '.json') {
            try {
                const filePath = path.join(ASSET_PACKS_DIR, file);
                const content = await fsp.readFile(filePath, 'utf-8');
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
        await fsp.access(filePath);
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
                await fsp.access(localPath);
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
            await fsp.mkdir(categoryDir, { recursive: true });
            const localPath = path.join(categoryDir, file.name);
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to download ${file.name}`);
            
            const buffer = Buffer.from(await response.arrayBuffer());
            await fsp.writeFile(localPath, buffer);
        } catch (err) {
            console.error(`Failed to import ${file.name}:`, err);
        }
    }
    res.status(204).send();
};

// --- Backups ---
const getBackups = async (req, res) => {
    const backups = await backupService.list();
    res.json(backups);
};

const createJsonBackup = async (req, res) => {
    const { actorId } = req.body;
    const backup = await backupService.create('json', 'manual', actorId);
    res.status(201).json({ message: 'JSON backup created.', filename: backup.filename });
};

const createSqliteBackup = async (req, res) => {
    const { actorId } = req.body;
    const backup = await backupService.create('sqlite', 'manual', actorId);
    res.status(201).json({ message: 'SQLite backup created.', filename: backup.filename });
};

const downloadBackup = async (req, res) => {
    const { filename } = req.params;
    const filePath = await backupService.getFilePath(filename);
    if (filePath) {
        res.download(filePath);
    } else {
        res.status(404).send('Backup not found.');
    }
};

const deleteBackup = async (req, res) => {
    const { filename } = req.params;
    await backupService.remove(filename);
    res.status(204).send();
};

const bulkDeleteBackups = async (req, res) => {
    const { filenames } = req.body;
    await backupService.removeMany(filenames);
    res.status(204).send();
};

const restoreFromBackup = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file provided.' });
    const { actorId } = req.body;
    await backupService.restore(req.file, actorId);
    res.json({ message: 'Restore successful! The application will now reload.' });
};


// --- Media ---
const getLocalGallery = async (req, res) => {
    const gallery = [];
    const readDirRecursive = async (dir, category) => {
        try {
            const files = await fsp.readdir(dir, { withFileTypes: true });
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
    const category = req.params.category || req.body.category || 'Miscellaneous';
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
    const url = `/uploads/${sanitizedCategory}/${req.file.filename}`;
    res.status(201).json({ url });
};

const browseMedia = async (req, res) => {
    const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.ogg'];
    const MAX_RECURSION_DEPTH = 15;
    const files = [];

    const readDirRecursive = async (currentDir, relativePath, depth) => {
        if (depth > MAX_RECURSION_DEPTH) {
            console.warn(`[Media Browser] Reached max directory depth of ${MAX_RECURSION_DEPTH} at ${currentDir}. Aborting this branch to prevent hangs.`);
            return;
        }
        try {
            const entries = await fsp.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isSymbolicLink()) {
                    continue; // Skip symbolic links to prevent potential infinite loops
                }
                const fullEntryPath = path.join(currentDir, entry.name);
                const newRelativePath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    await readDirRecursive(fullEntryPath, newRelativePath, depth + 1);
                } else if (VIDEO_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
                    files.push(`/media${newRelativePath.replace(/\\/g, '/')}`);
                }
            }
        } catch (error) {
            // If MEDIA_DIR doesn't exist, it's not a server error, just return an empty list.
            if (error.code !== 'ENOENT') {
                console.error(`Error reading media directory ${currentDir}:`, error);
                // To avoid breaking the client, we'll just log and continue.
            }
        }
    };
    
    await readDirRecursive(MEDIA_DIR, '/', 0);
    res.json(files);
};


module.exports = {
    // Other exports for different routers
    upload: upload.single('file'),
    discoverAssetPacks: asyncMiddleware(discoverAssetPacks),
    getAssetPack: asyncMiddleware(getAssetPack),
    fetchRemoteAssetPack: asyncMiddleware(fetchRemoteAssetPack),
    discoverImagePacks: asyncMiddleware(discoverImagePacks),
    getImagePackDetails: asyncMiddleware(getImagePackDetails),
    importImagePack: asyncMiddleware(importImagePack),
    getLocalGallery: asyncMiddleware(getLocalGallery),
    uploadMedia: asyncMiddleware(uploadMedia),
    browseMedia: asyncMiddleware(browseMedia),
    // Backup exports
    runScheduledBackups,
    runScheduledRotations,
    getBackups: asyncMiddleware(getBackups),
    createJsonBackup: asyncMiddleware(createJsonBackup),
    createSqliteBackup: asyncMiddleware(createSqliteBackup),
    downloadBackup: asyncMiddleware(downloadBackup),
    deleteBackup: asyncMiddleware(deleteBackup),
    bulkDeleteBackups: asyncMiddleware(bulkDeleteBackups),
    restoreFromBackup: asyncMiddleware(restoreFromBackup),
};
