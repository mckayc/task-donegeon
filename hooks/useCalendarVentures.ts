import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { useUIState } from '../context/UIStateContext';
import { Quest, QuestType } from '../types';
import { isQuestAvailableForUser, toYMD } from '../utils/quests';
import { useAuthState } from '../context/AuthContext';
import { useQuestState } from '../context/QuestContext';

export const useCalendarVentures = (date: Date) => {
    const { scheduledEvents } = useAppState();
    const { quests, questCompletions } = useQuestState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const dateYMD = useMemo(() => toYMD(date), [date]);

    return useMemo(() => {
        if (!currentUser || !date) return [];

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const userCompletionsForMode = questCompletions.filter(c => c.userId === currentUser.id && c.guildId === currentGuildId);

        const venturesToShow = quests.filter(q => {
            if (q.type !== QuestType.Venture || !q.isActive || q.guildId !== currentGuildId) return false;
            if (q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) return false;

            const isScheduled = q.lateDateTime && toYMD(new Date(q.lateDateTime)) === dateYMD;
            const isTodo = q.todoUserIds?.includes(currentUser.id);
            const isRequired = !q.isOptional;

            // A venture is a candidate if it's scheduled for the day, or it is a To-Do or required venture.
            const isCandidate = isScheduled || isTodo || isRequired;
            
            if (!isCandidate) return false;

            // Finally, check if it's actually available to be completed.
            return isQuestAvailableForUser(q, userCompletionsForMode, date, scheduledEvents, appMode);
        });

        // Return unique list
        return Array.from(new Set(venturesToShow.map(q => q.id))).map(id => venturesToShow.find(q => q.id === id)!);

    }, [quests, currentUser, questCompletions, appMode, date, dateYMD, scheduledEvents]);
};