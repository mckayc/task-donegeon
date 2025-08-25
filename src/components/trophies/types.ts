export enum TrophyRequirementType {
    CompleteQuestType = 'COMPLETE_QUEST_TYPE',
    EarnTotalReward = 'EARN_TOTAL_REWARD',
    AchieveRank = 'ACHIEVE_RANK',
    CompleteQuestTag = 'COMPLETE_QUEST_TAG',
    QuestCompleted = 'QUEST_COMPLETED',
}

export interface TrophyRequirement {
    type: TrophyRequirementType;
    // For QuestType, this is 'Duty' or 'Venture'
    // For Reward, this is the rewardTypeId
    // For Rank, this is the rankId
    // For QuestTag, this is the tag string
    // For QuestCompleted, this is the questId
    value: string; 
    count: number;
}

export interface Trophy {
    id: string;
    name: string;
    description: string;
    iconType: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
    isManual: boolean;
    requirements: TrophyRequirement[];
    createdAt?: string;
    updatedAt?: string;
}

export interface UserTrophy {
    id: string;
    userId: string;
    trophyId: string;
    awardedAt: string;
    guildId?: string;
    createdAt?: string;
    updatedAt?: string;
}
