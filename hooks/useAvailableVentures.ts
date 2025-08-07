import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { useUIState } from '../context/UIStateContext';
import { QuestType } from '../types';
import { isQuestAvailableForUser } from '../utils/quests';
import { useAuthState } from '../context/AuthContext';

export const useAvailableVentures = () => {
    const { scheduledEvents, quests, questCompletions } = useAppState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();

    const top10AvailableVentures = useMemo(() => {
        if (!currentUser) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        const userCompletionsForMode = questCompletions.filter(c => c.userId === currentUser.id && c.guildId === currentGuildId);

        const availableVentures = quests.filter(q => 
            q.isActive &&
            q.type === QuestType.Venture &&
            q.guildId === currentGuildId &&
            (q.assignedUserIds.length === 0 || q.assignedUserIds.includes(currentUser.id)) &&
            isQuestAvailableForUser(q, userCompletionsForMode, new Date(), scheduledEvents, appMode)
        );

        availableVentures.sort((a, b) => {
            const aHasDate = !!a.lateDateTime;
            const bHasDate = !!b.lateDateTime;
            if (aHasDate && !bHasDate) return -1;
            if (!aHasDate && bHasDate) return 1;
            if (aHasDate && bHasDate) {
                const dateA = new Date(a.lateDateTime!).getTime();
                const dateB = new Date(b.lateDateTime!).getTime();
                if (dateA !== dateB) return dateA - dateB;
            }
            // Fallback to ID sort (proxy for creation date)
            return a.id.localeCompare(b.id);
        });

        return availableVentures.slice(0, 10);
    }, [quests, currentUser, appMode, questCompletions, scheduledEvents]);

    return top10AvailableVentures;
}