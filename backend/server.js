require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const { In, Brackets, Like } = require("typeorm");
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('./initialData');
const { 
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity
} = require('./entities');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';

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
    const allQuests = await manager.find(QuestEntity);

    const totalXp = Object.values(user.personalExperience || {}).reduce((sum, amount) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    for (const trophy of automaticTrophies) {
        // Check if user already has this personal trophy
        if (userTrophies.some(ut => ut.trophyId === trophy.id)) continue;
        
        // Check requirements
        const meetsAllRequirements = trophy.requirements.every(req => {
            switch (req.type) {
                case 'COMPLETE_QUEST_TYPE':
                    return userCompletedQuests.filter(c => allQuests.find(q => q.id === c.quest?.id)?.type === req.value).length >= req.count;
                case 'COMPLETE_QUEST_TAG':
                    return userCompletedQuests.filter(c => allQuests.find(q => q.id === c.quest?.id)?.tags?.includes(req.value)).length >= req.count;
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
            await manager.save(newTrophy);

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
            await manager.save(newNotification);
        }
    }
};

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
            try {
                await fs.access(destPath);
            } catch (error) {
                await fs.copyFile(sourcePath, destPath);
                console.log(`Copied default asset pack: ${packFilename}`);
            }
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
            systemNotifications: [], scheduledEvents: [], bugReports: [],
            settings: { ...INITIAL_SETTINGS, contentVersion: 0 },
            loginHistory: [],
        });
    }

    const appData = await getFullAppData(dataSource.manager);
    res.status(200).json(appData);
}));

// FIRST RUN
app.post('/api/first-run', asyncMiddleware(async (req, res) => {
    const { adminUserData } = req.body;
    
    await dataSource.transaction(async manager => {
        // Clear everything first
        for (const entity of dataSource.entityMetadatas) {
            await manager.getRepository(entity.name).clear();
        }
        
        await manager.save(RewardTypeDefinitionEntity, INITIAL_REWARD_TYPES);
        await manager.save(RankEntity, INITIAL_RANKS);
        await manager.save(TrophyEntity, INITIAL_TROPHIES);
        await manager.save(ThemeDefinitionEntity, INITIAL_THEMES);
        await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS);

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
        await manager.save(adminUser);

        const defaultGuild = manager.create(GuildEntity, {
            id: 'guild-1',
            name: 'The First Guild',
            purpose: 'The default guild for all new adventurers.',
            isDefault: true,
            members: [adminUser]
        });
        await manager.save(defaultGuild);

        const exchangeMarket = { id: 'market-bank', title: 'The Exchange Post', description: 'Exchange your various currencies and experience points.', iconType: 'emoji', icon: '⚖️', status: { type: 'open' } };
        await manager.save(MarketEntity, exchangeMarket);

        const settings = { ...INITIAL_SETTINGS, contentVersion: 1 };
        await manager.save(SettingEntity, { id: 1, settings });
        await manager.save(LoginHistoryEntity, { id: 1, history: [adminUser.id] });
        
        res.status(201).json({ adminUser });
    });
}));

