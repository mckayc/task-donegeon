

const { dataSource, ensureDatabaseDirectoryExists } = require('../data-source');
const fs = require('fs').promises;
const { In, MoreThan, IsNull, Not } = require("typeorm");
const { 
    UserEntity, QuestEntity, QuestCompletionEntity, GuildEntity, PurchaseRequestEntity, 
    UserTrophyEntity, AdminAdjustmentEntity, SystemNotificationEntity, RewardTypeDefinitionEntity, 
    SettingEntity, LoginHistoryEntity, QuestGroupEntity, MarketEntity, RankEntity, TrophyEntity, 
    GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity, ChatMessageEntity, ScheduledEventEntity, 
    BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, TradeOfferEntity, GiftEntity, RotationEntity
} = require('../entities');
const { getFullAppData, updateTimestamps } = require('../utils/helpers');
const { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_REWARD_TYPES, INITIAL_QUEST_GROUPS, INITIAL_THEMES } = require('../initialData');
const settingService = require('../services/setting.service');
const userService = require('../services/user.service');
const { updateEmitter } = require('../utils/updateEmitter');


const getDeltaAppData = async (manager, lastSync) => {
    const updates = {};
    const entityMap = {
        Market: 'markets', GameAsset: 'gameAssets', PurchaseRequest: 'purchaseRequests', RewardTypeDefinition: 'rewardTypes', TradeOffer: 'tradeOffers', Gift: 'gifts',
        Rank: 'ranks', Trophy: 'trophies', UserTrophy: 'userTrophies',
        SystemLog: 'systemLogs', AdminAdjustment: 'adminAdjustments', SystemNotification: 'systemNotifications', ScheduledEvent: 'scheduledEvents', ChatMessage: 'chatMessages',
        BugReport: 'bugReports', ModifierDefinition: 'modifierDefinitions', AppliedModifier: 'appliedModifiers', ThemeDefinition: 'themes', QuestGroup: 'questGroups', Rotation: 'rotations'
    };

    const updatedUsers = await manager.find('User', { where: { updatedAt: MoreThan(lastSync) }, relations: ['guilds'] });
    if (updatedUsers.length > 0) {
        updates.users = updatedUsers.map(u => {
            const { guilds, ...userData } = u;
            return { ...userData, guildIds: guilds.map(g => g.id) };
        });
    }

    const questRepo = manager.getRepository('Quest');
    const updatedQuests = await questRepo.find({ where: { updatedAt: MoreThan(lastSync) }, relations: ['assignedUsers'] });
    if (updatedQuests.length > 0) {
        updates.quests = updatedQuests.map(q => {
            const { assignedUsers, ...questData } = q;
            return { ...questData, assignedUserIds: assignedUsers?.map(u => u.id) || [] };
        });
    }

    const qcRepo = manager.getRepository(QuestCompletionEntity);
    const updatedQCs = await qcRepo.find({ where: { updatedAt: MoreThan(lastSync) }, relations: ['user', 'quest'] });
    if (updatedQCs.length > 0) {
        updates.questCompletions = updatedQCs.filter(qc => qc.user && qc.quest).map(qc => ({
            ...qc, userId: qc.user.id, questId: qc.quest.id, user: undefined, quest: undefined
        }));
    }

    const guildRepo = manager.getRepository('Guild');
    const updatedGuilds = await guildRepo.find({ where: { updatedAt: MoreThan(lastSync) }, relations: ['members'] });
    if (updatedGuilds.length > 0) {
        updates.guilds = updatedGuilds.map(g => ({ ...g, memberIds: g.members.map(m => m.id) }));
    }
    
    for (const entityName in entityMap) {
        const repo = manager.getRepository(entityName);
        const keyName = entityMap[entityName];
        if (repo.metadata.hasColumnWithPropertyPath('updatedAt')) {
            const changedItems = await repo.find({ where: { updatedAt: MoreThan(lastSync) } });
            if (changedItems.length > 0) updates[keyName] = changedItems;
        }
    }

    const settingRow = await manager.findOne('Setting', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (settingRow) updates.settings = settingRow.settings;
    const historyRow = await manager.findOne('LoginHistory', { where: { id: 1, updatedAt: MoreThan(lastSync) } });
    if (historyRow) updates.loginHistory = historyRow.history;

    return updates;
};

const syncData = async (lastSync) => {
    const newSyncTimestamp = new Date().toISOString();
    const manager = dataSource.manager;

    if (!lastSync) {
        const userCount = await manager.count(UserEntity);
        if (userCount === 0) {
            return { updates: { settings: INITIAL_SETTINGS, users: [], loginHistory: [] }, newSyncTimestamp };
        }
        const appData = await getFullAppData(manager);
        return { updates: appData, newSyncTimestamp };
    } else {
        const updates = await getDeltaAppData(manager, lastSync);
        return { updates, newSyncTimestamp };
    }
};

const firstRun = async (adminUserData) => {
    const manager = dataSource.manager;
    // Simple check to ensure this can't be run if users already exist.
    const userCount = await manager.count(UserEntity);
    if (userCount > 0) {
        throw new Error("First run setup has already been completed.");
    }
    
    // Create admin
    await userService.create(adminUserData);
    
    // Seed initial content
    await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(qg => updateTimestamps(qg, true)));
    await manager.save(RewardTypeDefinitionEntity, INITIAL_REWARD_TYPES.map(rt => updateTimestamps(rt, true)));
    await manager.save(RankEntity, INITIAL_RANKS.map(r => updateTimestamps(r, true)));
    await manager.save(TrophyEntity, INITIAL_TROPHIES.map(t => updateTimestamps(t, true)));
    await manager.save(ThemeDefinitionEntity, INITIAL_THEMES.map(t => updateTimestamps(t, true)));
    
    updateEmitter.emit('update');
};

