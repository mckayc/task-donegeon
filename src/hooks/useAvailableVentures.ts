
import { useMemo } from 'react';
import { useUIState } from '../context/UIContext';
import { QuestType } from '../types';
import { isQuestAvailableForUser, getQuestLockStatus } from '../utils/quests';
import { useAuthState } from '../context/AuthContext';
import { useQuestsState } from '../context/QuestsContext';
import { useSystemState } from '../context/SystemContext';
import { useProgressionState } from '../context/ProgressionContext';
import { useEconomyState } from '../context/EconomyContext';
import { useCommunityState } from '../context/CommunityContext';

export const useAvailableVentures = () => {
    const systemState = useSystemState();
    const { scheduledEvents } = systemState;
    const { quests, questGroups, questCompletions } = useQuestsState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const progressionState = useProgressionState();
    const economyState = useEconomyState();
    const communityState = useCommunityState();

    const conditionDependencies = useMemo(() => ({
        ...progressionState, ...economyState, ...communityState, quests, questGroups, questCompletions, allConditionSets: systemState.settings.conditionSets
    }), [progressionState, economyState, communityState, quests, questGroups, questCompletions, systemState.settings.conditionSets]);

    const top10AvailableVentures = useMemo(() => {
        if (!currentUser) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        const userCompletionsForMode = questCompletions.filter(c => c.userId === currentUser.id && c.guildId === currentGuildId);

        const availableVentures = quests.filter(q => {
            if (q.type !== QuestType.Venture || !q.isActive || q.guildId !== currentGuildId) return false;
            if (q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) return false;
            
            const lockStatus = getQuestLockStatus(q, currentUser, conditionDependencies);
            if (lockStatus.isLocked) return false;
            
            return isQuestAvailableForUser(q, userCompletionsForMode, new Date(), scheduledEvents, appMode);
        });

        availableVentures.sort((a, b) => {
            const aHasDate = !!a.startDateTime;
            const bHasDate = !!b.startDateTime;
            if (aHasDate && !bHasDate) return -1;
            if (!aHasDate && bHasDate) return 1;
            if (aHasDate && bHasDate) {
                const dateA = new Date(a.startDateTime!).getTime();
                const dateB = new Date(b.startDateTime!).getTime();
                if (dateA !== dateB) return dateA - dateB;
            }
            // Fallback to ID sort (proxy for creation date)
            return a.id.localeCompare(b.id);
        });

        return availableVentures.slice(0, 10);
    }, [quests, currentUser, appMode, questCompletions, scheduledEvents, conditionDependencies]);

    return top10AvailableVentures;
}
