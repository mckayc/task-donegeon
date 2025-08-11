
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

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

const entityKeyMap = {
    User: 'users', Quest: 'quests', QuestGroup: 'questGroups', Market: 'markets',
    RewardTypeDefinition: 'rewardTypes', QuestCompletion: 'questCompletions',
    PurchaseRequest: 'purchaseRequests', Guild: 'guilds', Rank: 'ranks', Trophy: 'trophies',
    UserTrophy: 'userTrophies', AdminAdjustment: 'adminAdjustments', GameAsset: 'gameAssets',
    SystemLog: 'systemLogs', ThemeDefinition: 'themes', ChatMessage: 'chatMessages',
    SystemNotification: 'systemNotifications', ScheduledEvent: 'scheduledEvents',
    BugReport: 'bugReports', Setting: 'settings', LoginHistory: 'loginHistory'
};

const createBackup = async (reason = 'manual', maxBackups) => {
    try {
        const manager = dataSource.manager;
        const dataToBackup = {};
        for (const entity of allEntities) {
            const repo = manager.getRepository(entity);
            const records = await repo.find();
            const entityName = (typeof entity === 'function' ? entity.name : entity.target.name).replace(/Entity$/, '');
            const key = entityKeyMap[entityName];
            if (!key) continue;

            if (key === 'settings') {
                dataToBackup[key] = records[0]?.settings || {};
            } else if (key === 'loginHistory') {
                dataToBackup[key] = records[0]?.history || [];
            } else {
                 dataToBackup[key] = records;
            }
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const filename = `backup-${reason}-${timestamp}.json`;
        const filePath = path.join(BACKUP_DIR, filename);
        await fs.writeFile(filePath, JSON.stringify(dataToBackup, null, 2));
        console.log(`Backup created successfully: ${filename}`);

        // Cleanup logic for automated backups
        if (reason === 'automated' && maxBackups) {
            const files = await fs.readdir(BACKUP_DIR);
            const automatedBackups = files.filter(f => f.startsWith('backup-automated-'));
            
            if (automatedBackups.length > maxBackups) {
                const filesWithStats = await Promise.all(
                    automatedBackups.map(async f => ({ name: f, time: (await fs.stat(path.join(BACKUP_DIR, f))).mtime }))
                );
                filesWithStats.sort((a, b) => a.time.getTime() - b.time.getTime()); // oldest first
                
                const filesToDeleteCount = filesWithStats.length - maxBackups;
                const filesToDelete = filesWithStats.slice(0, filesToDeleteCount);

                for (const file of filesToDelete) {
                    await fs.unlink(path.join(BACKUP_DIR, file.name));
                    console.log(`Deleted old automated backup: ${file.name}`);
                }
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to create backup:', error);
        return false;
    }
};

const startAutomatedBackupScheduler = async () => {
    try {
        const manager = dataSource.manager;
        const settingsRepo = manager.getRepository(SettingEntity);
        const currentSettingsEntity = await settingsRepo.findOneBy({ id: 1 });

        if (currentSettingsEntity && currentSettingsEntity.settings.automatedBackups.enabled) {
            console.log("Automated backups enabled. Setting up schedules...");
            const { schedules } = currentSettingsEntity.settings.automatedBackups;
            schedules.forEach(schedule => {
                 const unitInMs = {
                    hours: 60 * 60 * 1000,
                    days: 24 * 60 * 60 * 1000,
                    weeks: 7 * 24 * 60 * 60 * 1000,
                };
                const intervalMs = schedule.frequency * unitInMs[schedule.unit];
                if (intervalMs > 0) {
                    setInterval(() => {
                        console.log(`Running automated backup for schedule: ${schedule.id}`);
                        createBackup('automated', schedule.maxBackups);
                    }, intervalMs);
                    console.log(`Scheduled backup for every ${schedule.frequency} ${schedule.unit}.`);
                }
            });
        } else {
            console.log("Automated backups are disabled.");
        }
    } catch (error) {
        console.error("Could not set up automated backup schedules on startup:", error);
    }
};

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

// === Backup & Restore Endpoints ===
app.get('/api/backups', async (req, res) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupInfo = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async (file) => {
                    const stats = await fs.stat(path.join(BACKUP_DIR, file));
                    return {
                        filename: file,
                        size: stats.size,
                        createdAt: stats.mtime.toISOString(),
                    };
                })
        );
        res.json(backupInfo.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
        console.error('Failed to list backups:', error);
        res.status(500).json({ error: 'Failed to list backups.' });
    }
});

app.post('/api/backups/create', async (req, res) => {
    const success = await createBackup('manual');
    if (success) {
        res.status(201).send({ message: 'Backup created.' });
    } else {
        res.status(500).send({ error: 'Failed to create backup.' });
    }
});

app.get('/api/backups/download/:filename', (req, res) => {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, sanitizedFilename);

    // Basic security check to prevent path traversal
    if (path.dirname(filePath) !== BACKUP_DIR) {
        return res.status(400).send({ error: 'Invalid filename.' });
    }

    res.download(filePath, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(404).send({ error: 'File not found.' });
        }
    });
});

app.post('/api/backups/restore/:filename', async (req, res) => {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, sanitizedFilename);
    
    if (path.dirname(filePath) !== BACKUP_DIR) {
        return res.status(400).send({ error: 'Invalid filename.' });
    }

    try {
        const backupDataString = await fs.readFile(filePath, 'utf-8');
        const backupData = JSON.parse(backupDataString);

        await dataSource.transaction(async manager => {
            // Clear all tables in reverse order of dependencies if necessary
            for (const entity of allEntities.slice().reverse()) {
                await manager.clear(entity);
            }
            
            // Restore data
            for (const entity of allEntities) {
                const entityName = (typeof entity === 'function' ? entity.name : entity.target.name).replace(/Entity$/, '');
                const key = entityKeyMap[entityName];
                if (key && backupData[key]) {
                    const records = backupData[key];
                    if (key === 'settings') {
                        await manager.save(entity, { id: 1, settings: records });
                    } else if (key === 'loginHistory') {
                        await manager.save(entity, { id: 1, history: records });
                    } else if (Array.isArray(records) && records.length > 0) {
                         await manager.save(entity, records);
                    }
                }
            }
        });

        res.status(200).json({ message: 'Restore successful.' });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: 'Failed to restore from backup.' });
    }
});

app.delete('/api/backups/:filename', async (req, res) => {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, sanitizedFilename);
    
    if (path.dirname(filePath) !== BACKUP_DIR) {
        return res.status(400).send({ error: 'Invalid filename.' });
    }

    try {
        await fs.unlink(filePath);
        res.status(204).send();
    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({ error: 'Failed to delete backup file.' });
    }
});

// The "catchall" handler: for any request that doesn't
// match one of the API routes above, send back React's index.html file.
// This must be placed after all other API routes.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

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
