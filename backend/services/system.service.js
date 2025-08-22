


const { dataSource } = require('../data-source');
const { 
    QuestCompletionEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, 
    UserEntity, QuestEntity, TrophyEntity,
    SettingEntity
} = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const { In, IsNull } = require('typeorm');


const getChronicles = async (req, res) => {
    const { startDate, endDate, userId, guildId, viewMode, page = 1, limit = 50 } = req.query;
    const manager = dataSource.manager;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const isPersonalScope = guildId === 'null' || !guildId || guildId === 'undefined';

    // --- Pre-fetch all necessary data to avoid N+1 queries ---
    const allQuests = await manager.find(QuestEntity);
    const allUsers = await manager.find(UserEntity);
    const allTrophies = await manager.find(TrophyEntity);
    const questMap = new Map(allQuests.map(q => [q.id, q]));
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const trophyMap = new Map(allTrophies.map(t => [t.id, t]));

    // --- Fetch Quest Completions with QueryBuilder for robust joins ---
    const completionsQB = manager.createQueryBuilder(QuestCompletionEntity, "completion")
        .leftJoinAndSelect("completion.user", "user")
        .leftJoinAndSelect("completion.quest", "quest")
        .orderBy("completion.completedAt", "DESC");

    if (isPersonalScope) {
        completionsQB.where("completion.guildId IS NULL");
    } else {
        completionsQB.where("completion.guildId = :guildId", { guildId });
    }

    if (viewMode === 'personal') {
        completionsQB.andWhere("completion.userId = :userId", { userId });
    }
    const completionsPromise = completionsQB.getMany();


    // --- Fetch Other Event Types Concurrently ---
    const whereClauseBase = {};
    if (isPersonalScope) { whereClauseBase.guildId = IsNull(); } else { whereClauseBase.guildId = guildId; }
    if (viewMode === 'personal') { whereClauseBase.userId = userId; }
    
    const purchasesPromise = manager.find(PurchaseRequestEntity, { where: whereClauseBase });
    const adjustmentsPromise = manager.find(AdminAdjustmentEntity, { where: whereClauseBase });
    const userTrophiesPromise = manager.find(UserTrophyEntity, { where: whereClauseBase });

    const [completions, purchases, adjustments, userTrophies] = await Promise.all([
        completionsPromise,
        purchasesPromise,
        adjustmentsPromise,
        userTrophiesPromise
    ]);

    // --- Map to Common Format ---
    let allEvents = [];
    allEvents.push(...completions.map(c => {
        const userName = c.user?.gameName || 'Unknown User';
        const questTitle = c.quest?.title || 'Unknown Quest';
        const questIcon = c.quest?.icon || '❓';
        return {
            id: `c-${c.id}`, originalId: c.id, date: c.completedAt, type: 'Quest',
            title: `${userName} completed "${questTitle}"`,
            note: c.note, status: c.status, icon: questIcon, color: '#10b981', userId: c.user?.id, actorName: userName
        };
    }));

    allEvents.push(...purchases.map(p => {
        const userName = userMap.get(p.userId)?.gameName ?? 'Unknown User';
        return {
            id: `p-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
            title: `${userName} purchased "${p.assetDetails?.name ?? 'an item'}"`,
            note: p.assetDetails?.description, status: p.status, icon: '💰', color: '#f59e0b', userId: p.userId, actorName: userName
        };
    }));

    allEvents.push(...userTrophies.map(t => {
        const trophy = trophyMap.get(t.trophyId);
        const userName = userMap.get(t.userId)?.gameName ?? 'Unknown User';
        return {
            id: `t-${t.id}`, originalId: t.id, date: t.awardedAt, type: 'Trophy',
            title: `${userName} earned: "${trophy?.name ?? 'a trophy'}"`,
            note: trophy?.description, status: 'Awarded', icon: trophy?.icon || '🏆', color: '#ca8a04', userId: t.userId, actorName: userName
        };
    }));

    allEvents.push(...adjustments.map(a => {
        const userName = userMap.get(a.userId)?.gameName ?? 'Unknown User';
        return {
            id: `a-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'Adjustment',
            title: `Admin Adjustment for ${userName}`,
            note: a.reason, status: a.type, icon: '⚖️', color: '#a855f7', userId: a.userId, actorName: userName
        };
    }));
    
    // Date Range Filtering & Sorting
    const filteredByDate = allEvents.filter(event => {
        if (!startDate || !endDate) return true;
        const eventDate = event.date.split('T')[0];
        return eventDate >= startDate && eventDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const paginatedEvents = filteredByDate.slice(skip, skip + parseInt(limit, 10));
    
    res.json({ events: paginatedEvents, total: filteredByDate.length });
};

const applySettingsUpdates = async (req, res) => {
    const manager = dataSource.manager;
    const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
    let currentSettings = settingRow ? settingRow.settings : INITIAL_SETTINGS;
    
    const defaultSettings = INITIAL_SETTINGS;
    const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

    const mergeNewProperties = (target, source) => {
        for (const key in source) {
            if (key === 'sidebars' && isObject(source[key]) && target[key] && source.sidebars.main) {
                const userVisibilityMap = new Map();
                (target.sidebars.main || []).forEach(item => {
                    if (item.id) {
                        userVisibilityMap.set(item.id, item.isVisible);
                    }
                });
                const newSidebar = (source.sidebars.main || []).map(defaultItem => {
                    if (defaultItem.id && userVisibilityMap.has(defaultItem.id)) {
                        return { ...defaultItem, isVisible: userVisibilityMap.get(defaultItem.id) };
                    }
                    return defaultItem;
                });
                target.sidebars.main = newSidebar;
            } else if (isObject(source[key])) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                mergeNewProperties(target[key], source[key]);
            } else if (!target.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };
    mergeNewProperties(currentSettings, defaultSettings);

    await manager.save(SettingEntity, updateTimestamps({ id: 1, settings: currentSettings }));
    updateEmitter.emit('update');
    res.status(200).json({ message: 'Settings updated successfully.' });
};

const clearAllHistory = async (req, res) => {
    const manager = dataSource.manager;
    const historyEntities = [
        QuestCompletionEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, 
        GiftEntity, TradeOfferEntity, AppliedModifierEntity, SystemLogEntity,
        ChatMessageEntity, SystemNotificationEntity
    ];
    for (const entity of historyEntities) {
        await manager.clear(entity);
    }
    updateEmitter.emit('update');
    res.status(200).json({ message: 'All history cleared.' });
};

const resetAllPlayerData = async (req, res) => {
    const manager = dataSource.manager;
    const usersToReset = await manager.find(UserEntity, { where: { role: In(['Explorer', 'Gatekeeper']) } });
    
    for (const user of usersToReset) {
        user.personalPurse = {};
        user.personalExperience = {};
        user.guildBalances = {};
        user.ownedAssetIds = [];
        user.ownedThemes = ['emerald', 'rose', 'sky'];
    }

    await manager.save(usersToReset.map(u => updateTimestamps(u)));
    updateEmitter.emit('update');
    res.status(200).json({ message: 'Player data reset.' });
};

const deleteAllCustomContent = async (req, res) => {
    const manager = dataSource.manager;
    
    await manager.clear(QuestEntity);
    await manager.clear(QuestGroupEntity);
    await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(qg => updateTimestamps(qg, true)));
    
    await manager.clear(MarketEntity);
    await manager.clear(GameAssetEntity);
    
    await manager.delete(RewardTypeDefinitionEntity, { isCore: false });

    const initialRankIds = INITIAL_RANKS.map(r => r.id);
    if (initialRankIds.length > 0) {
        await manager.getRepository(RankEntity).createQueryBuilder()
            .delete()
            .where("id NOT IN (:...ids)", { ids: initialRankIds })
            .execute();
    }
    
    const initialTrophyIds = INITIAL_TROPHIES.map(t => t.id);
    if (initialTrophyIds.length > 0) {
        await manager.getRepository(TrophyEntity).createQueryBuilder()
            .delete()
            .where("id NOT IN (:...ids)", { ids: initialTrophyIds })
            .execute();
    }

    updateEmitter.emit('update');
    res.status(200).json({ message: 'All custom content deleted.' });
};

const factoryReset = async (req, res) => {
    const manager = dataSource.manager;
    const entitiesToClear = [
        UserEntity, QuestEntity, QuestCompletionEntity, GuildEntity, QuestGroupEntity,
        MarketEntity, RewardTypeDefinitionEntity, PurchaseRequestEntity, AdminAdjustmentEntity,
        GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity, ChatMessageEntity,
        SystemNotificationEntity, ScheduledEventEntity, RankEntity, TrophyEntity,
        UserTrophyEntity, LoginHistoryEntity, BugReportEntity, ModifierDefinitionEntity,
        AppliedModifierEntity, TradeOfferEntity, GiftEntity, RotationEntity, SettingEntity
    ];

    for (const entity of entitiesToClear) {
        await manager.clear(entity);
    }
    
    updateEmitter.emit('update');
    res.status(200).json({ message: 'Factory reset successful.' });
};

const firstRun = async (req, res) => {
    const { adminUserData } = req.body;
    const manager = dataSource.manager;

    const userCount = await manager.count(UserEntity);
    if (userCount > 0) {
        return res.status(400).json({ error: 'First run has already been completed.' });
    }

    const adminUser = manager.create(UserEntity, {
        ...adminUserData,
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {},
        guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: true,
    });
    await manager.save(updateTimestamps(adminUser, true));
    
    await manager.save(SettingEntity, updateTimestamps({ id: 1, settings: INITIAL_SETTINGS }, true));
    await manager.save(RewardTypeDefinitionEntity, INITIAL_REWARD_TYPES.map(rt => updateTimestamps(rt, true)));
    await manager.save(RankEntity, INITIAL_RANKS.map(r => updateTimestamps(r, true)));
    await manager.save(TrophyEntity, INITIAL_TROPHIES.map(t => updateTimestamps(t, true)));
    await manager.save(QuestGroupEntity, INITIAL_QUEST_GROUPS.map(qg => updateTimestamps(qg, true)));
    await manager.save(ThemeDefinitionEntity, INITIAL_THEMES.map(th => updateTimestamps(th, true)));

    const defaultGuild = manager.create(GuildEntity, {
        id: `guild-default-${Date.now()}`,
        name: 'My Guild',
        purpose: 'A place for our adventures!',
        isDefault: true,
        treasury: { purse: {}, ownedAssetIds: [] },
        members: [adminUser]
    });
    await manager.save(updateTimestamps(defaultGuild, true));
    
    updateEmitter.emit('update');
    res.status(201).json({ message: 'First run completed successfully.' });
};

const injectChronicleEvent = async (req, res) => {
    const { userId, questId, note } = req.body;
    const manager = dataSource.manager;

    const user = await manager.findOneBy(UserEntity, { id: userId });
    const quest = await manager.findOneBy(QuestEntity, { id: questId });
    if (!user || !quest) {
        return res.status(404).json({ error: 'User or Quest not found.' });
    }

    const completionData = {
        questId: quest.id, userId: user.id, completedAt: new Date().toISOString(),
        status: 'Approved', note: `INJECTED: ${note || 'Test Event'}`, guildId: quest.guildId,
        actedById: 'system-injector', actedAt: new Date().toISOString(),
    };
    const newCompletion = manager.create(QuestCompletionEntity, {
        ...completionData,
        id: `qc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
    await manager.save(updateTimestamps(newCompletion, true));

    const rewardTypes = await manager.find('RewardTypeDefinition');
    const isGuildScope = !!quest.guildId;
    const balances = isGuildScope ? user.guildBalances[quest.guildId] || { purse: {}, experience: {} } : { purse: user.personalPurse, experience: user.personalExperience };
    
    quest.rewards.forEach(reward => {
        const rewardDef = rewardTypes.find(rt => rt.id === reward.rewardTypeId);
        if (rewardDef) {
            const target = rewardDef.category === 'Currency' ? balances.purse : balances.experience;
            target[reward.rewardTypeId] = (target[reward.rewardTypeId] || 0) + reward.amount;
        }
    });

    if (isGuildScope) user.guildBalances[quest.guildId] = balances;
    
    await manager.save(updateTimestamps(user));
    
    updateEmitter.emit('update');
    res.status(201).json({ message: 'Chronicle event injected successfully.' });
};

module.exports = {
    getChronicles,
    applySettingsUpdates,
    clearAllHistory,
    resetAllPlayerData,
    deleteAllCustomContent,
    factoryReset,
    firstRun,
    injectChronicleEvent,
};