
import { Quest, QuestCompletion, QuestCompletionStatus, User, QuestType, ScheduledEvent, AppMode, QuestKind, ConditionSet } from '../types';
import { isQuestScheduledForDay } from './conditions';

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
 * Checks if a vacation event is active for a given scope on a specific date.
 */
export const isVacationActiveOnDate = (date: Date, scheduledEvents: ScheduledEvent[], guildId?: string): boolean => {
    const dateKey = toYMD(date);
    return scheduledEvents.some(event => {
        if (event.eventType !== 'Vacation') return false;
        // Scope match: event is global (no guildId) or matches the current guildId.
        const scopeMatch = !event.guildId || event.guildId === guildId;
        if (!scopeMatch) return false;
        // Date match
        return dateKey >= event.startDate && dateKey <= event.endDate;
    });
};


/**
 * Checks if a quest is currently available for completion based on its recurrence rules
 * and the user's completion history. Now accounts for vacation periods.
 */
export const isQuestAvailableForUser = (
  quest: Quest,
  userCompletions: QuestCompletion[],
  today: Date,
  scheduledEvents: ScheduledEvent[],
  appMode: AppMode
): boolean => {
  const questUserCompletions = userCompletions.filter(
    (c) => c.questId === quest.id
  );

  const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
  const onVacation = isVacationActiveOnDate(today, scheduledEvents, guildId);

  // Venture-specific logic
  if (quest.type === QuestType.Venture) {
    const approvedOrPending = questUserCompletions.filter(c => c.status === QuestCompletionStatus.Approved || c.status === QuestCompletionStatus.Pending);
    // 1. Check total completions limit. A limit of 0 means infinite.
    const totalLimit = quest.totalCompletionsLimit;
    if (totalLimit && totalLimit > 0) {
      if (approvedOrPending.length >= totalLimit) {
        return false; // Total limit reached
      }
    }

    // 2. Check daily completions limit. A limit of 0 means infinite.
    const dailyLimit = quest.dailyCompletionsLimit;
    if (dailyLimit && dailyLimit > 0) {
      const todayYMD = toYMD(today);
      const todayCompletions = approvedOrPending.filter(c => toYMD(new Date(c.completedAt)) === todayYMD);
      if (todayCompletions.length >= dailyLimit) {
        return false; // Daily limit for today has been reached
      }
    }
      
    // 3. Check deadlines
    if (!onVacation && quest.endDateTime && today > new Date(quest.endDateTime)) {
      return false; // Past the final deadline
    }

    return true;
  }

  // Journey-specific logic
    if (quest.type === QuestType.Journey) {
        if (!onVacation && quest.endDateTime && today > new Date(quest.endDateTime)) {
            return false; // Past final deadline
        }
        
        const totalCheckpoints = quest.checkpoints?.length || 0;
        if (totalCheckpoints === 0) return false;

        const completionsForQuest = userCompletions.filter(c => c.questId === quest.id);
        const approvedCount = completionsForQuest.filter(c => c.status === QuestCompletionStatus.Approved).length;
        const hasPending = completionsForQuest.some(c => c.status === QuestCompletionStatus.Pending);
        
        // Available for action if not all approved and nothing is pending
        return approvedCount < totalCheckpoints && !hasPending;
    }
  
  // Duty-specific logic
  if (quest.type === QuestType.Duty) {
    const approvedOrPending = questUserCompletions.filter(c => c.status === QuestCompletionStatus.Approved || c.status === QuestCompletionStatus.Pending);
    // Prevent completing duties for a future date
    if (toYMD(today) > toYMD(new Date())) {
        return false;
    }
      
    if (!onVacation && quest.endTime) {
      if (isQuestScheduledForDay(quest, today)) {
          const [hours, minutes] = quest.endTime.split(':').map(Number);
          const deadlineToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
          if (today > deadlineToday) {
              return false;
          }
      }
    }
    
    const todayYMD = toYMD(today);

    // For all recurring duties, we check if it was completed today.
    if (isQuestScheduledForDay(quest, today)) {
        return !approvedOrPending.some((c) => toYMD(new Date(c.completedAt)) === todayYMD);
    }
    
    return false; // Not scheduled for today
  }

  return true; // Should not be reached
};

/**
 * Generates a multi-part sort key for a quest to determine its priority in a list.
 */
