
require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const { In, Brackets, Like, MoreThan, Between, IsNull } = require("typeorm");
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('./initialData');
const { 
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, RotationEntity, TradeOfferEntity, GiftEntity, allEntities
} = require('./entities');
const { EventEmitter } = require('events');

const { version } = require('./package.json');
const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';

const updateEmitter = new EventEmitter();
let clients = [];

const updateTimestamps = (entity, isNew = false) => {
    const now = new Date().toISOString();
    if (isNew) {
        entity.createdAt = now;
    }
    entity.updatedAt = now;
    return entity;
};

const checkAndAwardTrophies = async (manager, userId, guildId) => {
    // Automatic trophies are personal-only for now, as per frontend logic
    if (guildId) return { newUserTrophies: [], newNotifications: [] };

    const user = await manager.findOneBy(UserEntity, { id: userId });
    if (!user) return { newUserTrophies: [], newNotifications: [] };

    const newUserTrophies = [];
    const newNotifications = [];

    // Get all necessary data for checks
    const userCompletedQuests = await manager.find(QuestCompletionEntity, {
        where: { userId: userId, guildId: IsNull(), status: 'Approved' },
        relations: ['quest']
    });
    const userTrophies = await manager.find(UserTrophyEntity, { where: { userId, guildId: IsNull() } });
    const ranks = await manager.find(RankEntity);
    const automaticTrophies = await manager.find(TrophyEntity, { where: { isManual: false } });

    const totalXp = Object.values(user.personalExperience || {}).reduce((sum, amount) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    for (const trophy of automaticTrophies) {
        // Check if user already has this personal trophy
        if (userTrophies.some(ut => ut.trophyId === trophy.id)) continue;
        
        // Check requirements
        const requirements = Array.isArray(trophy.requirements) ? trophy.requirements : [];
        const meetsAllRequirements = requirements.every(req => {
            if (!req || typeof req.type === 'undefined') {
                console.warn('[Trophy Check] Skipping malformed requirement:', req);
                return false;
            }
            switch (req.type) {
                case 'COMPLETE_QUEST_TYPE':
                    return userCompletedQuests.filter(c => c.quest?.type === req.value).length >= req.count;
                case 'COMPLETE_QUEST_TAG':
                    return userCompletedQuests.filter(c => c.quest?.tags?.includes(req.value)).length >= req.count;
                case 'ACHIEVE_RANK':
                    return userRank?.id === req.value;
                case 'QUEST_COMPLETED':
                    return userCompletedQuests.filter(c => c.quest?.id === req.value).length >= req.count;
                default:
                    return false;
            }
        });

        if (meetsAllRequirements) {
            // Award trophy
            const newTrophy = manager.create(UserTrophyEntity, {
                id: `usertrophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId,
                trophyId: trophy.id,
                awardedAt: new Date().toISOString(),
                guildId: null, // Personal trophy
            });
            const savedTrophy = await manager.save(updateTimestamps(newTrophy, true));
            newUserTrophies.push(savedTrophy);

            // Create notification
            const newNotification = manager.create(SystemNotificationEntity, {
                 id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                 type: 'TrophyAwarded',
                 message: `You unlocked a new trophy: "${trophy.name}"!`,
                 recipientUserIds: [userId],
                 readByUserIds: [],
                 timestamp: new Date().toISOString(),
                 guildId: null,
                 iconType: trophy.iconType,
                 icon: trophy.icon,
                 imageUrl: trophy.imageUrl,
                 link: 'Trophies',
            });
            const savedNotification = await manager.save(updateTimestamps(newNotification, true));
            newNotifications.push(savedNotification);
        }
    }
    return { newUserTrophies, newNotifications };
};

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// === Gemini AI Client ===
let ai;
if (process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall') {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("WARNING: API_KEY environment variable not set or is default. AI features will be disabled.");
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

// Helper to fetch all data from DB
const fetchAllData = async (manager) => {
    const repos = {
        users: manager.getRepository(UserEntity),
        quests: manager.getRepository(QuestEntity),
        questGroups: manager.getRepository(QuestGroupEntity),
        markets: manager.getRepository(MarketEntity),
        rewardTypes: manager.getRepository(RewardTypeDefinitionEntity),
        questCompletions: manager.getRepository(QuestCompletionEntity),
        purchaseRequests: manager.getRepository(PurchaseRequestEntity),
        guilds: manager.getRepository(GuildEntity),
        ranks: manager.getRepository(RankEntity),
        trophies: manager.getRepository(TrophyEntity),
        userTrophies: manager.getRepository(UserTrophyEntity),
        adminAdjustments: manager.getRepository(AdminAdjustmentEntity),
        gameAssets: manager.getRepository(GameAssetEntity),
        systemLogs: manager.getRepository(SystemLogEntity),
        themes: manager.getRepository(ThemeDefinitionEntity),
        chatMessages: manager.getRepository(ChatMessageEntity),
        systemNotifications: manager.getRepository(SystemNotificationEntity),
        scheduledEvents: manager.getRepository(ScheduledEventEntity),
        settings: manager.getRepository(SettingEntity),
        loginHistory: manager.getRepository(LoginHistoryEntity),
        bugReports: manager.getRepository(BugReportEntity),
        modifierDefinitions: manager.getRepository(ModifierDefinitionEntity),
        appliedModifiers: manager.getRepository(AppliedModifierEntity),
        rotations: manager.getRepository(RotationEntity),
        tradeOffers: manager.getRepository(TradeOfferEntity),
        gifts: manager.getRepository(GiftEntity),
    };
    
    const data = {};
    for (const key in repos) {
        if (key === 'settings' || key === 'loginHistory') {
             const result = await repos[key].findOneBy({ id: 1 });
             data[key] = result ? (key === 'settings' ? result.settings : result.history) : (key === 'settings' ? INITIAL_SETTINGS : []);
        } else {
            data[key] = await repos[key].find();
        }
    }
    return data;
};

// === API Routes ===

// --- System Status ---
app.get('/api/system/status', async (req, res) => {
    try {
        const isDbConnected = dataSource.isInitialized;
        const isCustomPath = process.env.DATABASE_PATH !== undefined;
        const geminiConnected = !!ai;
        const jwtSecretSet = !!(process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-super-secret-and-long-jwt-secret');

        res.json({
            geminiConnected,
            database: {
                connected: isDbConnected,
                isCustomPath
            },
            jwtSecretSet
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- AI Generation ---
app.post('/api/ai/generate', async (req, res) => {
    if (!ai) return res.status(400).json({ error: 'AI features are not configured.' });
    try {
        const { model, prompt, generationConfig } = req.body;
        const result = await ai.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
        });
        
        res.json(result);
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: 'Failed to generate content from AI.', details: error.message });
    }
});

app.post('/api/ai/test', async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI key not configured on server.', success: false });
    }
    try {
        await ai.models.generateContent({model: 'gemini-2.5-flash', contents: 'test'});
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: 'API key is invalid or has insufficient permissions.', success: false });
    }
});


// --- Media Uploads ---
app.post('/api/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }
    const relativePath = path.relative(UPLOADS_DIR, req.file.path);
    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`; // Ensure forward slashes
    res.status(201).send({ url: url });
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/media/local-gallery', async (req, res) => {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        const files = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
        const gallery = [];

        for (const file of files) {
            if (file.isDirectory()) {
                const subFiles = await fs.readdir(path.join(UPLOADS_DIR, file.name));
                subFiles.forEach(subFile => {
                    gallery.push({
                        url: `/uploads/${file.name}/${subFile}`,
                        category: file.name,
                        name: subFile
                    });
                });
            } else {
                 gallery.push({
                    url: `/uploads/${file.name}`,
                    category: 'Miscellaneous',
                    name: file.name
                });
            }
        }
        res.json(gallery);
    } catch (error) {
        console.error('Failed to read gallery:', error);
        res.status(500).json({ error: 'Failed to read local image gallery.' });
    }
});

// --- Main Data Sync ---
app.get('/api/data/sync', async (req, res) => {
    const { lastSync } = req.query;
    const newSyncTimestamp = new Date().toISOString();

    try {
        await dataSource.manager.transaction(async manager => {
            if (!lastSync) {
                // Initial full load
                const allData = await fetchAllData(manager);
                res.json({ updates: allData, newSyncTimestamp });
            } else {
                // Delta sync - this is a simplified version. A real app might need more complex logic for deletions.
                const updates = {};
                for (const entity of allEntities) {
                    const repo = manager.getRepository(entity.target);
                    const key = entity.name.charAt(0).toLowerCase() + entity.name.slice(1) + 's';
                    
                    if (entity.name === 'Setting') {
                        const result = await repo.findOne({ where: { id: 1, updatedAt: MoreThan(lastSync) } });
                        if(result) updates.settings = result.settings;
                    } else if (entity.name === 'LoginHistory') {
                        const result = await repo.findOne({ where: { id: 1, updatedAt: MoreThan(lastSync) } });
                        if(result) updates.loginHistory = result.history;
                    } else {
                        const records = await repo.find({ where: { updatedAt: MoreThan(lastSync) } });
                        if (records.length > 0) {
                            updates[key] = records;
                        }
                    }
                }
                res.json({ updates, newSyncTimestamp });
            }
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Data synchronization failed.', details: error.message });
    }
});


app.get('/api/data/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const listener = () => {
        try {
            res.write('data: sync\n\n');
        } catch (error) {
            console.error('SSE write error:', error);
        }
    };
    updateEmitter.on('update', listener);
    
    clients.push({ req, res, listener });

    req.on('close', () => {
        updateEmitter.removeListener('update', listener);
        clients = clients.filter(client => client.res !== res);
    });
});

// Chronicles Endpoint
app.get('/api/chronicles', async (req, res) => {
    const { page = 1, limit = 50, userId, guildId: guildIdQuery, viewMode, startDate, endDate } = req.query;
    const guildId = guildIdQuery === 'null' ? null : guildIdQuery;

    try {
        await dataSource.manager.transaction(async manager => {
            const allEvents = [];

            const dateRangeWhere = (dateField) => {
                if(startDate && endDate) {
                    return { [dateField]: Between(new Date(startDate).toISOString(), new Date(endDate).toISOString()) };
                }
                return {};
            };

            const scopeWhere = viewMode === 'personal'
                ? { userId: userId, guildId: IsNull() }
                : (guildId ? { guildId } : {});

            const prefetchData = {
                users: await manager.find(UserEntity),
                quests: await manager.find(QuestEntity),
                trophies: await manager.find(TrophyEntity),
                modifierDefinitions: await manager.find(ModifierDefinitionEntity),
            };

            const userMap = new Map(prefetchData.users.map(u => [u.id, u]));
            const questMap = new Map(prefetchData.quests.map(q => [q.id, q]));
            const trophyMap = new Map(prefetchData.trophies.map(t => [t.id, t]));
            const modifierMap = new Map(prefetchData.modifierDefinitions.map(d => [d.id, d]));

            const entitiesToFetch = [
                { entity: QuestCompletionEntity, dateField: 'completedAt', where: { ...scopeWhere, ...dateRangeWhere('completedAt') } },
                { entity: PurchaseRequestEntity, dateField: 'requestedAt', where: { ...scopeWhere, ...dateRangeWhere('requestedAt') } },
                { entity: UserTrophyEntity, dateField: 'awardedAt', where: { ...scopeWhere, ...dateRangeWhere('awardedAt') } },
                { entity: AdminAdjustmentEntity, dateField: 'adjustedAt', where: { ...scopeWhere, ...dateRangeWhere('adjustedAt') } },
                { entity: AppliedModifierEntity, dateField: 'appliedAt', where: { ...scopeWhere, ...dateRangeWhere('appliedAt') } },
            ];

            for (const { entity, dateField, where } of entitiesToFetch) {
                const records = await manager.find(entity, { where });
                for (const record of records) {
                    const user = userMap.get(record.userId);
                    if (!user) continue;

                    let event = null;
                    if (entity === QuestCompletionEntity) {
                        const quest = questMap.get(record.questId);
                        if (quest) event = { id: `qc-${record.id}`, originalId: record.id, date: record.completedAt, type: 'Quest', title: `${user.gameName} completed "${quest.title}"`, note: record.note, status: record.status, icon: quest.icon, color: 'green', userId, guildId: record.guildId };
                    } else if (entity === PurchaseRequestEntity) {
                        event = { id: `pr-${record.id}`, originalId: record.id, date: record.requestedAt, type: 'Purchase', title: `${user.gameName} purchased "${record.assetDetails.name}"`, note: record.assetDetails.cost.map(c => `-${c.amount}`).join(' '), status: record.status, icon: '💰', color: 'gold', userId, guildId: record.guildId };
                    } else if (entity === UserTrophyEntity) {
                        const trophy = trophyMap.get(record.trophyId);
                        if (trophy) event = { id: `ut-${record.id}`, originalId: record.id, date: record.awardedAt, type: 'Trophy', title: `${user.gameName} earned "${trophy.name}"`, note: trophy.description, status: 'Awarded', icon: trophy.icon, color: 'yellow', userId, guildId: record.guildId };
                    } else if (entity === AdminAdjustmentEntity) {
                        event = { id: `aa-${record.id}`, originalId: record.id, date: record.adjustedAt, type: 'Adjustment', title: `${user.gameName} received an adjustment`, note: record.reason, status: record.type, icon: '⚖️', color: 'cyan', userId, guildId: record.guildId };
                    } else if (entity === AppliedModifierEntity) {
                        const definition = modifierMap.get(record.modifierDefinitionId);
                        if (definition) event = { id: `am-${record.id}`, originalId: record.id, date: record.appliedAt, type: definition.category, title: `${user.gameName} received ${definition.category}: ${definition.name}`, note: record.reason, status: record.status, icon: definition.icon, color: definition.category === 'Triumph' ? 'lime' : 'red', userId, guildId: record.guildId };
                    }
                    if (event) allEvents.push(event);
                }
            }
            
            allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const total = allEvents.length;
            const start = (page - 1) * limit;
            const end = start + parseInt(limit, 10);
            const paginatedEvents = allEvents.slice(start, end);

            res.json({ events: paginatedEvents, total });
        });
    } catch (error) {
        console.error("Chronicles Error:", error);
        res.status(500).json({ error: 'Failed to fetch chronicles.', details: error.message });
    }
});

// --- First Run Setup ---
app.post('/api/first-run', async (req, res) => {
    try {
        await dataSource.manager.transaction(async manager => {
            const userRepo = manager.getRepository(UserEntity);
            const users = await userRepo.find();
            if (users.length > 0) {
                return res.status(400).json({ error: 'Application has already been set up.' });
            }

            const { adminUserData } = req.body;
            
            // 1. Create admin user
            const newUser = userRepo.create({
                ...adminUserData,
                id: `user-${Date.now()}`,
                avatar: {},
                ownedAssetIds: [],
                personalPurse: {},
                personalExperience: {},
                guildBalances: {},
                ownedThemes: ['emerald', 'rose', 'sky'],
                hasBeenOnboarded: false,
            });
            await userRepo.save(updateTimestamps(newUser, true));

            // 2. Save initial settings and data
            await manager.getRepository(SettingEntity).save({ id: 1, settings: INITIAL_SETTINGS });
            await manager.getRepository(RewardTypeDefinitionEntity).save(INITIAL_REWARD_TYPES.map(rt => updateTimestamps(rt, true)));
            await manager.getRepository(RankEntity).save(INITIAL_RANKS.map(r => updateTimestamps(r, true)));
            await manager.getRepository(TrophyEntity).save(INITIAL_TROPHIES.map(t => updateTimestamps(t, true)));
            await manager.getRepository(ThemeDefinitionEntity).save(INITIAL_THEMES.map(t => updateTimestamps(t, true)));
            await manager.getRepository(QuestGroupEntity).save(INITIAL_QUEST_GROUPS.map(qg => updateTimestamps(qg, true)));
            
            // Create default bank market
            const bank = manager.getRepository(MarketEntity).create({
                id: 'market-bank', title: 'The Exchange Post', description: 'Exchange currencies and XP.', iconType: 'emoji', icon: '🏦',
                status: { type: 'open' }
            });
            await manager.getRepository(MarketEntity).save(updateTimestamps(bank, true));

            res.status(201).json({ message: "Setup complete." });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed during first run setup.', details: error.message });
    }
});

// --- Data Routes ---
const createCrudRoutes = (entity, pluralName, relations = []) => {
    const router = express.Router();
    
    // Get all
    router.get('/', async (req, res) => {
        const repo = dataSource.getRepository(entity);
        res.json(await repo.find({ relations }));
    });
    
    // Get one
    router.get('/:id', async (req, res) => {
        const repo = dataSource.getRepository(entity);
        const item = await repo.findOne({ where: { id: req.params.id }, relations });
        if (item) res.json(item);
        else res.status(404).json({ error: `${entity.name} not found` });
    });
    
    // Create
    router.post('/', async (req, res) => {
        const repo = dataSource.getRepository(entity);
        const newItem = repo.create({
            ...req.body,
            id: `${pluralName.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
        const savedItem = await repo.save(updateTimestamps(newItem, true));
        res.status(201).json(savedItem);
        updateEmitter.emit('update');
    });

    // Update
    router.put('/:id', async (req, res) => {
        const repo = dataSource.getRepository(entity);
        const item = await repo.findOneBy({ id: req.params.id });
        if (!item) return res.status(404).json({ error: `${entity.name} not found` });
        
        repo.merge(item, req.body);
        const updatedItem = await repo.save(updateTimestamps(item));
        res.json(updatedItem);
        updateEmitter.emit('update');
    });
    
    // Delete many
    router.delete('/', async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs must be provided as an array.' });
        }
        const repo = dataSource.getRepository(entity);
        await repo.delete({ id: In(ids) });
        res.sendStatus(204);
        updateEmitter.emit('update');
    });

    return router;
};

// Custom Chat Router
const chatRouter = express.Router();

chatRouter.post('/send', async (req, res) => {
    try {
        const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
        
        if (!senderId || !message || (!recipientId && !guildId)) {
            return res.status(400).json({ error: 'Missing required fields for chat message.' });
        }

        const repo = dataSource.getRepository(ChatMessageEntity);
        const newChatMessage = repo.create({
            id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            senderId,
            recipientId,
            guildId,
            message,
            isAnnouncement,
            timestamp: new Date().toISOString(),
            readBy: [senderId], // Sender has read it by default
        });

        const savedMessage = await repo.save(updateTimestamps(newChatMessage, true));
        
        // Respond with the new message so the client can add it optimistically
        res.status(201).json({ newChatMessage: savedMessage });
        updateEmitter.emit('update');

    } catch (error) {
        console.error("Error sending chat message:", error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

chatRouter.post('/read', async (req, res) => {
    try {
        const { userId, partnerId, guildId } = req.body;
        if (!userId || (!partnerId && !guildId)) {
            return res.status(400).json({ error: 'Missing required fields to mark messages as read.' });
        }
        
        const repo = dataSource.getRepository(ChatMessageEntity);

        let whereClause = {};
        if (partnerId) {
             whereClause = [
                { senderId: partnerId, recipientId: userId },
             ];
        } else if (guildId) {
            whereClause = { guildId };
        }
        
        const messagesToUpdate = await repo.find({ where: whereClause });

        for (const message of messagesToUpdate) {
            if (!message.readBy.includes(userId)) {
                message.readBy.push(userId);
                await repo.save(updateTimestamps(message));
            }
        }
        
        res.sendStatus(204);
        updateEmitter.emit('update');

    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: 'Failed to mark messages as read.' });
    }
});

app.use('/api/chat', chatRouter);
app.use('/api/quests', createCrudRoutes(QuestEntity, 'quests'));
app.use('/api/quest-groups', createCrudRoutes(QuestGroupEntity, 'questGroups'));
app.use('/api/markets', createCrudRoutes(MarketEntity, 'markets'));
app.use('/api/trophies', createCrudRoutes(TrophyEntity, 'trophies'));
app.use('/api/reward-types', createCrudRoutes(RewardTypeDefinitionEntity, 'rewardTypes'));
app.use('/api/assets', createCrudRoutes(GameAssetEntity, 'gameAssets'));
app.use('/api/guilds', createCrudRoutes(GuildEntity, 'guilds', ['members']));
app.use('/api/themes', createCrudRoutes(ThemeDefinitionEntity, 'themes'));
app.use('/api/notifications', createCrudRoutes(SystemNotificationEntity, 'systemNotifications'));
app.use('/api/events', createCrudRoutes(ScheduledEventEntity, 'scheduledEvents'));
app.use('/api/bug-reports', createCrudRoutes(BugReportEntity, 'bugReports'));
app.use('/api/rotations', createCrudRoutes(RotationEntity, 'rotations'));
app.use('/api/setbacks', createCrudRoutes(ModifierDefinitionEntity, 'modifierDefinitions'));
app.use('/api/trades', createCrudRoutes(TradeOfferEntity, 'tradeOffers'));
app.use('/api/gifts', createCrudRoutes(GiftEntity, 'gifts'));

// Special Routes
app.put('/api/settings', async (req, res) => {
    const repo = dataSource.getRepository(SettingEntity);
    let settings = await repo.findOneBy({ id: 1 });
    if (!settings) {
        settings = repo.create({ id: 1, settings: req.body });
    } else {
        settings.settings = req.body;
    }
    const updated = await repo.save(updateTimestamps(settings));
    res.json(updated.settings);
    updateEmitter.emit('update');
});

// User routes have more complex logic
const userRouter = express.Router();
userRouter.post('/', async (req, res) => {
    const userRepo = dataSource.getRepository(UserEntity);
    const newUser = userRepo.create({
        ...req.body,
        id: `user-${Date.now()}`,
        avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
    });
    const savedUser = await userRepo.save(updateTimestamps(newUser, true));
    res.status(201).json(savedUser);
    updateEmitter.emit('update');
});
userRouter.put('/:id', async (req, res) => {
    const repo = dataSource.getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    repo.merge(user, req.body);
    const updatedUser = await repo.save(updateTimestamps(user));
    res.json(updatedUser);
    updateEmitter.emit('update');
});
userRouter.delete('/', async (req, res) => {
    const { ids } = req.body;
    await dataSource.manager.transaction(async manager => {
        const userRepo = manager.getRepository(UserEntity);
        const guildRepo = manager.getRepository(GuildEntity);
        
        // Remove users from guilds
        const guilds = await guildRepo.find({ relations: ['members'] });
        for (const guild of guilds) {
            guild.members = guild.members.filter(member => !ids.includes(member.id));
            await guildRepo.save(updateTimestamps(guild));
        }

        await userRepo.delete({ id: In(ids) });
    });
    res.sendStatus(204);
    updateEmitter.emit('update');
});

userRouter.post('/clone/:id', async (req, res) => {
    try {
        const repo = dataSource.getRepository(UserEntity);
        const originalUser = await repo.findOneBy({ id: req.params.id });

        if (!originalUser) {
            return res.status(404).json({ error: "Original user not found" });
        }

        // Create a copy, removing unique/personal data
        const { id, username, email, password, pin, personalPurse, personalExperience, guildBalances, ownedAssetIds, ownedThemes, hasBeenOnboarded, ...clonedData } = originalUser;

        const newUsername = `${clonedData.username}_clone_${Math.random().toString(36).substring(2, 7)}`;
        const newEmail = `clone_${Math.random().toString(36).substring(2, 7)}@${email.split('@')[1] || 'donegeon.com'}`;
        
        const clonedUser = repo.create({
            ...clonedData,
            id: `user-${Date.now()}`,
            username: newUsername,
            email: newEmail,
            gameName: `${clonedData.gameName} (Clone)`,
            pin: '', // Cloned users should set a new PIN
            password: '', // And a new password
            personalPurse: {},
            personalExperience: {},
            guildBalances: {},
            ownedAssetIds: [],
            ownedThemes: ['emerald', 'rose', 'sky'],
            hasBeenOnboarded: false,
        });

        const savedUser = await repo.save(updateTimestamps(clonedUser, true));
        res.status(201).json(savedUser);
        updateEmitter.emit('update');
    } catch (error) {
        res.status(500).json({ error: 'Failed to clone user.' });
    }
});


app.use('/api/users', userRouter);

app.post('/api/actions/apply-modifier', async (req, res) => {
    try {
        await dataSource.manager.transaction(async manager => {
            const { userId, modifierDefinitionId, reason, appliedById, guildId, overrides } = req.body;
            
            const userRepo = manager.getRepository(UserEntity);
            const modifierRepo = manager.getRepository(AppliedModifierEntity);
            const questRepo = manager.getRepository(QuestEntity);

            const user = await userRepo.findOneBy({ id: userId });
            const definition = await manager.findOneBy(ModifierDefinitionEntity, { id: modifierDefinitionId });
            const currentUser = await userRepo.findOneBy({ id: appliedById });

            if (!user || !definition || !currentUser) {
                return res.status(404).json({ error: 'User or modifier definition not found.' });
            }
            
            const newAppliedModifier = modifierRepo.create({
                id: `appliedmod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId,
                modifierDefinitionId,
                appliedAt: new Date().toISOString(),
                status: 'Active',
                reason,
                appliedById,
                overrides,
                guildId: guildId || null, 
            });

            const finalEffects = overrides?.effects || definition.effects;
            let expirationDate = null;
            
            const purse = guildId ? user.guildBalances[guildId]?.purse : user.personalPurse;
            const experience = guildId ? user.guildBalances[guildId]?.experience : user.personalExperience;

            for (const effect of finalEffects) {
                switch(effect.type) {
                    case 'DEDUCT_REWARDS':
                        for (const r of effect.rewards) {
                            const rewardDef = await manager.findOneBy(RewardTypeDefinitionEntity, { id: r.rewardTypeId });
                            if (rewardDef.category === 'Currency') {
                                purse[r.rewardTypeId] = (purse[r.rewardTypeId] || 0) - r.amount;
                            } else {
                                experience[r.rewardTypeId] = (experience[r.rewardTypeId] || 0) - r.amount;
                            }
                        }
                        break;
                     case 'GRANT_REWARDS':
                        for (const r of effect.rewards) {
                            const rewardDef = await manager.findOneBy(RewardTypeDefinitionEntity, { id: r.rewardTypeId });
                            if (rewardDef.category === 'Currency') {
                                purse[r.rewardTypeId] = (purse[r.rewardTypeId] || 0) + r.amount;
                            } else {
                                experience[r.rewardTypeId] = (experience[r.rewardTypeId] || 0) + r.amount;
                            }
                        }
                        break;
                    case 'CLOSE_MARKET':
                    case 'OPEN_MARKET':
                    case 'MARKET_DISCOUNT':
                         const currentExpiry = new Date(newAppliedModifier.appliedAt);
                         currentExpiry.setHours(currentExpiry.getHours() + effect.durationHours);
                         if (!expirationDate || currentExpiry > expirationDate) {
                             expirationDate = currentExpiry;
                         }
                        break;
                }
            }
            
            if (expirationDate) {
                newAppliedModifier.expiresAt = expirationDate.toISOString();
            }

            if (guildId) {
                user.guildBalances[guildId] = { purse, experience };
            } else {
                user.personalPurse = purse;
                user.personalExperience = experience;
            }
            
            let newRedemptionQuest = null;
            const redemptionQuestId = overrides?.defaultRedemptionQuestId || definition.defaultRedemptionQuestId;
            if (redemptionQuestId) {
                const templateQuest = await questRepo.findOneBy({ id: redemptionQuestId });
                if (templateQuest) {
                    const { id, ...questData } = templateQuest;
                    newRedemptionQuest = questRepo.create({
                        ...questData,
                        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        assignedUserIds: [userId],
                        isActive: true,
                        isRedemptionFor: newAppliedModifier.id
                    });
                    newAppliedModifier.redemptionQuestId = newRedemptionQuest.id;
                    await questRepo.save(updateTimestamps(newRedemptionQuest, true));
                }
            }

            const savedModifier = await modifierRepo.save(updateTimestamps(newAppliedModifier, true));
            const updatedUser = await userRepo.save(updateTimestamps(user));
            
            res.json({ updatedUser, newAppliedModifier: savedModifier, newRedemptionQuest });
            updateEmitter.emit('update');

        });
    } catch (error) {
         res.status(500).json({ error: 'Failed to apply modifier.', details: error.message });
    }
});


// Serve React App
const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// --- Server Initialization ---
dataSource.initialize()
    .then(async () => {
        console.log("Database connected successfully.");
        await ensureDatabaseDirectoryExists();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => console.log("Database connection error: ", error));
