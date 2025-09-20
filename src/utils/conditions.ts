import { User, QuestCompletionStatus, Condition, ConditionType, ConditionSet, ConditionSetLogic, Rank, QuestCompletion, Quest, QuestGroup, Trophy, UserTrophy, GameAsset, Guild, Role, QuestType, AppMode } from '../types';

/**
 * Consistently formats a Date object into a 'YYYY-MM-DD' string, ignoring timezone.
 */
export const toYMD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Consistently parses a 'YYYY-MM-DD' string into a local Date object.
 * This avoids timezone issues where `new Date('YYYY-MM-DD')` might be interpreted as UTC.
 */
export const fromYMD = (ymd: string): Date => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
};


/**
 * Checks if a quest is scheduled to appear on a specific day, based on its type and recurrence rules.
 * This does not check for completion status, only if it's supposed to be on the calendar for that day.
 */
export const isQuestScheduledForDay = (quest: Quest, day: Date): boolean => {
    if (quest.type === QuestType.Journey || quest.type === QuestType.Venture) {
        // A Venture/Journey is "scheduled" for its due date range.
        if (!quest.startDateTime) return false;
        const startDate = toYMD(new Date(quest.startDateTime));
        const endDate = quest.endDateTime ? toYMD(new Date(quest.endDateTime)) : startDate;
        const checkDate = toYMD(day);
        return checkDate >= startDate && checkDate <= endDate;
    }
    // It's a Duty
    if (!quest.rrule) return false;

    const rruleParts = quest.rrule.split(';');
    const freq = rruleParts.find(p => p.startsWith('FREQ='))?.split('=')[1];

    switch (freq) {
        case 'DAILY': return true;
        case 'WEEKLY': {
            const byday = rruleParts.find(p => p.startsWith('BYDAY='))?.split('=')[1];
            if (!byday) return true; 
            const weekdays = byday.split(',').map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(d));
            return weekdays.includes(day.getDay());
        }
        case 'MONTHLY': {
            const bymonthday = rruleParts.find(p => p.startsWith('BYMONTHDAY='))?.split('=')[1];
            if (!bymonthday) return false;
            const daysOfMonth = bymonthday.split(',').map(Number);
            return daysOfMonth.includes(day.getDate());
        }
        default: return false;
    }
}

/**
 * Checks if a quest should be visible to a user in the current app mode.
 * Verifies active status, guild scope, and user assignment, strictly separating personal and guild contexts.
 */
export const isQuestVisibleToUserInMode = (
  quest: Quest,
  userId: string,
  appMode: AppMode
): boolean => {
  if (!quest.isActive) return false;

  const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

  // Scope check first
  if (quest.guildId) { // Guild quest
    if (quest.guildId !== currentGuildId) return false;
  } else { // Personal quest
    if (appMode.mode !== 'personal') return false;
  }
  
  // Assignment check - An empty list means it's not assigned to anyone yet.
  if (quest.assignedUserIds.length === 0) {
    return false;
  }
  
  return quest.assignedUserIds.includes(userId);
};

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
    appMode: AppMode;
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

            // Filter for quests that are actually requirements *right now*.
            const relevantRequirements = questsInGroup.filter(q => {
                if (!isQuestVisibleToUserInMode(q, user.id, dependencies.appMode)) {
                    return false;
                }
                if (q.type === QuestType.Duty) {
                    if (!isQuestScheduledForDay(q, now)) return false;
                    if (q.endTime) {
                        const [h, m] = q.endTime.split(':').map(Number);
                        const incompleteTime = new Date(now);
                        incompleteTime.setHours(h, m, 0, 0);
                        if (now > incompleteTime) return false;
                    }
                } else { // Venture or Journey
                    if (q.endDateTime && now > new Date(q.endDateTime)) return false;
                }
                return true;
            });

            const requiredGroupStatuses = condition.requiredStatuses?.length ? condition.requiredStatuses : [QuestCompletionStatus.Approved];

            return relevantRequirements.every(q =>
                dependencies.questCompletions.some(c => {
                    if (c.userId !== user.id || c.questId !== q.id || !requiredGroupStatuses.includes(c.status)) {
                        return false;
                    }
                    if (q.type === QuestType.Duty) {
                        return toYMD(new Date(c.completedAt)) === todayYMD;
                    }
                    return true;
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
        if (questId && set.exemptQuestGroupIds && set.exemptQuestGroupIds.length > 0) {
            const quest = dependencies.quests.find(q => q.id === questId);
            if (quest && quest.groupIds?.some(gid => set.exemptQuestGroupIds!.includes(gid))) {
                continue; // This quest is in an exempted group, so skip this global condition set.
            }
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

export interface QuestLockStatus {
    isLocked: boolean;
    reason?: 'CONDITIONAL';
    message?: string;
}

export const getQuestLockStatus = (
    quest: Quest, 
    user: User, 
    dependencies: ConditionDependencies & { allConditionSets: ConditionSet[] }
): QuestLockStatus => {
    // 1. Check global conditions first.
    const globalCheck = checkGlobalConditionsMet(user, dependencies, { questId: quest.id });
    if (!globalCheck.allMet) {
        return {
            isLocked: true,
            reason: 'CONDITIONAL',
            message: `Globally locked by: ${globalCheck.failingSetName || 'a global rule'}.`
        };
    }

    // 2. If global conditions pass, check quest-specific conditions.
    if (quest.conditionSetIds && quest.conditionSetIds.length > 0) {
        const { allMet, failingSetName } = checkAllConditionSetsMet(quest.conditionSetIds, user, dependencies, quest.id);
        if (!allMet) {
            return {
                isLocked: true,
                reason: 'CONDITIONAL',
                message: `You do not meet the requirements for: ${failingSetName || quest.title}`
            };
        }
    }
    return { isLocked: false };
};