const applySettingsUpdates = async () => {
    const manager = dataSource.manager;
    const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
    let currentSettings = settingRow ? settingRow.settings : INITIAL_SETTINGS;

    const defaultSettings = INITIAL_SETTINGS;
    const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

    const mergeNewProperties = (target, source) => {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key] || !isObject(target[key])) target[key] = {};
                mergeNewProperties(target[key], source[key]);
            } else if (!target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };
    mergeNewProperties(currentSettings, defaultSettings);
    await settingService.update(currentSettings);
};

const clearAllHistory = async () => {
    const manager = dataSource.manager;
    const tablesToClear = [QuestCompletionEntity, PurchaseRequestEntity, AdminAdjustmentEntity, SystemLogEntity, SystemNotificationEntity, UserTrophyEntity, GiftEntity, TradeOfferEntity, AppliedModifierEntity];
    for (const table of tablesToClear) {
        await manager.clear(table);
    }
    updateEmitter.emit('update');
};

const resetAllPlayerData = async (includeAdmins) => {
    const manager = dataSource.manager;
    const qb = manager.createQueryBuilder(UserEntity, "user");
    if (!includeAdmins) {
        qb.where("user.role != :role", { role: 'Donegeon Master' });
    }
    const usersToReset = await qb.getMany();
    
    for (const user of usersToReset) {
        user.personalPurse = {};
        user.personalExperience = {};
        user.guildBalances = {};
        user.ownedAssetIds = [];
        user.ownedThemes = ['emerald', 'rose', 'sky'];
    }
    await manager.save(UserEntity, usersToReset.map(u => updateTimestamps(u)));
    updateEmitter.emit('update');
};

