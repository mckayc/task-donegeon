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
        where: { user: { id: userId }, guildId: IsNull(), status: 'Approved' },
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

    const manager = dataSource.manager;

    // MIGRATION: Ensure the default exchange market exists for existing users
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

    // MIGRATION/SYNC: Ensure all users are in the default guild if one exists.
    const defaultGuild = await manager.findOne(GuildEntity, { where: { isDefault: true }, relations: ['members'] });
    if (defaultGuild) {
        const allUsers = await manager.find(UserEntity);
        const guildMemberIds = new Set(defaultGuild.members.map(m => m.id));
        let needsSave = false;
        allUsers.forEach(user => {
            if (!guildMemberIds.has(user.id)) {
                console.log(`[Data Sync] Adding user "${user.gameName}" (${user.id}) to default guild.`);
                defaultGuild.members.push(user);
                needsSave = true;
            }
        });
        if (needsSave) {
            await manager.save(updateTimestamps(defaultGuild));
            console.log(`[Data Sync] Default guild membership updated.`);
        }
    }

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });
    
    // Copy default asset packs if they don't exist in the user's volume
    await ensureDefaultAssetPacksExist();
    
    // Start automated backup scheduler
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

    data.users = users.map(u => {
        const { guilds, ...userData } = u;
        return { ...userData, guildIds: guilds?.map(g => g.id) || [] };
    });
    data.quests = quests.map(q => {
        const { assignedUsers, ...questData } = q;
        return { ...questData, assignedUserIds: assignedUsers?.map(u => u.id) || [] };
    });
    data.questCompletions = questCompletions.map(qc => {
        const { user, quest, ...completionData } = qc;
        return { ...completionData, userId: user?.id, questId: quest?.id };
    });
    data.guilds = guilds.map(g => {
        const { members, ...guildData } = g;
        return { ...guildData, memberIds: members?.map(m => m.id) || [] };
    });

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
    data.modifierDefinitions = await manager.find(ModifierDefinitionEntity);
    data.appliedModifiers = await manager.find(AppliedModifierEntity);
    data.tradeOffers = await manager.find(TradeOfferEntity);
    data.gifts = await manager.find(GiftEntity);
    data.rotations = await manager.find(RotationEntity);
    
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
    console.log(`[SSE] Broadcasting sync event to ${clients.length} client(s).`);
    const clientsToRemove = [];

    clients.forEach(client => {
        try {
            client.res.write('data: sync\n\n');
        } catch (error) {
            console.error(`[SSE] Error writing to client ${client.id}:`, error.message);
            // If we can't write, the connection is likely closed.
            clientsToRemove.push(client.id);
        }
    });

    if (clientsToRemove.length > 0) {
        console.log(`[SSE] Removing ${clientsToRemove.length} disconnected client(s).`);
        clients = clients.filter(client => !clientsToRemove.includes(client.id));
    }
};

updateEmitter.on('update', sendUpdateToClients);


// System Status Check
app.get('/api/system/status', (req, res) => {
    const geminiConnected = !!ai;
    const isCustomDbPath = process.env.DATABASE_PATH && process.env.DATABASE_PATH !== '/app/data/database/database.sqlite';
    const isJwtSecretSet = process.env.JWT_SECRET && process.env.JWT_SECRET !== 'insecure_default_secret_for_testing_only';

    res.json({
        geminiConnected,
        database: {
            connected: dataSource.isInitialized,
            isCustomPath: isCustomDbPath
        },
        jwtSecretSet: isJwtSecretSet
    });
});

