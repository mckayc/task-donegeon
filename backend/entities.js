const { EntitySchema } = require("typeorm");

// Note: These schemas are based on the structures in `types.ts`.
// Complex nested objects and arrays are stored as JSON or simple-array for simplicity.

const UserEntity = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: { primary: true, type: "varchar" },
        firstName: { type: "varchar" },
        lastName: { type: "varchar" },
        username: { type: "varchar" },
        email: { type: "varchar" },
        gameName: { type: "varchar" },
        birthday: { type: "varchar" },
        role: { type: "varchar" },
        avatar: { type: "simple-json" },
        profilePictureUrl: { type: "varchar", nullable: true },
        ownedAssetIds: { type: "simple-array" },
        pin: { type: "varchar" },
        password: { type: "varchar", nullable: true },
        personalPurse: { type: "simple-json" },
        personalExperience: { type: "simple-json" },
        guildBalances: { type: "simple-json" },
        theme: { type: "varchar", nullable: true },
        ownedThemes: { type: "simple-array" },
        hasBeenOnboarded: { type: "boolean", nullable: true },
    },
});

const QuestEntity = new EntitySchema({
    name: "Quest",
    tableName: "quests",
    columns: {
        id: { primary: true, type: "varchar" },
        title: { type: "varchar" },
        description: { type: "text" },
        type: { type: "varchar" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
        tags: { type: "simple-array" },
        lateDateTime: { type: "varchar", nullable: true },
        incompleteDateTime: { type: "varchar", nullable: true },
        lateTime: { type: "varchar", nullable: true },
        incompleteTime: { type: "varchar", nullable: true },
        rewards: { type: "simple-json" },
        lateSetbacks: { type: "simple-json" },
        incompleteSetbacks: { type: "simple-json" },
        isActive: { type: "boolean" },
        isOptional: { type: "boolean" },
        availabilityType: { type: "varchar" },
        availabilityCount: { type: "integer", nullable: true },
        weeklyRecurrenceDays: { type: "simple-json" },
        monthlyRecurrenceDays: { type: "simple-json" },
        assignedUserIds: { type: "simple-array" },
        guildId: { type: "varchar", nullable: true },
        groupId: { type: "varchar", nullable: true },
        requiresApproval: { type: "boolean" },
        claimedByUserIds: { type: "simple-array" },
        dismissals: { type: "simple-json" },
        todoUserIds: { type: "simple-array", nullable: true },
    },
});

const QuestGroupEntity = new EntitySchema({
    name: "QuestGroup",
    tableName: "quest_groups",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        description: { type: "text" },
        icon: { type: "varchar" },
    },
});

const MarketEntity = new EntitySchema({
    name: "Market",
    tableName: "markets",
    columns: {
        id: { primary: true, type: "varchar" },
        title: { type: "varchar" },
        description: { type: "text" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
        guildId: { type: "varchar", nullable: true },
        status: { type: "simple-json" },
    },
});

const RewardTypeDefinitionEntity = new EntitySchema({
    name: "RewardTypeDefinition",
    tableName: "reward_types",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        category: { type: "varchar" },
        description: { type: "text" },
        isCore: { type: "boolean" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
    },
});

const QuestCompletionEntity = new EntitySchema({
    name: "QuestCompletion",
    tableName: "quest_completions",
    columns: {
        id: { primary: true, type: "varchar" },
        questId: { type: "varchar" },
        userId: { type: "varchar" },
        completedAt: { type: "varchar" },
        status: { type: "varchar" },
        note: { type: "text", nullable: true },
        guildId: { type: "varchar", nullable: true },
    },
});

const PurchaseRequestEntity = new EntitySchema({
    name: "PurchaseRequest",
    tableName: "purchase_requests",
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        assetId: { type: "varchar" },
        requestedAt: { type: "varchar" },
        actedAt: { type: "varchar", nullable: true },
        status: { type: "varchar" },
        assetDetails: { type: "simple-json" },
        guildId: { type: "varchar", nullable: true },
    },
});

const GuildEntity = new EntitySchema({
    name: "Guild",
    tableName: "guilds",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        purpose: { type: "text" },
        memberIds: { type: "simple-array" },
        isDefault: { type: "boolean", nullable: true },
        themeId: { type: "varchar", nullable: true },
    },
});

const RankEntity = new EntitySchema({
    name: "Rank",
    tableName: "ranks",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        xpThreshold: { type: "integer" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
    },
});

const TrophyEntity = new EntitySchema({
    name: "Trophy",
    tableName: "trophies",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        description: { type: "text" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
        isManual: { type: "boolean" },
        requirements: { type: "simple-json" },
    },
});

