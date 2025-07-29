const Role = {
  DonegeonMaster: 'Donegeon Master',
  Gatekeeper: 'Gatekeeper',
  Explorer: 'Explorer',
};

const QuestType = {
  Duty: 'Duty',
  Venture: 'Venture',
};

const RewardCategory = {
  Currency: 'Currency',
  XP: 'XP',
};

const QuestAvailability = {
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Frequency: 'Frequency',
    Unlimited: 'Unlimited',
};

const QuestCompletionStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
}

const TrophyRequirementType = {
    CompleteQuestType: 'COMPLETE_QUEST_TYPE',
    EarnTotalReward: 'EARN_TOTAL_REWARD',
    AchieveRank: 'ACHIEVE_RANK',
    CompleteQuestTag: 'COMPLETE_QUEST_TAG',
};

module.exports = {
    Role,
    QuestType,
    RewardCategory,
    QuestAvailability,
    QuestCompletionStatus,
    TrophyRequirementType,
};