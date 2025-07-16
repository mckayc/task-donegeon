import { Quest, QuestCompletion, QuestAvailability, QuestCompletionStatus, AppMode, User, QuestType } from '../types';

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
 */
export const isQuestScheduledForDay = (quest: Quest, day: Date): boolean => {
    if (quest.type === QuestType.Venture) {
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
 * Verifies active status, guild scope, and user assignment.
 */
export const isQuestVisibleToUserInMode = (
  quest: Quest,
  userId: string,
  appMode: AppMode
): boolean => {
  if (!quest.isActive) return false;

  const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
  if (quest.guildId !== currentGuildId) return false;

  if (quest.assignedUserIds.length > 0 && !quest.assignedUserIds.includes(userId)) {
    return false;
  }

  return true;
};

/**
 * Checks if a quest is currently available for completion based on its recurrence rules
 * and the user's completion history.
 */
export const isQuestAvailableForUser = (
  quest: Quest,
  userCompletions: QuestCompletion[],
  today: Date
): boolean => {
  const questUserCompletions = userCompletions.filter(
    (c) => c.questId === quest.id && c.status === QuestCompletionStatus.Approved
  );

  // Venture-specific logic for early completion and deadlines
  if (quest.type === QuestType.Venture) {
    if (quest.incompleteDateTime && today > new Date(quest.incompleteDateTime)) {
      return false; // Past the final deadline
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
    if (quest.incompleteTime) {
      const isScheduledToday =
          quest.availabilityType === QuestAvailability.Daily ||
          (quest.availabilityType === QuestAvailability.Weekly && quest.weeklyRecurrenceDays.includes(today.getDay())) ||
          (quest.availabilityType === QuestAvailability.Monthly && quest.monthlyRecurrenceDays.includes(today.getDate()));

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
 * Generates a sort key for a quest based on priority rules.
 * Lower numbers are higher priority.
 * Sorts by:
 * 1. Type (Duty > Venture)
 * 2. Time-based priority (Due soon > To-Do > other)
 * 3. Title (alphabetical)
 */
const getQuestSortKey = (quest: Quest, user: User, date: Date = new Date()): [number, number, string] => {
    // Priority 1: Type (Duty = 0, Venture = 1)
    const typePriority = quest.type === QuestType.Duty ? 0 : 1;

    let timePriority = 9999; // Default low priority

    if (quest.type === QuestType.Duty) {
        if (quest.lateTime) {
            const [hours, minutes] = quest.lateTime.split(':').map(Number);
            timePriority = hours * 60 + minutes;
        } else {
            timePriority = 10000; // No due time, sort after ones with time
        }
    } else { // Venture
        const isDueToday = quest.lateDateTime && toYMD(new Date(quest.lateDateTime)) === toYMD(date);
        const isTodo = quest.todoUserIds?.includes(user.id);

        if (isDueToday) {
            timePriority = 0;
        } else if (isTodo) {
            timePriority = 1;
        } else {
            timePriority = 2; // Other ventures
        }
    }

    return [typePriority, timePriority, quest.title.toLowerCase()];
};

/**
 * A comparator function for sorting quests based on a standardized priority order.
 * @param user The current user, for To-Do list checking.
 * @param date The date context for sorting (e.g., today's date).
 * @returns A comparator function for Array.prototype.sort().
 */
export const questSorter = (user: User, date: Date = new Date()) => (a: Quest, b: Quest) => {
    const keyA = getQuestSortKey(a, user, date);
    const keyB = getQuestSortKey(b, user, date);

    for (let i = 0; i < keyA.length; i++) {
        if (keyA[i] < keyB[i]) return -1;
        if (keyA[i] > keyB[i]) return 1;
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