const deleteAllCustomContent = async () => {
    const manager = dataSource.manager;

    // Delete non-default guilds
    await manager.getRepository(GuildEntity).delete({ isDefault: Not(true) });
    
    const rewardTypeRepo = manager.getRepository(RewardTypeDefinitionEntity);

    // Delete non-core reward types
    await rewardTypeRepo.delete({ isCore: false });

    // Reset core reward types to their default values
    const coreRewardsFromDB = await rewardTypeRepo.find({ where: { isCore: true } });
    const coreRewardsMap = new Map(coreRewardsFromDB.map(r => [r.id, r]));
    let needsSave = false;
    for (const initialReward of INITIAL_REWARD_TYPES) {
        const dbReward = coreRewardsMap.get(initialReward.id);
        if (dbReward) {
            rewardTypeRepo.merge(dbReward, initialReward);
            needsSave = true;
        }
    }
    if (needsSave) {
        await rewardTypeRepo.save(coreRewardsFromDB.map(r => updateTimestamps(r)));
    }

    const tablesToClear = [QuestEntity, QuestGroupEntity, MarketEntity, GameAssetEntity, TrophyEntity, RankEntity, ThemeDefinitionEntity, RotationEntity, ModifierDefinitionEntity];
    for (const table of tablesToClear) {
        if (table === MarketEntity) {
            // Delete all markets EXCEPT the bank
            await manager.getRepository(table).delete({ id: Not(In(['market-bank'])) });
        } else {
             await manager.clear(table);
        }
    }
    // Re-seed core content that was cleared
    await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(qg => updateTimestamps(qg, true)));
    await manager.save(RankEntity, INITIAL_RANKS.map(r => updateTimestamps(r, true)));
    await manager.save(TrophyEntity, INITIAL_TROPHIES.map(t => updateTimestamps(t, true)));
    await manager.save(ThemeDefinitionEntity, INITIAL_THEMES.map(t => updateTimestamps(t, true)));
    updateEmitter.emit('update');
};

