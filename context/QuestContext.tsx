import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';
import { Quest, QuestGroup, QuestCompletion, BulkQuestUpdates, QuestCompletionStatus } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { bugLogger } from '../utils/bugLogger';
import { useEconomyDispatch } from './EconomyContext';
import { useAppDispatch } from './AppContext';

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
  const { registerOptimisticUpdate } = useAppDispatch();
  const economyDispatch = useEconomyDispatch();
  const authDispatch = useAuthDispatch();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);

  // Refs to hold state for stable callbacks
  const questsRef = useRef(quests);
  useEffect(() => { questsRef.current = quests; }, [quests]);
  const questCompletionsRef = useRef(questCompletions);
  useEffect(() => { questCompletionsRef.current = questCompletions; }, [questCompletions]);
  const economyDispatchRef = useRef(economyDispatch);
  useEffect(() => { economyDispatchRef.current = economyDispatch; }, [economyDispatch]);

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
  
  const state = useMemo(() => ({ quests, questGroups, questCompletions, allTags }), [quests, questGroups, questCompletions, allTags]);

  const updateQuest = useCallback((updatedQuest: Quest) => { apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest).catch(() => {}); }, [apiRequest]);
    
  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => { apiRequest('POST', '/api/quests', quest).catch(() => {}); }, [apiRequest]);
  const deleteQuest = useCallback((questId: string) => { apiRequest('DELETE', `/api/quests`, { ids: [questId] }).catch(() => {}); }, [apiRequest]);
  const cloneQuest = useCallback((questId: string) => { apiRequest('POST', `/api/quests/clone/${questId}`).catch(() => {}); }, [apiRequest]);
  
  const dismissQuest = useCallback((questId: string, userId: string) => {
    const optimisticTimestamp = registerOptimisticUpdate('quests', questId);
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals, { userId, dismissedAt: new Date().toISOString() }], updatedAt: optimisticTimestamp } : q));
  }, [registerOptimisticUpdate]);

  const claimQuest = useCallback((questId: string, userId: string) => {
    const optimisticTimestamp = registerOptimisticUpdate('quests', questId);
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...(q.claimedByUserIds || []), userId], updatedAt: optimisticTimestamp } : q));
  }, [registerOptimisticUpdate]);
  
  const releaseQuest = useCallback((questId: string, userId: string) => {
    const optimisticTimestamp = registerOptimisticUpdate('quests', questId);
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: (q.claimedByUserIds || []).filter(id => id !== userId), updatedAt: optimisticTimestamp } : q));
  }, [registerOptimisticUpdate]);
  
  const markQuestAsTodo = useCallback((questId: string, userId: string) => {
      const optimisticTimestamp = registerOptimisticUpdate('quests', questId);
      const originalQuests = questsRef.current;
      let questToUpdate: Quest | undefined;

      setQuests(prev => prev.map(q => {
          if (q.id === questId) {
              questToUpdate = { ...q, todoUserIds: [...(q.todoUserIds || []), userId], updatedAt: optimisticTimestamp };
              return questToUpdate;
          }
          return q;
      }));
      
      if (questToUpdate) {
          apiRequest('PUT', `/api/quests/${questId}`, questToUpdate).catch(() => setQuests(originalQuests));
      }
  }, [registerOptimisticUpdate, apiRequest]);
  
  const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => {
      const optimisticTimestamp = registerOptimisticUpdate('quests', questId);
      const originalQuests = questsRef.current;
      let questToUpdate: Quest | undefined;
      
      setQuests(prev => prev.map(q => {
          if (q.id === questId) {
              questToUpdate = { ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId), updatedAt: optimisticTimestamp };
              return questToUpdate;
          }
          return q;
      }));

      if (questToUpdate) {
          apiRequest('PUT', `/api/quests/${questId}`, questToUpdate).catch(() => setQuests(originalQuests));
      }
  }, [registerOptimisticUpdate, apiRequest]);

  const completeQuest = useCallback(async (completionData: any) => {
    try {
        const result = await apiRequest('POST', '/api/actions/complete-quest', { completionData });

        if (result && result.updatedUser && result.newCompletion) {
            // Update the local state with the authoritative response from the server.
            authDispatch.updateUser(result.updatedUser.id, result.updatedUser);
            setQuestCompletions(prev => [...prev, result.newCompletion]);
            
            const quest = questsRef.current.find(q => q.id === completionData.questId);
            if (quest) {
                addNotification({type: 'success', message: `Quest "${quest.title}" completed!`});
            }
        }
    } catch (error) {
        // apiRequest helper handles notification
    }
  }, [apiRequest, authDispatch, addNotification]);

  const approveQuestCompletion = useCallback(async (completionId: string, note?: string) => {
      const completion = questCompletionsRef.current.find(c => c.id === completionId);
      if (completion && completion.status === 'Pending') {
          const quest = questsRef.current.find(q => q.id === completion.questId);
          if (quest) economyDispatchRef.current.applyRewards(completion.userId, quest.rewards, completion.guildId);
      }
      await apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note });
  }, [apiRequest]);

  const rejectQuestCompletion = useCallback(async (completionId: string, note?: string) => {
      await apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note });
  }, [apiRequest]);

  const addQuestGroup = useCallback((group: Omit<QuestGroup, 'id'>): QuestGroup => {
      const newGroup = { ...group, id: `qg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
      setQuestGroups(prev => [...prev, newGroup]);
      return newGroup;
  }, []);

  const updateQuestGroup = useCallback((group: QuestGroup) => {
      const optimisticTimestamp = registerOptimisticUpdate('questGroups', group.id);
      setQuestGroups(prev => prev.map(g => g.id === group.id ? { ...group, updatedAt: optimisticTimestamp } : g))
  }, [registerOptimisticUpdate]);

  const deleteQuestGroup = useCallback((groupId: string) => {
      setQuestGroups(prev => prev.filter(g => g.id !== groupId));
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
  const deleteQuests = useCallback((questIds: string[]) => { apiRequest('DELETE', '/api/quests', { ids: questIds }).catch(() => {}); }, [apiRequest]);
  const updateQuestsStatus = useCallback((questIds: string[], isActive: boolean) => { apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive }).catch(() => {}); }, [apiRequest]);
  const bulkUpdateQuests = useCallback((questIds: string[], updates: BulkQuestUpdates) => { apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates }).catch(() => {}); }, [apiRequest]);

  const dispatch = useMemo(() => ({
    setQuests, setQuestGroups, setQuestCompletions, addQuest, updateQuest, deleteQuest,
    cloneQuest, dismissQuest, claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo,
    completeQuest, approveQuestCompletion, rejectQuestCompletion, addQuestGroup, updateQuestGroup,
    deleteQuestGroup, deleteQuestGroups, assignQuestGroupToUsers, deleteQuests, updateQuestsStatus,
    bulkUpdateQuests
  }), [
    addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest, markQuestAsTodo,
    unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion, addQuestGroup,
    updateQuestGroup, deleteQuestGroup, deleteQuestGroups, assignQuestGroupToUsers, deleteQuests,
    updateQuestsStatus, bulkUpdateQuests
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