app.post('/api/data/import-assets', asyncMiddleware(async (req, res) => {
    const { assetPack, resolutions } = req.body;
    if (!assetPack || !resolutions) return res.status(400).json({ error: 'Missing asset pack or resolutions.' });

    await dataSource.transaction(async manager => {
        console.log(`[IMPORT] Starting import for asset pack: ${assetPack.manifest.name}`);
        const idMap = new Map();
        const assetsToSave = {};
        const selectedResolutions = resolutions.filter(r => r.selected);
        console.log(`[IMPORT] Found ${selectedResolutions.length} selected assets to process.`);

        // Pass 1: Generate new IDs and build the ID map for all selected assets.
        console.log('[IMPORT] Pass 1: Generating new IDs and creating ID map...');
        for (const res of selectedResolutions) {
            const assetList = assetPack.assets[res.type];
            if (!assetList) continue;
            
            const idField = res.type === 'users' ? 'username' : 'id';
            const originalAsset = assetList.find(a => a[idField] === res.id);
            if (!originalAsset) continue;

            const newAssetData = JSON.parse(JSON.stringify(originalAsset));

            if (res.resolution === 'rename' && res.newName) {
                const oldName = newAssetData.title || newAssetData.name;
                if ('title' in newAssetData) newAssetData.title = res.newName;
                else newAssetData.name = res.newName;
                console.log(`[IMPORT] Renaming ${res.type} [${oldName}] -> [${res.newName}]`);
            }
            
            const newId = `${res.type.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            if (res.type === 'users') {
                if (originalAsset.id) {
                    idMap.set(originalAsset.id, newId);
                    console.log(`[IMPORT] Mapping user [ID: ${originalAsset.id}] -> [${newId}]`);
                }
                if (originalAsset.username) {
                    idMap.set(originalAsset.username, newId);
                    console.log(`[IMPORT] Mapping user [Username: ${originalAsset.username}] -> [${newId}]`);
                }
            } else {
                if (originalAsset.id) {
                    idMap.set(originalAsset.id, newId);
                    console.log(`[IMPORT] Mapping ${res.type} [${originalAsset.id}] -> [${newId}]`);
                }
            }
            newAssetData.id = newId;

            if (!assetsToSave[res.type]) assetsToSave[res.type] = [];
            assetsToSave[res.type].push(newAssetData);
        }
        
        const remap = (id) => {
            const newId = idMap.get(id);
            if (newId) {
                console.log(`[IMPORT] Remapping dependency [${id}] -> [${newId}]`);
                return newId;
            }
            return id;
        };

        // Pass 2: Remap all internal references using the idMap.
        console.log('[IMPORT] Pass 2: Remapping internal asset dependencies...');
        const processAssets = (type, processor) => {
            if (assetsToSave[type]) {
                assetsToSave[type].forEach(processor);
            }
        };
        
        processAssets('quests', quest => {
            if (quest.groupId) quest.groupId = remap(quest.groupId);
            if (Array.isArray(quest.assignedUserIds)) quest.assignedUserIds = quest.assignedUserIds.map(remap);
            if (Array.isArray(quest.rewards)) {
                quest.rewards = quest.rewards.map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
            }
            if (Array.isArray(quest.lateSetbacks)) {
                quest.lateSetbacks = quest.lateSetbacks.map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
            }
            if (Array.isArray(quest.incompleteSetbacks)) {
                quest.incompleteSetbacks = quest.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: remap(r.rewardTypeId) }));
            }
        });

        processAssets('gameAssets', asset => {
            if (Array.isArray(asset.marketIds)) asset.marketIds = asset.marketIds.map(remap);
            if (Array.isArray(asset.costGroups)) {
                asset.costGroups = asset.costGroups.map(group => group.map(c => ({ ...c, rewardTypeId: remap(c.rewardTypeId) })));
            }
            if (Array.isArray(asset.payouts)) asset.payouts = asset.payouts.map(p => ({ ...p, rewardTypeId: remap(p.rewardTypeId) }));
            if (asset.linkedThemeId) asset.linkedThemeId = remap(asset.linkedThemeId);
        });

        processAssets('trophies', trophy => {
            if (Array.isArray(trophy.requirements)) {
                trophy.requirements = trophy.requirements.map(req => {
                    if (req.type === 'ACHIEVE_RANK' || req.type === 'QUEST_COMPLETED') return { ...req, value: remap(req.value) };
                    return req;
                });
            }
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
        console.log('[IMPORT] Pass 3: Saving assets to database...');
        const saveOrder = ['markets', 'rewardTypes', 'ranks', 'questGroups', 'users', 'quests', 'trophies', 'gameAssets'];
        for (const type of saveOrder) {
            if (assetsToSave[type]) {
                console.log(`[IMPORT] Saving ${assetsToSave[type].length} asset(s) of type: ${type}`);
                for (const asset of assetsToSave[type]) {
                    switch (type) {
                        case 'users':
                            const { assignedUsers, guilds, questCompletions, purchaseRequests, ...userData } = asset;
                            const defaultGuild = await manager.findOneBy(GuildEntity, { isDefault: true });
                            const userToSave = manager.create(UserEntity, {
                                ...userData,
                                avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {},
                                ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false,
                            });
                            await manager.save(userToSave);
                            if (defaultGuild) {
                                if (!defaultGuild.members) defaultGuild.members = [];
                                defaultGuild.members.push(userToSave);
                                await manager.save(defaultGuild);
                            }
                            break;
                        case 'quests':
                            const { assignedUserIds: remappedUserIds, ...questData } = asset;
                            const questToSave = manager.create(QuestEntity, questData);
                            if (remappedUserIds && remappedUserIds.length > 0) {
                                questToSave.assignedUsers = await manager.getRepository(UserEntity).findBy({ id: In(remappedUserIds) });
                            }
                            await manager.save(questToSave);
                            break;
                        case 'questGroups': await manager.save(QuestGroupEntity, asset); break;
                        case 'rewardTypes': await manager.save(RewardTypeDefinitionEntity, { ...asset, isCore: false }); break;
                        case 'ranks': await manager.save(RankEntity, asset); break;
                        case 'trophies': await manager.save(TrophyEntity, asset); break;
                        case 'markets': await manager.save(MarketEntity, asset); break;
                        case 'gameAssets': await manager.save(GameAssetEntity, asset); break;
                    }
                }
            }
        }
        console.log(`[IMPORT] Successfully completed import for asset pack: ${assetPack.manifest.name}`);
    });

    res.status(200).json({ message: 'Assets imported successfully.' });
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

    await guildRepo.save(newGuild);
    res.status(201).json(newGuild);
}));

guildsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const { memberIds, ...guildData } = req.body;
    const guild = await guildRepo.findOneBy({ id: req.params.id });
    if (!guild) return res.status(404).send('Guild not found');

    guildRepo.merge(guild, guildData);
    
    if (memberIds) {
        guild.members = await dataSource.getRepository(UserEntity).findBy({ id: In(memberIds) });
    }

    await guildRepo.save(guild);
    res.json(guild);
}));

guildsRouter.delete('/:id', asyncMiddleware(async (req, res) => {
    await guildRepo.delete(req.params.id);
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
    await userRepo.save(newUser);
    
    const defaultGuild = await guildRepo.findOne({ where: { isDefault: true }, relations: ['members'] });
    if (defaultGuild) {
        defaultGuild.members.push(newUser);
        await guildRepo.save(defaultGuild);
    }

    res.status(201).json(newUser);
}));

usersRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const userData = req.body;

    if (userData.username || userData.email) {
        const qb = userRepo.createQueryBuilder("user").where("user.id != :id", { id });
        const orConditions = [];
        if (userData.username) orConditions.push({ username: userData.username });
        if (userData.email) orConditions.push({ email: userData.email });
        if (orConditions.length > 0) {
            qb.andWhere(new Brackets(subQb => subQb.where(orConditions[0]).orWhere(orConditions.slice(1))));
        }
        
        const conflict = await qb.getOne();
        if (conflict) {
            return res.status(409).json({ error: 'Username or email is already in use by another user.' });
        }
    }

    await userRepo.update(id, userData);
    res.json(await userRepo.findOneBy({ id }));
}));

usersRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send('Invalid request body, expected { ids: [...] }');
    await userRepo.delete(ids);
    res.status(204).send();
}));

app.use('/api/users', usersRouter);
app.use('/api/guilds', guildsRouter);

// Specific endpoint for settings
app.put('/api/settings', asyncMiddleware(async (req, res) => {
    const repo = dataSource.getRepository(SettingEntity);
    await repo.save({ id: 1, settings: req.body });
    res.json(req.body);
}));

// Bug Reports Router
const bugReportsRouter = express.Router();
const bugReportRepo = dataSource.getRepository(BugReportEntity);

bugReportsRouter.get('/', asyncMiddleware(async (req, res) => {
    const reports = await bugReportRepo.find({ order: { createdAt: "DESC" } });
    res.json(reports);
}));

bugReportsRouter.post('/', asyncMiddleware(async (req, res) => {
    const newReport = bugReportRepo.create(req.body);
    await bugReportRepo.save(newReport);
    res.status(201).json(newReport);
}));

bugReportsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    await bugReportRepo.update(req.params.id, req.body);
    res.json(await bugReportRepo.findOneBy({ id: req.params.id }));
}));

bugReportsRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Report IDs must be provided in an array.' });
    }
    await bugReportRepo.delete(ids);
    res.status(204).send();
}));

bugReportsRouter.post('/import', asyncMiddleware(async (req, res) => {
    const reportsToImport = req.body;
    if (!Array.isArray(reportsToImport)) {
        return res.status(400).json({ error: 'Request body must be an array of bug reports.' });
    }
    // Basic validation of the first report object
    if (reportsToImport.length > 0) {
        const firstReport = reportsToImport[0];
        if (!firstReport.id || !firstReport.title || !firstReport.createdAt || !firstReport.logs) {
             return res.status(400).json({ error: 'Invalid bug report format.' });
        }
    }

    await dataSource.transaction(async manager => {
        await manager.clear(BugReportEntity);
        const reports = reportsToImport.map(r => manager.create(BugReportEntity, r));
        await manager.save(reports);
    });

    res.status(200).json({ message: `${reportsToImport.length} bug reports imported successfully.` });
}));


app.use('/api/bug-reports', bugReportsRouter);


// Specific endpoint for quests (due to relations)
const questsRouter = express.Router();
const questRepo = dataSource.getRepository(QuestEntity);

// GET /api/quests - List with filtering and sorting
questsRouter.get('/', asyncMiddleware(async (req, res) => {
    const { groupId, searchTerm, sortBy } = req.query;
    const qb = questRepo.createQueryBuilder("quest")
        .leftJoinAndSelect("quest.assignedUsers", "user");

    // groupId 'All' is default, no filter needed.
    if (groupId && groupId !== 'All') {
        if (groupId === 'Uncategorized') {
            qb.where("quest.groupId IS NULL OR quest.groupId = ''");
        } else {
            qb.where("quest.groupId = :groupId", { groupId });
        }
    }

    if (searchTerm) {
        qb.andWhere(new Brackets(subQuery => {
            subQuery.where("LOWER(quest.title) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` })
                  .orWhere("LOWER(quest.description) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` });
        }));
    }

    switch (sortBy) {
        case 'title-desc': qb.orderBy("quest.title", "DESC"); break;
        case 'status-asc': qb.orderBy("quest.isActive", "ASC"); break;
        case 'status-desc': qb.orderBy("quest.isActive", "DESC"); break;
        case 'createdAt-asc': qb.orderBy("quest.id", "ASC"); break;
        case 'createdAt-desc': qb.orderBy("quest.id", "DESC"); break;
        case 'title-asc': default: qb.orderBy("quest.title", "ASC"); break;
    }

    const quests = await qb.getMany();
    res.json(quests.map(q => ({ ...q, assignedUserIds: q.assignedUsers?.map(u => u.id) || [] })));
}));

