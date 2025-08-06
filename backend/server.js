

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
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('./initialData');
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
const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';

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
    });
};

initializeApp().catch(err => {
    console.error("Critical error during application initialization:", err);
    process.exit(1);
});

// === Helper to construct the full app data state from DB ===
const getFullAppData = async (manager) => {
    const data = {};
    
    const users = await manager.find(UserEntity);
    const quests = await manager.find(QuestEntity, { relations: ['assignedUsers'] });
    const questCompletions = await manager.find(QuestCompletionEntity, { relations: ['user', 'quest'] });
    const guilds = await manager.find(GuildEntity, { relations: ['members'] });

    data.users = users.map(u => ({ ...u, guildIds: u.guilds?.map(g => g.id) || [] }));
    data.quests = quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers?.map(u => u.id) || [] }));
    data.questCompletions = questCompletions.map(qc => ({ ...qc, userId: qc.user?.id, questId: qc.quest?.id }));
    data.guilds = guilds.map(g => ({ ...g, memberIds: g.members?.map(m => m.id) || [] }));

    data.questGroups = await manager.find(QuestGroupEntity);
    data.markets = await manager.find(MarketEntity);
    data.rewardTypes = await manager.find(RewardTypeDefinitionEntity);
    data.purchaseRequests = await manager.find(PurchaseRequestEntity);
    data.ranks = await manager.find(RankEntity);
    data.trophies = await manager.find(TrophyEntity);
    data.userTrophies = await manager.find(UserTrophyEntity);
    data.adminAdjustments = await manager.find(AdminAdjustmentEntity);
    data.gameAssets = await manager.find(GameAssetEntity);
    data.systemLogs = await manager.find(SystemLogEntity);
    data.themes = await manager.find(ThemeDefinitionEntity);
    data.chatMessages = await manager.find(ChatMessageEntity);
    data.systemNotifications = await manager.find(SystemNotificationEntity);
    data.scheduledEvents = await manager.find(ScheduledEventEntity);
    
    const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
    data.settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;

    const historyRow = await manager.findOneBy(LoginHistoryEntity, { id: 1 });
    data.loginHistory = historyRow ? historyRow.history : [];
    
    return data;
};

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// === API ROUTES ===

// BOOTSTRAP: Load all data
app.get('/api/data/load', asyncMiddleware(async (req, res) => {
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
}));

// FIRST RUN
app.post('/api/first-run', asyncMiddleware(async (req, res) => {
    const { 
        adminUserData, allUsers, guilds, quests, markets, gameAssets, questCompletions,
        rewardTypes, ranks, trophies, questGroups 
    } = req.body;
    
    await dataSource.transaction(async manager => {
        // Clear everything first
        for (const entity of dataSource.entityMetadatas) {
            await manager.getRepository(entity.name).clear();
        }
        
        // Save initial static data, using provided data if available, otherwise defaults
        await manager.save(RewardTypeDefinitionEntity, rewardTypes && rewardTypes.length > 0 ? rewardTypes : INITIAL_REWARD_TYPES);
        await manager.save(RankEntity, ranks && ranks.length > 0 ? ranks : INITIAL_RANKS);
        await manager.save(TrophyEntity, trophies && trophies.length > 0 ? trophies : INITIAL_TROPHIES);
        await manager.save(ThemeDefinitionEntity, INITIAL_THEMES); // Themes are always the same initial set
        await manager.save(QuestGroupEntity, questGroups && questGroups.length > 0 ? questGroups : INITIAL_QUEST_GROUPS);

        // Save generated data
        const userEntities = allUsers.map(u => manager.create(UserEntity, u));
        await manager.save(userEntities);

        const guildEntities = guilds.map(g => {
            const guild = manager.create(GuildEntity, g);
            guild.members = userEntities.filter(u => g.memberIds.includes(u.id));
            return guild;
        });
        await manager.save(guildEntities);

        const questEntities = quests.map(q => {
             const quest = manager.create(QuestEntity, q);
             quest.assignedUsers = userEntities.filter(u => q.assignedUserIds.includes(u.id));
             return quest;
        });
        await manager.save(questEntities);
        
        await manager.save(MarketEntity, markets);
        await manager.save(GameAssetEntity, gameAssets);

        const completionEntities = questCompletions.map(qc => {
            const completion = manager.create(QuestCompletionEntity, qc);
            completion.user = userEntities.find(u => u.id === qc.userId);
            completion.quest = questEntities.find(q => q.id === qc.questId);
            return completion;
        });
        await manager.save(completionEntities);
        
        const adminUser = userEntities.find(u => u.username === adminUserData.username);
        
        const settings = { ...INITIAL_SETTINGS, contentVersion: 1 };
        await manager.save(SettingEntity, { id: 1, settings });
        await manager.save(LoginHistoryEntity, { id: 1, history: [adminUser.id] });
        
        res.status(201).json({ adminUser });
    });
    broadcast({ type: 'DATA_UPDATED' });
}));

