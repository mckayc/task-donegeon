import { Quest, QuestCompletion, QuestAvailability, QuestCompletionStatus, AppMode, User, QuestType, ScheduledEvent } from '../types';

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
    if (quest.type === QuestType.Venture) {
        // A Venture is "scheduled" for its due date.
        return !!quest.lateDateTime && toYMD(new Date(quest.lateDateTime)) === toYMD(day);
    }
    // It's a Duty
    switch (quest.availabilityType) {
        case QuestAvailability.Daily: return true;
        case QuestAvailability.Weekly: return quest.weeklyRecurrenceDays.includes(day.getDay());
        case QuestAvailability.Monthly: return quest.monthlyRecurrenceDays.includes(day.getDate());
        default: return false;
    }
}

/**
 * Checks if a quest should be visible to a user in the current app mode.
 * Verifies active status, guild scope, and user assignment, strictly separating personal and guild contexts.
 * Also checks for quest chain prerequisites.
 */
export const isQuestVisibleToUserInMode = (
  quest: Quest,
  userId: string,
  appMode: AppMode,
  allQuests: Quest[],
  allCompletions: QuestCompletion[]
): boolean => {
  // Find prerequisite quest
  const prerequisiteQuest = allQuests.find(q => q.nextQuestId === quest.id);

  if (prerequisiteQuest) {
    // This quest is locked. Check if the user has completed the prerequisite.
    const hasCompletedPrerequisite = allCompletions.some(c =>
      c.questId === prerequisiteQuest.id &&
      c.userId === userId &&
      c.status === QuestCompletionStatus.Approved
    );
    if (!hasCompletedPrerequisite) {
      return false; // Prerequisite not met, quest is not visible.
    }
  }
  
  // If prerequisite is met or doesn't exist, proceed with original visibility checks.
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

  // Venture-specific logic for early completion and deadlines
  if (quest.type === QuestType.Venture) {
    if (!onVacation && quest.incompleteDateTime && today > new Date(quest.incompleteDateTime)) {
      return false; // Past the final deadline, and not on vacation
    }
    if (quest.availabilityType === QuestAvailability.Unlimited) {
      return questUserCompletions.length === 0;
    }
    if (quest.availabilityType === QuestAvailability.Frequency) {
      return questUserCompletions.length < (quest.availabilityCount || 1);
    }
    // If a venture has no specific availability, it's treated as unlimited.
    return questUserCompletions.length === 0;
  }
  
  // Duty-specific logic
  if (quest.type === QuestType.Duty) {
    if (!onVacation && quest.incompleteTime) {
      const isScheduledToday = isQuestScheduledForDay(quest, today);

      if (isScheduledToday) {
          const [hours, minutes] = quest.incompleteTime.split(':').map(Number);
          const incompleteDeadlineToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
          if (today > incompleteDeadlineToday) {
              return false;
          }
      }
    }
    
    const todayYMD = toYMD(today);

    switch (quest.availabilityType) {
      case QuestAvailability.Daily:
        // Available if not completed today.
        return !questUserCompletions.some((c) => toYMD(new Date(c.completedAt)) === todayYMD);

      case QuestAvailability.Weekly: {
        // Not available if it's not the right day of the week.
        if (!quest.weeklyRecurrenceDays.includes(today.getDay())) {
          return false;
        }
        // Available if not completed today.
        return !questUserCompletions.some((c) => toYMD(new Date(c.completedAt)) === todayYMD);
      }
        
      case QuestAvailability.Monthly: {
        // Not available if it's not the right day of the month.
        if (!quest.monthlyRecurrenceDays.includes(today.getDate())) {
          return false;
        }
        // Available if not completed today.
        return !questUserCompletions.some((c) => toYMD(new Date(c.completedAt)) === todayYMD);
      }
        
      default:
        return true;
    }
  }

  return true; // Should not be reached
};