const factoryReset = async () => {
    const dbPath = process.env.DATABASE_PATH || '/app/data/database/database.sqlite';

    // 1. Close the connection if it's open
    if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('[Factory Reset] Database connection closed.');
    }

    // 2. Delete the file
    try {
        await fs.unlink(dbPath);
        console.log(`[Factory Reset] Database file deleted: ${dbPath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`[Factory Reset] Database file not found, which is an acceptable state for a reset.`);
        } else {
            console.error(`[Factory Reset] Error deleting database file:`, error);
            // Attempt to re-initialize to restore the app to a working state before failing.
            try {
                if (!dataSource.isInitialized) {
                    await ensureDatabaseDirectoryExists();
                    await dataSource.initialize();
                }
            } catch (reinitError) {
                 console.error(`[Factory Reset] CRITICAL: Failed to re-initialize previous database after deletion failure.`, reinitError);
            }
            throw new Error(`Factory reset failed: Could not delete the database file. Please check server file permissions.`);
        }
    }
    
    // 3. Re-initialize the database connection. This will create a new, empty database file.
    try {
        await ensureDatabaseDirectoryExists();
        await dataSource.initialize();
        console.log("[Factory Reset] Data Source has been re-initialized successfully, creating a new empty database.");
    } catch (initError) {
        console.error(`[Factory Reset] Failed to re-initialize data source after deletion:`, initError);
        throw new Error("Factory reset failed: The database file was deleted, but a new one could not be created.");
    }

    // No need to emit update, the frontend handles a full reload and will fetch everything fresh.
};

const getChronicles = async (queryParams) => {
    const manager = dataSource.manager;
    const { userId, guildId, viewMode, page = 1, limit = 50, filterTypes } = queryParams;

    if (!filterTypes) {
        return { events: [], total: 0 };
    }

    const filterTypesArray = filterTypes.split(',');
    if (filterTypesArray.length === 0) {
        return { events: [], total: 0 };
    }

    const subQueries = [];
    const params = [];

    // --- Quest Completions ---
    if (filterTypesArray.includes('QuestCompletion')) {
        let query = `
            SELECT
                qc.id as id, qc.id as originalId, qc.completedAt as date, 'QuestCompletion' as type,
                quest.title as title, qc.note as note, qc.status as status,
                quest.iconType as iconType, quest.icon as icon, quest.imageUrl as imageUrl,
                '#4ade80' as color, qc.userId as userId, user.gameName as actorName,
                quest.type as questType, qc.guildId as guildId,
                json_extract(quest.rewards, '$') as rewardsJson
            FROM quest_completion qc
            LEFT JOIN user user ON user.id = qc.userId
            LEFT JOIN quest quest ON quest.id = qc.questId
        `;
        const where = [];
        if (viewMode === 'personal') {
            where.push('qc.userId = ?');
            params.push(userId);
        }
        if (guildId !== 'null') {
            where.push('qc.guildId = ?');
            params.push(guildId);
        } else if (viewMode === 'personal') {
            where.push('qc.guildId IS NULL');
        }
        if (where.length > 0) {
            query += ' WHERE ' + where.join(' AND ');
        }
        subQueries.push(query);
    }
    
     // --- Purchases ---
    if (filterTypesArray.includes('Purchase')) {
        let query = `
            SELECT
                pr.id as id, pr.id as originalId, pr.requestedAt as date, 'Purchase' as type,
                'Purchase: ' || json_extract(pr.assetDetails, '$.name') as title,
                json_extract(pr.assetDetails, '$.description') as note, 
                pr.status as status,
                'emoji' as iconType, '💰' as icon, '' as imageUrl,
                '#fbbf24' as color, pr.userId as userId, user.gameName as actorName,
                '' as questType, pr.guildId as guildId,
                json_extract(pr.assetDetails, '$.cost') as rewardsJson
            FROM purchase_request pr
            LEFT JOIN user user ON user.id = pr.userId
        `;
        const where = [];
        if (viewMode === 'personal') {
            where.push('pr.userId = ?');
            params.push(userId);
        }
        if (guildId !== 'null') {
            where.push('pr.guildId = ?');
            params.push(guildId);
        } else if (viewMode === 'personal') {
            where.push('pr.guildId IS NULL');
        }
        if (where.length > 0) {
            query += ' WHERE ' + where.join(' AND ');
        }
        subQueries.push(query);
    }

    // --- Admin Adjustments ---
    if (filterTypesArray.includes('AdminAdjustment')) {
        let query = `
            SELECT
                aa.id as id, aa.id as originalId, aa.adjustedAt as date, 'AdminAdjustment' as type,
                aa.reason as title, '' as note, aa.type as status,
                'emoji' as iconType, '⚖️' as icon, '' as imageUrl,
                '#60a5fa' as color, aa.userId as userId, adjuster.gameName as actorName,
                '' as questType, aa.guildId as guildId,
                json_object('rewards', json(aa.rewards), 'setbacks', json(aa.setbacks)) as rewardsJson
            FROM admin_adjustment aa
            LEFT JOIN user user ON user.id = aa.userId
            LEFT JOIN user adjuster ON adjuster.id = aa.adjusterId
        `;
        const where = [];
        if (viewMode === 'personal') {
            where.push('aa.userId = ?');
            params.push(userId);
        }
        if (guildId !== 'null') {
            where.push('aa.guildId = ?');
            params.push(guildId);
        } else if (viewMode === 'personal') {
            where.push('aa.guildId IS NULL');
        }
        if (where.length > 0) {
            query += ' WHERE ' + where.join(' AND ');
        }
        subQueries.push(query);
    }

    // --- Trophies ---
    if (filterTypesArray.includes('TrophyAwarded')) {
        let query = `
            SELECT
                ut.id as id, ut.id as originalId, ut.awardedAt as date, 'TrophyAwarded' as type,
                'Trophy: ' || trophy.name as title,
                trophy.description as note, 'Awarded' as status,
                trophy.iconType as iconType, trophy.icon as icon, trophy.imageUrl as imageUrl,
                '#facc15' as color, ut.userId as userId, user.gameName as actorName,
                '' as questType, ut.guildId as guildId,
                '[]' as rewardsJson
            FROM user_trophy ut
            LEFT JOIN trophy trophy ON trophy.id = ut.trophyId
            LEFT JOIN user user ON user.id = ut.userId
        `;
        const where = [];
        if (viewMode === 'personal') {
            where.push('ut.userId = ?');
            params.push(userId);
        }
        if (guildId !== 'null') {
            where.push('ut.guildId = ?');
            params.push(guildId);
        } else if (viewMode === 'personal') {
            where.push('ut.guildId IS NULL');
        }
        if (where.length > 0) {
            query += ' WHERE ' + where.join(' AND ');
        }
        subQueries.push(query);
    }
    
    const fullQuery = subQueries.join(' UNION ALL ');
    const pagedQuery = `SELECT * FROM (${fullQuery}) ORDER BY date DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM (${fullQuery})`;
    
    // The parameters for count and paged queries are different.
    const pagedParams = [...params, limit, (page - 1) * limit];
    const countParams = [...params];

    const rawEvents = await manager.query(pagedQuery, pagedParams);
    const totalResult = await manager.query(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
    const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    
    const events = rawEvents.map(event => {
        let rewardsText = '';
        try {
            const rewardsJsonString = event.rewardsJson || '[]';
            const rewardsData = JSON.parse(rewardsJsonString);
            
            if (event.type === 'QuestCompletion' && event.status === 'Approved') {
                if (Array.isArray(rewardsData)) {
                    rewardsText = rewardsData.map(r => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                }
            } else if (event.type === 'Purchase') {
                if (Array.isArray(rewardsData)) {
                    rewardsText = rewardsData.map(r => `-${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                }
            } else if (event.type === 'AdminAdjustment') {
                const paid = (rewardsData.setbacks || []).map((r) => `-${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                const received = (rewardsData.rewards || []).map((r) => `+${r.amount}${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                rewardsText = `${paid} ${received}`.trim();
            }
        } catch (e) {
            // JSON parsing might fail, ignore.
        }
        delete event.rewardsJson; // Clean up temp field
        return { ...event, rewardsText: rewardsText || undefined };
    });

    return { events, total };
};