app.post('/api/ai/test', asyncMiddleware(async (req, res) => {
    if (!ai) {
        return res.status(400).json({ success: false, error: 'API_KEY is not configured on the server.' });
    }
    try {
        // A simple, low-token prompt to verify connectivity and key validity.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
            config: {
                maxOutputTokens: 1,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Gemini API key test failed:", error.message);
        let errorMessage = 'The API key is invalid or has insufficient permissions.';
        if (error.message && typeof error.message === 'string') {
            if (error.message.includes('API_KEY_INVALID')) {
                errorMessage = 'The provided API key is invalid.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'The API key does not have permission to access the Gemini API.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'A network error occurred while trying to contact the Google AI service.';
            }
        }
        res.status(400).json({ success: false, error: errorMessage });
    }
}));


// New Sync Endpoint
app.get('/api/data/sync', asyncMiddleware(async (req, res) => {
    const { lastSync } = req.query;
    const newSyncTimestamp = new Date().toISOString();
    const manager = dataSource.manager;

    if (!lastSync) {
        // Full initial load
        const userCount = await manager.count(UserEntity);
        if (userCount === 0) {
            console.log("No users found, triggering first run.");
            return res.status(200).json({
                updates: {
                    users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
                    purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
                    adminAdjustments: [], gameAssets: [], systemLogs: [], themes: [], chatMessages: [],
                    systemNotifications: [], scheduledEvents: [], bugReports: [], modifierDefinitions: [], appliedModifiers: [],
                    rotations: [], tradeOffers: [], gifts: [],
                    settings: { ...INITIAL_SETTINGS, contentVersion: 0 },
                    loginHistory: [],
                },
                newSyncTimestamp
            });
        }
        const appData = await getFullAppData(manager);
        res.status(200).json({ updates: appData, newSyncTimestamp });
    } else {
        // Delta sync
        const updates = {};
        const entitiesToSync = [
            UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
            QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
            UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
            ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
            BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, RotationEntity, TradeOfferEntity, GiftEntity
        ];
        
        for (const entity of entitiesToSync) {
            const repo = manager.getRepository(entity);
            const pluralName = entity.options.name.toLowerCase() + 's';
            
            const changedRecords = await repo.find({
                where: { updatedAt: MoreThan(lastSync) },
                // Include necessary relations for correct frontend processing
                ...(entity.options.name === 'Quest' && { relations: ['assignedUsers'] }),
                ...(entity.options.name === 'Guild' && { relations: ['members'] }),
                ...(entity.options.name === 'QuestCompletion' && { relations: ['user', 'quest'] }),
            });
            
            if (changedRecords.length > 0) {
                // Remap relational data to IDs for frontend
                if (entity.options.name === 'Quest') {
                    updates.quests = changedRecords.map(q => {
                        const { assignedUsers, ...questData } = q;
                        return { ...questData, assignedUserIds: assignedUsers?.map(u => u.id) || [] };
                    });
                } else if (entity.options.name === 'Guild') {
                    updates.guilds = changedRecords.map(g => {
                        const { members, ...guildData } = g;
                        return { ...guildData, memberIds: members?.map(m => m.id) || [] };
                    });
                } else if (entity.options.name === 'QuestCompletion') {
                    updates.questCompletions = changedRecords.map(qc => {
                        const { user, quest, ...completionData } = qc;
                        return { ...completionData, userId: user?.id, questId: quest?.id };
                    });
                } else {
                     updates[pluralName] = changedRecords;
                }
            }
        }
        
        // Special handling for settings and login history as they are single rows
        const settingRow = await manager.findOne(SettingEntity, { where: { id: 1, updatedAt: MoreThan(lastSync) } });
        if (settingRow) updates.settings = settingRow.settings;

        const historyRow = await manager.findOne(LoginHistoryEntity, { where: { id: 1, updatedAt: MoreThan(lastSync) } });
        if (historyRow) updates.loginHistory = historyRow.history;
        
        res.status(200).json({ updates, newSyncTimestamp });
    }
}));


// FIRST RUN
app.post('/api/first-run', asyncMiddleware(async (req, res) => {
    const { adminUserData } = req.body;
    
    await dataSource.transaction(async manager => {
        // Clear everything first
        for (const entity of dataSource.entityMetadatas) {
            await manager.getRepository(entity.name).clear();
        }
        
        await manager.save(RewardTypeDefinitionEntity, INITIAL_REWARD_TYPES.map(e => updateTimestamps(e, true)));
        await manager.save(RankEntity, INITIAL_RANKS.map(e => updateTimestamps(e, true)));
        await manager.save(TrophyEntity, INITIAL_TROPHIES.map(e => updateTimestamps(e, true)));
        await manager.save(ThemeDefinitionEntity, INITIAL_THEMES.map(e => updateTimestamps(e, true)));
        await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(e => updateTimestamps(e, true)));

        const adminUser = manager.create(UserEntity, {
            ...adminUserData,
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            avatar: {},
            ownedAssetIds: [],
            personalPurse: {},
            personalExperience: {},
            guildBalances: {},
            ownedThemes: ['emerald', 'rose', 'sky'],
            hasBeenOnboarded: false,
        });
        await manager.save(updateTimestamps(adminUser, true));

        const defaultGuild = manager.create(GuildEntity, {
            id: 'guild-1',
            name: 'The First Guild',
            purpose: 'The default guild for all new adventurers.',
            isDefault: true,
            members: [adminUser]
        });
        await manager.save(updateTimestamps(defaultGuild, true));

        const exchangeMarket = { id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } };
        await manager.save(MarketEntity, updateTimestamps(exchangeMarket, true));

        const settings = { ...INITIAL_SETTINGS, contentVersion: 1 };
        await manager.save(SettingEntity, updateTimestamps({ id: 1, settings }, true));
        await manager.save(LoginHistoryEntity, updateTimestamps({ id: 1, history: [adminUser.id] }, true));
        
        res.status(201).json({ adminUser });
    });
}));