// POST /api/quests - Create new quest
questsRouter.post('/', asyncMiddleware(async (req, res) => {
    const { assignedUserIds, ...questData } = req.body;
    const newQuest = questRepo.create({
        ...questData,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        claimedByUserIds: [],
        dismissals: [],
        todoUserIds: []
    });
    if (assignedUserIds) {
        newQuest.assignedUsers = await dataSource.getRepository(UserEntity).findBy({ id: In(assignedUserIds) });
    }
    await questRepo.save(newQuest);
    const savedQuest = await questRepo.findOne({ where: { id: newQuest.id }, relations: ['assignedUsers'] });
    res.status(201).json({ ...savedQuest, assignedUserIds: savedQuest.assignedUsers?.map(u => u.id) || [] });
}));


questsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    const { assignedUserIds, ...questData } = req.body;
    const quest = await questRepo.findOneBy({ id: req.params.id });
    if (!quest) return res.status(404).send('Quest not found');
    
    questRepo.merge(quest, questData);
    if (assignedUserIds) {
        quest.assignedUsers = await dataSource.getRepository(UserEntity).findBy({ id: In(assignedUserIds) });
    }
    await questRepo.save(quest);
    const updatedQuest = await questRepo.findOne({ where: { id: req.params.id }, relations: ['assignedUsers'] });
    res.json({ ...updatedQuest, assignedUserIds: updatedQuest.assignedUsers?.map(u => u.id) || [] });
}));

