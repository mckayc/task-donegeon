
require("reflect-metadata");
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenAI } = require('@google/genai');
const { In, Brackets, Like, MoreThan } = require("typeorm");
const { dataSource, ensureDatabaseDirectoryExists } = require('./data-source');
const { INITIAL_SETTINGS, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_THEMES, INITIAL_QUEST_GROUPS } = require('./initialData');
const { 
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity, allEntities
} = require('./entities');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';

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

    // Ensure asset and backup directories exist
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(ASSET_PACKS_DIR, { recursive: true });
    
    // Copy default asset packs if they don't exist in the user's volume
    await ensureDefaultAssetPacksExist();
    
    // Start automated backup scheduler
    startAutomatedBackupScheduler();

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
    const questCompletions = await manager.find(QuestCompletionEntity,
        { relations: ['user', 'quest'] }
    );
    // ... (rest of the function)
    return data;
}

// Manual Admin Adjustments
app.post('/api/adjustments', async (req, res) => {
    try {
        await dataSource.transaction(async manager => {
            const adjData = req.body;
            const newAdj = manager.create(AdminAdjustmentEntity, {
                ...adjData,
                id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                adjustedAt: new Date().toISOString(),
            });
            await manager.save(updateTimestamps(newAdj, true));

            const user = await manager.findOneBy(UserEntity, { id: newAdj.userId });
            if (!user) {
                throw new Error("User not found for adjustment.");
            }

            const rewardTypes = await manager.find(RewardTypeDefinitionEntity);

            // Apply rewards/setbacks
            if (newAdj.type === 'Reward' && newAdj.rewards.length > 0) {
                 newAdj.rewards.forEach(reward => {
                    const def = rewardTypes.find(r => r.id === reward.rewardTypeId);
                    if (!def) return;
                    if (newAdj.guildId) {
                        if (!user.guildBalances[newAdj.guildId]) user.guildBalances[newAdj.guildId] = { purse: {}, experience: {} };
                        const target = def.category === 'Currency' ? user.guildBalances[newAdj.guildId].purse : user.guildBalances[newAdj.guildId].experience;
                        target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                    } else {
                        const target = def.category === 'Currency' ? user.personalPurse : user.personalExperience;
                        target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
                    }
                 });
            } else if (newAdj.type === 'Setback' && newAdj.setbacks.length > 0) {
                 newAdj.setbacks.forEach(setback => {
                    const def = rewardTypes.find(r => r.id === setback.rewardTypeId);
                    if (!def) return;
                     if (newAdj.guildId) {
                        if (!user.guildBalances[newAdj.guildId]) user.guildBalances[newAdj.guildId] = { purse: {}, experience: {} };
                        const target = def.category === 'Currency' ? user.guildBalances[newAdj.guildId].purse : user.guildBalances[newAdj.guildId].experience;
                        target[setback.rewardTypeId] = Math.max(0, (target[setback.rewardTypeId] || 0) - setback.amount);
                    } else {
                        const target = def.category === 'Currency' ? user.personalPurse : user.personalExperience;
                        target[setback.rewardTypeId] = Math.max(0, (target[setback.rewardTypeId] || 0) - setback.amount);
                    }
                 });
            } else if (newAdj.type === 'Trophy' && newAdj.trophyId) {
                const newTrophy = manager.create(UserTrophyEntity, {
                    id: `usertrophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    userId: newAdj.userId,
                    trophyId: newAdj.trophyId,
                    awardedAt: new Date().toISOString(),
                    guildId: newAdj.guildId || undefined,
                });
                await manager.save(updateTimestamps(newTrophy, true));
            }
            
            await manager.save(UserEntity, updateTimestamps(user));
        });
        res.status(201).send({ success: true });
    } catch (error) {
        console.error("Adjustment error:", error);
        res.status(500).json({ error: error.message });
    }
});