app.post('/api/data/import-assets', asyncMiddleware(async (req, res) => {
    const { newAssets } = req.body;

    try {
        await dataSource.transaction(async manager => {
            // Save in an order that respects potential (though not enforced by FK) dependencies
            if (newAssets.questGroups?.length) await manager.save(QuestGroupEntity, newAssets.questGroups);
            if (newAssets.rewardTypes?.length) await manager.save(RewardTypeDefinitionEntity, newAssets.rewardTypes);
            if (newAssets.ranks?.length) await manager.save(RankEntity, newAssets.ranks);
            if (newAssets.trophies?.length) await manager.save(TrophyEntity, newAssets.trophies);
            if (newAssets.markets?.length) await manager.save(MarketEntity, newAssets.markets);
            if (newAssets.gameAssets?.length) await manager.save(GameAssetEntity, newAssets.gameAssets);
            if (newAssets.quests?.length) {
                // Quests don't have user assignments on import, so a simple save is fine.
                await manager.save(QuestEntity, newAssets.quests);
            }
        });

        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json({ message: 'Assets imported successfully.' });
    } catch (error) {
        console.error("Error during asset import:", error);
        res.status(500).json({ error: 'Failed to import assets.' });
    }
}));

app.post('/api/data/factory-reset', asyncMiddleware(async (req, res) => {
    try {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log("Data Source connection closed.");
        }

        await fs.unlink(dbPath);
        console.log("Database file deleted successfully.");
        
        res.status(200).json({ message: "Factory reset successful. The application will restart." });
        
        console.log("Initiating server restart for factory reset...");
        setTimeout(() => process.exit(0), 1000);

    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log("Database file did not exist, which is fine for a factory reset.");
            res.status(200).json({ message: "No database file found to delete. The application will restart." });
            console.log("Initiating server restart for factory reset...");
            setTimeout(() => process.exit(0), 1000);
        } else {
            console.error("Error during factory reset:", err);
            res.status(500).json({ error: "Failed to perform factory reset." });
        }
    }
}));

// Generic CRUD factory
const createCrudEndpoints = (entity, relations = []) => {
    const router = express.Router();
    const repo = dataSource.getRepository(entity);

    router.get('/', asyncMiddleware(async (req, res) => res.json(await repo.find({ relations }))));
    router.post('/', asyncMiddleware(async (req, res) => {
        const newItem = repo.create(req.body);
        await repo.save(newItem);
        broadcast({ type: 'DATA_UPDATED' });
        res.status(201).json(newItem);
    }));
    router.put('/:id', asyncMiddleware(async (req, res) => {
        await repo.update(req.params.id, req.body);
        broadcast({ type: 'DATA_UPDATED' });
        res.json(await repo.findOneBy({ id: req.params.id }));
    }));
    router.delete('/:id', asyncMiddleware(async (req, res) => {
        await repo.delete(req.params.id);
        broadcast({ type: 'DATA_UPDATED' });
        res.status(204).send();
    }));
    return router;
};

app.use('/api/users', createCrudEndpoints(UserEntity, ['guilds']));
// ... Add more simple CRUD routes here if needed for other entities.

// Specific endpoint for settings
app.put('/api/settings', asyncMiddleware(async (req, res) => {
    const repo = dataSource.getRepository(SettingEntity);
    await repo.save({ id: 1, settings: req.body });
    broadcast({ type: 'DATA_UPDATED' });
    res.json(req.body);
}));

// Specific endpoint for quests (due to relations)
const questsRouter = express.Router();
questsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const repo = dataSource.getRepository(QuestEntity);
    const { assignedUserIds, ...questData } = req.body;
    const quest = await repo.findOneBy({ id: req.params.id });
    if (!quest) return res.status(404).send('Quest not found');
    
    repo.merge(quest, questData);
    if (assignedUserIds) {
        quest.assignedUsers = await dataSource.getRepository(UserEntity).findBy({ id: In(assignedUserIds) });
    }
    await repo.save(quest);
    broadcast({ type: 'DATA_UPDATED' });
    const updatedQuest = await repo.findOne({ where: { id: req.params.id }, relations: ['assignedUsers'] });
    res.json({ ...updatedQuest, assignedUserIds: updatedQuest.assignedUsers.map(u => u.id) });
}));
app.use('/api/quests', questsRouter);