// POST /api/quests/clone/:id
questsRouter.post('/clone/:id', asyncMiddleware(async (req, res) => {
    const questToClone = await questRepo.findOne({ where: { id: req.params.id }, relations: ['assignedUsers'] });
    if (!questToClone) return res.status(404).send('Quest not found');

    const newQuest = questRepo.create({
        ...questToClone,
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
        claimedByUserIds: [],
        dismissals: [],
        todoUserIds: [],
        assignedUsers: questToClone.assignedUsers // keep assignments
    });
    await questRepo.save(newQuest);
    const savedQuest = await questRepo.findOne({ where: { id: newQuest.id }, relations: ['assignedUsers'] });
    res.status(201).json({ ...savedQuest, assignedUserIds: savedQuest.assignedUsers?.map(u => u.id) || [] });
}));

// DELETE /api/quests
questsRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send('Invalid request body, expected { ids: [...] }');
    await questRepo.delete(ids);
    res.status(204).send();
}));

// PUT /api/quests/bulk-status
questsRouter.put('/bulk-status', asyncMiddleware(async (req, res) => {
    const { ids, isActive } = req.body;
    await questRepo.update(ids, { isActive });
    res.status(204).send();
}));

// PUT /api/quests/bulk-update
questsRouter.put('/bulk-update', asyncMiddleware(async (req, res) => {
    const { ids, updates } = req.body;
    const { addTags, removeTags, assignUsers, unassignUsers, ...simpleUpdates } = updates;

    await dataSource.transaction(async manager => {
        const questsToUpdate = await manager.getRepository(QuestEntity).find({ where: { id: In(ids) }, relations: ['assignedUsers'] });
        
        for (const quest of questsToUpdate) {
            // Apply simple updates
            Object.assign(quest, simpleUpdates);

            // Handle tags
            if (addTags) quest.tags = Array.from(new Set([...quest.tags, ...addTags]));
            if (removeTags) quest.tags = quest.tags.filter(tag => !removeTags.includes(tag));
            
            // Handle user assignments
            if (assignUsers) {
                const usersToAdd = await manager.getRepository(UserEntity).findBy({ id: In(assignUsers) });
                const newAssignedUsers = new Map(quest.assignedUsers.map(u => [u.id, u]));
                usersToAdd.forEach(u => newAssignedUsers.set(u.id, u));
                quest.assignedUsers = Array.from(newAssignedUsers.values());
            }
            if (unassignUsers) {
                quest.assignedUsers = quest.assignedUsers.filter(u => !unassignUsers.includes(u.id));
            }
        }
        await manager.save(questsToUpdate);
    });

    res.status(204).send();
}));