const getQuestSortKey = (quest: Quest, user: User, date: Date, allCompletions: QuestCompletion[], scheduledEvents: ScheduledEvent[]): (string | number)[] => {
    const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
    const userCompletionsForQuest = allCompletions.filter(c => c.questId === quest.id && c.userId === user.id);
    
    // Key 1: In-Progress Journey (0 = In-progress, 1 = Not)
    let inProgressJourneyPriority = 1;
    if (quest.type === QuestType.Journey) {
        const approvedCheckpoints = userCompletionsForQuest.filter(c => c.status === QuestCompletionStatus.Approved).length;
        const totalCheckpoints = quest.checkpoints?.length || 0;
        if (approvedCheckpoints > 0 && totalCheckpoints > 0 && approvedCheckpoints < totalCheckpoints) {
            inProgressJourneyPriority = 0; // Highest priority for in-progress Journeys
        }
    }
    
    // Key 2: Availability (0 = Available, 1 = Not Available)
    const isAvailable = isQuestAvailableForUser(quest, userCompletionsForQuest, date, scheduledEvents, questAppMode);
    const hasPendingCheckpoint = quest.type === QuestType.Journey && userCompletionsForQuest.some(c => c.status === 'Pending');
    const isAvailableForSorting = isAvailable || hasPendingCheckpoint;
    const availabilityPriority = isAvailableForSorting ? 0 : 1;

    // Key 3: Urgency (0 = Urgent, 1 = Future, 2 = Not Time-Sensitive)
    let urgencyPriority = 2;
    const todayYMD = toYMD(date);
    if ((quest.type === QuestType.Venture || quest.type === QuestType.Journey) && quest.endDateTime) {
        const dueDate = new Date(quest.endDateTime);
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        if (dueDate < todayStart || toYMD(dueDate) === todayYMD) {
            urgencyPriority = 0;
        } else {
            urgencyPriority = 1;
        }
    } else if (quest.type === QuestType.Duty && quest.endTime && isQuestScheduledForDay(quest, date)) {
        const [hours, minutes] = quest.endTime.split(':').map(Number);
        const deadlineToday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        urgencyPriority = (date > deadlineToday) ? 0 : 0;
    }
    
    // Key 4: To-Do Status (0 = Is To-Do, 1 = Not To-Do)
    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
    const isTodoPriority = isTodo ? 0 : 1;
    
    // Key 5: Quest Type (0 = Duty, 1 = Venture, 2 = Journey)
    const typePriority = quest.type === QuestType.Duty ? 0 : quest.type === QuestType.Venture ? 1 : 2;
    
    // Key 6: Time Sorting (earlier times/dates get a smaller number)
    let timePriority = Number.MAX_SAFE_INTEGER;
    if ((quest.type === QuestType.Venture || quest.type === QuestType.Journey) && quest.endDateTime) {
        timePriority = new Date(quest.endDateTime).getTime();
    } else if (quest.type === QuestType.Duty && quest.endTime) {
        const [hours, minutes] = quest.endTime.split(':').map(Number);
        timePriority = hours * 60 + minutes;
    }

    // Key 7: Title (alphabetical tie-breaker)
    const title = quest.title.toLowerCase();

    return [inProgressJourneyPriority, availabilityPriority, urgencyPriority, isTodoPriority, typePriority, timePriority, title];
};


/**
 * A comparator function for sorting quests based on a standardized priority order.
 */
export const questSorter = (user: User, allCompletions: QuestCompletion[], scheduledEvents: ScheduledEvent[], date: Date = new Date()) => (a: Quest, b: Quest): number => {
    const keyA = getQuestSortKey(a, user, date, allCompletions, scheduledEvents);
    const keyB = getQuestSortKey(b, user, date, allCompletions, scheduledEvents);

    for (let i = 0; i < keyA.length; i++) {
        const valA = keyA[i];
        const valB = keyB[i];
        if (valA < valB) return -1;
        if (valA > valB) return 1;
    }
    return 0;
};


export const getAvailabilityText = (quest: Quest, completionsCount: number): string => {
    // This function provides a general status text. Specific user completion counts for limits are checked elsewhere.
    if (quest.kind === QuestKind.GuildCollaborative) {
        return `Contributions: ${quest.contributions?.length || 0} / ${quest.completionGoal || 'many'}`;
    }
    if (quest.totalCompletionsLimit && quest.totalCompletionsLimit > 0) {
        return `Completed ${completionsCount} / ${quest.totalCompletionsLimit} times total`;
    }
    if (quest.dailyCompletionsLimit) {
        if (quest.dailyCompletionsLimit === 1) return 'Completable Daily';
        return `Completable ${quest.dailyCompletionsLimit} times daily`;
    }
    return quest.kind === QuestKind.Redemption ? 'Redemption Opportunity' : 'Available';
};

export const formatTimeRemaining = (deadline: Date, now: Date): string => {
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return '0m';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || (days === 0 && hours === 0)) result += `${minutes}m`;

    return result.trim();
};

export const getDueDateString = (quest: Quest): string | null => {
    if (quest.type === QuestType.Venture && quest.startDateTime) {
        return `Due: ${new Date(quest.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
    if (quest.type === QuestType.Duty && quest.startTime) {
        const [hours, minutes] = quest.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return `Due at: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return null;
};