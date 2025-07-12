




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
  // If a quest has a hard incomplete deadline, it's unavailable after that time.
  if (quest.type === QuestType.Venture && quest.incompleteDateTime && today > new Date(quest.incompleteDateTime)) {
    return false;
  }
  
  if (quest.type === QuestType.Duty && quest.incompleteTime) {
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

  const questUserCompletions = userCompletions.filter(
    (c) => c.questId === quest.id && c.status === QuestCompletionStatus.Approved
  );
  
  const todayYMD = toYMD(today);

  switch (quest.availabilityType) {
    case QuestAvailability.Daily:
      // Available if not completed today.
      return !questUserCompletions.some((c) => c.completedAt === todayYMD);

    case QuestAvailability.Weekly: {
      // Not available if it's not the right day of the week.
      if (!quest.weeklyRecurrenceDays.includes(today.getDay())) {
        return false;
      }
      // Find the most recent completion for this quest.
      const mostRecentCompletion = questUserCompletions.sort(
        (a, b) => fromYMD(b.completedAt).getTime() - fromYMD(a.completedAt).getTime()
      )[0];
      // If never completed, it's available.
      if (!mostRecentCompletion) {
        return true;
      }
      
      // Determine the date of the last time this quest was scheduled.
      // 1. Find the most recent recurrence day that is on or before today's day of the week.
      const lastCycleDayOfWeek = quest.weeklyRecurrenceDays
        .filter(d => d <= today.getDay())
        .pop() ?? quest.weeklyRecurrenceDays[quest.weeklyRecurrenceDays.length - 1];
      // 2. Calculate how many days ago that was.
      const daysToSubtract = (today.getDay() - lastCycleDayOfWeek + 7) % 7;
      const lastCycleDate = new Date(today);
      lastCycleDate.setDate(today.getDate() - daysToSubtract);
      
      // The quest is available if the last completion was before the last scheduled date.
      return fromYMD(mostRecentCompletion.completedAt) < lastCycleDate;
    }
      
    case QuestAvailability.Monthly: {
      // Not available if it's not the right day of the month.
      if (!quest.monthlyRecurrenceDays.includes(today.getDate())) {
        return false;
      }
       // Find the most recent completion.
       const mostRecentCompletion = questUserCompletions.sort(
        (a, b) => fromYMD(b.completedAt).getTime() - fromYMD(a.completedAt).getTime()
      )[0];
       // If never completed, it's available.
      if (!mostRecentCompletion) {
        return true;
      }
      
      // Determine the date of the last time this quest was scheduled.
      // 1. Find the most recent recurrence day that is on or before today's date.
      const lastCycleDayOfMonth = quest.monthlyRecurrenceDays
          .filter(d => d <= today.getDate())
          .pop();

      let lastCycleDate: Date;
      if (lastCycleDayOfMonth !== undefined) {
          // If a recurrence day happened this month, use it.
          lastCycleDate = new Date(today.getFullYear(), today.getMonth(), lastCycleDayOfMonth);
      } else {
          // If all recurrence days are later in the month, find the last one from the previous month.
          const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          const lastRecurrenceDayInPrevMonth = quest.monthlyRecurrenceDays
              .slice()
              .sort((a,b) => b-a)[0]; // The latest date in the month is the last possible cycle.
          lastCycleDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), lastRecurrenceDayInPrevMonth);
      }
      // The quest is available if the last completion was before the last scheduled date.
      return fromYMD(mostRecentCompletion.completedAt) < lastCycleDate;
    }
      
    case QuestAvailability.Frequency:
      // Available if the number of completions is less than the allowed count.
      return questUserCompletions.length < (quest.availabilityCount || 1);

    case QuestAvailability.Unlimited:
        // Available if it has never been completed.
        return questUserCompletions.length === 0;

    default:
      return true;
  }
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
  
  const isPendingOnDate = userCompletionsForQuest.some(c => c.status === QuestCompletionStatus.Pending && c.completedAt === dateYMD);
  if (isPendingOnDate) {
    return { status: 'PENDING', buttonText: 'Pending Approval', isActionDisabled: true };
  }

  const isApprovedOnDate = userCompletionsForQuest.some(c => c.status === QuestCompletionStatus.Approved && c.completedAt === dateYMD);
  if (isApprovedOnDate) {
    return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
  }

  // Handle general completion for non-daily quests
  if (quest.availabilityType !== QuestAvailability.Daily) {
    const isApproved = userCompletionsForQuest.some(c => c.status === QuestCompletionStatus.Approved);
    if (isApproved && quest.availabilityType !== QuestAvailability.Frequency) {
        return { status: 'COMPLETED', buttonText: 'Completed', isActionDisabled: true };
    }
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