/**
 * Generates a multi-part sort key for a quest to determine its priority in a list.
 * Lower numbers in each part of the key mean higher priority.
 *
 * The sorting priority is as follows:
 * 1.  **Availability:** Available quests always come before unavailable (completed/pending) ones.
 * 2.  **Urgency:** Quests that are past due or due today are most urgent. Quests due in the future are next.
 *     Quests with no deadline (like most Duties) are least urgent.
 * 3.  **Optional Status**: Required quests are prioritized over optional ones.
 * 4.  **Quest Type:** Recurring Duties are prioritized over one-time Ventures when other factors are equal.
 * 5.  **To-Do Status:** Ventures marked as "To-Do" by the user are prioritized within their group.
 * 6.  **Time/Date:** Quests with earlier due dates/times are sorted first.
 * 7.  **Title:** Alphabetical order is used as a final tie-breaker.
 */
const getQuestSortKey = (quest: Quest, user: User, date: Date, allCompletions: QuestCompletion[], scheduledEvents: ScheduledEvent[]): (string | number)[] => {
    const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
    const userCompletionsForQuest = allCompletions.filter(c => c.questId === quest.id && c.userId === user.id);
    
    const isAvailable = isQuestAvailableForUser(quest, userCompletionsForQuest, date, scheduledEvents, questAppMode);
    const availabilityPriority = isAvailable ? 0 : 1;

    let urgencyPriority = 2;
    const todayYMD = toYMD(date);
    if ((quest.type === QuestType.Venture && quest.lateDateTime) || (quest.type === QuestType.Duty && quest.lateTime && isQuestScheduledForDay(quest, date))) {
        const lateDateTime = quest.type === QuestType.Venture ? quest.lateDateTime : `${todayYMD}T${quest.lateTime}`;
        if(lateDateTime) {
            const dueDate = new Date(lateDateTime);
            const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            if (dueDate < todayStart || toYMD(dueDate) === todayYMD) {
                urgencyPriority = 0; // Past due or due today
            } else {
                urgencyPriority = 1; // Due in the future
            }
        }
    }
    
    const isOptionalPriority = quest.isOptional ? 1 : 0;
    
    const typePriority = quest.type === QuestType.Duty ? 0 : 1;
    
    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
    const isTodoPriority = isTodo ? 0 : 1;
    
    let timePriority = Number.MAX_SAFE_INTEGER;
    if (quest.type === QuestType.Venture && quest.lateDateTime) {
        timePriority = new Date(quest.lateDateTime).getTime();
    } else if (quest.type === QuestType.Duty && quest.lateTime) {
        const [hours, minutes] = quest.lateTime.split(':').map(Number);
        timePriority = hours * 60 + minutes;
    }

    const title = quest.title.toLowerCase();

    return [availabilityPriority, urgencyPriority, isOptionalPriority, typePriority, isTodoPriority, timePriority, title];
};


/**
 * A comparator function for sorting quests based on a standardized priority order.
 * @param user The current user, for To-Do list checking.
 * @param allCompletions All quest completions, to determine availability.
 * @param date The date context for sorting (e.g., today's date).
 * @returns A comparator function for Array.prototype.sort().
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
 * This consolidates all logic for button states and text.
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
  
  // Handle general completion for non-daily quests
  const approvedCompletions = userCompletionsForQuest.filter(c => c.status === QuestCompletionStatus.Approved);
  if (quest.availabilityType === QuestAvailability.Unlimited && approvedCompletions.length > 0) {
      return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }
  if (quest.availabilityType === QuestAvailability.Frequency && approvedCompletions.length >= (quest.availabilityCount || 1)) {
     return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }


  const isClaimableVenture = quest.type === QuestType.Venture && quest.availabilityType === QuestAvailability.Frequency;
  if (isClaimableVenture) {
    const isClaimedByCurrentUser = (quest.claimedByUserIds || []).includes(user.id);
    const isFullyClaimed = (quest.claimedByUserIds || []).length >= (quest.availabilityCount || 1);

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