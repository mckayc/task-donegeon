
require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const WebSocket = require('ws');
const { In } = require("typeorm");
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS } = require('./initialData');
const { 
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity
} = require('./entities');

const app = express();
const port = process.env.PORT || 3000;
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

    const users = await manager.getRepository(UserEntity).find();
    const guilds = await manager.getRepository(GuildEntity).find({ relations: ['members'] });
    const quests = await manager.getRepository(QuestEntity).find({ relations: ['assignedUsers'] });
    const questCompletions = await manager.getRepository(QuestCompletionEntity).find({ relations: ['user', 'quest'] });
    
    // Flatten relational data back to the ID-based format the frontend expects
    data.users = users.map(u => ({ ...u, guildIds: u.guilds?.map(g => g.id) || [] }));
    data.guilds = guilds.map(g => ({ ...g, memberIds: g.members?.map(m => m.id) || [] }));
    data.quests = quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers?.map(u => u.id) || [] }));
    data.questCompletions = questCompletions.map(qc => ({ ...qc, userId: qc.user?.id, questId: qc.quest?.id }));
    
    data.questGroups = await manager.getRepository(QuestGroupEntity).find();
    data.markets = await manager.getRepository(MarketEntity).find();
    data.rewardTypes = await manager.getRepository(RewardTypeDefinitionEntity).find();
    data.purchaseRequests = await manager.getRepository(PurchaseRequestEntity).find();
    data.ranks = await manager.getRepository(RankEntity).find();
    data.trophies = await manager.getRepository(TrophyEntity).find();
    data.userTrophies = await manager.getRepository(UserTrophyEntity).find();
    data.adminAdjustments = await manager.getRepository(AdminAdjustmentEntity).find();
    data.gameAssets = await manager.getRepository(GameAssetEntity).find();
    data.systemLogs = await manager.getRepository(SystemLogEntity).find();
    data.themes = await manager.getRepository(ThemeDefinitionEntity).find();
    data.chatMessages = await manager.getRepository(ChatMessageEntity).find();
    data.systemNotifications = await manager.getRepository(SystemNotificationEntity).find();
    data.scheduledEvents = await manager.getRepository(ScheduledEventEntity).find();
    
    const settingRow = await manager.getRepository(SettingEntity).findOneBy({ id: 1 });
    data.settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;

    const historyRow = await manager.getRepository(LoginHistoryEntity).findOneBy({ id: 1 });
    data.loginHistory = historyRow ? historyRow.history : [];
    
    return data;
};

// === API ROUTES ===