app.use('/api/quests', questsRouter);

// Specific endpoint for game assets
const assetsRouter = express.Router();
const assetRepo = dataSource.getRepository(GameAssetEntity);

assetsRouter.get('/', asyncMiddleware(async (req, res) => {
    const { category, searchTerm, sortBy } = req.query;
    const qb = assetRepo.createQueryBuilder("asset");

    if (category && category !== 'All') {
        qb.where("asset.category = :category", { category });
    }

    if (searchTerm) {
        qb.andWhere(new Brackets(subQuery => {
            subQuery.where("LOWER(asset.name) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` })
                  .orWhere("LOWER(asset.description) LIKE LOWER(:searchTerm)", { searchTerm: `%${searchTerm}%` });
        }));
    }

    switch (sortBy) {
        case 'name-asc': qb.orderBy("asset.name", "ASC"); break;
        case 'name-desc': qb.orderBy("asset.name", "DESC"); break;
        case 'createdAt-asc': qb.orderBy("asset.createdAt", "ASC"); break;
        case 'createdAt-desc': default: qb.orderBy("asset.createdAt", "DESC"); break;
    }

    res.json(await qb.getMany());
}));

assetsRouter.post('/', asyncMiddleware(async (req, res) => {
    const currentUser = { id: 'admin' }; // Placeholder for actual auth
    const newAssetData = {
        ...req.body,
        id: `g-asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        creatorId: currentUser.id,
        createdAt: new Date().toISOString(),
        purchaseCount: 0,
    };
    const newAsset = assetRepo.create(newAssetData);
    await assetRepo.save(newAsset);
    res.status(201).json(newAsset);
}));

assetsRouter.put('/:id', asyncMiddleware(async (req, res) => {
    await assetRepo.update(req.params.id, req.body);
    res.json(await assetRepo.findOneBy({ id: req.params.id }));
}));

assetsRouter.post('/clone/:id', asyncMiddleware(async (req, res) => {
    const assetToClone = await assetRepo.findOneBy({ id: req.params.id });
    if (!assetToClone) return res.status(404).send('Asset not found');

    const newAsset = assetRepo.create({
        ...assetToClone,
        id: `g-asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${assetToClone.name} (Copy)`,
        purchaseCount: 0,
        createdAt: new Date().toISOString(),
    });
    await assetRepo.save(newAsset);
    res.status(201).json(newAsset);
}));

assetsRouter.delete('/', asyncMiddleware(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send('Invalid request body, expected { ids: [...] }');
    await assetRepo.delete(ids);
    res.status(204).send();
}));

app.use('/api/assets', assetsRouter);

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
                // After applying rewards, check for trophies
                await checkAndAwardTrophies(manager, user.id, quest.guildId);
            }
        });

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
            // After applying rewards, check for trophies
            await checkAndAwardTrophies(manager, user.id, quest.guildId);
        });

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


// === Asset Pack Endpoints ===
app.get('/api/asset-packs/fetch-remote', asyncMiddleware(async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
    }

    try {
        const validatedUrl = new URL(url); // Basic validation
        if (!validatedUrl.pathname.endsWith('.json')) {
            return res.status(400).json({ error: 'URL must point to a .json file.' });
        }
        
        const response = await fetch(validatedUrl.toString());

        if (!response.ok) {
            throw new Error(`Failed to fetch from URL with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error fetching remote asset pack:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: `Could not fetch or parse remote pack: ${message}` });
    }
}));

