
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
class ModifierDefinition {}
class AppliedModifier {}
class Rotation {}
class TradeOffer {}
class Gift {}
class ChronicleEvent {}
class Minigame {}
class GameScore {}
class AITutor {}
class AITutorSessionLog {}
class PendingReward {}

const ChronicleEventEntity = new EntitySchema({
    name: "ChronicleEvent",
    target: ChronicleEvent,
    columns: {
        id: { primary: true, type: "varchar" },
        originalId: { type: "varchar" }, // ID of the source object (e.g., QuestCompletion id)
        date: { type: "varchar" },
        type: { type: "varchar" },
        title: { type: "varchar" },
        note: { type: "text", nullable: true },
        status: { type: "varchar" },
        iconType: { type: "varchar", nullable: true },
        icon: { type: "varchar" },
        imageUrl: { type: "varchar", nullable: true },
        color: { type: "varchar" },
        userId: { type: "varchar", nullable: true }, // The primary user this event is about
        userName: { type: "varchar", nullable: true }, // The name of the user this event is about
        actorId: { type: "varchar", nullable: true }, // The ID of the user who performed the action
        actorName: { type: "varchar", nullable: true }, // The name of the user who performed the action
        recipientUserIds: { type: "simple-array", nullable: true },
        questType: { type: "varchar", nullable: true },
        guildId: { type: "varchar", nullable: true },
        rewardsText: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});


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
        profilePictureUrl: { type: "varchar", nullable: true },
        ownedAssetIds: { type: "simple-array" },
        wishlistAssetIds: { type: "simple-array", nullable: true },
        pin: { type: "varchar" },
        password: { type: "varchar", nullable: true },
        personalPurse: { type: "simple-json" },
        personalExperience: { type: "simple-json" },
        guildBalances: { type: "simple-json" },
        theme: { type: "varchar", nullable: true },
        ownedThemes: { type: "simple-array" },
        hasBeenOnboarded: { type: "boolean", nullable: true, default: false },
        aboutMe: { type: "text", nullable: true },
        adminNotes: { type: "text", nullable: true },
        dashboardLayout: { type: "simple-json", nullable: true },
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
        kind: { type: "varchar", default: "Personal" },
        mediaType: { type: "varchar", nullable: true },
        aiTutorId: { type: "varchar", nullable: true },
        videos: { type: "simple-json", nullable: true },
        pdfUrl: { type: "varchar", nullable: true },
        images: { type: "simple-json", nullable: true },
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
        dailyCompletionsLimit: { type: "integer", default: 1 },
        totalCompletionsLimit: { type: "integer", default: 0 },
        rewards: { type: "simple-json" },
        lateSetbacks: { type: "simple-json" },
        incompleteSetbacks: { type: "simple-json" },
        isActive: { type: "boolean", default: true },
        isOptional: { type: "boolean", default: false },
        requiresApproval: { type: "boolean", default: false },
        claimedByUserIds: { type: "simple-array", nullable: true },
        dismissals: { type: "simple-json", nullable: true },
        todoUserIds: { type: "simple-array", nullable: true },
        guildId: { type: "varchar", nullable: true },
        groupIds: { type: "simple-array", nullable: true },
        checkpoints: { type: "simple-json", nullable: true },
        checkpointCompletionTimestamps: { type: "simple-json", nullable: true },
        requiresClaim: { type: "boolean", default: false },
        claimLimit: { type: "integer", default: 1 },
        pendingClaims: { type: "simple-json", nullable: true },
        approvedClaims: { type: "simple-json", nullable: true },
        conditionSetIds: { type: "simple-array", nullable: true },
        timerConfig: { type: "simple-json", nullable: true },
        readingProgress: { type: "simple-json", nullable: true },
        minigameId: { type: "varchar", nullable: true },
        minigameMinScore: { type: "integer", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
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
const RewardTypeDefinitionEntity = new EntitySchema({ name: "RewardTypeDefinition", target: RewardTypeDefinition, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, category: { type: "varchar" }, description: { type: "text" }, isCore: { type: "boolean" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, baseValue: { type: "float", default: 0 }, isExchangeable: { type: "boolean", default: true, nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const RankEntity = new EntitySchema({ name: "Rank", target: Rank, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, xpThreshold: { type: "integer" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const TrophyEntity = new EntitySchema({ name: "Trophy", target: Trophy, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, isManual: { type: "boolean" }, requirements: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ThemeDefinitionEntity = new EntitySchema({ name: "ThemeDefinition", target: ThemeDefinition, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, isCustom: { type: "boolean" }, styles: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const GameAssetEntity = new EntitySchema({ name: "GameAsset", target: GameAsset, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, iconType: { type: "varchar" }, icon: { type: "varchar" }, imageUrl: { type: "varchar", nullable: true }, category: { type: "varchar" }, avatarSlot: { type: "varchar", nullable: true }, isForSale: { type: "boolean" }, costGroups: { type: "simple-json" }, payouts: { type: "simple-json", nullable: true }, marketIds: { type: "simple-array" }, creatorId: { type: "varchar" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true }, purchaseLimit: { type: "integer", nullable: true }, purchaseLimitType: { type: "varchar" }, purchaseCount: { type: "integer" }, requiresApproval: { type: "boolean" }, linkedThemeId: { type: "varchar", nullable: true } } });
const SystemLogEntity = new EntitySchema({ name: "SystemLog", target: SystemLog, columns: { id: { primary: true, type: "varchar" }, timestamp: { type: "varchar" }, type: { type: "varchar" }, questId: { type: "varchar" }, userIds: { type: "simple-array" }, setbacksApplied: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ChatMessageEntity = new EntitySchema({ name: "ChatMessage", target: ChatMessage, columns: { id: { primary: true, type: "varchar" }, senderId: { type: "varchar" }, recipientId: { type: "varchar", nullable: true }, guildId: { type: "varchar", nullable: true }, message: { type: "text" }, timestamp: { type: "varchar" }, readBy: { type: "simple-array" }, isAnnouncement: { type: "boolean", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const SystemNotificationEntity = new EntitySchema({ name: "SystemNotification", target: SystemNotification, columns: { id: { primary: true, type: "varchar" }, senderId: { type: "varchar", nullable: true }, message: { type: "text" }, type: { type: "varchar" }, timestamp: { type: "varchar" }, recipientUserIds: { type: "simple-array" }, readByUserIds: { type: "simple-array" }, link: { type: "varchar", nullable: true }, guildId: { type: "varchar", nullable: true }, iconType: { type: "varchar", nullable: true }, icon: { type: "varchar", nullable: true }, imageUrl: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const ScheduledEventEntity = new EntitySchema({ name: "ScheduledEvent", target: ScheduledEvent, columns: { id: { primary: true, type: "varchar" }, title: { type: "varchar" }, description: { type: "text" }, startDate: { type: "varchar" }, endDate: { type: "varchar" }, isAllDay: { type: "boolean" }, eventType: { type: "varchar" }, guildId: { type: "varchar", nullable: true }, icon: { type: "varchar", nullable: true }, color: { type: "varchar", nullable: true }, modifiers: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const SettingEntity = new EntitySchema({ name: "Setting", target: Setting, columns: { id: { primary: true, type: "integer", default: 1 }, settings: { type: "simple-json" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const LoginHistoryEntity = new EntitySchema({ name: "LoginHistory", target: LoginHistory, columns: { id: { primary: true, type: "integer", default: 1 }, history: { type: "simple-array" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });

const ModifierDefinitionEntity = new EntitySchema({
    name: "ModifierDefinition",
    target: ModifierDefinition,
    columns: {
        id: { primary: true, type: "varchar" },
        category: { type: "varchar" },
        name: { type: "varchar" },
        description: { type: "text" },
        icon: { type: "varchar" },
        effects: { type: "simple-json" },
        defaultRedemptionQuestId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});

const AppliedModifierEntity = new EntitySchema({
    name: "AppliedModifier",
    target: AppliedModifier,
    columns: {
        id: { primary: true, type: "varchar" },
        userId: { type: "varchar" },
        modifierDefinitionId: { type: "varchar" },
        appliedAt: { type: "varchar" },
        expiresAt: { type: "varchar", nullable: true },
        status: { type: "varchar", default: 'Active' },
        redemptionQuestId: { type: "varchar", nullable: true },
        resolvedAt: { type: "varchar", nullable: true },
        resolvedById: { type: "varchar", nullable: true },
        resolutionNote: { type: "text", nullable: true },
        overrides: { type: "simple-json", nullable: true },
        reason: { type: "text" },
        appliedById: { type: "varchar" },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId" },
            onDelete: "CASCADE",
        },
        appliedBy: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "appliedById" },
            onDelete: "SET NULL",
        },
        definition: {
            type: "many-to-one",
            target: "ModifierDefinition",
            joinColumn: { name: "modifierDefinitionId" },
            onDelete: "CASCADE",
        },
    }
});

const AITutorEntity = new EntitySchema({
    name: "AITutor",
    target: AITutor,
    columns: {
        id: { primary: true, type: "varchar" },
        name: { type: "varchar" },
        icon: { type: "varchar" },
        subject: { type: "varchar" },
        targetAgeGroup: { type: "varchar" },
        sessionMinutes: { type: "integer" },
        style: { type: "varchar" },
        customPersona: { type: "text", nullable: true },
        generalInstructions: { type: "text", nullable: true },
        sampleQuestions: { type: "simple-array" },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    }
});

const AITutorSessionLogEntity = new EntitySchema({
    name: "AITutorSessionLog",
    target: AITutorSessionLog,
    columns: {
        id: { primary: true, type: "varchar" },
        questId: { type: "varchar" },
        userId: { type: "varchar" },
        tutorId: { type: "varchar" },
        startedAt: { type: "varchar" },
        endedAt: { type: "varchar" },
        durationSeconds: { type: "integer" },
        transcript: { type: "simple-json" },
        finalScore: { type: "integer", nullable: true },
        totalQuestions: { type: "integer", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        completion: {
            type: "one-to-one",
            target: "QuestCompletion",
            joinColumn: true,
            onDelete: 'CASCADE',
            inverseSide: "aiTutorSessionLog"
        }
    }
});


const QuestCompletionEntity = new EntitySchema({
    name: "QuestCompletion",
    target: QuestCompletion,
    columns: {
        id: { primary: true, type: "varchar" },
        completedAt: { type: "varchar" },
        status: { type: "varchar" },
        note: { type: "text", nullable: true },
        adminNote: { type: "text", nullable: true },
        guildId: { type: "varchar", nullable: true },
        actedById: { type: "varchar", nullable: true },
        actedAt: { type: "varchar", nullable: true },
        checkpointId: { type: "varchar", nullable: true },
        timerDurationSeconds: { type: "integer", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId", referencedColumnName: "id" },
            inverseSide: "questCompletions",
            onDelete: "CASCADE",
        },
        quest: {
            type: "many-to-one",
            target: "Quest",
            joinColumn: { name: "questId", referencedColumnName: "id" },
            inverseSide: "questCompletions",
            onDelete: "CASCADE",
        },
        aiTutorSessionLog: {
            type: "one-to-one",
            target: "AITutorSessionLog",
            inverseSide: "completion",
            nullable: true,
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
        marketId: { type: "varchar", nullable: true },
        requestedAt: { type: "varchar" },
        actedAt: { type: "varchar", nullable: true },
        actedById: { type: "varchar", nullable: true }, // ID of the user who approved, rejected, or cancelled.
        status: { type: "varchar" },
        assetDetails: { type: "simple-json" },
        guildId: { type: "varchar", nullable: true },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId", referencedColumnName: "id" },
            inverseSide: "purchaseRequests",
            onDelete: "CASCADE",
        }
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
        treasury: { type: "simple-json", default: '{}' },
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        members: {
            type: "many-to-many",
            target: "User",
            joinTable: true,
            cascade: true,
            inverseSide: "guilds",
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
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId", referencedColumnName: "id" },
            onDelete: "CASCADE",
        },
        trophy: {
            type: "many-to-one",
            target: "Trophy",
            joinColumn: { name: "trophyId", referencedColumnName: "id" },
            onDelete: "CASCADE",
        },
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
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId", referencedColumnName: "id" },
            onDelete: "CASCADE",
        },
        adjuster: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "adjusterId", referencedColumnName: "id" },
            onDelete: "SET NULL",
        },
    }
});

const RotationEntity = new EntitySchema({ name: "Rotation", target: Rotation, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, questIds: { type: "simple-array" }, userIds: { type: "simple-array" }, activeDays: { type: "simple-array" }, frequency: { type: "varchar" }, lastAssignmentDate: { type: "varchar", nullable: true }, lastUserIndex: { type: "integer", default: -1 }, lastQuestStartIndex: { type: "integer", default: -1 }, questsPerUser: { type: "integer", default: 1 }, isActive: { type: "boolean", default: true }, startDate: { type: "varchar", nullable: true }, endDate: { type: "varchar", nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const TradeOfferEntity = new EntitySchema({ name: "TradeOffer", target: TradeOffer, columns: { id: { primary: true, type: "varchar" }, initiatorId: { type: "varchar" }, recipientId: { type: "varchar" }, guildId: { type: "varchar" }, status: { type: "varchar" }, initiatorOffer: { type: "simple-json" }, recipientOffer: { type: "simple-json" }, initiatorLocked: { type: "boolean" }, recipientLocked: { type: "boolean" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const GiftEntity = new EntitySchema({ name: "Gift", target: Gift, columns: { id: { primary: true, type: "varchar" }, senderId: { type: "varchar" }, recipientId: { type: "varchar" }, assetId: { type: "varchar" }, guildId: { type: "varchar" }, sentAt: { type: "varchar" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const MinigameEntity = new EntitySchema({ name: "Minigame", target: Minigame, columns: { id: { primary: true, type: "varchar" }, name: { type: "varchar" }, description: { type: "text" }, icon: { type: "varchar" }, cost: { type: "integer" }, isActive: { type: 'boolean', default: true, nullable: true }, playsPerToken: { type: 'integer', default: 1, nullable: true }, prizesEnabled: { type: 'boolean', default: false, nullable: true }, prizeThresholds: { type: 'simple-json', nullable: true }, rewardSettings: { type: 'simple-json', nullable: true }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });
const GameScoreEntity = new EntitySchema({ name: "GameScore", target: GameScore, columns: { id: { primary: true, type: "varchar" }, gameId: { type: "varchar" }, userId: { type: "varchar" }, score: { type: "integer" }, playedAt: { type: "varchar" }, createdAt: { type: "varchar", nullable: true }, updatedAt: { type: "varchar", nullable: true } } });

const PendingRewardEntity = new EntitySchema({
    name: "PendingReward",
    target: PendingReward,
    columns: {
        id: { primary: true, type: "varchar" }, // This will be the token
        userId: { type: "varchar" },
        rewards: { type: "simple-json" }, // e.g., [{ rewardTypeId: '...', amount: 10 }]
        source: { type: "varchar" }, // e.g., 'Math Muncher Round 1'
        status: { type: "varchar", default: 'pending' }, // 'pending' or 'claimed'
        createdAt: { type: "varchar", nullable: true },
        updatedAt: { type: "varchar", nullable: true },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId", referencedColumnName: "id" },
            onDelete: "CASCADE",
        }
    }
});

const allEntities = [
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, RotationEntity, TradeOfferEntity, GiftEntity,
    ChronicleEventEntity, MinigameEntity, GameScoreEntity, AITutorEntity, AITutorSessionLogEntity,
    PendingRewardEntity,
];

module.exports = { 
    allEntities,
    UserEntity, QuestEntity, QuestGroupEntity, MarketEntity, RewardTypeDefinitionEntity,
    QuestCompletionEntity, PurchaseRequestEntity, GuildEntity, RankEntity, TrophyEntity,
    UserTrophyEntity, AdminAdjustmentEntity, GameAssetEntity, SystemLogEntity, ThemeDefinitionEntity,
    ChatMessageEntity, SystemNotificationEntity, ScheduledEventEntity, SettingEntity, LoginHistoryEntity,
    BugReportEntity, ModifierDefinitionEntity, AppliedModifierEntity, RotationEntity, TradeOfferEntity, GiftEntity,
    ChronicleEventEntity, MinigameEntity, GameScoreEntity, AITutorEntity, AITutorSessionLogEntity,
    PendingRewardEntity,
};