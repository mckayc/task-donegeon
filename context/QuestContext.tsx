import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
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
  const { currentUser } = useAuthState();
  const economyDispatch = useEconomyDispatch();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);

  const allTags = useMemo(() => 
    Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), 
  [quests]);

  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
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

  const addQuest = useCallback(async (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
      await apiRequest('POST', '/api/quests', quest);
  }, [apiRequest]);

  const updateQuest = useCallback(async (updatedQuest: Quest) => {
      await apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest);
  }, [apiRequest]);
  
  const deleteQuest = useCallback(async (questId: string) => {
      await apiRequest('DELETE', `/api/quests`, { ids: [questId] });
  }, [apiRequest]);

  const cloneQuest = useCallback(async (questId: string) => {
      await apiRequest('POST', `/api/quests/clone/${questId}`);
  }, [apiRequest]);
  
  const dismissQuest = useCallback((questId: string, userId: string) => {
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }] } : q));
  }, []);

  const claimQuest = useCallback((questId: string, userId: string) => {
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...(q.claimedByUserIds || []), userId] } : q));
  }, []);

  const releaseQuest = useCallback((questId: string, userId: string) => {
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId) } : q));
  }, []);

  const markQuestAsTodo = useCallback((questId: string, userId: string) => {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      
      const updatedQuest = { ...quest, todoUserIds: [...(quest.todoUserIds || []), userId] };
      setQuests(prev => prev.map(q => q.id === questId ? updatedQuest : q));
      updateQuest(updatedQuest);
  }, [quests, updateQuest]);

  const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      
      const updatedQuest = { ...quest, todoUserIds: (quest.todoUserIds || []).filter(id => id !== userId) };
      setQuests(prev => prev.map(q => q.id === questId ? updatedQuest : q));
      updateQuest(updatedQuest);
  }, [quests, updateQuest]);

  const completeQuest = useCallback(async (completionData: any) => {
      const { questId, userId, status, guildId } = completionData;

      // Optimistic Update
      if (status === QuestCompletionStatus.Approved) {
          const quest = quests.find(q => q.id === questId);
          if (quest) {
              economyDispatch.applyRewards(userId, quest.rewards, guildId, false);
          }
      }
      setQuestCompletions(prev => [...prev, { ...completionData, id: `temp-comp-${Date.now()}` }]);

      await apiRequest('POST', '/api/actions/complete-quest', { completionData });
  }, [apiRequest, economyDispatch, quests]);

  const approveQuestCompletion = useCallback(async (completionId: string, note?: string) => {
      // Optimistic Update
      const completion = questCompletions.find(c => c.id === completionId);
      if (completion && completion.status === 'Pending') {
          const quest = quests.find(q => q.id === completion.questId);
          if (quest) {
              economyDispatch.applyRewards(completion.userId, quest.rewards, completion.guildId, false);
          }
          setQuestCompletions(prev => prev.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Approved, note: note || c.note } : c));
      }

      await apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note });
  }, [apiRequest, economyDispatch, quests, questCompletions]);

  const rejectQuestCompletion = useCallback(async (completionId: string, note?: string) => {
      // Optimistic Update
      setQuestCompletions(prev => prev.map(c => {
          if (c.id === completionId && c.status === 'Pending') {
              return { ...c, status: QuestCompletionStatus.Rejected, note: note || c.note };
          }
          return c;
      }));
      await apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note });
  }, [apiRequest]);

  const addQuestGroup = useCallback((group: Omit<QuestGroup, 'id'>): QuestGroup => {
      const newGroup = { ...group, id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
      setQuestGroups(prev => [...prev, newGroup]);
      return newGroup;
  }, []);
  
  const updateQuestGroup = useCallback((group: QuestGroup) => setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)), []);
  
  const deleteQuestGroup = useCallback((groupId: string) => {
    setQuestGroups(prev => prev.filter(g => g.id !== groupId));
    // Also unset from quests
    setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, groupId: undefined } : q));
  }, []);

  const deleteQuestGroups = useCallback((groupIds: string[]) => {
      const idsToDelete = new Set(groupIds);
      setQuestGroups(prev => prev.filter(g => !idsToDelete.has(g.id)));
      setQuests(prev => prev.map(q => idsToDelete.has(q.groupId || '') ? { ...q, groupId: undefined } : q));
  }, []);

  const assignQuestGroupToUsers = useCallback((groupId: string, userIds: string[]) => {
      setQuests(prev => prev.map(q => q.groupId === groupId ? { ...q, assignedUserIds: userIds } : q));
  }, []);

  const deleteQuests = useCallback(async (questIds: string[]) => {
      await apiRequest('DELETE', '/api/quests', { ids: questIds });
  }, [apiRequest]);

  const updateQuestsStatus = useCallback(async (questIds: string[], isActive: boolean) => {
      await apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive });
  }, [apiRequest]);

  const bulkUpdateQuests = useCallback(async (questIds: string[], updates: BulkQuestUpdates) => {
      await apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates });
  }, [apiRequest]);

  const state = useMemo(() => ({
      quests, questGroups, questCompletions, allTags
  }), [quests, questGroups, questCompletions, allTags]);

  const dispatch = useMemo(() => ({
      setQuests, setQuestGroups, setQuestCompletions,
      addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest,
      claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo, completeQuest,
      approveQuestCompletion, rejectQuestCompletion, addQuestGroup, updateQuestGroup,
      deleteQuestGroup, assignQuestGroupToUsers, deleteQuests, updateQuestsStatus,
      bulkUpdateQuests, deleteQuestGroups
  }), [
      addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest,
      claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo, completeQuest,
      approveQuestCompletion, rejectQuestCompletion, addQuestGroup, updateQuestGroup,
      deleteQuestGroup, assignQuestGroupToUsers, deleteQuests, updateQuestsStatus,
      bulkUpdateQuests, deleteQuestGroups
  ]);

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