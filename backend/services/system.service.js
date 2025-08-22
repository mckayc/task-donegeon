
const { dataSource } = require('../data-source');
const { 
    QuestCompletionEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, 
    GiftEntity, TradeOfferEntity, AppliedModifierEntity, UserEntity, QuestEntity, GameAssetEntity, 
    MarketEntity, RewardTypeDefinitionEntity, RankEntity, TrophyEntity, QuestGroupEntity, 
    SettingEntity, LoginHistoryEntity, SystemLogEntity, ChatMessageEntity, SystemNotificationEntity,
    ScheduledEventEntity, BugReportEntity, ModifierDefinitionEntity, RotationEntity, GuildEntity
} = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');
const { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_REWARD_TYPES, INITIAL_TROPHIES, INITIAL_QUEST_GROUPS, INITIAL_THEMES } = require('../initialData');
const { In } = require('typeorm');


const getChronicles = async (req, res) => {
    const { startDate, endDate, userId, guildId, viewMode, page = 1, limit = 50 } = req.query;
    const manager = dataSource.manager;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let allEvents = [];
    const baseWhere = { timestamp: { $gte: startDate, $lte: endDate } }; // Simplified, TypeORM uses different syntax

    const userFilter = viewMode === 'personal' ? { userId: userId } : {};

    // Quest Completions
    const completions = await manager.find(QuestCompletionEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user', 'quest'],
        order: { completedAt: 'DESC' }
    });
    allEvents.push(...completions.map(c => ({
        id: `c-${c.id}`, originalId: c.id, date: c.completedAt, type: 'Quest',
        title: c.quest?.title || 'Unknown Quest', note: c.note, status: c.status,
        icon: c.quest?.icon, color: '#10b981', userId: c.user.id
    })));

    // Purchase Requests
    const purchases = await manager.find(PurchaseRequestEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user'],
        order: { requestedAt: 'DESC' }
    });
    allEvents.push(...purchases.map(p => ({
        id: `p-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
        title: `Purchase: ${p.assetDetails.name}`, note: p.assetDetails.description, status: p.status,
        icon: '💰', color: '#f59e0b', userId: p.user.id
    })));

    // User Trophies
    const trophies = await manager.find(UserTrophyEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user', 'trophy'],
        order: { awardedAt: 'DESC' }
    });
    allEvents.push(...trophies.map(t => ({
        id: `t-${t.id}`, originalId: t.id, date: t.awardedAt, type: 'Trophy',
        title: `Trophy Earned: ${t.trophy.name}`, note: t.trophy.description, status: 'Awarded',
        icon: t.trophy.icon, color: '#ca8a04', userId: t.user.id
    })));

    // Admin Adjustments
    const adjustments = await manager.find(AdminAdjustmentEntity, {
        where: { userId: userFilter.userId, guildId: guildId === 'null' ? null : guildId },
        relations: ['user'],
        order: { adjustedAt: 'DESC' }
    });
    allEvents.push(...adjustments.map(a => ({
        id: `a-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'Adjustment',
        title: `Admin Adjustment: ${a.type}`, note: a.reason, status: a.type,
        icon: '⚖️', color: '#a855f7', userId: a.user.id
    })));
    
    // Sort all collected events by date
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const paginatedEvents = allEvents.slice(skip, skip + parseInt(limit));

    res.json({ events: paginatedEvents, total: allEvents.length });
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

module.exports = {
    getChronicles,
    applySettingsUpdates,
    clearAllHistory,
    resetAllPlayerData,
    deleteAllCustomContent,
    factoryReset,
    firstRun
};
