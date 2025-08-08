import { useMemo } from 'react';
import {
  ChronicleEvent,
  Quest,
  QuestType,
  Trophy,
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

  return useMemo(() => {
    const chroniclesByDate = new Map<string, ChronicleEvent[]>();
    if (!currentUser) return chroniclesByDate;

    const startYMD = toYMD(startDate);
    const endYMD = toYMD(endDate);

    const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
    const allEvents: ChronicleEvent[] = [];

    const userMap = new Map(users.map(u => [u.id, u.gameName]));
    const questMap = new Map(quests.map(q => [q.id, q]));
    const trophyMap = new Map(trophies.map(t => [t.id, t]));

    // 1. Quest Completions
    questCompletions.forEach(c => {
      if (c.userId === currentUser.id && c.guildId === currentGuildId) {
        const dateKey = toYMD(new Date(c.completedAt));
        if (dateKey >= startYMD && dateKey <= endYMD) {
          const quest = questMap.get(c.questId) as Quest | undefined;
          allEvents.push({
            id: c.id, date: c.completedAt, type: 'Quest',
            title: `Completed "${quest?.title || 'Unknown Quest'}"`,
            status: c.status, note: c.note, icon: quest?.icon || '📜',
            color: quest?.type === QuestType.Duty ? '#38bdf8' : '#f59e0b', userId: c.userId,
            questType: quest?.type, guildId: c.guildId
          });
        }
      }
    });

    // 2. Purchase Requests
    purchaseRequests.forEach(p => {
        if (p.userId === currentUser.id && p.guildId === currentGuildId) {
            const dateKey = toYMD(new Date(p.requestedAt));
            if (dateKey >= startYMD && dateKey <= endYMD) {
                allEvents.push({
                    id: p.id, date: p.requestedAt, type: 'Purchase', userId: p.userId,
                    title: `Purchased "${p.assetDetails.name}"`,
                    status: p.status, icon: '💰', color: '#22c55e', guildId: p.guildId
                });
            }
        }
    });

    // 3. User Trophies
    userTrophies.forEach(ut => {
        if (ut.userId === currentUser.id && ut.guildId === currentGuildId) {
            const dateKey = toYMD(new Date(ut.awardedAt));
            if (dateKey >= startYMD && dateKey <= endYMD) {
                const trophy = trophyMap.get(ut.trophyId) as Trophy | undefined;
                allEvents.push({
                    id: ut.id, date: ut.awardedAt, type: 'Trophy', userId: ut.userId,
                    title: `Earned "${trophy?.name || 'Unknown Trophy'}"`,
                    status: "Awarded", note: trophy?.description, icon: trophy?.icon || '🏆',
                    color: '#f59e0b', guildId: ut.guildId
                });
            }
        }
    });
    
    // 4. Admin Adjustments
    adminAdjustments.forEach(adj => {
        if (adj.userId === currentUser.id && adj.guildId === currentGuildId) {
            const dateKey = toYMD(new Date(adj.adjustedAt));
            if (dateKey >= startYMD && dateKey <= endYMD) {
                allEvents.push({
                    id: adj.id, date: adj.adjustedAt, type: 'Adjustment', userId: adj.userId,
                    title: `Adjustment by ${userMap.get(adj.adjusterId) || 'Admin'}`,
                    status: adj.type, note: adj.reason, icon: '🛠️', color: '#64748b', guildId: adj.guildId
                });
            }
        }
    });
    
    // 5. Announcements
    systemNotifications.forEach(n => {
        if(n.type === 'Announcement' && n.recipientUserIds.includes(currentUser.id) && n.guildId === currentGuildId) {
            const dateKey = toYMD(new Date(n.timestamp));
             if (dateKey >= startYMD && dateKey <= endYMD) {
                 allEvents.push({
                    id: n.id, date: n.timestamp, type: 'Announcement',
                    title: `Announcement from ${userMap.get(n.senderId || '') || 'System'}`,
                    status: 'Announcement', note: n.message, icon: '📢', color: '#10b981',
                    guildId: n.guildId, recipientUserIds: n.recipientUserIds
                });
             }
        }
    });

    // Group events by date
    allEvents.forEach(event => {
      const dateKey = toYMD(new Date(event.date));
      const collection = chroniclesByDate.get(dateKey) || [];
      collection.push(event);
      chroniclesByDate.set(dateKey, collection);
    });

    // Sort events within each day
    for (const events of chroniclesByDate.values()) {
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return chroniclesByDate;

  }, [
    currentUser, appMode, startDate, endDate, users, quests, questCompletions,
    purchaseRequests, userTrophies, trophies, adminAdjustments, systemNotifications
  ]);
};