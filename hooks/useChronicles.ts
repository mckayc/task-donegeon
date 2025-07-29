import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { ChronicleEvent, AdminAdjustmentType, QuestCompletionStatus, PurchaseRequestStatus, QuestType, Role } from '../frontendTypes';
import { toYMD } from '../utils/quests';

export const useChronicles = ({ startDate, endDate }: { startDate: Date; endDate: Date; }) => {
    const { 
        currentUser, appMode, users, quests, rewardTypes,
        questCompletions, purchaseRequests, userTrophies, trophies, 
        adminAdjustments, systemLogs 
    } = useAppState();

    const chroniclesByDate = useMemo(() => {
        const eventsByDate = new Map<string, ChronicleEvent[]>();
        if (!currentUser) return eventsByDate;

        const startYMD = toYMD(startDate);
        const endYMD = toYMD(endDate);
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        const getUserName = (userId: string) => users.find(u => u.id === userId)?.gameName || 'Unknown User';
        const getTrophyName = (trophyId: string) => trophies.find(t => t.id === trophyId)?.name || `Unknown Award`;

        // Process Quest Completions
        questCompletions.forEach(c => {
            const dateKey = toYMD(new Date(c.completedAt));
            if (dateKey >= startYMD && dateKey <= endYMD && c.userId === currentUser.id && c.guildId === currentGuildId) {
                const quest = quests.find(q => q.id === c.questId);
                const event: ChronicleEvent = {
                    id: c.id,
                    date: c.completedAt,
                    type: 'Quest',
                    title: quest?.title || 'Unknown Quest',
                    note: c.note,
                    status: c.status,
                    icon: quest?.icon || '📜',
                    color: c.status === QuestCompletionStatus.Approved ? '#22c55e' : c.status === QuestCompletionStatus.Pending ? '#eab308' : '#ef4444',
                    userId: c.userId,
                    questType: quest?.type,
                };
                if (!eventsByDate.has(dateKey)) eventsByDate.set(dateKey, []);
                eventsByDate.get(dateKey)!.push(event);
            }
        });

        // Add other event types here (Purchases, Trophies, etc.)
        // For simplicity, we'll focus on quests for now in the calendar chronicle view.

        // Sort events within each day
        for (const events of eventsByDate.values()) {
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        
        return eventsByDate;

    }, [currentUser, appMode, startDate, endDate, questCompletions, quests]);

    return chroniclesByDate;
};