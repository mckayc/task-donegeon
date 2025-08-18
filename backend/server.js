require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const { In, Brackets, Like, MoreThan, Between } = require("typeorm");
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('./initialData');
const { 
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity, SetbackDefinitionEntity, AppliedSetbackEntity, RotationEntity, TradeOfferEntity, GiftEntity, allEntities
} = require('./entities');
const { EventEmitter } = require('events');

const { version } = require('../package.json');
app = express();
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
    const user = await manager.findOneBy(UserEntity, { id: userId });
    if (!user) return { newUserTrophies: [], newNotifications: [] };

    const newUserTrophies = [];
    const newNotifications = [];

    const userCompletedQuests = await manager.find(QuestCompletionEntity, {
        where: { user: { id: userId }, guildId: guildId === undefined ? null : guildId, status: 'Approved' },
        relations: ['quest']
    });
    const userTrophies = await manager.find(UserTrophyEntity, { where: { userId, guildId: guildId === undefined ? null : guildId } });
    const ranks = await manager.find(RankEntity);
    const automaticTrophies = await manager.find(TrophyEntity, { where: { isManual: false } });

    const balances = guildId ? user.guildBalances[guildId] : { purse: user.personalPurse, experience: user.personalExperience };
    const totalXp = Object.values(balances?.experience || {}).reduce((sum, amount) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    for (const trophy of automaticTrophies) {
        if (userTrophies.some(ut => ut.trophyId === trophy.id)) continue;
        
        const requirements = Array.isArray(trophy.requirements) ? trophy.requirements : [];
        const meetsAllRequirements = requirements.every(req => {
            if (!req || typeof req.type === 'undefined') return false;
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
            const newTrophy = manager.create(UserTrophyEntity, {
                id: `usertrophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId,
                trophyId: trophy.id,
                awardedAt: new Date().toISOString(),
                guildId: guildId || null,
            });
            const savedTrophy = await manager.save(updateTimestamps(newTrophy, true));
            newUserTrophies.push(savedTrophy);

            const newNotification = manager.create(SystemNotificationEntity, {
                 id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                 type: 'TrophyAwarded',
                 message: `You unlocked a new trophy: "${trophy.name}"!`,
                 recipientUserIds: [userId],
                 readByUserIds: [],
                 timestamp: new Date().toISOString(),
                 guildId: guildId || null,
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
const ASSET_PACKS_DIR = '/app/data/asset_packs';
const DEFAULT_ASSET_PACKS_SOURCE_DIR = path.join(__dirname, 'default_asset_packs');

const ensureDefaultAssetPacksExist = async () => {
    try {
        const defaultPacks = await fs.readdir(DEFAULT_ASSET_PACKS_SOURCE_DIR);
        for (const packFilename of defaultPacks) {
            const sourcePath = path.join(DEFAULT_ASSET_PACKS_SOURCE_DIR, packFilename);
            const destPath = path.join(ASSET_PACKS_DIR, packFilename);
            // Unconditionally copy the file to ensure the user's volume always has the latest version from the codebase.
            await fs.copyFile(sourcePath, destPath);
        }
    } catch (error) {
        console.error('Could not ensure default asset packs exist:', error);
    }
};


// === Database Initialization and Server Start ===
const initializeApp = async () => {
    await ensureDatabaseDirectoryExists();
    await dataSource.initialize();
    console.log("Data Source has been initialized!");

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });
    
    // Copy default asset packs if they don't exist in the user's volume
    await ensureDefaultAssetPacksExist();
    
    console.log(`Asset directory is ready at: ${UPLOADS_DIR}`);
    console.log(`Backup directory is ready at: ${BACKUP_DIR}`);
    console.log(`Asset Pack directory is ready at: ${ASSET_PACKS_DIR}`);

    app.listen(port, () => {
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
    for (const entity of allEntities) {
        const repo = manager.getRepository(entity);
        const tableName = repo.metadata.tableName.charAt(0).toLowerCase() + repo.metadata.tableName.slice(1);
        data[tableName] = await repo.find();
    }
    
    // Handle relations
    const users = await manager.getRepository(UserEntity).find({ relations: ['guilds'] });
    data.users = users.map(u => ({ ...u, guildIds: u.guilds.map(g => g.id) }));
    const quests = await manager.getRepository(QuestEntity).find({ relations: ['assignedUsers'] });
    data.quests = quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers.map(u => u.id) }));
    
    const settingRow = await manager.getRepository(SettingEntity).findOneBy({ id: 1 });
    data.settings = settingRow ? settingRow.settings : INITIAL_SETTINGS;
    
    const historyRow = await manager.getRepository(LoginHistoryEntity).findOneBy({ id: 1 });
    data.loginHistory = historyRow ? historyRow.history : [];
    
    return data;
};

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// === API ROUTES ===

// Server-Sent Events endpoint
app.get('/api/data/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    res.write('data: connected\n\n');

    const heartbeatInterval = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch (error) {
            clearInterval(heartbeatInterval);
            req.socket.end();
        }
    }, 20000);

    req.on('close', () => {
        clearInterval(heartbeatInterval);
        clients = clients.filter(client => client.id !== clientId);
    });
});

const sendUpdateToClients = () => {
    const clientsToRemove = [];
    clients.forEach(client => {
        try {
            client.res.write('data: sync\n\n');
        } catch (error) {
            clientsToRemove.push(client.id);
        }
    });
    if (clientsToRemove.length > 0) {
        clients = clients.filter(client => !clientsToRemove.includes(client.id));
    }
};

updateEmitter.on('update', sendUpdateToClients);

// Generic CRUD factory
const createCrudRouter = (entity, relations = [], entityNameOverride = null) => {
    const router = express.Router();
    const repo = dataSource.getRepository(entity);
    const entityName = entityNameOverride || repo.metadata.tableName.toLowerCase();

    // Get all
    router.get('/', async (req, res) => {
        const items = await repo.find({ relations });
        res.json(items);
    });

    // Create
    router.post('/', async (req, res) => {
        const newItemData = req.body;
        const id = `${entityName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const item = repo.create({ ...newItemData, id });
        const savedItem = await repo.save(updateTimestamps(item, true));
        updateEmitter.emit('update');
        res.status(201).json(savedItem);
    });

    // Update
    router.put('/:id', async (req, res) => {
        const item = await repo.preload({ id: req.params.id, ...req.body });
        if (!item) return res.status(404).json({ error: `${entityName} not found` });
        const savedItem = await repo.save(updateTimestamps(item));
        updateEmitter.emit('update');
        res.json(savedItem);
    });

    // Bulk Delete
    router.delete('/', async (req, res) => {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid request body' });
        await repo.delete(ids);
        updateEmitter.emit('update');
        res.status(204).send();
    });

    return router;
};

// Use the factory for simple CRUD entities
app.use('/api/ranks', createCrudRouter(RankEntity));
app.use('/api/trophies', createCrudRouter(TrophyEntity));
app.use('/api/questGroups', createCrudRouter(QuestGroupEntity, [], 'questgroup'));
app.use('/api/themes', createCrudRouter(ThemeDefinitionEntity));
app.use('/api/rotations', createCrudRouter(RotationEntity));
app.use('/api/setbackDefinitions', createCrudRouter(SetbackDefinitionEntity));
app.use('/api/events', createCrudRouter(ScheduledEventEntity, [], 'event'));
app.use('/api/assets', createCrudRouter(GameAssetEntity, [], 'gameasset'));
app.use('/api/markets', createCrudRouter(MarketEntity));
app.use('/api/quests', createCrudRouter(QuestEntity, ['assignedUsers']));

// More complex routes will be implemented directly
const actionsRouter = require('./routes/actions');
app.use('/api/actions', actionsRouter);
const dataRouter = require('./routes/data');
app.use('/api/data', dataRouter);
const guildsRouter = require('./routes/guilds');
app.use('/api/guilds', guildsRouter);
const mediaRouter = require('./routes/media');
app.use('/api/media', mediaRouter(upload));
const assetPacksRouter = require('./routes/assetPacks');
app.use('/api/asset-packs', assetPacksRouter);
const imagePacksRouter = require('./routes/imagePacks');
app.use('/api/image-packs', imagePacksRouter);
const rewardTypesRouter = require('./routes/rewardTypes');
app.use('/api/reward-types', rewardTypesRouter);
const settingsRouter = require('./routes/settings');
app.use('/api/settings', settingsRouter);
const systemRouter = require('./routes/system');
app.use('/api/system', systemRouter);
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
const aiRouter = require('./routes/ai');
app.use('/api/ai', aiRouter(ai));

// Serve static assets from React build
const staticPath = path.join(__dirname, '../dist');
app.use(express.static(staticPath));

// Serve uploaded assets
app.use('/uploads', express.static(UPLOADS_DIR));

// The "catchall" handler
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Final error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
});