app.get('/api/asset-packs/discover', asyncMiddleware(async (req, res) => {
    try {
        const dirents = await fs.readdir(ASSET_PACKS_DIR, { withFileTypes: true });
        const packPromises = dirents
            .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
            .map(async (dirent) => {
                try {
                    const filePath = path.join(ASSET_PACKS_DIR, dirent.name);
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const packData = JSON.parse(fileContent);
                    if (packData.manifest && packData.assets) {
                         const summary = {
                            quests: (packData.assets.quests || []).slice(0, 3).map(q => ({ title: q.title, icon: q.icon })),
                            gameAssets: (packData.assets.gameAssets || []).slice(0, 3).map(a => ({ name: a.name, icon: a.icon })),
                            trophies: (packData.assets.trophies || []).slice(0, 3).map(t => ({ name: t.name, icon: t.icon })),
                            users: (packData.assets.users || []).slice(0, 3).map(u => ({ gameName: u.gameName, role: u.role })),
                            markets: (packData.assets.markets || []).slice(0, 3).map(m => ({ title: m.title, icon: m.icon })),
                            ranks: (packData.assets.ranks || []).slice(0, 3).map(r => ({ name: r.name, icon: r.icon })),
                            rewardTypes: (packData.assets.rewardTypes || []).slice(0, 3).map(rt => ({ name: rt.name, icon: rt.icon })),
                            questGroups: (packData.assets.questGroups || []).slice(0, 3).map(qg => ({ name: qg.name, icon: qg.icon })),
                        };
                        return { manifest: packData.manifest, filename: dirent.name, summary };
                    }
                } catch (e) {
                    console.error(`Could not parse asset pack: ${dirent.name}`, e);
                }
                return null;
            });
        
        const packs = (await Promise.all(packPromises)).filter(p => p !== null);
        res.json(packs);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log("Asset pack directory does not exist, returning empty array.");
            res.json([]);
        } else {
            throw err;
        }
    }
}));

