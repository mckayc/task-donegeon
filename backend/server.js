require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS } = require('./initialData');
const { allEntities } = require('./entities');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === WebSocket Logic ===
wss.on('connection', ws => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => console.log('Client disconnected from WebSocket'));
});

const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// === Gemini AI Client ===
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set. AI features will be disabled.");
}

// === Multer Configuration for File Uploads ===
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

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// === Backup Configuration ===
const BACKUP_DIR = '/app/data/backups';

// === Database Initialization and Server Start ===
const initializeApp = async () => {
    await ensureDatabaseDirectoryExists();
    await dataSource.initialize();
    console.log("Data Source has been initialized!");

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log(`Asset directory is ready at: ${UPLOADS_DIR}`);
    console.log(`Backup directory is ready at: ${BACKUP_DIR}`);

    server.listen(port, () => {
        console.log(`Task Donegeon backend listening at http://localhost:${port}`);
        // Start automated backup timer (checks every 30 minutes)
        setInterval(runAutomatedBackup, 30 * 60 * 1000);
    });
};

initializeApp().catch(err => {
    console.error("Critical error during application initialization:", err);
    process.exit(1);
});

// === Helper to construct the full app data state from DB ===
const getFullAppData = async (manager) => {
    const data = {};
    for (const entity of allEntities) {
        const repo = manager.getRepository(entity.target);
        // Special handling for singleton entities
        if (entity.targetName === 'Setting') {
            const settingRow = await repo.findOneBy({ id: 1 });
            data.settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;
        } else if (entity.targetName === 'LoginHistory') {
            const historyRow = await repo.findOneBy({ id: 1 });
            data.loginHistory = historyRow ? historyRow.history : [];
        } else {
            // Pluralize table name for key
            const key = entity.tableName.endsWith('s') ? entity.tableName : `${entity.tableName}s`;
            // Simple mapping for now
            const simpleKey = {
                'users': 'users', 'quests': 'quests', 'quest_groups': 'questGroups', 'markets': 'markets',
                'reward_types': 'rewardTypes', 'quest_completions': 'questCompletions',
                'purchase_requests': 'purchaseRequests', 'guilds': 'guilds', 'ranks': 'ranks',
                'trophies': 'trophies', 'user_trophies': 'userTrophies', 'admin_adjustments': 'adminAdjustments',
                'game_assets': 'gameAssets', 'system_logs': 'systemLogs', 'themes': 'themes',
                'chat_messages': 'chatMessages', 'system_notifications': 'systemNotifications',
                'scheduled_events': 'scheduledEvents'
            }[entity.tableName] || entity.tableName;

            data[simpleKey] = await repo.find();
        }
    }
    return data;
};

// === API ROUTES ===

// Load data
app.get('/api/data/load', async (req, res, next) => {
    try {
        const userRepo = dataSource.getRepository('User');
        const userCount = await userRepo.count();

        if (userCount === 0) {
            console.log("No users found, triggering first run.");
            const initialData = {};
            for (const entity of allEntities) {
                const simpleKey = {
                    'users': 'users', 'quests': 'quests', 'quest_groups': 'questGroups', 'markets': 'markets',
                    'reward_types': 'rewardTypes', 'quest_completions': 'questCompletions',
                    'purchase_requests': 'purchaseRequests', 'guilds': 'guilds', 'ranks': 'ranks',
                    'trophies': 'trophies', 'user_trophies': 'userTrophies', 'admin_adjustments': 'adminAdjustments',
                    'game_assets': 'gameAssets', 'system_logs': 'systemLogs', 'themes': 'themes',
                    'chat_messages': 'chatMessages', 'system_notifications': 'systemNotifications',
                    'scheduled_events': 'scheduledEvents'
                }[entity.tableName] || entity.tableName;
                if (simpleKey !== 'settings' && simpleKey !== 'login_history') {
                    initialData[simpleKey] = [];
                }
            }
             initialData.settings = { ...INITIAL_SETTINGS, contentVersion: 0 };
             initialData.loginHistory = [];

            return res.status(200).json(initialData);
        }

        const appData = await getFullAppData(dataSource.manager);
        res.status(200).json(appData);
    } catch (err) {
        console.error(`ERROR in GET /api/data/load:`, err);
        next(err);
    }
});

// Save data
app.post('/api/data/save', async (req, res, next) => {
    const data = req.body;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        for (const entity of allEntities) {
            const repo = queryRunner.manager.getRepository(entity.target);
            const simpleKey = {
                'users': 'users', 'quests': 'quests', 'quest_groups': 'questGroups', 'markets': 'markets',
                'reward_types': 'rewardTypes', 'quest_completions': 'questCompletions',
                'purchase_requests': 'purchaseRequests', 'guilds': 'guilds', 'ranks': 'ranks',
                'trophies': 'trophies', 'user_trophies': 'userTrophies', 'admin_adjustments': 'adminAdjustments',
                'game_assets': 'gameAssets', 'system_logs': 'systemLogs', 'themes': 'themes',
                'chat_messages': 'chatMessages', 'system_notifications': 'systemNotifications',
                'scheduled_events': 'scheduledEvents',
                'settings': 'settings', 'login_history': 'loginHistory'
            }[entity.tableName];

            if (!simpleKey || !data.hasOwnProperty(simpleKey)) continue;

            if (entity.targetName === 'Setting') {
                await repo.save({ id: 1, settings: data.settings });
            } else if (entity.targetName === 'LoginHistory') {
                await repo.save({ id: 1, history: data.loginHistory });
            } else {
                const itemsFromFrontend = data[simpleKey];
                const currentIds = (await repo.find({ select: { id: true } })).map(item => item.id);
                const frontendIds = new Set(itemsFromFrontend.map(item => item.id));
                const idsToDelete = currentIds.filter(id => !frontendIds.has(id));
                
                if (idsToDelete.length > 0) {
                    await repo.delete(idsToDelete);
                }
                if (itemsFromFrontend.length > 0) {
                    await repo.save(itemsFromFrontend);
                }
            }
        }

        await queryRunner.commitTransaction();
        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json({ message: 'Data saved successfully.' });
    } catch (err) {
        await queryRunner.rollbackTransaction();
        console.error(`ERROR in POST /api/data/save:`, err);
        next(err);
    } finally {
        await queryRunner.release();
    }
});


