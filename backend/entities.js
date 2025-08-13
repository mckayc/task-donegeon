

const { EntitySchema } = require("typeorm");

// Placeholder classes for TypeORM entity schemas. This removes the dependency on a non-existent file.
class User {}
class Quest {}
class QuestGroup {}
class Market {}
class RewardTypeDefinition {}
class QuestCompletion {}
class PurchaseRequest {}
class Guild {}
class Rank {}
class Trophy {}
class UserTrophy {}
class AdminAdjustment {}
class GameAsset {}
class SystemLog {}
class ThemeDefinition {}
class ChatMessage {}
class SystemNotification {}
class ScheduledEvent {}
class Setting {}
class LoginHistory {}
class BugReport {}

const BugReportEntity = new EntitySchema({
    name: "BugReport",
    target: BugReport,
    columns: {
        id: { primary: true, type: "varchar" },
        title: { type: "varchar" },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
        status: { type: "varchar" },
        tags: { type: "simple-array", nullable: true },
        logs: { type: "simple-json" },
    }
});

const UserEntity = new EntitySchema({
    name: "User",
    target: User,
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
        hasBeenOnboarded: { type: "boolean", nullable: true, default: false },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        questCompletions: {
            type: "one-to-many",
            target: "QuestCompletion",
            inverseSide: "user",
        },
        purchaseRequests: {
            type: "one-to-many",
            target: "PurchaseRequest",
            inverseSide: "user",
        },
        guilds: {
            type: "many-to-many",
            target: "Guild",
            inverseSide: "members"
        },
    }
});

const QuestEntity = new EntitySchema({
    name: "Quest",
    target: Quest,
    columns: {
        id: { primary: true, type: "varchar" },
        title: { type: "varchar" },
        description: { type: "text" },
        type: { type: "varchar" },
        iconType: { type: "varchar" },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
        tags: { type: "simple-array" },
        startDateTime: { type: "varchar", nullable: true },
        endDateTime: { type: "varchar", nullable: true },
        allDay: { type: "boolean", default: true },
        rrule: { type: "varchar", nullable: true },
        startTime: { type: "varchar", nullable: true },
        endTime: { type: "varchar", nullable: true },
        availabilityCount: { type: "integer", nullable: true },
        rewards: { type: "simple-json" },
        lateSetbacks: { type: "simple-json" },
        incompleteSetbacks: { type: "simple-json" },
        isActive: { type: "boolean", default: true },
        isOptional: { type: "boolean", default: false },
        requiresApproval: { type: "boolean", default: false },
        claimedByUserIds: { type: "simple-array" },
        dismissals: { type: "simple-json" },
        todoUserIds: { type: "simple-array", nullable: true },
        guildId: { type: "varchar", nullable: true },
        groupId: { type: "varchar", nullable: true },
        nextQuestId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
        // Old columns for migration, can be removed later
        lateDateTime: { type: "varchar", nullable: true },
        incompleteDateTime: { type: "varchar", nullable: true },
        lateTime: { type: "varchar", nullable: true },
        incompleteTime: { type: "varchar", nullable: true },
        availabilityType: { type: "varchar", nullable: true },
        weeklyRecurrenceDays: { type: "simple-json", nullable: true },
        monthlyRecurrenceDays: { type: "simple-json", nullable: true },
    },
    relations: {
        assignedUsers: {
            type: "many-to-many",
            target: "User",
            joinTable: true,
            cascade: true,
        },
        questCompletions: {
            type: "one-to-many",
            target: "QuestCompletion",
            inverseSide: "quest",
        },
    },
});

