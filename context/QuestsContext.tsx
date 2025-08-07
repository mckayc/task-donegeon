import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Quest, QuestGroup, QuestCompletion, QuestType, SystemNotificationType, IAppData, BulkQuestUpdates } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch } from './AuthContext';
import { useAppDispatch } from './AppContext'; // For addSystemNotification
import { useEconomyDispatch } from './EconomyContext'; // For applyRewards
import { useDeveloper } from './DeveloperContext';

// State managed by this context
interface QuestsState {
  quests: Quest[];
  questGroups: QuestGroup[];
  questCompletions: QuestCompletion[];
  allTags: string[];
}

// Dispatch functions provided by this context
interface QuestsDispatch {
  setQuests: (quests: Quest[]) => void;
  setQuestGroups: (groups: QuestGroup[]) => void;
  setQuestCompletions: (completions: QuestCompletion[]) => void;
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
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  deleteQuests: (questIds: string[]) => void;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => void;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;
}

const QuestsStateContext = createContext<QuestsState | undefined>(undefined);
const QuestsDispatchContext = createContext<QuestsDispatch | undefined>(undefined);

export const QuestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotificationsDispatch();
  const appDispatch = useAppDispatch(); // Using a stable reference
  const { isRecording, addLogEntry } = useDeveloper();

  // === STATE MANAGEMENT ===
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);

  const allTags = React.useMemo(() => 
    Array.from(new Set(['Cleaning', 'Learning', 'Health', 'Yardwork', ...quests.flatMap(q => q.tags || [])])).sort(), 
  [quests]);

  const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
    try {
        const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
        throw error;
    }
  }, [addNotification]);
  
  // === DISPATCH FUNCTIONS ===
  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
    if (isRecording) {
      addLogEntry({ type: 'ACTION', message: `addQuest called for "${quest.title}"`});
    }
    const newQuest: Quest = { ...quest, id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, claimedByUserIds: [], dismissals: [], todoUserIds: [] };
    setQuests(prev => [...prev, newQuest]);
    
    // Cross-context call
    if (appDispatch) {
        if (newQuest.assignedUserIds.length > 0) {
            appDispatch.addSystemNotification({
                type: SystemNotificationType.QuestAssigned,
                message: `You have been assigned a new quest: "${newQuest.title}"`,
                recipientUserIds: newQuest.assignedUserIds,
                guildId: newQuest.guildId,
                link: 'Quests',
            });
        }
    }
  }, [appDispatch, isRecording, addLogEntry]);

  const updateQuest = useCallback(async (updatedQuest: Quest) => {
    if (isRecording) {
      addLogEntry({ type: 'ACTION', message: `updateQuest called for "${updatedQuest.title}" (ID: ${updatedQuest.id})`});
    }
    try {
        await apiRequest('PUT', `/api/quests/${updatedQuest.id}`, updatedQuest);
        // State updates are handled via WebSocket broadcast
    } catch (error) {}
  }, [apiRequest, isRecording, addLogEntry]);
  
  const deleteQuest = useCallback((questId: string) => setQuests(prev => prev.filter(q => q.id !== questId)), []);
  const cloneQuest = useCallback((questId: string) => {
    const questToClone = quests.find(q => q.id === questId);
    if (!questToClone) return;
    const newQuest: Quest = { ...JSON.parse(JSON.stringify(questToClone)), id: `quest-${Date.now()}`, title: `${questToClone.title} (Copy)`, claimedByUserIds: [], dismissals: [], todoUserIds: [] };
    setQuests(prev => [...prev, newQuest]);
    addNotification({ type: 'success', message: `Cloned quest: ${newQuest.title}` });
  }, [quests, addNotification]);
  const dismissQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals.filter(d => d.userId !== userId), { userId, dismissedAt: new Date().toISOString() }] } : q)), []);
  const claimQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, userId] } : q)), []);
  const releaseQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId) } : q)), []);
  const markQuestAsTodo = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, todoUserIds: Array.from(new Set([...(q.todoUserIds || []), userId])) } : q)), []);
  const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId) } : q)), []);
  
  const completeQuest = useCallback(async (completionData: any) => {
    if (isRecording) {
      addLogEntry({ type: 'ACTION', message: `Completing quest ID ${completionData.questId} for user ID ${completionData.userId}`});
    }
    try {
      await apiRequest('POST', '/api/actions/complete-quest', { completionData });
    } catch (error) {}
  }, [apiRequest, isRecording, addLogEntry]);

  const approveQuestCompletion = useCallback(async (completionId: string, note?: string) => {
    if (isRecording) {
      addLogEntry({ type: 'ACTION', message: `Approving quest completion ID ${completionId}`});
    }
    try {
        await apiRequest('POST', `/api/actions/approve-quest/${completionId}`, { note });
        addNotification({ type: 'success', message: 'Quest approved!' });
    } catch (error) {}
  }, [apiRequest, addNotification, isRecording, addLogEntry]);

  const rejectQuestCompletion = useCallback(async (completionId: string, note?: string) => {
    if (isRecording) {
      addLogEntry({ type: 'ACTION', message: `Rejecting quest completion ID ${completionId}`});
    }
    try {
        await apiRequest('POST', `/api/actions/reject-quest/${completionId}`, { note });
        addNotification({ type: 'info', message: 'Quest rejected.' });
    } catch (error) {}
  }, [apiRequest, addNotification, isRecording, addLogEntry]);

  const addQuestGroup = useCallback((group: Omit<QuestGroup, 'id'>): QuestGroup => {
    const newGroup: QuestGroup = { ...group, id: `q-group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setQuestGroups(prev => [...prev, newGroup]);
    addNotification({ type: 'success', message: `Quest group "${newGroup.name}" created.` });
    return newGroup;
  }, [addNotification]);
  const updateQuestGroup = useCallback((group: QuestGroup) => { setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)); addNotification({ type: 'success', message: `Quest group "${group.name}" updated.` }); }, [addNotification]);
  const deleteQuestGroup = useCallback((groupId: string) => { setQuestGroups(prev => prev.filter(g => g.id !== groupId)); setQuests(prevQuests => prevQuests.map(q => q.groupId === groupId ? { ...q, groupId: undefined } : q)); addNotification({ type: 'info', message: 'Quest group deleted.' }); }, [addNotification]);
  const assignQuestGroupToUsers = useCallback((groupId: string, userIds: string[]) => {
    const group = questGroups.find(g => g.id === groupId);
    if (!group || !appDispatch) return;
    
    userIds.forEach(userId => appDispatch.addSystemNotification({
        type: SystemNotificationType.QuestAssigned,
        message: `You have been assigned all quests from the "${group.name}" group.`,
        recipientUserIds: [userId],
        link: 'Quests'
    }));
    
    setQuests(prevQuests => prevQuests.map(q => {
        if (q.groupId === groupId) {
            return { ...q, assignedUserIds: Array.from(new Set([...q.assignedUserIds, ...userIds])) };
        }
        return q;
    }));
  }, [questGroups, appDispatch]);

  const deleteQuests = useCallback(async (questIds: string[]) => {
    try {
      await apiRequest('DELETE', '/api/quests', { ids: questIds });
      addNotification({ type: 'info', message: `${questIds.length} quest(s) deleted.` });
    } catch (e) {}
  }, [apiRequest, addNotification]);
  
  const updateQuestsStatus = useCallback(async (questIds: string[], isActive: boolean) => {
    try {
      await apiRequest('PUT', '/api/quests/bulk-status', { ids: questIds, isActive });
      addNotification({ type: 'success', message: `${questIds.length} quest(s) updated.` });
    } catch(e) {}
  }, [apiRequest, addNotification]);

  const bulkUpdateQuests = useCallback(async (questIds: string[], updates: BulkQuestUpdates) => {
    try {
      await apiRequest('PUT', '/api/quests/bulk-update', { ids: questIds, updates });
      addNotification({type: 'success', message: `Bulk updated ${questIds.length} quest(s).`});
    } catch (e) {}
  }, [apiRequest, addNotification]);


  const stateValue: QuestsState = { quests, questGroups, questCompletions, allTags };
  const dispatchValue: QuestsDispatch = {
    setQuests, setQuestGroups, setQuestCompletions,
    addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest,
    markQuestAsTodo, unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion,
    addQuestGroup, updateQuestGroup, deleteQuestGroup, assignQuestGroupToUsers,
    deleteQuests, updateQuestsStatus, bulkUpdateQuests,
  };

  return (
    <QuestsStateContext.Provider value={stateValue}>
      <QuestsDispatchContext.Provider value={dispatchValue}>
        {children}
      </QuestsDispatchContext.Provider>
    </QuestsStateContext.Provider>
  );
};

export const useQuestsState = (): QuestsState => {
  const context = useContext(QuestsStateContext);
  if (context === undefined) throw new Error('useQuestsState must be used within a QuestsProvider');
  return context;
};

export const useQuestsDispatch = (): QuestsDispatch => {
  const context = useContext(QuestsDispatchContext);
  if (context === undefined) throw new Error('useQuestsDispatch must be used within a QuestsProvider');
  return context;
};