app.post('/api/data/apply-updates', asyncMiddleware(async (req, res) => {
    await dataSource.transaction(async manager => {
        const settingRepo = manager.getRepository(SettingEntity);
        const currentSettingRow = await settingRepo.findOneBy({ id: 1 });
        let currentSettings = currentSettingRow ? currentSettingRow.settings : {};
        const defaultSettings = INITIAL_SETTINGS;

        const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

        const mergeNewProperties = (target, source) => {
            for (const key in source) {
                if (key === 'sidebars' && isObject(source[key]) && target[key] && source.sidebars.main) {
                    // Rebuild the sidebar from the default, preserving user's visibility settings
                    const userVisibilityMap = new Map();
                    // Use a unique key for each item, like its id, for the map.
                    (target.sidebars.main || []).forEach(item => {
                        if (item.id) {
                            userVisibilityMap.set(item.id, item.isVisible);
                        }
                    });
                    
                    const newSidebar = (source.sidebars.main || []).map(defaultItem => {
                        // Check if the user has a saved visibility setting for this item.
                        if (defaultItem.id && userVisibilityMap.has(defaultItem.id)) {
                            // If yes, apply it. Otherwise, use the default visibility.
                            return { ...defaultItem, isVisible: userVisibilityMap.get(defaultItem.id) };
                        }
                        return defaultItem;
                    });
                    
                    target.sidebars.main = newSidebar;
                } else if (isObject(source[key])) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    mergeNewProperties(target[key], source[key]);
                } else if (!target.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        };

        mergeNewProperties(currentSettings, defaultSettings);
        
        // Also update contentVersion if it's different.
        if (currentSettings.contentVersion !== defaultSettings.contentVersion) {
            currentSettings.contentVersion = defaultSettings.contentVersion;
        }

        const savedSettings = await settingRepo.save(updateTimestamps({ id: 1, settings: currentSettings }));
        updateEmitter.emit('update');
        res.json(savedSettings.settings);
    });
}));

app.post('/api/data/import-assets', asyncMiddleware(async (req, res) => {
    const { assetPack, resolutions } = req.body;
    if (!assetPack || !resolutions) return res.status(400).json({ error: 'Missing asset pack or resolutions.' });

    let importedData = {};
    const createdEntityIds = {};

    await dataSource.transaction(async manager => {
        const idMap = new Map();
        const assetsToSave = {};
        const selectedResolutions = resolutions.filter(r => r.selected);

        // Pass 1: Sanitize data, generate new IDs, and build the ID map.
        for (const res of selectedResolutions) {
            const assetList = assetPack.assets[res.type];
            if (!assetList) continue;
            
            const idField = res.type === 'users' ? 'username' : 'id';
            const originalAsset = assetList.find(a => a[idField] === res.id);
            if (!originalAsset) continue;

            const newAssetData = JSON.parse(JSON.stringify(originalAsset));
            
            // --- DATA SANITIZATION AND DEFAULTING ---
            if (res.type === 'quests') {
                const q = newAssetData;
                q.iconType = q.iconType || 'emoji';
                q.imageUrl = q.imageUrl || null;
                q.tags = q.tags || [];
                q.rewards = q.rewards || [];
                q.lateSetbacks = q.lateSetbacks || [];
                q.incompleteSetbacks = q.incompleteSetbacks || [];
                q.assignedUserIds = q.assignedUserIds || [];
                q.claimedByUserIds = q.claimedByUserIds || [];
                q.dismissals = q.dismissals || [];
                q.todoUserIds = q.todoUserIds || [];
                q.startDateTime = q.startDateTime || null;
                q.endDateTime = q.endDateTime || null;
                q.startTime = q.startTime || null;
                q.endTime = q.endTime || null;
                q.nextQuestId = q.nextQuestId || null;
                q.groupId = q.groupId === undefined ? null : q.groupId;
                
                if (typeof q.allDay !== 'boolean') q.allDay = !(q.startTime || q.endTime);
                if (q.guildId === undefined) q.guildId = null;
                
                if (q.type === 'Duty') {
                    q.rrule = q.rrule || 'FREQ=DAILY';
                    q.availabilityCount = null;
                } else { // Venture
                    q.rrule = null;
                    if (typeof q.availabilityCount !== 'number') q.availabilityCount = null;
                }
            }

            if (res.type === 'gameAssets') {
                const ga = newAssetData;
                ga.creatorId = ga.creatorId || 'system';
                ga.purchaseCount = ga.purchaseCount || 0;
                ga.purchaseLimitType = ga.purchaseLimitType || 'Total';
                if (typeof ga.isForSale !== 'boolean') ga.isForSale = false;
                if (typeof ga.requiresApproval !== 'boolean') ga.requiresApproval = false;
                ga.costGroups = ga.costGroups || [];
                ga.marketIds = ga.marketIds || [];
                ga.iconType = ga.iconType || 'emoji';
            }

            if (res.resolution === 'rename' && res.newName) {
                if ('title' in newAssetData) newAssetData.title = res.newName;
                else newAssetData.name = res.newName;
            }
            
            const newId = `${res.type.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            if (res.type === 'users') {
                if (originalAsset.id) idMap.set(originalAsset.id, newId);
                if (originalAsset.username) idMap.set(originalAsset.username, newId);
            } else {
                if (originalAsset.id) idMap.set(originalAsset.id, newId);
            }
            newAssetData.id = newId;

            if (!assetsToSave[res.type]) assetsToSave[res.type] = [];
            assetsToSave[res.type].push(newAssetData);
        }
        
        const remap = (id) => idMap.get(id) || id;

        // Pass 2: Remap all internal references.
        const processAssets = (type, processor) => {
            if (assetsToSave[type]) assetsToSave[type].forEach(processor);
        };
        
        processAssets('quests', quest => {
            if (quest.groupId) quest.groupId = remap(quest.groupId);
            quest.assignedUserIds = (quest.assignedUserIds || []).map(remap);
            quest.rewards = (quest.rewards || []).map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
            quest.lateSetbacks = (quest.lateSetbacks || []).map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
            quest.incompleteSetbacks = (quest.incompleteSetbacks || []).map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
        });

        processAssets('gameAssets', asset => {
            asset.marketIds = (asset.marketIds || []).map(remap);
            asset.costGroups = (asset.costGroups || []).map(group => group.map(c => ({ ...c, rewardTypeId: remap(c.rewardTypeId) })));
            asset.payouts = (asset.payouts || []).map(p => ({ ...p, rewardTypeId: remap(p.rewardTypeId) }));
            if (asset.linkedThemeId) asset.linkedThemeId = remap(asset.linkedThemeId);
        });

        processAssets('trophies', trophy => {
            trophy.requirements = (trophy.requirements || []).map(req => {
                if (req.type === 'ACHIEVE_RANK' || req.type === 'QUEST_COMPLETED') return { ...req, value: remap(req.value) };
                return req;
            });
        });
        
        processAssets('markets', market => {
            if (market.status.type === 'conditional' && Array.isArray(market.status.conditions)) {
                market.status.conditions = market.status.conditions.map(cond => {
                    if (cond.type === 'MIN_RANK') return { ...cond, rankId: remap(cond.rankId) };
                    if (cond.type === 'QUEST_COMPLETED') return { ...cond, questId: remap(cond.questId) };
                    return cond;
                });
            }
        });

        // Pass 3: Save remapped assets in a dependency-aware order.
        const saveOrder = ['markets', 'rewardTypes', 'ranks', 'questGroups', 'users', 'quests', 'trophies', 'gameAssets'];
        for (const type of saveOrder) {
            if (assetsToSave[type]) {
                if (!createdEntityIds[type]) createdEntityIds[type] = [];
                for (const asset of assetsToSave[type]) {
                    const assetWithTimestamps = updateTimestamps(asset, true);
                    let savedEntity;
                    switch (type) {
                        case 'users':
                            const { assignedUsers, guilds, questCompletions, purchaseRequests, ...userData } = assetWithTimestamps;
                            const defaultGuild = await manager.findOneBy(GuildEntity, { isDefault: true });
                            const userToSave = manager.create(UserEntity, {
                                ...userData, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {},
                                ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
                            });
                            savedEntity = await manager.save(userToSave);
                            if (defaultGuild) {
                                if (!defaultGuild.members) defaultGuild.members = [];
                                defaultGuild.members.push(userToSave);
                                await manager.save(updateTimestamps(defaultGuild));
                            }
                            break;
                        case 'quests':
                            const { assignedUserIds: remappedUserIds, ...questData } = assetWithTimestamps;
                            const questToSave = manager.create(QuestEntity, questData);
                            if (remappedUserIds && remappedUserIds.length > 0) {
                                questToSave.assignedUsers = await manager.getRepository(UserEntity).findBy({ id: In(remappedUserIds) });
                            }
                            savedEntity = await manager.save(questToSave);
                            break;
                        case 'questGroups': savedEntity = await manager.save(QuestGroupEntity, assetWithTimestamps); break;
                        case 'rewardTypes': savedEntity = await manager.save(RewardTypeDefinitionEntity, { ...assetWithTimestamps, isCore: false }); break;
                        case 'ranks': savedEntity = await manager.save(RankEntity, assetWithTimestamps); break;
                        case 'trophies': savedEntity = await manager.save(TrophyEntity, assetWithTimestamps); break;
                        case 'markets': savedEntity = await manager.save(MarketEntity, assetWithTimestamps); break;
                        case 'gameAssets': savedEntity = await manager.save(GameAssetEntity, assetWithTimestamps); break;
                    }
                    if (savedEntity) createdEntityIds[type].push(savedEntity.id);
                }
            }
        }
        
        // Populate importedData with the newly created and fully resolved entities
        const entityNameMap = {
            quests: 'Quest',
            questGroups: 'QuestGroup',
            markets: 'Market',
            rewardTypes: 'RewardTypeDefinition',
            ranks: 'Rank',
            trophies: 'Trophy',
            gameAssets: 'GameAsset',
            users: 'User',
        };
        for(const type in createdEntityIds) {
            if (!importedData[type]) importedData[type] = [];

            const findOptions = { where: { id: In(createdEntityIds[type]) } };
            if (type === 'quests') {
                findOptions.relations = ['assignedUsers'];
            } else if (type === 'guilds') {
                findOptions.relations = ['members'];
            }
            
            const entityName = entityNameMap[type];
            if (!entityName) {
                console.warn(`[Asset Import] Unknown asset type for repository lookup: ${type}`);
                continue;
            }
            const repo = manager.getRepository(entityName);
            const entities = await repo.find(findOptions);
            importedData[type] = entities;
        }
    });

    const remappedImportedData = {};
    if (importedData.quests) remappedImportedData.quests = importedData.quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers?.map(u => u.id) || [] }));
    if (importedData.markets) remappedImportedData.markets = importedData.markets;
    if (importedData.gameAssets) remappedImportedData.gameAssets = importedData.gameAssets;
    if (importedData.questGroups) remappedImportedData.questGroups = importedData.questGroups;
    if (importedData.rewardTypes) remappedImportedData.rewardTypes = importedData.rewardTypes;
    if (importedData.ranks) remappedImportedData.ranks = importedData.ranks;
    if (importedData.trophies) remappedImportedData.trophies = importedData.trophies;
    if (importedData.users) remappedImportedData.users = importedData.users;
    
    updateEmitter.emit('update');
    res.status(200).json({ message: 'Assets imported successfully.', importedData: remappedImportedData });
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

// Guilds Router (custom handling for members)
const guildsRouter = express.Router();
const guildRepo = dataSource.getRepository(GuildEntity);

guildsRouter.get('/', asyncMiddleware(async (req, res) => {
    const guilds = await guildRepo.find({ relations: ['members'] });
    res.json(guilds.map(g => ({ ...g, memberIds: g.members.map(m => m.id) })));
}));

guildsRouter.post('/', asyncMiddleware(async (req, res) => {
    const { memberIds, ...guildData } = req.body;
    const newGuild = guildRepo.create({
        ...guildData,
        id: `guild-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });

    if (memberIds && memberIds.length > 0) {
        newGuild.members = await dataSource.getRepository(UserEntity).findBy({ id: In(memberIds) });
    }

    const saved = await guildRepo.save(updateTimestamps(newGuild, true));
    updateEmitter.emit('update');
    res.status(201).json(saved);
}));

guildsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const { memberIds, ...guildData } = req.body;
    const guild = await guildRepo.findOneBy({ id: req.params.id });
    if (!guild) return res.status(404).send('Guild not found');

    guildRepo.merge(guild, guildData);
    
    if (memberIds) {
        guild.members = await dataSource.getRepository(UserEntity).findBy({ id: In(memberIds) });
    }

    const saved = await guildRepo.save(updateTimestamps(guild));
    updateEmitter.emit('update');
    res.json(saved);
}));

guildsRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    await guildRepo.delete(ids);
    updateEmitter.emit('update');
    res.status(204).send();
}));

// Users Router (custom handling)
const usersRouter = express.Router();
const userRepo = dataSource.getRepository(UserEntity);

usersRouter.get('/', asyncMiddleware(async (req, res) => {
    const { searchTerm, sortBy } = req.query;
    const qb = userRepo.createQueryBuilder("user");

    if (searchTerm) {
        qb.where(new Brackets(subQuery => {
            subQuery.where("LOWER(user.gameName) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` })
                  .orWhere("LOWER(user.username) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` });
        }));
    }

    switch (sortBy) {
        case 'gameName-desc': qb.orderBy("user.gameName", "DESC"); break;
        case 'username-asc': qb.orderBy("user.username", "ASC"); break;
        case 'username-desc': qb.orderBy("user.username", "DESC"); break;
        case 'role-asc': qb.orderBy("user.role", "ASC"); break;
        case 'role-desc': qb.orderBy("user.role", "DESC"); break;
        case 'gameName-asc': default: qb.orderBy("user.gameName", "ASC"); break;
    }

    res.json(await qb.getMany());
}));

usersRouter.post('/', asyncMiddleware(async (req, res) => {
    const userData = req.body;
    
    const conflict = await userRepo.findOne({
        where: [
            { username: userData.username },
            { email: userData.email }
        ]
    });
    if (conflict) {
        return res.status(409).json({ error: 'Username or email is already in use.' });
    }

    const newUser = userRepo.create({
        ...userData,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
    });
    await userRepo.save(updateTimestamps(newUser, true));
    
    const defaultGuild = await guildRepo.findOne({ where: { isDefault: true }, relations: ['members'] });
    if (defaultGuild) {
        defaultGuild.members.push(newUser);
        await guildRepo.save(updateTimestamps(defaultGuild));
    }

    updateEmitter.emit('update');
    res.status(201).json(newUser);
}));

usersRouter.post('/clone/:id', asyncMiddleware(async (req, res) => {
    const userToClone = await userRepo.findOneBy({ id: req.params.id });
    if (!userToClone) return res.status(404).send('User not found');

    const suffix = Date.now().toString().slice(-5);
    const newUser = userRepo.create({
        ...userToClone,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        username: `${userToClone.username}${suffix}`,
        email: `clone_${suffix}_${userToClone.email}`,
        gameName: `${userToClone.gameName} (Copy)`,
        // Reset dynamic data for the new user
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedAssetIds: [],
        ownedThemes: ['emerald', 'rose', 'sky'],
        hasBeenOnboarded: false,
    });
    
    const savedUser = await userRepo.save(updateTimestamps(newUser, true));
    
    const defaultGuild = await guildRepo.findOne({ where: { isDefault: true }, relations: ['members'] });
    if (defaultGuild) {
        defaultGuild.members.push(savedUser);
        await guildRepo.save(updateTimestamps(defaultGuild));
    }

    updateEmitter.emit('update');
    res.status(201).json(savedUser);
}));

usersRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const user = await userRepo.findOneBy({ id: req.params.id });
    if (!user) return res.status(404).send('User not found');
    
    if (req.body.username && req.body.username !== user.username) {
        const conflict = await userRepo.findOneBy({ username: req.body.username });
        if (conflict) return res.status(409).json({ error: 'Username already in use.' });
    }
    if (req.body.email && req.body.email !== user.email) {
        const conflict = await userRepo.findOneBy({ email: req.body.email });
        if (conflict) return res.status(409).json({ error: 'Email already in use.' });
    }

    userRepo.merge(user, req.body);
    const saved = await userRepo.save(updateTimestamps(user));
    updateEmitter.emit('update');
    res.json(saved);
}));

usersRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send('Invalid request body, expected "ids" array.');
    await userRepo.delete(ids);
    updateEmitter.emit('update');
    res.status(204).send();
}));


const createGenericRouter = (entity, relations = []) => {
    const router = express.Router();
    const repo = dataSource.getRepository(entity);
    const entityName = entity.options.name;

    router.get('/', asyncMiddleware(async (req, res) => {
        const items = await repo.find({ relations });
        res.json(items);
    }));

    router.post('/', asyncMiddleware(async (req, res) => {
        const newItem = repo.create({
            ...req.body,
            id: `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
        const saved = await repo.save(updateTimestamps(newItem, true));
        updateEmitter.emit('update');
        res.status(201).json(saved);
    }));

    router.put('/:id', asyncMiddleware(async (req, res) => {
        const item = await repo.findOneBy({ id: req.params.id });
        if (!item) return res.status(404).send(`${entityName} not found`);
        repo.merge(item, req.body);
        const saved = await repo.save(updateTimestamps(item));
        updateEmitter.emit('update');
        res.json(saved);
    }));

    router.delete('/', asyncMiddleware(async (req, res) => {
        const { ids } = req.body;
        await repo.delete(ids);
        updateEmitter.emit('update');
        res.status(204).send();
    }));

    return router;
};

const questsRouter = express.Router();
const questRepo = dataSource.getRepository(QuestEntity);

questsRouter.get('/', asyncMiddleware(async (req, res) => {
    const quests = await questRepo.find({ relations: ['assignedUsers'] });
    res.json(quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers.map(u => u.id) })));
}));

questsRouter.post('/', asyncMiddleware(async (req, res) => {
    const { assignedUserIds, ...questData } = req.body;
    const newQuest = questRepo.create({
        ...questData,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    });
    if (assignedUserIds && assignedUserIds.length > 0) {
        newQuest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }
    const saved = await questRepo.save(updateTimestamps(newQuest, true));
    updateEmitter.emit('update');
    res.status(201).json(saved);
}));

questsRouter.post('/clone/:id', asyncMiddleware(async (req, res) => {
    const questToClone = await questRepo.findOne({ where: { id: req.params.id }, relations: ['assignedUsers'] });
    if (!questToClone) return res.status(404).send('Quest not found');

    const newQuest = questRepo.create({
        ...questToClone,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
        assignedUsers: questToClone.assignedUsers,
    });
    
    const saved = await questRepo.save(updateTimestamps(newQuest, true));
    updateEmitter.emit('update');
    res.status(201).json(saved);
}));


questsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const quest = await questRepo.findOneBy({ id: req.params.id });
    if (!quest) return res.status(404).send('Quest not found');

    const { assignedUserIds, ...questData } = req.body;
    questRepo.merge(quest, questData);

    if (assignedUserIds) {
        quest.assignedUsers = await userRepo.findBy({ id: In(assignedUserIds) });
    }

    const saved = await questRepo.save(updateTimestamps(quest));
    updateEmitter.emit('update');
    res.json(saved);
}));

questsRouter.delete('/', asyncMiddleware(async (req, res) => {
    await questRepo.delete(req.body.ids);
    updateEmitter.emit('update');
    res.status(204).send();
}));

questsRouter.put('/bulk-status', asyncMiddleware(async (req, res) => {
    const { ids, isActive } = req.body;
    await questRepo.update(ids, { isActive });
    updateEmitter.emit('update');
    res.status(204).send();
}));

questsRouter.put('/bulk-update', asyncMiddleware(async (req, res) => {
    const { ids, updates } = req.body;
    const updatePayload = {};
    if (typeof updates.isActive === 'boolean') updatePayload.isActive = updates.isActive;
    if (typeof updates.isOptional === 'boolean') updatePayload.isOptional = updates.isOptional;
    if (typeof updates.requiresApproval === 'boolean') updatePayload.requiresApproval = updates.requiresApproval;
    if (updates.groupId !== undefined) updatePayload.groupId = updates.groupId;

    if (Object.keys(updatePayload).length > 0) {
        await questRepo.update(ids, updatePayload);
    }
    
    if (updates.addTags || updates.removeTags || updates.assignUsers || updates.unassignUsers) {
        const questsToUpdate = await questRepo.findBy({ id: In(ids) });
        for (const quest of questsToUpdate) {
            if (updates.addTags) quest.tags = [...new Set([...quest.tags, ...updates.addTags])];
            if (updates.removeTags) quest.tags = quest.tags.filter(t => !updates.removeTags.includes(t));
            if (updates.assignUsers) {
                const usersToAdd = await userRepo.findBy({ id: In(updates.assignUsers) });
                const existingUserIds = new Set(quest.assignedUsers.map(u => u.id));
                quest.assignedUsers.push(...usersToAdd.filter(u => !existingUserIds.has(u.id)));
            }
            if (updates.unassignUsers) {
                quest.assignedUsers = quest.assignedUsers.filter(u => !updates.unassignUsers.includes(u.id));
            }
        }
        await questRepo.save(questsToUpdate);
    }
    updateEmitter.emit('update');
    res.status(204).send();
}));

// AI GENERATION
app.post('/api/ai/generate', asyncMiddleware(async (req, res) => {
    if (!ai) {
        return res.status(400).json({ error: 'AI features are not configured on the server.' });
    }
    const { model, prompt, generationConfig } = req.body;
    try {
        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: prompt,
            config: generationConfig,
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: error.message || 'An error occurred while communicating with the AI.' });
    }
}));


// ACTIONS ROUTER
const actionsRouter = express.Router();

actionsRouter.post('/complete-quest', asyncMiddleware(async (req, res) => {
    const { completionData } = req.body;
    await dataSource.transaction(async manager => {
        const newCompletion = manager.create(QuestCompletionEntity, {
            ...completionData,
            id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        });
        const savedCompletion = await manager.save(updateTimestamps(newCompletion, true));
        
        let updatedUser = null;
        if (completionData.status === 'Approved') {
            const user = await manager.findOneBy(UserEntity, { id: completionData.userId });
            const quest = await manager.findOneBy(QuestEntity, { id: completionData.questId });
            if (user && quest) {
                quest.rewards.forEach(reward => {
                    const rewardType = INITIAL_REWARD_TYPES.find(rt => rt.id === reward.rewardTypeId) || {};
                    const balance = rewardType.category === 'Currency' ? user.personalPurse : user.personalExperience;
                    balance[reward.rewardTypeId] = (balance[reward.rewardTypeId] || 0) + reward.amount;
                });
                updatedUser = await manager.save(updateTimestamps(user));
            }
        }
        updateEmitter.emit('update');
        res.status(201).json({ updatedUser, newCompletion: savedCompletion });
    });
}));

actionsRouter.post('/approve-quest/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    await dataSource.transaction(async manager => {
        const completion = await manager.findOne(QuestCompletionEntity, { where: { id }, relations: ['user', 'quest'] });
        if (!completion || completion.status !== 'Pending') {
            return res.status(404).json({ error: 'Completion not found or not pending.' });
        }
        completion.status = 'Approved';
        if (note) completion.note = `${completion.note ? `${completion.note}\n` : ''}Approver: ${note}`;
        
        const updatedCompletion = await manager.save(updateTimestamps(completion));
        const user = completion.user;
        const quest = completion.quest;

        if (user && quest) {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const isGuildScope = !!completion.guildId;
            let balances = isGuildScope ? user.guildBalances[completion.guildId] : { purse: user.personalPurse, experience: user.personalExperience };
            if (!balances) {
                balances = { purse: {}, experience: {} };
                if (isGuildScope) user.guildBalances[completion.guildId] = balances;
            }
            if (!balances.purse) balances.purse = {};
            if (!balances.experience) balances.experience = {};

            quest.rewards.forEach(reward => {
                const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                }
            });

            const updatedUser = await manager.save(updateTimestamps(user));
            const { newUserTrophies, newNotifications } = await checkAndAwardTrophies(manager, user.id, completion.guildId);

            updateEmitter.emit('update');
            res.json({ updatedUser, updatedCompletion, newUserTrophies, newNotifications });
        } else {
            updateEmitter.emit('update');
            res.json({ updatedCompletion });
        }
    });
}));

actionsRouter.post('/reject-quest/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    const completion = await dataSource.manager.findOneBy(QuestCompletionEntity, { id });
    if (!completion || completion.status !== 'Pending') {
        return res.status(404).json({ error: 'Completion not found or not pending.' });
    }
    completion.status = 'Rejected';
    if (note) completion.note = `${completion.note ? `${completion.note}\n` : ''}Rejecter: ${note}`;
    const updatedCompletion = await dataSource.manager.save(updateTimestamps(completion));
    updateEmitter.emit('update');
    res.json({ updatedCompletion });
}));

actionsRouter.post('/purchase-item', asyncMiddleware(async (req, res) => {
    const { assetId, userId, costGroupIndex, guildId } = req.body;
    await dataSource.transaction(async manager => {
        const user = await manager.findOneBy(UserEntity, { id: userId });
        const asset = await manager.findOneBy(GameAssetEntity, { id: assetId });
        if (!user || !asset) return res.status(404).json({ error: 'User or asset not found.' });

        const cost = asset.costGroups[costGroupIndex];
        if (!cost) return res.status(400).json({ error: 'Invalid cost option.' });

        // Create Purchase Request
        const newPurchaseRequest = manager.create(PurchaseRequestEntity, {
            id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId, assetId, guildId,
            requestedAt: new Date().toISOString(),
            status: asset.requiresApproval ? 'Pending' : 'Completed',
            assetDetails: { name: asset.name, description: asset.description, cost }
        });
        const savedRequest = await manager.save(updateTimestamps(newPurchaseRequest, true));

        // Deduct funds (escrow)
        const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
        const balances = guildId ? user.guildBalances[guildId] : { purse: user.personalPurse, experience: user.personalExperience };
        
        for (const item of cost) {
            const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
            if (rewardDef) {
                const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) - item.amount;
            }
        }
        
        // If not requiring approval, add item immediately
        if (!asset.requiresApproval) {
            user.ownedAssetIds.push(asset.id);
            asset.purchaseCount += 1;
            await manager.save(updateTimestamps(asset));
        }

        const updatedUser = await manager.save(updateTimestamps(user));
        updateEmitter.emit('update');
        res.json({ updatedUser, newPurchaseRequest: savedRequest });
    });
}));

actionsRouter.post('/approve-purchase/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { approverId } = req.body;
    await dataSource.transaction(async manager => {
        const request = await manager.findOneBy(PurchaseRequestEntity, { id });
        if (!request || request.status !== 'Pending') return res.status(404).json({ error: 'Request not found or not pending.' });
        
        request.status = 'Completed';
        request.actedAt = new Date().toISOString();
        request.actedById = approverId;
        const updatedPurchaseRequest = await manager.save(updateTimestamps(request));

        const user = await manager.findOneBy(UserEntity, { id: request.userId });
        const asset = await manager.findOneBy(GameAssetEntity, { id: request.assetId });
        if (user && asset) {
            user.ownedAssetIds.push(asset.id);
            asset.purchaseCount += 1;
            await manager.save(updateTimestamps(asset));
            const updatedUser = await manager.save(updateTimestamps(user));
            updateEmitter.emit('update');
            res.json({ updatedUser, updatedPurchaseRequest });
        } else {
            updateEmitter.emit('update');
            res.json({ updatedPurchaseRequest });
        }
    });
}));

actionsRouter.post('/reject-purchase/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { rejecterId } = req.body;
    await dataSource.transaction(async manager => {
        const request = await manager.findOneBy(PurchaseRequestEntity, { id });
        if (!request || request.status !== 'Pending') return res.status(404).json({ error: 'Request not found or not pending.' });

        request.status = 'Rejected';
        request.actedAt = new Date().toISOString();
        request.actedById = rejecterId;
        const updatedPurchaseRequest = await manager.save(updateTimestamps(request));
        
        // Refund currency
        const user = await manager.findOneBy(UserEntity, { id: request.userId });
        if (user) {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const balances = request.guildId ? user.guildBalances[request.guildId] : { purse: user.personalPurse, experience: user.personalExperience };
            for (const item of request.assetDetails.cost) {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) + item.amount;
                }
            }
            const updatedUser = await manager.save(updateTimestamps(user));
            updateEmitter.emit('update');
            res.json({ updatedUser, updatedPurchaseRequest });
        } else {
            updateEmitter.emit('update');
            res.json({ updatedPurchaseRequest });
        }
    });
}));

actionsRouter.post('/cancel-purchase/:id', asyncMiddleware(async (req, res) => {
    // Similar to reject, but doesn't require an admin ID.
    // Can only be done by the user who made the request.
    const { id } = req.params;
    await dataSource.transaction(async manager => {
        const request = await manager.findOneBy(PurchaseRequestEntity, { id });
        if (!request || request.status !== 'Pending') return res.status(404).json({ error: 'Request not found or not pending.' });

        request.status = 'Cancelled';
        request.actedAt = new Date().toISOString();
        const updatedPurchaseRequest = await manager.save(updateTimestamps(request));
        
        const user = await manager.findOneBy(UserEntity, { id: request.userId });
        if (user) {
            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
            const balances = request.guildId ? user.guildBalances[request.guildId] : { purse: user.personalPurse, experience: user.personalExperience };
            for (const item of request.assetDetails.cost) {
                const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (rewardDef) {
                    const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
                    target[item.rewardTypeId] = (target[item.rewardTypeId] || 0) + item.amount;
                }
            }
            const updatedUser = await manager.save(updateTimestamps(user));
            updateEmitter.emit('update');
            res.json({ updatedUser, updatedPurchaseRequest });
        } else {
            updateEmitter.emit('update');
            res.json({ updatedPurchaseRequest });
        }
    });
}));


// ... (The rest of the file will go here)

app.use('/api/actions', actionsRouter);
app.use('/api/quests', questsRouter);
app.use('/api/users', usersRouter);
app.use('/api/guilds', guildsRouter);
app.use('/api/markets', createGenericRouter(MarketEntity));
app.use('/api/reward-types', createGenericRouter(RewardTypeDefinitionEntity));
app.use('/api/ranks', createGenericRouter(RankEntity));
app.use('/api/trophies', createGenericRouter(TrophyEntity));
app.use('/api/assets', createGenericRouter(GameAssetEntity));
app.use('/api/themes', createGenericRouter(ThemeDefinitionEntity));
app.use('/api/settings', createGenericRouter(SettingEntity));

const chatRouter = express.Router();
const chatRepo = dataSource.getRepository(ChatMessageEntity);
chatRouter.get('/', asyncMiddleware(async (req, res) => { res.json(await chatRepo.find()); }));
chatRouter.post('/send', asyncMiddleware(async (req, res) => {
    const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
    if (!senderId || (!recipientId && !guildId) || !message) return res.status(400).json({ error: 'Missing required fields for chat message.' });
    const newChatMessage = chatRepo.create({
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId, recipientId, guildId, message, timestamp: new Date().toISOString(),
        readBy: [senderId], isAnnouncement: !!isAnnouncement,
    });
    const savedMessage = await chatRepo.save(updateTimestamps(newChatMessage, true));
    updateEmitter.emit('update');
    res.status(201).json({ newChatMessage: savedMessage });
}));
chatRouter.post('/read', asyncMiddleware(async (req, res) => {
    const { userId, partnerId, guildId } = req.body;
    if (!userId || (!partnerId && !guildId)) return res.status(400).json({ error: 'Missing user and target.' });
    let messagesToUpdate;
    if (partnerId) {
        messagesToUpdate = await chatRepo.find({ where: { senderId: partnerId, recipientId: userId } });
    } else {
        messagesToUpdate = await chatRepo.find({ where: { guildId } });
    }
    const updatedMessages = [];
    for (const msg of messagesToUpdate) {
        if (!msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
            const saved = await chatRepo.save(updateTimestamps(msg));
            updatedMessages.push(saved);
        }
    }
    if (updatedMessages.length > 0) updateEmitter.emit('update');
    res.status(200).json({ updatedMessages });
}));
app.use('/api/chat', chatRouter);

app.use('/api/notifications', createGenericRouter(SystemNotificationEntity));
app.use('/api/events', createGenericRouter(ScheduledEventEntity));
app.use('/api/bug-reports', createGenericRouter(BugReportEntity));
app.use('/api/quest-groups', createGenericRouter(QuestGroupEntity));
app.use('/api/rotations', createGenericRouter(RotationEntity));
app.use('/api/setbacks', createGenericRouter(ModifierDefinitionEntity));
app.use('/api/applied-setbacks', createGenericRouter(AppliedModifierEntity));
app.use('/api/trades', createGenericRouter(TradeOfferEntity));
app.use('/api/gifts', createGenericRouter(GiftEntity));

app.get('/api/chronicles', asyncMiddleware(async(req, res) => {
    const { page, limit, userId, guildId, viewMode, startDate, endDate } = req.query;
    const manager = dataSource.manager;
    let allEvents = [];

    const users = await manager.find(UserEntity);
    const quests = await manager.find(QuestEntity);
    const trophies = await manager.find(TrophyEntity);
    const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
    const gameAssets = await manager.find(GameAssetEntity);
    const modifierDefinitions = await manager.find(ModifierDefinitionEntity);

    const userMap = new Map(users.map(u => [u.id, u.gameName]));
    const questMap = new Map(quests.map(q => [q.id, { title: q.title, icon: q.icon, type: q.type }]));
    const trophyMap = new Map(trophies.map(t => [t.id, { name: t.name, icon: t.icon }]));
    const assetMap = new Map(gameAssets.map(a => [a.id, { name: a.name, icon: a.icon }]));

    const whereConditions = {};
    if (guildId === 'null') {
        whereConditions.guildId = IsNull();
    } else if (guildId) {
        whereConditions.guildId = guildId;
    }
    
    const whereConditionsAll = { ...whereConditions };
    if (viewMode === 'personal' && userId) {
        whereConditions.userId = userId;
    }

    // Quest Completions
    const completions = await manager.find(QuestCompletionEntity, { where: whereConditions, relations: ['user'] });
    allEvents.push(...completions.map(c => ({
        id: `quest-${c.id}`, originalId: c.id, date: c.completedAt, type: 'Quest',
        title: `${c.user?.gameName || 'Unknown'} completed "${questMap.get(c.questId)?.title || 'Unknown Quest'}"`,
        note: c.note, status: c.status, icon: questMap.get(c.questId)?.icon || '📜',
        color: 'hsl(158 84% 39%)', userId: c.userId, questType: questMap.get(c.questId)?.type, guildId: c.guildId
    })));

    // Purchase Requests
    const purchases = await manager.find(PurchaseRequestEntity, { where: whereConditions, relations: ['user'] });
    allEvents.push(...purchases.map(p => ({
        id: `purchase-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
        title: `${p.user?.gameName || 'Unknown'} requested "${p.assetDetails.name}"`,
        note: `Cost: ${p.assetDetails.cost.map(r => `${r.amount} ${rewardTypes.find(rt => rt.id === r.rewardTypeId)?.icon || '?'}`).join(', ')}`, status: p.status, icon: '💰',
        color: 'hsl(280 60% 60%)', userId: p.userId, guildId: p.guildId
    })));

    // User Trophies
    const userTrophyAwards = await manager.find(UserTrophyEntity, { where: whereConditions, relations: ['user'] });
    allEvents.push(...userTrophyAwards.map(ut => ({
        id: `trophy-${ut.id}`, originalId: ut.id, date: ut.awardedAt, type: 'Trophy',
        title: `${ut.user?.gameName || 'Unknown'} earned "${trophyMap.get(ut.trophyId)?.name || 'Unknown Trophy'}"`,
        note: '', status: 'Awarded', icon: trophyMap.get(ut.trophyId)?.icon || '🏆',
        color: 'hsl(50 90% 60%)', userId: ut.userId, guildId: ut.guildId
    })));
    
    // Admin Adjustments
    const adjustments = await manager.find(AdminAdjustmentEntity, { where: whereConditionsAll });
    allEvents.push(...adjustments.map(a => ({
        id: `adj-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'Adjustment',
        title: `${userMap.get(a.adjusterId) || 'Admin'} applied an adjustment to ${userMap.get(a.userId) || 'a user'}.`,
        note: a.reason, status: a.type, icon: '🛠️',
        color: 'hsl(220 60% 60%)', userId: a.userId, guildId: a.guildId
    })));
    
    // Gifts
    const gifts = await manager.find(GiftEntity, { where: whereConditionsAll });
    allEvents.push(...gifts.map(g => ({
        id: `gift-${g.id}`, originalId: g.id, date: g.sentAt, type: 'Gift',
        title: `${userMap.get(g.senderId)} gifted "${assetMap.get(g.assetId)?.name || 'an item'}" to ${userMap.get(g.recipientId)}`,
        status: 'Gifted', icon: '🎁',
        color: 'hsl(330 80% 60%)', guildId: g.guildId
    })));

    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let finalEvents = allEvents;
    const total = allEvents.length;

    if (page && limit) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;
        finalEvents = allEvents.slice(offset, offset + limitNum);
    } else if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        finalEvents = allEvents.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate >= start && eventDate <= end;
        });
    }

    res.json({ events: finalEvents, total });
}));


// Serve static assets from the 'uploads' directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});