// Business Logic Actions
app.post('/api/actions/complete-quest', asyncMiddleware(async (req, res) => {
    const { completionData } = req.body;
    
    try {
        await dataSource.transaction(async manager => {
            const completionWithId = {
                ...completionData,
                id: `qcomp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            };

            const completion = manager.create(QuestCompletionEntity, completionWithId);
            completion.user = await manager.findOneBy(UserEntity, { id: completionData.userId });
            completion.quest = await manager.findOneBy(QuestEntity, { id: completionData.questId });

            if (!completion.user || !completion.quest) {
                const error = new Error("User or Quest not found for this completion.");
                error.statusCode = 404;
                throw error;
            }

            await manager.save(completion);
            
            if (completion.status === 'Approved') {
                const user = completion.user;
                const quest = completion.quest;
                const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
                const rewardTypesMap = new Map(rewardTypes.map(rt => [rt.id, rt]));

                quest.rewards.forEach(reward => {
                    const rewardDef = rewardTypesMap.get(reward.rewardTypeId);
                    if (!rewardDef) return;

                    if (quest.guildId) {
                        user.guildBalances = user.guildBalances || {};
                        if (!user.guildBalances[quest.guildId]) user.guildBalances[quest.guildId] = { purse: {}, experience: {} };
                        const balanceSheet = user.guildBalances[quest.guildId];
                        if (rewardDef.category === 'Currency') {
                            balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                        } else {
                            balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
                        }
                    } else {
                         if (rewardDef.category === 'Currency') {
                            user.personalPurse[reward.rewardTypeId] = (user.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                        } else {
                            user.personalExperience[reward.rewardTypeId] = (user.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                        }
                    }
                });
                await manager.save(UserEntity, user);
            }
        });

        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json({ message: 'Quest completion recorded.' });

    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            throw error;
        }
    }
}));

app.post('/api/actions/approve-quest/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    try {
        await dataSource.transaction(async manager => {
            const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest']});
            if (!completion || completion.status !== 'Pending') {
                const error = new Error("Pending completion not found.");
                error.statusCode = 404;
                throw error;
            }

            completion.status = 'Approved';
            if (note) completion.note = note;

            const user = completion.user;
            const quest = completion.quest;
            if (!user || !quest) {
                const error = new Error("User or Quest associated with completion not found.");
                error.statusCode = 404;
                throw error;
            }

            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const rewardTypesMap = new Map(rewardTypes.map(rt => [rt.id, rt]));

            quest.rewards.forEach(reward => {
                const rewardDef = rewardTypesMap.get(reward.rewardTypeId);
                if (!rewardDef) return;

                if (quest.guildId) {
                    user.guildBalances = user.guildBalances || {};
                    if (!user.guildBalances[quest.guildId]) user.guildBalances[quest.guildId] = { purse: {}, experience: {} };
                    const balanceSheet = user.guildBalances[quest.guildId];
                    if (rewardDef.category === 'Currency') {
                        balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                    } else {
                        balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
                    }
                } else {
                     if (rewardDef.category === 'Currency') {
                        user.personalPurse[reward.rewardTypeId] = (user.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                    } else {
                        user.personalExperience[reward.rewardTypeId] = (user.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                    }
                }
            });
            
            await manager.save(UserEntity, user);
            await manager.save(QuestCompletionEntity, completion);
        });

        broadcast({ type: 'DATA_UPDATED' });
        res.status(200).json({ message: 'Quest approved.' });
    } catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            throw error;
        }
    }
}));

app.post('/api/actions/reject-quest/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    const repo = dataSource.getRepository(QuestCompletionEntity);
    const completion = await repo.findOneBy({ id });
    if (!completion || completion.status !== 'Pending') {
        return res.status(404).json({ error: 'Pending completion not found.' });
    }
    completion.status = 'Rejected';
    if(note) completion.note = note;
    await repo.save(completion);
    broadcast({ type: 'DATA_UPDATED' });
    res.status(200).json({ message: 'Quest rejected.' });
}));


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

// Fallback to index.html for single-page application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("An error occurred:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An internal server error occurred' });
    }
});