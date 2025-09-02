
import { User, QuestCompletionStatus, Condition, ConditionType, ConditionSet, ConditionSetLogic, Rank, QuestCompletion, Quest, QuestGroup, Trophy, UserTrophy, GameAsset, Guild, Role } from '../types';
import { toYMD } from './quests';

// The dependencies needed to evaluate conditions.
export type ConditionDependencies = {
    ranks: Rank[];
    questCompletions: QuestCompletion[];
    quests: Quest[];
    questGroups: QuestGroup[];
    userTrophies: UserTrophy[];
    trophies: Trophy[];
    gameAssets: GameAsset[];
    guilds: Guild[];
};

export const checkCondition = (condition: Condition, user: User, dependencies: ConditionDependencies): boolean => {
    switch (condition.type) {
        case ConditionType.MinRank:
            const totalXp = Object.values(user.personalExperience).reduce<number>((sum, amount) => sum + Number(amount), 0);
            const userRank = dependencies.ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);
            const requiredRank = dependencies.ranks.find(r => r.id === condition.rankId);
            if (!userRank || !requiredRank) return false;
            return userRank.xpThreshold >= requiredRank.xpThreshold;

        case ConditionType.DayOfWeek:
            const today = new Date().getDay();
            return condition.days.includes(today);

        case ConditionType.DateRange:
            const todayYMD = toYMD(new Date());
            return todayYMD >= condition.start && todayYMD <= condition.end;

        case ConditionType.TimeOfDay:
             const now = new Date();
             const currentTime = now.getHours() * 60 + now.getMinutes();
             const [startH, startM] = condition.start.split(':').map(Number);
             const startTime = startH * 60 + startM;
             const [endH, endM] = condition.end.split(':').map(Number);
             const endTime = endH * 60 + endM;
             return currentTime >= startTime && currentTime <= endTime;

        case ConditionType.QuestCompleted:
            return dependencies.questCompletions.some(c =>
                c.userId === user.id &&
                c.questId === condition.questId &&
                c.status === QuestCompletionStatus.Approved
            );
        
        case ConditionType.QuestGroupCompleted:
            const group = dependencies.questGroups.find(g => g.id === condition.questGroupId);
            if (!group) return false;
            const questsInGroup = dependencies.quests.filter(q => q.groupId === group.id);
            if (questsInGroup.length === 0) return true; // No quests to complete
            return questsInGroup.every(q => 
                dependencies.questCompletions.some(c => c.userId === user.id && c.questId === q.id && c.status === QuestCompletionStatus.Approved)
            );

        case ConditionType.TrophyAwarded:
            return dependencies.userTrophies.some(ut => ut.userId === user.id && ut.trophyId === condition.trophyId);

        case ConditionType.UserHasItem:
            return user.ownedAssetIds.includes(condition.assetId);

        case ConditionType.UserDoesNotHaveItem:
            return !user.ownedAssetIds.includes(condition.assetId);
        
        case ConditionType.UserIsMemberOfGuild:
            const userGuilds = dependencies.guilds.filter(g => g.memberIds.includes(user.id));
            return userGuilds.some(g => g.id === condition.guildId);

        case ConditionType.UserHasRole:
            return user.role === condition.role;

        default:
            return false;
    }
};

export const checkAllConditionSetsMet = (
    conditionSetIds: string[], 
    user: User, 
    dependencies: ConditionDependencies & { allConditionSets: ConditionSet[] }
): { allMet: boolean, failingSetName: string | null } => {
    
    if (!conditionSetIds || conditionSetIds.length === 0) {
        return { allMet: true, failingSetName: null };
    }

    const setsToEvaluate = dependencies.allConditionSets.filter(cs => conditionSetIds.includes(cs.id));
    if (setsToEvaluate.length !== conditionSetIds.length) {
         console.warn("An asset references a non-existent Condition Set.");
         return { allMet: false, failingSetName: 'an unknown set' };
    }

    // An asset is available only if ALL linked condition sets are met
    for (const set of setsToEvaluate) {
        const conditionsMet = set.logic === ConditionSetLogic.ALL
            ? set.conditions.every(cond => checkCondition(cond, user, dependencies))
            : set.conditions.some(cond => checkCondition(cond, user, dependencies));
        
        if (!conditionsMet) {
            return { allMet: false, failingSetName: set.name };
        }
    }
    
    return { allMet: true, failingSetName: null };
};