const resetSettings = async () => {
    await settingService.update(INITIAL_SETTINGS);
};

const importAssetPack = async (assetPack, resolutions, userIdsToAssign) => {
    return await dataSource.transaction(async manager => {
        const idMap = new Map();

        const processAssets = async (assetType, repoName, assets) => {
            if (!assets || assets.length === 0) return;
            const repo = manager.getRepository(repoName);

            for (const asset of assets) {
                const resolution = resolutions.find(r => r.id === asset.id && r.type === assetType);
                if (!resolution || resolution.resolution === 'skip') continue;

                const newAssetData = { ...asset };
                const oldId = newAssetData.id;
                delete newAssetData.id; 

                if (resolution.resolution === 'rename') {
                    if ('title' in newAssetData) newAssetData.title = resolution.newName;
                    else if ('name' in newAssetData) newAssetData.name = resolution.newName;
                }
                
                if(assetType === 'quests') {
                    // Ensure non-nullable fields have defaults if missing from pack
                    if (!newAssetData.lateSetbacks) newAssetData.lateSetbacks = [];
                    if (!newAssetData.incompleteSetbacks) newAssetData.incompleteSetbacks = [];

                    if (userIdsToAssign !== undefined) {
                        if (userIdsToAssign.length > 0) {
                            newAssetData.assignedUsers = await manager.findBy(UserEntity, { id: In(userIdsToAssign) });
                        } else {
                            newAssetData.assignedUsers = [];
                        }
                    } else { // Not passed, so respect the pack's data (for blueprints)
                        if (asset.assignedUserIds && asset.assignedUserIds.length > 0) {
                            newAssetData.assignedUsers = await manager.findBy(UserEntity, { id: In(asset.assignedUserIds) });
                        } else {
                            newAssetData.assignedUsers = [];
                        }
                    }
                    delete newAssetData.assignedUserIds;

                    // Remap dependencies
                    if(newAssetData.rewards) newAssetData.rewards = newAssetData.rewards.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    if(newAssetData.lateSetbacks) newAssetData.lateSetbacks = (newAssetData.lateSetbacks || []).map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    if(newAssetData.incompleteSetbacks) newAssetData.incompleteSetbacks = (newAssetData.incompleteSetbacks || []).map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    if (newAssetData.groupId) newAssetData.groupId = idMap.get(newAssetData.groupId) || newAssetData.groupId;
                }
                if(assetType === 'gameAssets') {
                    // Ensure non-nullable fields have defaults if missing from pack
                    if (!newAssetData.creatorId) newAssetData.creatorId = 'system';

                    if(newAssetData.costGroups) {
                        newAssetData.costGroups = newAssetData.costGroups.map(group => 
                            group.map(c => ({ ...c, rewardTypeId: idMap.get(c.rewardTypeId) || c.rewardTypeId }))
                        );
                        if (newAssetData.marketIds) {
                            newAssetData.marketIds = newAssetData.marketIds.map(mid => idMap.get(mid) || mid);
                        }
                    }
                }
                if (assetType === 'trophies' && newAssetData.requirements) {
                    newAssetData.requirements = newAssetData.requirements.map(req => {
                        if (req.type === 'ACHIEVE_RANK' || req.type === 'QUEST_COMPLETED') {
                            return { ...req, value: idMap.get(req.value) || req.value };
                        }
                        return req;
                    });
                }

                const newId = `${assetType.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const newEntity = repo.create({ ...newAssetData, id: newId });

                const savedEntity = await repo.save(updateTimestamps(newEntity, true));
                idMap.set(oldId, savedEntity.id);
            }
        };

        const processUsers = async (usersToImport) => {
            if (!usersToImport || usersToImport.length === 0) return;
            const userRepo = manager.getRepository(UserEntity);
            const defaultGuild = await manager.findOne(GuildEntity, { where: { isDefault: true }, relations: ['members'] });
            
            for (const userTemplate of usersToImport) {
                const resolution = resolutions.find(r => r.id === userTemplate.username && r.type === 'users');
                if (!resolution || resolution.resolution === 'skip') continue;

                const newUser = {
                    ...userTemplate,
                    id: `user-${Date.now()}`,
                    avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
                    guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false
                };
                if (resolution.resolution === 'rename') {
                    newUser.gameName = resolution.newName;
                }
                const savedUser = await userRepo.save(updateTimestamps(newUser, true));
                if (defaultGuild) {
                    if (!defaultGuild.members) defaultGuild.members = [];
                    defaultGuild.members.push(savedUser);
                }
            }
            if(defaultGuild && defaultGuild.members.length > 0) await manager.save(updateTimestamps(defaultGuild));
        };
        
        await processAssets('rewardTypes', RewardTypeDefinitionEntity, assetPack.assets.rewardTypes);
        await processAssets('questGroups', QuestGroupEntity, assetPack.assets.questGroups);
        await processAssets('markets', MarketEntity, assetPack.assets.markets);
        await processAssets('ranks', RankEntity, assetPack.assets.ranks);
        
        await processAssets('gameAssets', GameAssetEntity, assetPack.assets.gameAssets);
        await processAssets('quests', QuestEntity, assetPack.assets.quests);
        await processAssets('trophies', TrophyEntity, assetPack.assets.trophies);
        await processAssets('rotations', RotationEntity, assetPack.assets.rotations);
        await processAssets('modifierDefinitions', ModifierDefinitionEntity, assetPack.assets.modifierDefinitions);
        
        await processUsers(assetPack.assets.users);

        updateEmitter.emit('update');
    });
};

module.exports = {
    syncData,
    firstRun,
    applySettingsUpdates,
    clearAllHistory,
    resetAllPlayerData,
    deleteAllCustomContent,
    factoryReset,
    getChronicles,
    resetSettings,
    importAssetPack,
};