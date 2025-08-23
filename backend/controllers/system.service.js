
const { dataSource } = require('../data-source');
const { 
    QuestCompletionEntity, PurchaseRequestEntity, UserTrophyEntity, AdminAdjustmentEntity, 
    UserEntity, QuestEntity, SettingEntity
} = require('../entities');
const { updateEmitter } = require('../utils/updateEmitter');
const { updateTimestamps } = require('../utils/helpers');
const { INITIAL_SETTINGS } = require('../initialData');
const { In, IsNull } = require('typeorm');

const getChronicles = async (req, res) => {
    const { userId, guildId, viewMode, page = 1, limit = 50, startDate, endDate } = req.query;
    const manager = dataSource.manager;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let allEvents = [];

    // --- Quest Completions ---
    const qcQb = manager.createQueryBuilder(QuestCompletionEntity, "qc")
        .leftJoinAndSelect("qc.user", "user")
        .leftJoinAndSelect("qc.quest", "quest")
        .leftJoinAndSelect("qc.actedBy", "actor");
    
    if (viewMode === 'personal' && userId) qcQb.where("user.id = :userId", { userId });
    
    if (guildId === 'null') qcQb.andWhere("qc.guildId IS NULL");
    else if (guildId) qcQb.andWhere("qc.guildId = :guildId", { guildId });
    
    if (startDate && endDate) {
        qcQb.andWhere("qc.completedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
        qcQb.andWhere("qc.completedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
    }

    const completions = await qcQb.orderBy("qc.completedAt", "DESC").getMany();
    
    completions.forEach(c => {
        if (!c.user || !c.quest) return; // Skip orphaned records

        const eventType = c.quest.type === 'Journey' ? 'Checkpoint' : 'Quest';

        if (c.quest.requiresApproval) {
            if (c.status === 'Pending') {
                allEvents.push({
                    id: `c-pend-${c.id}`, originalId: c.id, date: c.completedAt, type: eventType, questType: c.quest.type,
                    title: `${c.user.gameName} completed: ${c.quest.title}`,
                    note: c.note, status: 'Pending Approval', icon: c.quest.icon || '📜', color: '#f59e0b',
                    userId: c.user.id, rewards: c.quest.rewards
                });
            } else if (c.status === 'Approved' && c.actedAt) {
                allEvents.push({
                    id: `c-appr-${c.id}`, originalId: c.id, date: c.actedAt, type: eventType, questType: c.quest.type,
                    title: `Quest Approved: ${c.quest.title}`,
                    note: `Approved by ${c.actor?.gameName || 'Admin'}.`, status: 'Approved', icon: '✅', color: '#22c55e',
                    userId: c.user.id, actorName: c.actor?.gameName, rewards: c.quest.rewards
                });
            } else if (c.status === 'Rejected' && c.actedAt) {
                allEvents.push({
                    id: `c-rej-${c.id}`, originalId: c.id, date: c.actedAt, type: eventType, questType: c.quest.type,
                    title: `Quest Rejected: ${c.quest.title}`,
                    note: `Rejected by ${c.actor?.gameName || 'Admin'}.`, status: 'Rejected', icon: '❌', color: '#ef4444',
                    userId: c.user.id, actorName: c.actor?.gameName, rewards: []
                });
            }
        } else { // Auto-approved quests
            allEvents.push({
                id: `c-comp-${c.id}`, originalId: c.id, date: c.completedAt, type: eventType, questType: c.quest.type,
                title: `${c.user.gameName} completed: ${c.quest.title}`,
                note: c.note, status: 'Completed', icon: c.quest.icon || '📜', color: '#10b981',
                userId: c.user.id, rewards: c.quest.rewards
            });
        }
    });

    // --- Purchase Requests ---
    const prQb = manager.createQueryBuilder(PurchaseRequestEntity, "pr")
        .leftJoinAndSelect("pr.user", "user");
    
    if (viewMode === 'personal' && userId) prQb.where("user.id = :userId", { userId });

    if (guildId === 'null') prQb.andWhere("pr.guildId IS NULL");
    else if (guildId) prQb.andWhere("pr.guildId = :guildId", { guildId });

    if (startDate && endDate) {
        prQb.andWhere("pr.requestedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
        prQb.andWhere("pr.requestedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
    }
    
    const purchases = await prQb.orderBy("pr.requestedAt", "DESC").getMany();
    allEvents.push(...purchases.map(p => ({
        id: `p-${p.id}`, originalId: p.id, date: p.requestedAt, type: 'Purchase',
        title: `${p.user?.gameName || 'Unknown User'} requested: ${p.assetDetails.name}`,
        note: p.assetDetails.description, status: p.status, icon: '💰', color: '#f59e0b',
        userId: p.user?.id
    })));

    // --- User Trophies ---
    const utQb = manager.createQueryBuilder(UserTrophyEntity, "ut")
        .leftJoinAndSelect("ut.user", "user")
        .leftJoinAndSelect("ut.trophy", "trophy");
    
    if (viewMode === 'personal' && userId) utQb.where("user.id = :userId", { userId });

    if (guildId === 'null') utQb.andWhere("ut.guildId IS NULL");
    else if (guildId) utQb.andWhere("ut.guildId = :guildId", { guildId });

    if (startDate && endDate) {
        utQb.andWhere("ut.awardedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
        utQb.andWhere("ut.awardedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
    }

    const trophies = await utQb.orderBy("ut.awardedAt", "DESC").getMany();
    allEvents.push(...trophies.map(t => ({
        id: `t-${t.id}`, originalId: t.id, date: t.awardedAt, type: 'Trophy',
        title: `${t.user?.gameName || 'Unknown User'} earned: ${t.trophy?.name || 'Unknown Trophy'}`,
        note: t.trophy?.description, status: 'Awarded', icon: t.trophy?.icon || '🏆', color: '#ca8a04',
        userId: t.user?.id
    })));

    // --- Admin Adjustments ---
    const aaQb = manager.createQueryBuilder(AdminAdjustmentEntity, "aa")
        .leftJoinAndSelect("aa.user", "user");
    
    if (viewMode === 'personal' && userId) aaQb.where("user.id = :userId", { userId });

    if (guildId === 'null') aaQb.andWhere("aa.guildId IS NULL");
    else if (guildId) aaQb.andWhere("aa.guildId = :guildId", { guildId });

    if (startDate && endDate) {
        aaQb.andWhere("aa.adjustedAt >= :startDate", { startDate: `${startDate}T00:00:00.000Z` });
        aaQb.andWhere("aa.adjustedAt <= :endDate", { endDate: `${endDate}T23:59:59.999Z` });
    }
    
    const adjustments = await aaQb.orderBy("aa.adjustedAt", "DESC").getMany();
    allEvents.push(...adjustments.map(a => ({
        id: `a-${a.id}`, originalId: a.id, date: a.adjustedAt, type: 'Adjustment',
        title: `Admin Adjustment for ${a.user?.gameName || 'Unknown User'}: ${a.type}`,
        note: a.reason, status: a.type, icon: '⚖️', color: '#a855f7',
        userId: a.user?.id
    })));
    
    // Sort all collected events by date
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const total = allEvents.length;
    const paginatedEvents = (startDate || endDate) ? allEvents : allEvents.slice(skip, skip + parseInt(limit));

    res.json({ events: paginatedEvents, total });
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