app.get('/api/asset-packs/get/:filename', asyncMiddleware(async (req, res) => {
    const { filename } = req.params;
    // Basic sanitation
    if (path.basename(filename) !== filename || !filename.endsWith('.json')) {
        return res.status(400).json({ error: 'Invalid filename.' });
    }
    const filePath = path.join(ASSET_PACKS_DIR, filename);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.send(fileContent);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'Asset pack not found.' });
        } else {
            throw err;
        }
    }
}));

app.get('/api/chronicles', asyncMiddleware(async (req, res) => {
    const { page = 1, limit = 50, userId, guildId, viewMode } = req.query;
    const manager = dataSource.manager;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, quests, trophies, rewardTypes] = await Promise.all([
        manager.find(UserEntity),
        manager.find(QuestEntity),
        manager.find(TrophyEntity),
        manager.find(RewardTypeDefinitionEntity)
    ]);
    const userMap = new Map(users.map(u => [u.id, u.gameName]));
    const questMap = new Map(quests.map(q => [q.id, q]));
    const trophyMap = new Map(trophies.map(t => [t.id, t]));
    const rewardMap = new Map(rewardTypes.map(rt => [rt.id, rt]));
    
    const getRewardDisplay = (rewardItems) => (rewardItems || []).map(r => {
        const reward = rewardMap.get(r.rewardTypeId);
        return `${r.amount} ${reward ? reward.icon : '❓'}`;
    }).join(' ');

    let allEvents = [];
    const guildIdQuery = guildId === 'null' ? null : guildId;

    let baseUserConditions = { guildId: guildIdQuery };
    if (viewMode === 'personal' && userId) {
        baseUserConditions.userId = userId;
    }

    // 1. Quest Completions
    const questCompletions = await manager.find(QuestCompletionEntity, { where: { ...baseUserConditions } });
    questCompletions.forEach(c => {
        const quest = questMap.get(c.questId);
        let finalNote = c.note || '';
        if (c.status === 'Approved' && quest && quest.rewards.length > 0) {
            const rewardsText = getRewardDisplay(quest.rewards).replace(/(\d+)/g, '+$1');
            finalNote = finalNote ? `${finalNote}\n(${rewardsText})` : rewardsText;
        }
        allEvents.push({
            id: c.id, date: c.completedAt, type: 'Quest', userId: c.userId,
            title: `${userMap.get(c.userId) || 'Unknown'} completed "${quest?.title || 'Unknown Quest'}"`,
            status: c.status, note: finalNote, icon: quest?.icon || '📜',
            color: '#3b82f6', guildId: c.guildId
        });
    });

    // 2. Purchase Requests
    const purchaseRequests = await manager.find(PurchaseRequestEntity, { where: { ...baseUserConditions } });
    purchaseRequests.forEach(p => {
        const costText = getRewardDisplay(p.assetDetails.cost).replace(/(\d+)/g, '-$1');
        allEvents.push({
            id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
            title: `${userMap.get(p.userId) || 'Unknown'} purchased "${p.assetDetails.name}"`,
            status: p.status, note: costText, icon: '💰',
            color: '#22c55e', guildId: p.guildId
        });
    });

    // 3. User Trophies
    const userTrophies = await manager.find(UserTrophyEntity, { where: { ...baseUserConditions } });
    userTrophies.forEach(ut => {
        const trophy = trophyMap.get(ut.trophyId);
        allEvents.push({
            id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId,
            title: `${userMap.get(ut.userId) || 'Unknown'} earned "${trophy?.name || 'Unknown Trophy'}"`,
            status: "Awarded", note: trophy?.description, icon: trophy?.icon || '🏆',
            color: '#f59e0b', guildId: ut.guildId
        });
    });
    
    // 4. Admin Adjustments
    const adjustments = await manager.find(AdminAdjustmentEntity, { where: { ...baseUserConditions } });
    adjustments.forEach(adj => {
        const rewardsText = getRewardDisplay(adj.rewards).replace(/(\d+)/g, '+$1');
        const setbacksText = getRewardDisplay(adj.setbacks).replace(/(\d+)/g, '-$1');
        allEvents.push({
            id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId,
            title: `${userMap.get(adj.userId) || 'Unknown'} received an adjustment from ${userMap.get(adj.adjusterId) || 'Admin'}`,
            status: adj.type,
            note: `${adj.reason}\n(${rewardsText} ${setbacksText})`.trim(),
            icon: '🛠️',
            color: adj.type === 'Reward' ? '#10b981' : '#ef4444',
            guildId: adj.guildId
        });
    });

     // 5. System Logs
     if (viewMode !== 'personal') {
        const systemLogs = await manager.find(SystemLogEntity);
        systemLogs.forEach(log => {
             const quest = questMap.get(log.questId);
             const userNames = log.userIds.map(id => userMap.get(id) || 'Unknown').join(', ');
             const setbacksText = getRewardDisplay(log.setbacksApplied).replace(/(\d+)/g, '-$1');
             allEvents.push({
                id: log.id, date: log.timestamp, type: 'System',
                title: `System: ${quest?.title || 'Unknown Quest'} marked as ${log.type.split('_')[1]}`,
                status: log.type, note: `For: ${userNames}\n(${setbacksText})`, icon: '⚙️', color: '#64748b'
             });
        });
     }
    
    // Sort all events by date descending
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = allEvents.length;
    const paginatedEvents = allEvents.slice(skip, skip + take);

    res.json({ events: paginatedEvents, total });
}));

