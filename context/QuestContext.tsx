import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';
import { Quest, QuestGroup, QuestCompletion, BulkQuestUpdates, QuestCompletionStatus } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { useEconomyDispatch } from './EconomyContext';

interface QuestState {
  quests: Quest[];
  questGroups: QuestGroup[];
  questCompletions: QuestCompletion[];
  allTags: string[];
}

interface QuestDispatch {
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  setQuestGroups: React.Dispatch<React.SetStateAction<QuestGroup[]>>;
  setQuestCompletions: React.Dispatch<React.SetStateAction<QuestCompletion[]>>;
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  cloneQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  markQuestAsTodo: (questId: string, userId: string) => void;
  unmarkQuestAsTodo: (questId: string, userId: string) => void;
  completeQuest: (completionData: any) => Promise<void>;
  approveQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  addQuestGroup: (group: Omit<QuestGroup, 'id'>) => QuestGroup;
  updateQuestGroup: (group: QuestGroup) => void;
  deleteQuestGroup: (groupId: string) => void;
  deleteQuestGroups: (groupIds: string[]) => void;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  deleteQuests: (questIds: string[]) => void;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => void;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;
}

const QuestStateContext = createContext<QuestState | undefined>(undefined);
const QuestDispatchContext = createContext<QuestDispatch | undefined>(undefined);

export const QuestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const economyDispatch = useEconomyDispatch();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);

  // Refs to hold state for stable callbacks
  const questsRef = useRef(quests);
  useEffect(() => { questsRef.current = quests; }, [quests]);
  const questCompletionsRef = useRef(questCompletions);
  useEffect(() => { questCompletionsRef.current = questCompletions; }, [questCompletions]);

  const allTags = useMemo(() => 
    Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), 
  [quests]);

  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        };
        const response = await window.fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        if (response.status === 204) {
             return null;
        }
        return await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, [addNotification]);
  
  const state = { quests, questGroups, questCompletions, allTags };

  const dispatch = useMemo(() => {
    const updateQuest = (updatedQuest: Quest) => { apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest).catch(() => {}); };
    
    return {
      setQuests,
      setQuestGroups,
      setQuestCompletions,
      addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => { apiRequest('POST', '/api/quests', quest).catch(() => {}); },
      updateQuest,
      deleteQuest: (questId: string) => { apiRequest('DELETE', `/api/quests`, { ids: [questId] }).catch(() => {}); },
      cloneQuest: (questId: string) => { apiRequest('POST', `/api/quests/clone/${questId}`).catch(() => {}); },
      dismissQuest: (questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }] } : q)),
      claimQuest: (questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...(q.claimedByUserIds || []), userId] } : q)),
      releaseQuest: (questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId) } : q)),
      
      markQuestAsTodo: (questId: string, userId: string) => {
          setQuests(prev => {
              const quest = prev.find(q => q.id === questId);
              if (!quest) return prev;
              const updatedQuest = { ...quest, todoUserIds: [...(quest.todoUserIds || []), userId] };
              updateQuest(updatedQuest);
              return prev.map(q => q.id === questId ? updatedQuest : q);
          });
      },
      
      unmarkQuestAsTodo: (questId: string, userId: string) => {
          setQuests(prev => {
              const quest = prev.find(q => q.id === questId);
              if (!quest) return prev;
              const updatedQuest = { ...quest, todoUserIds: (quest.todoUserIds || []).filter(id => id !== userId) };
              updateQuest(updatedQuest);
              return prev.map(q => q.id === questId ? updatedQuest : q);
          });
      },

      completeQuest: async (completionData: any) => {
          const { questId, userId, status, guildId } = completionData;
          if (status === QuestCompletionStatus.Approved) {
              const quest = questsRef.current.find(q => q.id === questId);
              if (quest) economyDispatch.applyRewards(userId, quest.rewards, guildId);
          }
          await apiRequest('POST', '/api/actions/complete-quest', { completionData });
      },

      approveQuestCompletion: async (completionId: string, note?: string) => {
          const completion = questCompletionsRef.current.find(c => c.id === completionId);
          if (completion && completion.status === 'Pending') {
              const quest = questsRef.current.find(q => q.id === completion.questId);
              if (quest) economyDispatch.applyRewards(completion.userId, quest.rewards, completion.guildId);
          }
          await apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note });
      },

      rejectQuestCompletion: async (completionId: string, note?: string) => {
          await apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note });
      },

      addQuestGroup: (group: Omit<QuestGroup, 'id'>): QuestGroup => {
          const newGroup = { ...group, id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
          setQuestGroups(prev => [...prev, newGroup]);
          return newGroup;
      },

      updateQuestGroup: (group: QuestGroup) => setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)),
      deleteQuestGroup: (groupId: string) => {
          setQuestGroups(prev => prev.filter(g => g.id !== groupId));
          setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, groupId: undefined } : q));
      },
      deleteQuestGroups: (groupIds: string[]) => {
          const idsToDelete = new Set(groupIds);
          setQuestGroups(prev => prev.filter(g => !idsToDelete.has(g.id)));
          setQuests(prev => prev.map(q => idsToDelete.has(q.groupId || '') ? { ...q, groupId: undefined } : q));
      },
      assignQuestGroupToUsers: (groupId: string, userIds: string[]) => {
          setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, assignedUserIds: userIds } : q));
      },
      deleteQuests: (questIds: string[]) => { apiRequest('DELETE', '/api/quests', { ids: questIds }).catch(() => {}); },
      updateQuestsStatus: (questIds: string[], isActive: boolean) => { apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive }).catch(() => {}); },
      bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => { apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates }).catch(() => {}); },
    };
  }, [apiRequest, economyDispatch]);

  return (
    <QuestStateContext.Provider value={state}>
      <QuestDispatchContext.Provider value={dispatch}>
        {children}
      </QuestDispatchContext.Provider>
    </QuestStateContext.Provider>
  );
};

export const useQuestState = (): QuestState => {
  const context = useContext(QuestStateContext);
  if (context === undefined) {
    throw new Error('useQuestState must be used within a QuestProvider');
  }
  return context;
};

export const useQuestDispatch = (): QuestDispatch => {
  const context = useContext(QuestDispatchContext);
  if (context === undefined) {
    throw new Error('useQuestDispatch must be used within a QuestProvider');
  }
  return context;
};