const UserTrophyEntity = new EntitySchema({
    name: "UserTrophy",
    tableName: "user_trophies",
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        trophyId: { type: "varchar" },
        awardedAt: { type: "varchar" },
        guildId: { type: "varchar", nullable: true },
    },
});

const AdminAdjustmentEntity = new EntitySchema({
    name: "AdminAdjustment",
    tableName: "admin_adjustments",
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        adjusterId: { type: "varchar" },
        type: { type: "varchar" },
        rewards: { type: "simple-json" },
        setbacks: { type: "simple-json" },
        trophyId: { type: "varchar", nullable: true },
        reason: { type: "text" },
        adjustedAt: { type: "varchar" },
        guildId: { type: "varchar", nullable: true },
    },
});

const GameAssetEntity = new EntitySchema({
    name: "GameAsset",
    tableName: "game_assets",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        description: { type: "text" },
        url: { type: "varchar" },
        icon: { type: "varchar", nullable: true },
        category: { type: "varchar" },
        avatarSlot: { type: "varchar", nullable: true },
        isForSale: { type: "boolean" },
        costGroups: { type: "simple-json" },
        payouts: { type: "simple-json", nullable: true },
        marketIds: { type: "simple-array" },
        creatorId: { type: "varchar" },
        createdAt: { type: "varchar" },
        purchaseLimit: { type: "integer", nullable: true },
        purchaseLimitType: { type: "varchar" },
        purchaseCount: { type: "integer" },
        requiresApproval: { type: "boolean" },
        linkedThemeId: { type: "varchar", nullable: true },
    },
});

const SystemLogEntity = new EntitySchema({
    name: "SystemLog",
    tableName: "system_logs",
    columns: {
        id: { primary: true, type: "varchar" },
        timestamp: { type: "varchar" },
        type: { type: "varchar" },
        questId: { type: "varchar" },
        userIds: { type: "simple-array" },
        setbacksApplied: { type: "simple-json" },
    },
});

const ThemeDefinitionEntity = new EntitySchema({
    name: "ThemeDefinition",
    tableName: "themes",
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        isCustom: { type: "boolean" },
        styles: { type: "simple-json" },
    },
});

const ChatMessageEntity = new EntitySchema({
    name: "ChatMessage",
    tableName: "chat_messages",
    columns: {
        id: { primary: true, type: "varchar" },
        senderId: { type: "varchar" },
        recipientId: { type: "varchar", nullable: true },
        guildId: { type: "varchar", nullable: true },
        message: { type: "text" },
        timestamp: { type: "varchar" },
        readBy: { type: "simple-array" },
        isAnnouncement: { type: "boolean", nullable: true },
    },
});

const SystemNotificationEntity = new EntitySchema({
    name: "SystemNotification",
    tableName: "system_notifications",
    columns: {
        id: { primary: true, type: "varchar" },
        senderId: { type: "varchar", nullable: true },
        message: { type: "text" },
        type: { type: "varchar" },
        timestamp: { type: "varchar" },
        recipientUserIds: { type: "simple-array" },
        readByUserIds: { type: "simple-array" },
        link: { type: "varchar", nullable: true },
        guildId: { type: "varchar", nullable: true },
        iconType: { type: "varchar", nullable: true },
        icon: { type: "varchar", nullable: true },
        imageUrl: { type: "varchar", nullable: true },
    },
});

const ScheduledEventEntity = new EntitySchema({
    name: "ScheduledEvent",
    tableName: "scheduled_events",
    columns: {
        id: { primary: true, type: "varchar" },
        title: { type: "varchar" },
        description: { type: "text" },
        startDate: { type: "varchar" },
        endDate: { type: "varchar" },
        isAllDay: { type: "boolean" },
        eventType: { type: "varchar" },
        guildId: { type: "varchar", nullable: true },
        icon: { type: "varchar", nullable: true },
        color: { type: "varchar", nullable: true },
        modifiers: { type: "simple-json" },
    },
});

const SettingEntity = new EntitySchema({
    name: "Setting",
    tableName: "settings",
    columns: {
        // Use a single, fixed ID to ensure only one row of settings exists.
        id: { primary: true, type: "integer", default: 1 },
        settings: { type: "simple-json" },
    },
});

const LoginHistoryEntity = new EntitySchema({
    name: "LoginHistory",
    tableName: "login_history",
    columns: {
        id: { primary: true, type: "integer", default: 1 },
        history: { type: "simple-array" },
    },
});

const allEntities = [
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity
];

module.exports = { 
    allEntities,
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity
};
