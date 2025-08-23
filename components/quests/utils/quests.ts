
import { Quest, QuestCompletion, QuestCompletionStatus, User, QuestType, ScheduledEvent, AppMode } from '../../../types';

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

  // If quest is a guild quest, it's only visible in that guild's view.
  if (quest.guildId) {
    if (quest.guildId !== currentGuildId) {
      return false;
    }
    // Check assignment within the guild
    if (quest.assignedUserIds.length > 0 && !quest.assignedUserIds.includes(userId)) {
      return false;
    }
    return true;
  } 
  // If quest is a personal quest, it's only visible in personal view.
  else {
    if (appMode.mode !== 'personal') {
      return false;
    }
    // Check assignment for personal quests
    if (quest.assignedUserIds.length > 0 && !quest.assignedUserIds.includes(userId)) {
      return false;
    }
    return true;
  }
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
    (c) => c.questId === quest.id && (c.status === QuestCompletionStatus.Approved || c.status === QuestCompletionStatus.Pending)
  );

  const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
  const onVacation = isVacationActiveOnDate(today, scheduledEvents, guildId);

  // Venture-specific logic
  if (quest.type === QuestType.Venture) {
    // 1. Check total completions limit. A limit of 0 means infinite.
    const totalLimit = quest.totalCompletionsLimit;
    if (totalLimit && totalLimit > 0) {
      if (questUserCompletions.length >= totalLimit) {
        return false; // Total limit reached
      }
    }

    // 2. Check daily completions limit. A limit of 0 means infinite.
    const dailyLimit = quest.dailyCompletionsLimit;
    if (dailyLimit && dailyLimit > 0) {
      const todayYMD = toYMD(today);
      const todayCompletions = questUserCompletions.filter(c => toYMD(new Date(c.completedAt)) === todayYMD);
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
    if (totalCheckpoints === 0) return false; // Not a valid journey
    
    // A journey is available as long as not all checkpoints are completed.
    const completedCheckpoints = questUserCompletions.filter(c => c.status !== QuestCompletionStatus.Rejected).length;
    return completedCheckpoints < totalCheckpoints;
  }
  
  // Duty-specific logic
  if (quest.type === QuestType.Duty) {
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
        return !questUserCompletions.some((c) => toYMD(new Date(c.completedAt)) === todayYMD);
    }
    
    return false; // Not scheduled for today
  }

  return true; // Should not be reached
};

/**
 * Generates a multi-part sort key for a quest to determine its priority in a list.
 * Lower numbers in each part of the key mean higher priority.
 */
const getQuestSortKey = (quest: Quest, user: User, date: Date, allCompletions: QuestCompletion[], scheduledEvents: ScheduledEvent[]): (string | number)[] => {
    const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
    const userCompletionsForQuest = allCompletions.filter(c => c.questId === quest.id && c.userId === user.id);
    
    // Key 1: Availability
    const isAvailable = isQuestAvailableForUser(quest, userCompletionsForQuest, date, scheduledEvents, questAppMode);
    const availabilityPriority = isAvailable ? 0 : 1;

    // Key 2: Urgency
    let urgencyPriority = 2; // Default: not urgent
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
        urgencyPriority = date > deadlineToday ? 0 : 0;
    }
    
    // Key 3: In-Progress Journey
    const completedCheckpoints = quest.type === QuestType.Journey ? Object.keys(quest.checkpointCompletionTimestamps?.[user.id] || {}).length : 0;
    const totalCheckpoints = quest.type === QuestType.Journey ? quest.checkpoints?.length || 0 : 0;
    const isJourneyInProgress = quest.type === QuestType.Journey && completedCheckpoints > 0 && completedCheckpoints < totalCheckpoints;
    const journeyInProgressPriority = isJourneyInProgress ? 0 : 1;

    // Key 4: To-Do Status
    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
    const isTodoPriority = isTodo ? 0 : 1;
    
    // Key 5: Quest Type
    const typePriority = quest.type === QuestType.Duty ? 0 : quest.type === QuestType.Venture ? 1 : 2;
    
    // Key 6: Time Sorting
    let timePriority = Number.MAX_SAFE_INTEGER;
    if ((quest.type === QuestType.Venture || quest.type === QuestType.Journey) && quest.endDateTime) {
        timePriority = new Date(quest.endDateTime).getTime();
    } else if (quest.type === QuestType.Duty && quest.endTime) {
        const [hours, minutes] = quest.endTime.split(':').map(Number);
        timePriority = hours * 60 + minutes;
    }

    // Key 7: Title
    const title = quest.title.toLowerCase();

    return [availabilityPriority, urgencyPriority, journeyInProgressPriority, isTodoPriority, typePriority, timePriority, title];
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


export interface QuestUserStatus {
  status: 'PENDING' | 'COMPLETED' | 'AVAILABLE' | 'CLAIMABLE' | 'RELEASEABLE' | 'FULLY_CLAIMED';
  buttonText: string;
  isActionDisabled: boolean;
}

/**
 * Gets the complete status of a quest for a specific user.
 */
export const getQuestUserStatus = (
  quest: Quest,
  user: User,
  allCompletions: QuestCompletion[],
  date: Date = new Date()
): QuestUserStatus => {
  const currentGuildId = quest.guildId;
  const dateYMD = toYMD(date);
  
  const userCompletionsForQuest = allCompletions.filter(c => 
    c.questId === quest.id && 
    c.userId === user.id && 
    c.guildId === currentGuildId
  );
  
  const isPendingOnDate = userCompletionsForQuest.some(c => c.status === QuestCompletionStatus.Pending && toYMD(new Date(c.completedAt)) === dateYMD);
  if (isPendingOnDate) {
    return { status: 'PENDING', buttonText: 'Pending Approval', isActionDisabled: true };
  }

  const isApprovedOnDate = userCompletionsForQuest.some(c => c.status === QuestCompletionStatus.Approved && toYMD(new Date(c.completedAt)) === dateYMD);
  if (quest.type === QuestType.Duty && isApprovedOnDate) {
    return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }
  
  const approvedCompletions = userCompletionsForQuest.filter(c => c.status === QuestCompletionStatus.Approved);
  if (quest.totalCompletionsLimit === 1 && approvedCompletions.length > 0) {
      return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }
  if (quest.totalCompletionsLimit && quest.totalCompletionsLimit > 0 && approvedCompletions.length >= quest.totalCompletionsLimit) {
     return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }


  const isClaimableVenture = quest.type === QuestType.Venture && quest.totalCompletionsLimit && quest.totalCompletionsLimit > 0;
  if (isClaimableVenture) {
    const isClaimedByCurrentUser = (quest.claimedByUserIds || []).includes(user.id);
    const isFullyClaimed = (quest.claimedByUserIds || []).length >= (quest.totalCompletionsLimit || 1);

    if (isClaimedByCurrentUser) {
      return { status: 'RELEASEABLE', buttonText: 'Complete', isActionDisabled: false };
    }
    if (isFullyClaimed) {
      return { status: 'FULLY_CLAIMED', buttonText: 'Fully Claimed', isActionDisabled: true };
    }
    return { status: 'CLAIMABLE', buttonText: 'Claim', isActionDisabled: false };
  }
  
  return { status: 'AVAILABLE', buttonText: 'Complete', isActionDisabled: false };
};