// Media Upload
app.post('/api/media/upload', upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    try {
        const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
        const fileUrl = `/uploads/${relativePath}`;
        res.status(201).json({ url: fileUrl, name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
    } catch (err) {
        next(err);
    }
});

// Local Image Gallery
app.get('/api/media/local-gallery', async (req, res, next) => {
    const walk = async (dir, parentCategory = null) => {
        let dirents;
        try {
            dirents = await fs.readdir(dir, { withFileTypes: true });
        } catch (e) {
            return []; // Dir doesn't exist, return empty
        }
        let imageFiles = [];
        for (const dirent of dirents) {
            const fullPath = path.join(dir, dirent.name);
            if (dirent.isDirectory()) {
                imageFiles.push(...await walk(fullPath, dirent.name));
            } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(dirent.name)) {
                const relativePath = path.relative(UPLOADS_DIR, fullPath).replace(/\\/g, '/');
                imageFiles.push({
                    url: `/uploads/${relativePath}`,
                    category: parentCategory ? (parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1)) : 'Miscellaneous',
                    name: dirent.name.replace(/\.[^/.]+$/, ""),
                });
            }
        }
        return imageFiles;
    };
    try {
        res.status(200).json(await walk(UPLOADS_DIR));
    } catch (err) {
        next(err);
    }
});

// --- Backup Endpoints ---
app.get('/api/backups', async (req, res, next) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupDetails = await Promise.all(
            files.filter(f => f.endsWith('.json')).map(async f => {
                const stats = await fs.stat(path.join(BACKUP_DIR, f));
                return { filename: f, createdAt: stats.birthtime, size: stats.size, isAuto: f.startsWith('auto_') };
            })
        );
        res.json(backupDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { next(err); }
});

app.post('/api/backups', async (req, res, next) => {
    try {
        const appData = await getFullAppData(dataSource.manager);
        const dataToBackup = JSON.stringify(appData, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const filename = `manual_backup_${timestamp}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, filename), dataToBackup);
        res.status(201).json({ message: 'Manual backup created successfully.' });
    } catch (err) { next(err); }
});

app.get('/api/backups/:filename', (req, res, next) => {
    const filename = path.basename(req.params.filename);
    res.download(path.join(BACKUP_DIR, filename), err => err && next(err));
});

app.delete('/api/backups/:filename', async (req, res, next) => {
    try {
        await fs.unlink(path.join(BACKUP_DIR, path.basename(req.params.filename)));
        res.status(200).json({ message: 'Backup deleted.' });
    } catch (err) { next(err); }
});


// === AI Endpoints (Unchanged) ===
app.get('/api/ai/status', (req, res) => res.json({ isConfigured: !!ai }));

app.post('/api/ai/test', async (req, res, next) => {
    if (!ai) return res.status(400).json({ success: false, error: "AI not configured on server." });
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        if (response && response.text) res.json({ success: true });
        else throw new Error("Invalid response from API.");
    } catch (error) {
        res.status(400).json({ success: false, error: 'API key is invalid.' });
    }
});

app.post('/api/ai/generate', async (req, res, next) => {
    if (!ai) return res.status(503).json({ error: "AI not configured on server." });
    try {
        const { model, prompt, generationConfig } = req.body;
        const response = await ai.models.generateContent({ model, contents: prompt, config: generationConfig });
        res.json({ text: response.text });
    } catch (err) { next(err); }
});


// === Static File Serving ===
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(UPLOADS_DIR));

// === Final Catchall & Error Handling ===
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.use((err, req, res, next) => {
  console.error('An error occurred:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Automated Backup Logic
const runAutomatedBackup = async () => {
    try {
        const settingsRepo = dataSource.getRepository('Setting');
        const settingRow = await settingsRepo.findOneBy({ id: 1 });
        const settings = settingRow?.settings;

        if (!settings?.automatedBackups?.enabled) return;

        const files = await fs.readdir(BACKUP_DIR).catch(() => []);
        const autoBackups = files.filter(f => f.startsWith('auto_backup_')).sort().reverse();
        if (autoBackups.length > 0) {
            const lastBackupDate = new Date(autoBackups[0].replace('auto_backup_', '').replace('.json', ''));
            const hoursSince = (new Date() - lastBackupDate) / 36e5;
            if (hoursSince < settings.automatedBackups.frequencyHours) return;
        }
        
        console.log(`[Automated Backup] Creating new backup...`);
        const appData = await getFullAppData(dataSource.manager);
        const dataToBackup = JSON.stringify(appData, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const filename = `auto_backup_${timestamp}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, filename), dataToBackup);

        const updatedBackups = [filename, ...autoBackups];
        if (updatedBackups.length > settings.automatedBackups.maxBackups) {
            const toDelete = updatedBackups.slice(settings.automatedBackups.maxBackups);
            console.log(`[Automated Backup] Pruning ${toDelete.length} old backup(s).`);
            for (const f of toDelete) await fs.unlink(path.join(BACKUP_DIR, f));
        }
    } catch (err) {
        console.error('[Automated Backup] Error:', err);
    }
};

// Export the app for Vercel
module.exports = app;