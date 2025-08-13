import { useMemo } from 'react';
import {
  ChronicleEvent,
  Quest,
  QuestType,
  Trophy,
  AdminAdjustmentType,
} from '../types';
import { useAppState } from '../context/AppContext';
import { useUIState } from '../context/UIStateContext';
import { toYMD } from '../utils/quests';
import { useAuthState } from '../context/AuthContext';
import { useEconomyState } from '../context/EconomyContext';
import { useQuestState } from '../context/QuestContext';

interface UseChroniclesProps {
  startDate: Date;
  endDate: Date;
}

export const useChronicles = ({ startDate, endDate }: UseChroniclesProps): Map<string, ChronicleEvent[]> => {
  const {
    userTrophies,
    trophies,
    adminAdjustments,
    systemNotifications,
  } = useAppState();
  const { quests, questCompletions } = useQuestState();
  const { purchaseRequests } = useEconomyState();
  const { currentUser, users } = useAuthState();
  const { appMode } = useUIState();
  
  const allChronicleEvents = useMemo(() => {
    if (!currentUser) return [];

    const allEvents: ChronicleEvent[] = [];
    const userMap = new Map(users.map(u => [u.id, u.gameName]));
    const questMap = new Map(quests.map(q => [q.id, q]));
    const trophyMap = new Map(trophies.map(t => [t.id, t]));

    // 1. Quest Completions
    questCompletions.forEach(c => {
        const quest = questMap.get(c.questId) as Quest | undefined;
        allEvents.push({
          id: c.id, date: c.completedAt, type: 'Quest',
          title: `Completed "${quest?.title || 'Unknown Quest'}"`,
          status: c.status, note: c.note, icon: quest?.icon || '📜',
          color: quest?.type === QuestType.Duty ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
          userId: c.userId,
          questType: quest?.type, guildId: c.guildId
        });
    });

    // 2. Purchase Requests
    purchaseRequests.forEach(p => {
        allEvents.push({
            id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
            title: `Purchased "${p.assetDetails.name}"`,
            status: p.status, icon: '💰', color: 'hsl(var(--primary))', guildId: p.guildId
        });
    });

    // 3. User Trophies
    userTrophies.forEach(ut => {
        const trophy = trophyMap.get(ut.trophyId) as Trophy | undefined;
        allEvents.push({
            id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId,
            title: `Earned "${trophy?.name || 'Unknown Trophy'}"`,
            status: "Awarded", note: trophy?.description, icon: trophy?.icon || '🏆',
            color: 'hsl(var(--accent))', guildId: ut.guildId
        });
    });
    
    // 4. Admin Adjustments
    adminAdjustments.forEach(adj => {
        allEvents.push({
            id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId,
            title: `Adjustment by ${userMap.get(adj.adjusterId) || 'Admin'}`,
            status: adj.type, note: adj.reason, icon: '🛠️',
            color: adj.type === AdminAdjustmentType.Reward ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            guildId: adj.guildId
        });
    });
    
    // 5. Announcements
    systemNotifications.forEach(n => {
        if(n.type === 'Announcement') {
             allEvents.push({
                id: n.id, date: n.timestamp, type: 'Announcement',
                title: `Announcement from ${userMap.get(n.senderId || '') || 'System'}`,
                status: 'Announcement', note: n.message, icon: '📢', color: 'hsl(var(--accent-light))',
                guildId: n.guildId, recipientUserIds: n.recipientUserIds
            });
        }
    });

    return allEvents;
  }, [
    users, quests, questCompletions, purchaseRequests, userTrophies, trophies,
    adminAdjustments, systemNotifications
  ]);

  return useMemo(() => {
    const chroniclesByDate = new Map<string, ChronicleEvent[]>();
    if (!currentUser) return chroniclesByDate;

    const startYMD = toYMD(startDate);
    const endYMD = toYMD(endDate);
    const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : null;

    const filteredEvents = allChronicleEvents.filter(event => {
        if (event.guildId !== currentGuildId) return false;
        
        const dateKey = toYMD(new Date(event.date));
        return dateKey >= startYMD && dateKey <= endYMD;
    });

    // Group events by date
    filteredEvents.forEach(event => {
      const dateKey = toYMD(new Date(event.date));
      const collection = chroniclesByDate.get(dateKey) || [];
      collection.push(event);
      chroniclesByDate.set(dateKey, collection);
    });

    // Sort events within each day
    for (const events of chroniclesByDate.values()) {
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return chroniclesByDate;
  }, [allChronicleEvents, currentUser, appMode, startDate, endDate]);
};