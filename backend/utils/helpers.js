

const { UserEntity, QuestCompletionEntity, UserTrophyEntity, RankEntity, TrophyEntity, QuestEntity, GuildEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity, PurchaseRequestEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity, ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity, BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, TradeOfferEntity, GiftEntity, RotationEntity, ChronicleEventEntity } = require('../entities');
const { In, IsNull } = require("typeorm");
const { SystemNotificationEntity: SysNotifEntity } = require('../entities'); // alias for checkAndAwardTrophies
const { INITIAL_SETTINGS, INITIAL_RANKS, INITIAL_TROPHIES, INITIAL_REWARD_TYPES, INITIAL_QUEST_GROUPS, INITIAL_THEMES } = require('../initialData');

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
            const newNotification = manager.create(SysNotifEntity, {
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

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

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
    data.questCompletions = questCompletions
        .filter(qc => qc.user && qc.quest) // Filter out orphaned records
        .map(qc => {
            const { user, quest, ...completionData } = qc;
            return { ...completionData, userId: user.id, questId: quest.id };
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
    data.chronicleEvents = await manager.find(ChronicleEventEntity, { order: { date: "DESC" } });
    
    const settingRow = await manager.findOneBy(SettingEntity, { id: 1 });
    let finalSettings = settingRow ? settingRow.settings : INITIAL_SETTINGS;

    if (settingRow) { // Only merge if settings were loaded from DB
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
        mergeNewProperties(finalSettings, defaultSettings);
    }
    data.settings = finalSettings;

    const historyRow = await manager.findOneBy(LoginHistoryEntity, { id: 1 });
    data.loginHistory = historyRow ? historyRow.history : [];
    
    return data;
};

const logAdminAction = async (manager, { actorId, title, note, icon, color, guildId }) => {
    const chronicleRepo = manager.getRepository(ChronicleEventEntity);
    const userRepo = manager.getRepository(UserEntity);

    const actor = actorId ? await userRepo.findOneBy({ id: actorId }) : null;
    
    const eventData = {
        id: `chron-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalId: `admin-action-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'System',
        title,
        note,
        status: 'Executed',
        icon,
        color,
        userId: null, 
        userName: null,
        actorId: actor?.id || 'system',
        actorName: actor?.gameName || 'System',
        guildId: guildId || undefined,
    };

    const chronicleEvent = chronicleRepo.create(eventData);
    await manager.save(updateTimestamps(chronicleEvent, true));
};

module.exports = {
    updateTimestamps,
    checkAndAwardTrophies,
    asyncMiddleware,
    getFullAppData,
    logAdminAction,
};
