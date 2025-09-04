import { User, QuestCompletionStatus, Condition, ConditionType, ConditionSet, ConditionSetLogic, Rank, QuestCompletion, Quest, QuestGroup, Trophy, UserTrophy, GameAsset, Guild, Role, QuestType } from '../types';
import { toYMD, isQuestScheduledForDay } from './quests';

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

export const checkCondition = (condition: Condition, user: User, dependencies: ConditionDependencies, questIdToExclude?: string): boolean => {
    const now = new Date();
    const todayYMD = toYMD(now);
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
            return todayYMD >= condition.start && todayYMD <= condition.end;

        case ConditionType.TimeOfDay:
             const currentTime = now.getHours() * 60 + now.getMinutes();
             const [startH, startM] = condition.start.split(':').map(Number);
             const startTime = startH * 60 + startM;
             const [endH, endM] = condition.end.split(':').map(Number);
             const endTime = endH * 60 + endM;
             return currentTime >= startTime && currentTime <= endTime;

        case ConditionType.QuestCompleted: {
            if (condition.questId === questIdToExclude) {
                return true;
            }
            const requiredQuestStatuses = condition.requiredStatuses?.length ? condition.requiredStatuses : [QuestCompletionStatus.Approved];
            const questForCondition = dependencies.quests.find(q => q.id === condition.questId);
            if (!questForCondition) return false;

            return dependencies.questCompletions.some(c => {
                if (c.userId !== user.id || c.questId !== condition.questId || !requiredQuestStatuses.includes(c.status)) {
                    return false;
                }
                // For a condition check on a recurring quest, we care about "today".
                if (questForCondition.type === QuestType.Duty || (questForCondition.type === QuestType.Venture && (questForCondition.dailyCompletionsLimit ?? 0) > 0)) {
                    return toYMD(new Date(c.completedAt)) === todayYMD;
                }
                // For one-time ventures/journeys, any completion is fine
                return true;
            });
        }
        
        case ConditionType.QuestGroupCompleted: {
            const group = dependencies.questGroups.find(g => g.id === condition.questGroupId);
            if (!group) return false;
            
            const questsInGroup = dependencies.quests.filter(q => 
                q.groupIds?.includes(group.id) && 
                q.id !== questIdToExclude
            );

            // Filter out quests that are definitively unavailable due to time to prevent deadlocks.
            const availableQuestsInGroup = questsInGroup.filter(q => {
                if (!q.isActive) return false;
                
                if (q.endDateTime && now > new Date(q.endDateTime)) {
                    return false; 
                }
                if (q.type === 'Duty' && q.endTime) {
                    const [h, m] = q.endTime.split(':').map(Number);
                    const incompleteTime = new Date(now);
                    incompleteTime.setHours(h, m, 0, 0);
                    if (isQuestScheduledForDay(q, now) && now > incompleteTime) {
                        return false;
                    }
                }
                return true;
            });

            if (questsInGroup.length > 0 && availableQuestsInGroup.length === 0) {
                return false;
            }

            const requiredGroupStatuses = condition.requiredStatuses?.length ? condition.requiredStatuses : [QuestCompletionStatus.Approved];
            
            return availableQuestsInGroup.every(q => 
                dependencies.questCompletions.some(c => {
                    if (c.userId !== user.id || c.questId !== q.id || !requiredGroupStatuses.includes(c.status)) {
                        return false;
                    }
                    // For a group completion check, we always care about "today".
                    // This applies to both duties and ventures within the group.
                    return toYMD(new Date(c.completedAt)) === todayYMD;
                })
            );
        }

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

export const checkGlobalConditionsMet = (
    user: User, 
    dependencies: ConditionDependencies & { allConditionSets: ConditionSet[] },
    options: { questId?: string, marketId?: string } = {}
): { allMet: boolean, failingSetName: string | null } => {
    const { questId, marketId } = options;
    const globalSets = dependencies.allConditionSets.filter(cs => cs.isGlobal);
    if (globalSets.length === 0) {
        return { allMet: true, failingSetName: null };
    }
    
    for (const set of globalSets) {
        if (questId && set.exemptQuestIds?.includes(questId)) {
            continue; 
        }
        if (marketId && set.exemptMarketIds?.includes(marketId)) {
            continue; 
        }
        
        const { allMet, failingSetName } = checkAllConditionSetsMet([set.id], user, dependencies, questId);
        if (!allMet) {
            return { allMet: false, failingSetName: failingSetName || set.name };
        }
    }

    return { allMet: true, failingSetName: null };
};

export const checkAllConditionSetsMet = (
    conditionSetIds: string[], 
    user: User, 
    dependencies: ConditionDependencies & { allConditionSets: ConditionSet[] },
    questIdToExclude?: string
): { allMet: boolean, failingSetName: string | null } => {
    
    if (!conditionSetIds || conditionSetIds.length === 0) {
        return { allMet: true, failingSetName: null };
    }

    const setsToEvaluate = dependencies.allConditionSets.filter(cs => conditionSetIds.includes(cs.id));
    if (setsToEvaluate.length !== conditionSetIds.length) {
         console.warn("An asset references a non-existent Condition Set.");
         return { allMet: false, failingSetName: 'an unknown set' };
    }

    for (const set of setsToEvaluate) {
        if (set.assignedUserIds && set.assignedUserIds.length > 0) {
            if (!set.assignedUserIds.includes(user.id)) {
                return { allMet: false, failingSetName: set.name };
            }
        }

        const useAndLogic = set.isGlobal || set.logic === ConditionSetLogic.ALL;

        const conditionsMet = useAndLogic
            ? set.conditions.every(cond => checkCondition(cond, user, dependencies, questIdToExclude))
            : set.conditions.some(cond => checkCondition(cond, user, dependencies, questIdToExclude));
        
        if (!conditionsMet) {
            return { allMet: false, failingSetName: set.name };
        }
    }
    
    return { allMet: true, failingSetName: null };
};


export const getConditionDescription = (condition: Condition, dependencies: ConditionDependencies): string => {
    switch (condition.type) {
        case ConditionType.MinRank:
            const requiredRank = dependencies.ranks.find(r => r.id === condition.rankId);
            return `Achieve the rank of: ${requiredRank?.name || 'Unknown Rank'}`;

        case ConditionType.DayOfWeek:
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const activeDays = condition.days.map(d => dayNames[d]).join(', ');
            return `Visit on: ${activeDays}`;

        case ConditionType.DateRange:
            const start = new Date(condition.start + 'T00:00:00').toLocaleDateString();
            const end = new Date(condition.end + 'T00:00:00').toLocaleDateString();
            return `Visit between ${start} and ${end}`;

        case ConditionType.TimeOfDay:
             const formatTime = (time: string) => new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
             return `Visit between ${formatTime(condition.start)} and ${formatTime(condition.end)}`;

        case ConditionType.QuestCompleted:
            const quest = dependencies.quests.find(q => q.id === condition.questId);
            return `Complete quest: "${quest?.title || 'Unknown Quest'}"`;
        
        case ConditionType.QuestGroupCompleted:
            const group = dependencies.questGroups.find(g => g.id === condition.questGroupId);
            return `Complete all quests in group: "${group?.name || 'Unknown Group'}"`;

        case ConditionType.TrophyAwarded:
            const trophy = dependencies.trophies.find(t => t.id === condition.trophyId);
            return `Earn trophy: "${trophy?.name || 'Unknown Trophy'}"`;

        case ConditionType.UserHasItem:
            const hasAsset = dependencies.gameAssets.find(a => a.id === condition.assetId);
            return `Own item: "${hasAsset?.name || 'Unknown Item'}"`;

        case ConditionType.UserDoesNotHaveItem:
            const doesNotHaveAsset = dependencies.gameAssets.find(a => a.id === condition.assetId);
            return `Do not own item: "${doesNotHaveAsset?.name || 'Unknown Item'}"`;
        
        case ConditionType.UserIsMemberOfGuild:
            const guild = dependencies.guilds.find(g => g.id === condition.guildId);
            return `Be a member of guild: "${guild?.name || 'Unknown Guild'}"`;

        case ConditionType.UserHasRole:
            return `Have the role: "${condition.role}"`;

        default:
            return 'Unknown condition';
    }
};