// Load data
app.get('/api/data/load', async (req, res, next) => {
    try {
        const userRepo = dataSource.getRepository(UserEntity);
        const userCount = await userRepo.count();

        if (userCount === 0) {
            console.log("No users found, triggering first run.");
            return res.status(200).json({
                users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
                purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
                adminAdjustments: [], gameAssets: [], systemLogs: [], themes: [], chatMessages: [],
                systemNotifications: [], scheduledEvents: [],
                settings: { ...INITIAL_SETTINGS, contentVersion: 0 },
                loginHistory: [],
            });
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
        // Clear all tables using TypeORM's robust clear method
        for (const entity of dataSource.entityMetadatas) {
            await queryRunner.manager.getRepository(entity.name).clear();
        }

        // Save new data, ensuring all entities are created before saving for consistency.
        const rewardTypeEntities = data.rewardTypes?.map(e => queryRunner.manager.create(RewardTypeDefinitionEntity, e)) || [];
        if (rewardTypeEntities.length) await queryRunner.manager.save(rewardTypeEntities);

        const rankEntities = data.ranks?.map(e => queryRunner.manager.create(RankEntity, e)) || [];
        if (rankEntities.length) await queryRunner.manager.save(rankEntities);

        const trophyEntities = data.trophies?.map(e => queryRunner.manager.create(TrophyEntity, e)) || [];
        if (trophyEntities.length) await queryRunner.manager.save(trophyEntities);
        
        const themeEntities = data.themes?.map(e => queryRunner.manager.create(ThemeDefinitionEntity, e)) || [];
        if (themeEntities.length) await queryRunner.manager.save(themeEntities);

        const questGroupEntities = data.questGroups?.map(e => queryRunner.manager.create(QuestGroupEntity, e)) || [];
        if (questGroupEntities.length) await queryRunner.manager.save(questGroupEntities);

        const marketEntities = data.markets?.map(e => queryRunner.manager.create(MarketEntity, e)) || [];
        if (marketEntities.length) await queryRunner.manager.save(marketEntities);

        const gameAssetEntities = data.gameAssets?.map(e => queryRunner.manager.create(GameAssetEntity, e)) || [];
        if (gameAssetEntities.length) await queryRunner.manager.save(gameAssetEntities);

        const userEntities = data.users?.map(u => queryRunner.manager.create(UserEntity, u)) || [];
        if (userEntities.length) await queryRunner.manager.save(userEntities);

        const guildEntities = data.guilds?.map(g => {
            const guild = queryRunner.manager.create(GuildEntity, g);
            guild.members = g.memberIds ? userEntities.filter(u => g.memberIds.includes(u.id)) : [];
            return guild;
        }) || [];
        if (guildEntities.length) await queryRunner.manager.save(guildEntities);

        const questEntities = data.quests?.map(q => {
             const quest = queryRunner.manager.create(QuestEntity, q);
             quest.assignedUsers = q.assignedUserIds ? userEntities.filter(u => q.assignedUserIds.includes(u.id)) : [];
             return quest;
        }) || [];
        if (questEntities.length) await queryRunner.manager.save(questEntities);
        
        const questCompletionEntities = data.questCompletions?.map(qc => {
            const completion = queryRunner.manager.create(QuestCompletionEntity, qc);
            completion.user = userEntities.find(u => u.id === qc.userId);
            completion.quest = questEntities.find(q => q.id === qc.questId);
            return completion;
        }) || [];
        if (questCompletionEntities.length) await queryRunner.manager.save(questCompletionEntities);
        
        const purchaseRequestEntities = data.purchaseRequests?.map(e => queryRunner.manager.create(PurchaseRequestEntity, e)) || [];
        if (purchaseRequestEntities.length) await queryRunner.manager.save(purchaseRequestEntities);

        const userTrophyEntities = data.userTrophies?.map(e => queryRunner.manager.create(UserTrophyEntity, e)) || [];
        if (userTrophyEntities.length) await queryRunner.manager.save(userTrophyEntities);

        const adminAdjustmentEntities = data.adminAdjustments?.map(e => queryRunner.manager.create(AdminAdjustmentEntity, e)) || [];
        if (adminAdjustmentEntities.length) await queryRunner.manager.save(adminAdjustmentEntities);
        
        const systemLogEntities = data.systemLogs?.map(e => queryRunner.manager.create(SystemLogEntity, e)) || [];
        if (systemLogEntities.length) await queryRunner.manager.save(systemLogEntities);

        const chatMessageEntities = data.chatMessages?.map(e => queryRunner.manager.create(ChatMessageEntity, e)) || [];
        if (chatMessageEntities.length) await queryRunner.manager.save(chatMessageEntities);

        const systemNotificationEntities = data.systemNotifications?.map(e => queryRunner.manager.create(SystemNotificationEntity, e)) || [];
        if (systemNotificationEntities.length) await queryRunner.manager.save(systemNotificationEntities);

        const scheduledEventEntities = data.scheduledEvents?.map(e => queryRunner.manager.create(ScheduledEventEntity, e)) || [];
        if (scheduledEventEntities.length) await queryRunner.manager.save(scheduledEventEntities);
        
        if (data.settings) await queryRunner.manager.save(SettingEntity, { id: 1, settings: data.settings });
        if (data.loginHistory) await queryRunner.manager.save(LoginHistoryEntity, { id: 1, history: data.loginHistory });

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
        const settingsRepo = dataSource.getRepository(SettingEntity);
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
