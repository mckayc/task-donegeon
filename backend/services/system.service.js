

const { dataSource } = require('../data-source');
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
    const manager = dataSource.manager;
    for (const entity of dataSource.entityMetadatas) {
        await manager.query(`DELETE FROM ${entity.tableName};`);
    }
    await manager.query(`DELETE FROM sqlite_sequence;`); // Reset auto-incrementing IDs for sqlite
    updateEmitter.emit('update');
};

const getChronicles = async (queryParams) => {
    const manager = dataSource.manager;
    const { userId, guildId, viewMode, page = 1, limit = 50, startDate, endDate, filterTypes } = queryParams;
    
    const filterTypesArray = filterTypes ? filterTypes.split(',') : [];

    const qb = manager.createQueryBuilder();
    let subQueries = [];

    // --- Quest Completions ---
    if (filterTypesArray.includes('QuestCompletion')) {
        let questQuery = qb.subQuery()
            .select([
                'qc.id as id', 'qc.id as originalId', 'qc.completedAt as date', "'QuestCompletion' as type",
                'quest.title as title', 'qc.note as note', 'qc.status as status',
                'quest.iconType as iconType', 'quest.icon as icon', 'quest.imageUrl as imageUrl',
                "'#4ade80' as color", 'qc.userId as userId', 'user.gameName as actorName',
                'quest.type as questType', 'qc.guildId as guildId'
            ])
            .from('quest_completion', 'qc')
            .leftJoin('user', 'user', 'user.id = qc.userId')
            .leftJoin('quest', 'quest', 'quest.id = qc.questId');

        if (viewMode === 'personal') {
            questQuery.where('qc.userId = :userId', { userId });
        }
        if (guildId !== 'null') {
            questQuery.andWhere('qc.guildId = :guildId', { guildId });
        } else if (viewMode === 'personal') {
            questQuery.andWhere('qc.guildId IS NULL');
        }
        subQueries.push(questQuery.getQuery());
    }
    
     // --- Purchases ---
    if (filterTypesArray.includes('Purchase')) {
        let purchaseQuery = qb.subQuery()
            .select([
                'pr.id as id', 'pr.id as originalId', 'pr.requestedAt as date', "'Purchase' as type",
                `'Purchase: ' || json_extract(pr.assetDetails, '$.name') as title`,
                'json_extract(pr.assetDetails, \'$.description\') as note', 'pr.status as status',
                "'emoji' as iconType", "'💰' as icon", "'' as imageUrl",
                "'#fbbf24' as color", 'pr.userId as userId', 'user.gameName as actorName',
                "'' as questType", 'pr.guildId as guildId'
            ])
            .from('purchase_request', 'pr')
            .leftJoin('user', 'user', 'user.id = pr.userId');
        
        if (viewMode === 'personal') {
            purchaseQuery.where('pr.userId = :userId', { userId });
        }
        if (guildId !== 'null') {
            purchaseQuery.andWhere('pr.guildId = :guildId', { guildId });
        } else if (viewMode === 'personal') {
            purchaseQuery.andWhere('pr.guildId IS NULL');
        }
        subQueries.push(purchaseQuery.getQuery());
    }

    // --- Admin Adjustments ---
    if (filterTypesArray.includes('AdminAdjustment')) {
        let adjustmentQuery = qb.subQuery()
            .select([
                'aa.id as id', 'aa.id as originalId', 'aa.adjustedAt as date', "'AdminAdjustment' as type",
                'aa.reason as title', "'' as note", 'aa.type as status',
                "'emoji' as iconType", "'⚖️' as icon", "'' as imageUrl",
                "'#60a5fa' as color", 'aa.userId as userId', 'adjuster.gameName as actorName',
                "'' as questType", 'aa.guildId as guildId'
            ])
            .from('admin_adjustment', 'aa')
            .leftJoin('user', 'adjuster', 'adjuster.id = aa.adjusterId');
        
        if (viewMode === 'personal') {
            adjustmentQuery.where('aa.userId = :userId', { userId });
        }
        if (guildId !== 'null') {
            adjustmentQuery.andWhere('aa.guildId = :guildId', { guildId });
        } else if (viewMode === 'personal') {
            adjustmentQuery.andWhere('aa.guildId IS NULL');
        }
        subQueries.push(adjustmentQuery.getQuery());
    }

    // --- Trophies ---
    if (filterTypesArray.includes('TrophyAwarded')) {
        let trophyQuery = qb.subQuery()
            .select([
                'ut.id as id', 'ut.id as originalId', 'ut.awardedAt as date', "'TrophyAwarded' as type",
                `'Trophy Awarded: ' || trophy.name as title`,
                'trophy.description as note', "'Awarded' as status",
                'trophy.iconType as iconType', 'trophy.icon as icon', 'trophy.imageUrl as imageUrl',
                "'#facc15' as color", 'ut.userId as userId', 'user.gameName as actorName',
                "'' as questType", 'ut.guildId as guildId'
            ])
            .from('user_trophy', 'ut')
            .leftJoin('trophy', 'trophy', 'trophy.id = ut.trophyId')
            .leftJoin('user', 'user', 'user.id = ut.userId');
        
        if (viewMode === 'personal') {
            trophyQuery.where('ut.userId = :userId', { userId });
        }
        if (guildId !== 'null') {
            trophyQuery.andWhere('ut.guildId = :guildId', { guildId });
        } else if (viewMode === 'personal') {
            trophyQuery.andWhere('ut.guildId IS NULL');
        }
        subQueries.push(trophyQuery.getQuery());
    }
    
    if (subQueries.length === 0) {
        return { events: [], total: 0 };
    }

    const fullQuery = subQueries.join(' UNION ALL ');
    const pagedQuery = `${fullQuery} ORDER BY date DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    const countQuery = `SELECT COUNT(*) as total FROM (${fullQuery}) as unionResult`;

    const rawEvents = await manager.query(pagedQuery, [userId, guildId]);
    const totalResult = await manager.query(countQuery, [userId, guildId]);
    const total = totalResult[0]?.total || 0;

    const rewardTypes = await manager.find(RewardTypeDefinitionEntity);
    const getRewardInfo = (id) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };

    const events = rawEvents.map(event => {
        if (event.type === 'Purchase') {
            try {
                const details = JSON.parse(event.note);
                if (Array.isArray(details.cost)) {
                    event.note = details.cost.map(r => `-${r.amount} ${getRewardInfo(r.rewardTypeId).name}`).join(', ');
                }
            } catch (e) { /* ignore */ }
        }
        return event;
    });

    return { events, total };
};


const resetSettings = async () => {
    await settingService.update(INITIAL_SETTINGS);
};

const importAssetPack = async (assetPack, resolutions) => {
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
                
                if(assetType === 'quests' && newAssetData.rewards) {
                    newAssetData.rewards = newAssetData.rewards.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    newAssetData.lateSetbacks = (newAssetData.lateSetbacks || []).map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    newAssetData.incompleteSetbacks = (newAssetData.incompleteSetbacks || []).map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId }));
                    if (newAssetData.groupId) newAssetData.groupId = idMap.get(newAssetData.groupId) || newAssetData.groupId;
                }
                if(assetType === 'gameAssets' && newAssetData.costGroups) {
                    newAssetData.costGroups = newAssetData.costGroups.map(group => 
                        group.map(c => ({ ...c, rewardTypeId: idMap.get(c.rewardTypeId) || c.rewardTypeId }))
                    );
                    if (newAssetData.marketIds) {
                        newAssetData.marketIds = newAssetData.marketIds.map(mid => idMap.get(mid) || mid);
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
                    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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