// Chat Router
const chatRouter = express.Router();
const chatRepo = dataSource.getRepository(ChatMessageEntity);

chatRouter.post('/send', asyncMiddleware(async (req, res) => {
    const { senderId, recipientId, guildId, message, isAnnouncement } = req.body;
    if (!senderId || !message || (!recipientId && !guildId)) {
        return res.status(400).json({ error: 'Missing required fields for chat message.' });
    }

    const newMessage = chatRepo.create({
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId,
        recipientId,
        guildId,
        message,
        isAnnouncement: isAnnouncement || false,
        timestamp: new Date().toISOString(),
        readBy: [senderId], // Sender has implicitly read the message
    });

    await chatRepo.save(newMessage);
    res.status(201).json(newMessage);
}));

chatRouter.post('/read', asyncMiddleware(async (req, res) => {
    const { userId, partnerId, guildId } = req.body;
    if (!userId || (!partnerId && !guildId)) {
        return res.status(400).json({ error: 'Missing required fields to mark messages as read.' });
    }

    let messagesToUpdate;
    if (partnerId) {
        messagesToUpdate = await chatRepo.find({
            where: {
                senderId: partnerId,
                recipientId: userId,
            }
        });
    } else { // guildId
        messagesToUpdate = await chatRepo.find({
            where: {
                guildId: guildId,
            }
        });
    }

    let updated = false;
    for (const message of messagesToUpdate) {
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            updated = true;
        }
    }

    if (updated) {
        await chatRepo.save(messagesToUpdate);
    }

    res.status(204).send();
}));

app.use('/api/chat', chatRouter);

// Serve React App
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});