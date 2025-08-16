
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
    BugReportEntity, allEntities
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
    if (guildId) return;

    const user = await manager.findOneBy(UserEntity, { id: userId });
    if (!user) return;

    // Get all necessary data for checks
    const userCompletedQuests = await manager.find(QuestCompletionEntity, {
        where: { user: { id: userId }, guildId: null, status: 'Approved' },
        relations: ['quest']
    });
    const userTrophies = await manager.find(UserTrophyEntity, { where: { userId, guildId: null } });
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
            await manager.save(updateTimestamps(newTrophy, true));

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
            await manager.save(updateTimestamps(newNotification, true));
        }
    }
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
            console.log(`Synced default asset pack: ${packFilename}`);
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

    // MIGRATION: Ensure the default exchange market exists for existing users
    const manager = dataSource.manager;
    const bankMarket = await manager.findOneBy(MarketEntity, { id: 'market-bank' });
    if (!bankMarket) {
        console.log("Exchange Post market not found, creating it for existing instance...");
        const newBankMarket = manager.create(MarketEntity, {
            id: 'market-bank',
            title: 'The Exchange Post',
            description: 'Exchange your various currencies and experience points.',
            iconType: 'emoji',
            icon: '⚖️',
            status: { type: 'open' }
        });
        await manager.save(updateTimestamps(newBankMarket, true));
        console.log("Exchange Post market created.");
    }


    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });
    
    // Copy default asset packs if they don't exist in the user's volume
    await ensureDefaultAssetPacksExist();
    
    // Placeholder for automated backup scheduler
    // startAutomatedBackupScheduler();

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
    
    const users = await manager.find(UserEntity, { relations: ['guilds'] });
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
    data.bugReports = await manager.find(BugReportEntity, { order: { createdAt: "DESC" } });
    
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

// Server-Sent Events endpoint
app.get('/api/data/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log(`[SSE] Client connected: ${clientId}`);

    // Send a welcome message to confirm connection
    res.write('data: connected\n\n');

    const heartbeatInterval = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing heartbeat to client ${clientId}, closing connection.`);
            clearInterval(heartbeatInterval);
            req.socket.end(); // Manually close the socket
        }
    }, 20000); // Send a heartbeat every 20 seconds

    req.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log(`[SSE] Client disconnected: ${clientId}`);
        clients = clients.filter(client => client.id !== clientId);
    });
});

const sendUpdateToClients = () => {
    console.log(`[SSE] Sending update to ${clients.length} client(s)`);
    clients.forEach(client => {
        try {
            client.res.write('data: sync\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing to client ${client.id}, it might be disconnected.`);
        }
    });
};

app.post('/api/data/import-assets', asyncMiddleware(async (req, res) => {
    const { assetPack, resolutions } = req.body;
    // For now, assume the first admin is the importer. A proper user session would be needed for a real app.
    const currentUser = await dataSource.manager.findOne(UserEntity, { where: { role: 'Donegeon Master' } });
    if (!currentUser) throw new Error('No admin user found to act as importer.');
    
    const now = new Date().toISOString();
    const idMap = new Map(); // Maps old blueprint IDs to new database IDs

    await dataSource.transaction(async manager => {
        // Helper function to process assets
        const processAssets = async (assetType, packAssets, entity, nameField = 'name') => {
            if (packAssets && packAssets.length > 0) {
                for (const asset of packAssets) {
                    const resolution = resolutions.find(r => r.id === asset.id && r.type === assetType);
                    if (resolution && resolution.selected) {
                        const newId = `${entity.name.toLowerCase().replace('entity', '').trim()}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                        idMap.set(asset.id, newId);
                        
                        let finalAsset = {
                            // Provide robust defaults for GameAsset properties
                            purchaseLimit: null,
                            purchaseLimitType: 'Total',
                            purchaseCount: 0,
                            requiresApproval: false,
                            icon: '📦',
                            iconType: 'emoji',
                            ...asset,
                            id: newId,
                            [nameField]: resolution.resolution === 'rename' ? resolution.newName : asset[nameField],
                            creatorId: currentUser.id,
                            createdAt: now,
                            updatedAt: now,
                        };

                        // Clean up potential nulls that the DB might not like
                        if (finalAsset.payouts === null) delete finalAsset.payouts;

                        const newEntity = manager.create(entity, finalAsset);
                        await manager.save(newEntity);
                    }
                }
            }
        };

        await processAssets('rewardTypes', assetPack.assets.rewardTypes, RewardTypeDefinitionEntity);
        await processAssets('ranks', assetPack.assets.ranks, RankEntity);
        await processAssets('questGroups', assetPack.assets.questGroups, QuestGroupEntity);
        await processAssets('gameAssets', assetPack.assets.gameAssets, GameAssetEntity);
        await processAssets('markets', assetPack.assets.markets, MarketEntity, 'title');
        await processAssets('trophies', assetPack.assets.trophies, TrophyEntity);
        
        // Process Quests with dependency remapping
        if (assetPack.assets.quests) {
            for (const quest of assetPack.assets.quests) {
                const resolution = resolutions.find(r => r.id === quest.id && r.type === 'quests');
                if (resolution && resolution.selected) {
                    const newId = `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    idMap.set(quest.id, newId);
                    
                    const remapRewards = (rewards) => (rewards || []).map(r => ({
                        ...r,
                        rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId
                    }));

                    const finalQuest = {
                        // DEFAULTS FOR QUEST to prevent crashes
                        iconType: 'emoji',
                        claimedByUserIds: [],
                        dismissals: [],
                        lateSetbacks: [],
                        incompleteSetbacks: [],
                        assignedUserIds: [],
                        ...quest, // SPREAD QUEST OVER DEFAULTS
                        id: newId,
                        title: resolution.resolution === 'rename' ? resolution.newName : quest.title,
                        groupId: idMap.get(quest.groupId) || quest.groupId,
                        rewards: remapRewards(quest.rewards),
                        lateSetbacks: remapRewards(quest.lateSetbacks),
                        incompleteSetbacks: remapRewards(quest.incompleteSetbacks),
                        createdAt: now,
                        updatedAt: now,
                    };

                    const newQuest = manager.create(QuestEntity, finalQuest);
                    await manager.save(newQuest);
                }
            }
        }
        
    });

    sendUpdateToClients();
    res.status(204).send();
}));