
require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const { In } = require("typeorm");
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

const app = express();
const port = process.env.PORT || 3000;

const updateEmitter = new EventEmitter();
let clients = [];

// === Helper Functions ===
const updateTimestamps = (entity, isNew = false) => {
    const now = new Date().toISOString();
    if (isNew) entity.createdAt = now;
    entity.updatedAt = now;
    return entity;
};

const checkAndAwardTrophies = async (manager, userId, guildId) => {
    // Implementation for awarding trophies automatically
    // This is a complex function that would check user progress against trophy requirements
    return { newUserTrophies: [], newNotifications: [] };
};

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === Gemini AI Client ===
let ai;
if (process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall') {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// === File Uploads and Backups Configuration ===
const UPLOADS_DIR = '/app/data/assets';
const BACKUP_DIR = '/app/data/backups';
const ASSET_PACKS_DIR = '/app/data/asset_packs';
const DEFAULT_ASSET_PACKS_SOURCE_DIR = path.join(__dirname, 'default_asset_packs');

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const finalDir = path.join(UPLOADS_DIR, category);
        await fs.mkdir(finalDir, { recursive: true });
        cb(null, finalDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_')}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// === Database Initialization and Server Start ===
const initializeApp = async () => {
    await ensureDatabaseDirectoryExists();
    await dataSource.initialize();
    console.log("Data Source has been initialized!");

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });

    // Copy default asset packs if they don't exist
    try {
        const defaultPacks = await fs.readdir(DEFAULT_ASSET_PACKS_SOURCE_DIR);
        for (const packFilename of defaultPacks) {
            const sourcePath = path.join(DEFAULT_ASSET_PACKS_SOURCE_DIR, packFilename);
            const destPath = path.join(ASSET_PACKS_DIR, packFilename);
            await fs.copyFile(sourcePath, destPath);
        }
    } catch (error) {
        console.error('Could not ensure default asset packs exist:', error);
    }

    // === API ROUTES ===
    // This is where all route setup now lives, after the database is initialized.
    
    // Generic CRUD factory
    const createCrudRouter = (entity, relations = [], entityNameOverride = null) => {
        const router = express.Router();
        const repo = dataSource.getRepository(entity);
        const entityName = entityNameOverride || repo.metadata.tableName.toLowerCase();

        router.get('/', async (req, res) => res.json(await repo.find({ relations })));
        router.post('/', async (req, res) => {
            const id = `${entityName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const item = repo.create({ ...req.body, id });
            const saved = await repo.save(updateTimestamps(item, true));
            updateEmitter.emit('update');
            res.status(201).json(saved);
        });
        router.put('/:id', async (req, res) => {
            const item = await repo.preload({ id: req.params.id, ...req.body });
            if (!item) return res.status(404).json({ error: `${entityName} not found` });
            const saved = await repo.save(updateTimestamps(item));
            updateEmitter.emit('update');
            res.json(saved);
        });
        router.delete('/', async (req, res) => {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid body' });
            await repo.delete(ids);
            updateEmitter.emit('update');
            res.status(204).send();
        });

        // Add clone routes for relevant entities
        if (['quests', 'markets', 'rewardTypes', 'gameAssets'].includes(entityName)) {
            router.post('/clone/:id', async (req, res) => {
                const original = await repo.findOneBy({ id: req.params.id });
                if (!original) return res.status(404).json({ error: `${entityName} not found` });
                const cloneData = { ...original, id: undefined, name: `${original.name || original.title} (Copy)` };
                const newId = `${entityName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const newItem = repo.create({ ...cloneData, id: newId });
                const saved = await repo.save(updateTimestamps(newItem, true));
                updateEmitter.emit('update');
                res.status(201).json(saved);
            });
        }
        
        return router;
    };

    // Use the factory for entities
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
    app.use('/api/guilds', createCrudRouter(GuildEntity, ['members']));
    app.use('/api/reward-types', createCrudRouter(RewardTypeDefinitionEntity));
    app.use('/api/users', createCrudRouter(UserEntity, ['guilds']));
    app.use('/api/bug-reports', createCrudRouter(BugReportEntity));
    
    // Complex routes that don't fit simple CRUD
    const dataRouter = require('./routes/data');
    app.use('/api/data', dataRouter(updateEmitter)); // Pass emitter
    const actionsRouter = require('./routes/actions');
    app.use('/api/actions', actionsRouter(updateEmitter, checkAndAwardTrophies)); // Pass emitter and helpers
    const mediaRouter = require('./routes/media');
    app.use('/api/media', mediaRouter(upload));
    const assetPacksRouter = require('./routes/assetPacks');
    app.use('/api/asset-packs', assetPacksRouter);
    const imagePacksRouter = require('./routes/imagePacks');
    app.use('/api/image-packs', imagePacksRouter);
    const settingsRouter = require('./routes/settings');
    app.use('/api/settings', settingsRouter(updateEmitter));
    const systemRouter = require('./routes/system');
    app.use('/api/system', systemRouter);
    const aiRouter = require('./routes/ai');
    app.use('/api/ai', aiRouter(ai));
    
    // Serve static assets
    const staticPath = path.join(__dirname, '../dist');
    app.use(express.static(staticPath));
    app.use('/uploads', express.static(UPLOADS_DIR));

    // Catch-all to serve index.html
    app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));

    // Final error handler
    app.use((err, req, res, next) => {
        console.error("Unhandled error:", err);
        res.status(500).json({ error: 'An unexpected server error occurred.' });
    });

    app.listen(port, () => console.log(`Task Donegeon backend listening at http://localhost:${port}`));
};

initializeApp().catch(err => {
    console.error("Critical error during application initialization:", err);
    process.exit(1);
});