const QuestGroupEntity = new EntitySchema({ name: "QuestGroup", target: QuestGroup, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, icon: { type: "varchar" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const MarketEntity = new EntitySchema({ name: "Market", target: Market, columns: { id: { primary: true, type: "varchar" }, title: { type: "varchar" }, description: { type: "text" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, guildId: { type: "varchar", nullable: true }, status: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const RewardTypeDefinitionEntity = new EntitySchema({ name: "RewardTypeDefinition", target: RewardTypeDefinition, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, category: { type: "varchar" }, description: { type: "text" }, isCore: { type: "boolean" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const RankEntity = new EntitySchema({ name: "Rank", target: Rank, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, xpThreshold: { type: "integer" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const TrophyEntity = new EntitySchema({ name: "Trophy", target: Trophy, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, isManual: { type: "boolean" }, requirements: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ThemeDefinitionEntity = new EntitySchema({ name: "ThemeDefinition", target: ThemeDefinition, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, isCustom: { type: "boolean" }, styles: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const GameAssetEntity = new EntitySchema({ name: "GameAsset", target: GameAsset, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, url: { type: "varchar" }, icon: { type: "varchar", nullable: true }, category: { type: "varchar" }, avatarSlot: { type: "varchar", nullable: true }, isForSale: { type: "boolean" }, costGroups: { type: "simple-json" }, payouts: { type: "simple-json", nullable: true }, marketIds: { type: "simple-array" }, creatorId: { type: "varchar" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true }, purchaseLimit: { type: "integer", nullable: true }, purchaseLimitType: { type: "varchar" }, purchaseCount: { type: "integer" }, requiresApproval: { type: "boolean" }, linkedThemeId: { type: "varchar", nullable: true } } });
const SystemLogEntity = new EntitySchema({ name: "SystemLog", target: SystemLog, columns: { id: { primary: true, type: "varchar" }, timestamp: { type: "varchar" }, type: { type: "varchar" }, questId: { type: "varchar" }, userIds: { type: "simple-array" }, setbacksApplied: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ChatMessageEntity = new EntitySchema({ name: "ChatMessage", target: ChatMessage, columns: { id: { primary: true, type: "varchar" }, senderId: { type: "varchar" }, recipientId: { type: "varchar", nullable: true }, guildId: { type: "varchar", nullable: true }, message: { type: "text" }, timestamp: { type: "varchar" }, readBy: { type: "simple-array" }, isAnnouncement: { type: "boolean", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const SystemNotificationEntity = new EntitySchema({ name: "SystemNotification", target: SystemNotification, columns: { id: { primary: true, type: "varchar" }, senderId: { type: "varchar", nullable: true }, message: { type: "text" }, type: { type: "varchar" }, timestamp: { type: "varchar" }, recipientUserIds: { type: "simple-array" }, readByUserIds: { type: "simple-array" }, link: { type: "varchar", nullable: true }, guildId: { type: "varchar", nullable: true }, iconType: { type: "varchar", nullable: true }, icon: { type: "varchar", nullable: true }, imageUrl: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ScheduledEventEntity = new EntitySchema({ name: "ScheduledEvent", target: ScheduledEvent, columns: { id: { primary: true, type: "varchar" }, title: { type: "varchar" }, description: { type: "text" }, startDate: { type: "varchar" }, endDate: { type: "varchar" }, isAllDay: { type: "boolean" }, eventType: { type: "varchar" }, guildId: { type: "varchar", nullable: true }, icon: { type: "varchar", nullable: true }, color: { type: "varchar", nullable: true }, modifiers: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const SettingEntity = new EntitySchema({ name: "Setting", target: Setting, columns: { id: { primary: true, type: "integer", default: 1 }, settings: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const LoginHistoryEntity = new EntitySchema({ name: "LoginHistory", target: LoginHistory, columns: { id: { primary: true, type: "integer", default: 1 }, history: { type: "simple-array" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });

const QuestCompletionEntity = new EntitySchema({
    name: "QuestCompletion",
    target: QuestCompletion,
    columns: {
        id: { primary: true, type: "varchar" },
        completedAt: { type: "varchar" },
        status: { type: "varchar" },
        note: { type: "text", nullable: true },
        guildId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            inverseSide: "questCompletions",
            onDelete: "CASCADE",
        },
        quest: {
            type: "many-to-one",
            target: "Quest",
            inverseSide: "questCompletions",
            onDelete: "CASCADE",
        },
    },
});

const PurchaseRequestEntity = new EntitySchema({
    name: "PurchaseRequest",
    target: PurchaseRequest,
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        assetId: { type: "varchar" },
        requestedAt: { type: "varchar" },
        actedAt: { type: "varchar", nullable: true },
        status: { type: "varchar" },
        assetDetails: { type: "simple-json" },
        guildId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});

const GuildEntity = new EntitySchema({
    name: "Guild",
    target: Guild,
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        purpose: { type: "text" },
        isDefault: { type: "boolean", nullable: true },
        themeId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        members: {
            type: "many-to-many",
            target: "User",
            joinTable: true,
            cascade: true,
        },
    },
});

const UserTrophyEntity = new EntitySchema({
    name: "UserTrophy",
    target: UserTrophy,
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        trophyId: { type: "varchar" },
        awardedAt: { type: "varchar" },
        guildId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});

const AdminAdjustmentEntity = new EntitySchema({
    name: "AdminAdjustment",
    target: AdminAdjustment,
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
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});

const allEntities = [
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity
];

module.exports = { 
    allEntities,
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity
};
