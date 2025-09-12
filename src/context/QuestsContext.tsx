
import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Quest, QuestGroup, QuestCompletion, Rotation, BulkQuestUpdates, Bookmark } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { 
    addQuestAPI, updateQuestAPI, cloneQuestAPI, updateQuestsStatusAPI, bulkUpdateQuestsAPI, 
    completeQuestAPI, approveQuestCompletionAPI, rejectQuestCompletionAPI, 
    markQuestAsTodoAPI, unmarkQuestAsTodoAPI, addQuestGroupAPI, updateQuestGroupAPI, 
    assignQuestGroupToUsersAPI, addRotationAPI, updateRotationAPI, cloneRotationAPI, runRotationAPI,
    completeCheckpointAPI,
    claimQuestAPI, unclaimQuestAPI,
    approveClaimAPI, rejectClaimAPI,
    deleteSelectedAssetsAPI,
    updateReadingProgressAPI
} from '../api';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { useProgressionReducerDispatch } from './ProgressionContext';
import { useSystemReducerDispatch } from './SystemContext';

// --- STATE & CONTEXT DEFINITIONS ---

export interface QuestsState {
    quests: Quest[];
    questGroups: QuestGroup[];
    questCompletions: QuestCompletion[];
    rotations: Rotation[];
    allTags: string[];
}

export type QuestsAction = 
  | { type: 'SET_QUESTS_DATA', payload: Partial<QuestsState> }
  | { type: 'UPDATE_QUESTS_DATA', payload: Partial<QuestsState> }
  | { type: 'REMOVE_QUESTS_DATA', payload: { [key in keyof QuestsState]?: string[] } };

export interface QuestsDispatch {
  addQuest: (questData: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => Promise<Quest | null>;
  updateQuest: (questData: Quest) => Promise<Quest | null>;
  cloneQuest: (questId: string) => Promise<Quest | null>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;
  deleteQuests: (questIds: string[]) => Promise<void>;
  completeQuest: (completionData: Omit<QuestCompletion, 'id'>) => Promise<void>;
  approveQuestCompletion: (completionId: string, approverId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, rejecterId: string, note?: string) => Promise<void>;
  markQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  unmarkQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  addQuestGroup: (groupData: Omit<QuestGroup, 'id'> & { questIds?: string[] }) => Promise<QuestGroup | null>;
  updateQuestGroup: (groupData: QuestGroup & { questIds?: string[] }) => Promise<QuestGroup | null>;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => Promise<void>;
  addRotation: (rotationData: Omit<Rotation, 'id'>) => Promise<Rotation | null>;
  updateRotation: (rotationData: Rotation) => Promise<Rotation | null>;
  cloneRotation: (rotationId: string) => Promise<Rotation | null>;
  runRotation: (rotationId: string) => Promise<void>;
  completeCheckpoint: (questId: string, userId: string) => Promise<void>;
  claimQuest: (questId: string, userId: string) => Promise<void>;
  unclaimQuest: (questId: string, userId: string) => Promise<void>;
  approveClaim: (questId: string, userId: string, adminId: string) => Promise<void>;
  rejectClaim: (questId: string, userId: string, adminId: string) => Promise<void>;
  updateReadingProgress: (questId: string, userId: string, data: { secondsToAdd?: number; sessionSeconds?: number; pageNumber?: number; locationCfi?: string; bookmarks?: Bookmark[] }) => Promise<void>;
}

const QuestsStateContext = createContext<QuestsState | undefined>(undefined);
export const QuestsDispatchContext = createContext<{ dispatch: React.Dispatch<QuestsAction>, actions: QuestsDispatch } | undefined>(undefined);

const initialState: QuestsState = {
    quests: [],
    questGroups: [],
    questCompletions: [],
    rotations: [],
    allTags: [],
};

const questsReducer = (state: QuestsState, action: QuestsAction): QuestsState => {
    let newState: QuestsState;

    switch (action.type) {
        case 'SET_QUESTS_DATA':
            newState = { ...initialState, ...action.payload };
            break;
        case 'UPDATE_QUESTS_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof QuestsState;

                if (typedKey === 'allTags') {
                    continue; // Skip allTags, it is derived from quests
                }

                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    const itemsToUpdate = action.payload[typedKey];
                    if (Array.isArray(itemsToUpdate)) {
                        itemsToUpdate.forEach(newItem => existingItems.set(newItem.id, newItem));
                    }
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                }
            }
            newState = updatedState;
            break;
        }
        case 'REMOVE_QUESTS_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof QuestsState;
                
                if (typedKey === 'allTags') {
                    continue; // Skip allTags
                }

                if (Array.isArray(stateWithRemoved[typedKey])) {
                    const idsToRemove = new Set(action.payload[typedKey] as string[]);
                    (stateWithRemoved as any)[typedKey] = ((stateWithRemoved as any)[typedKey] as any[]).filter(item => !idsToRemove.has(item.id));
                }
            }
            newState = stateWithRemoved;
            break;
        }
        default:
            return state;
    }
    
    // Always derive allTags from the quests array to ensure consistency
    if (newState.quests) {
        newState.allTags = Array.from(new Set(newState.quests.flatMap(q => q.tags || [])));
    } else {
        newState.allTags = [];
    }

    return newState;
};

export const QuestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(questsReducer, initialState);
    const { addNotification } = useNotificationsDispatch();
    const { updateUser } = useAuthDispatch();
    const { currentUser } = useAuthState();
    const progressionDispatch = useProgressionReducerDispatch();
    const systemDispatch = useSystemReducerDispatch();

    const apiAction = useCallback(async <T,>(apiFn: () => Promise<T | null>, successMessage?: string): Promise<T | null> => {
        try {
            const result = await apiFn();
            if (successMessage) addNotification({ type: 'success', message: successMessage });
            return result;
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
            return null;
        }
    }, [addNotification]);
    
    const actions = useMemo<QuestsDispatch>(() => ({
        addQuest: (data) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => addQuestAPI(data, currentUser.id), 'Quest created!');
        },
        updateQuest: (data) => {
            if (!currentUser) return Promise.resolve(null);
            return apiAction(() => updateQuestAPI(data, currentUser.id), 'Quest updated!');
        },
        cloneQuest: (id) => apiAction(() => cloneQuestAPI(id), 'Quest cloned!'),
        updateQuestsStatus: (ids, isActive) => apiAction(() => updateQuestsStatusAPI(ids, isActive)),
        bulkUpdateQuests: (ids, updates) => apiAction(() => bulkUpdateQuestsAPI(ids, updates)),
        
        deleteQuests: async (questIds) => {
            if (!currentUser) return;
            try {
                await deleteSelectedAssetsAPI({ quests: questIds }, currentUser.id);
                dispatch({ type: 'REMOVE_QUESTS_DATA', payload: { quests: questIds }});
                addNotification({ type: 'info', message: `${questIds.length} quest(s) deleted.` });
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete quests.' });
            }
        },

        completeQuest: async (completionData) => {
            const result = await apiAction(() => completeQuestAPI(completionData));
            if (result) {
                const { updatedUser, newCompletion } = result as any;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (newCompletion) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questCompletions: [newCompletion] } });
                addNotification({ type: 'success', message: 'Quest completed!' });
            }
        },
        approveQuestCompletion: async (id, approverId, note) => {
            const result = await apiAction(() => approveQuestCompletionAPI(id, approverId, note));
            if (result) {
                const { updatedUser, updatedCompletion, newUserTrophies, newNotifications } = result as any;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (updatedCompletion) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questCompletions: [updatedCompletion] } });
                if (newUserTrophies?.length > 0) progressionDispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { userTrophies: newUserTrophies } });
                if (newNotifications?.length > 0) systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { systemNotifications: newNotifications } });
                addNotification({ type: 'success', message: 'Quest approved!' });
            }
        },
        rejectQuestCompletion: async (id, rejecterId, note) => {
            const result = await apiAction(() => rejectQuestCompletionAPI(id, rejecterId, note));
            if (result) {
                const { updatedCompletion } = result as any;
                if (updatedCompletion) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questCompletions: [updatedCompletion] } });
            }
        },
        markQuestAsTodo: async (questId, userId) => {
            const result = await apiAction(() => markQuestAsTodoAPI(questId, userId));
            if (result) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
        },
        unmarkQuestAsTodo: async (questId, userId) => {
            const result = await apiAction(() => unmarkQuestAsTodoAPI(questId, userId));
            if (result) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
        },
        completeCheckpoint: async (questId, userId) => {
            const result = await apiAction(() => completeCheckpointAPI(questId, userId));
            if (result) {
                const { updatedUser, updatedQuest, newCompletion, newUserTrophies, newNotifications } = result as any;
                if (updatedUser) updateUser(updatedUser.id, updatedUser);
                if (updatedQuest) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [updatedQuest] } });
                if (newCompletion) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questCompletions: [newCompletion] } });
                if (newUserTrophies?.length > 0) progressionDispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { userTrophies: newUserTrophies } });
                if (newNotifications?.length > 0) systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { systemNotifications: newNotifications } });
                
                const message = (newCompletion.status === 'Approved') 
                    ? 'Checkpoint completed!' 
                    : 'Checkpoint submitted for approval!';
                addNotification({ type: 'success', message });
            }
        },
        claimQuest: async (questId, userId) => {
            const result = await apiAction(() => claimQuestAPI(questId, userId));
            if (result) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
        },
        unclaimQuest: async (questId, userId) => {
            const result = await apiAction(() => unclaimQuestAPI(questId, userId));
            if (result) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
        },
        approveClaim: async (questId, userId, adminId) => {
            const result = await apiAction(() => approveClaimAPI(questId, userId, adminId), 'Claim approved!');
            if (result) {
                dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
            }
        },
        rejectClaim: async (questId, userId, adminId) => {
            const result = await apiAction(() => rejectClaimAPI(questId, userId, adminId), 'Claim rejected.');
            if (result) {
                dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
            }
        },
        updateReadingProgress: async (questId, userId, data) => {
            await apiAction(() => updateReadingProgressAPI(questId, userId, data));
            // Optimistic update of the quest in the local state
            const questToUpdate = state.quests.find(q => q.id === questId);
            if (questToUpdate) {
                const existingProgress = questToUpdate.readingProgress?.[userId] || {};
                const newProgress = {
                    ...existingProgress,
                    ...data,
                    totalSeconds: (existingProgress.totalSeconds || 0) + (data.secondsToAdd || 0),
                };
                // Remove secondsToAdd as it's an action, not persistent state
                delete (newProgress as any).secondsToAdd;

                const updatedQuest = {
                    ...questToUpdate,
                    readingProgress: {
                        ...(questToUpdate.readingProgress || {}),
                        [userId]: newProgress,
                    }
                };
                 dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [updatedQuest] } });
            }
        },
        addQuestGroup: async (data) => {
            const result = await apiAction(() => addQuestGroupAPI(data), 'Quest group created!');
            if (result) {
                dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questGroups: [result] } });
            }
            return result;
        },
        updateQuestGroup: async (data) => {
            const result = await apiAction(() => updateQuestGroupAPI(data), 'Quest group updated!');
            if (result) {
                dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questGroups: [result] } });
            }
            return result;
        },
        assignQuestGroupToUsers: (groupId, userIds) => {
            if (!currentUser) return Promise.resolve();
            return apiAction(() => assignQuestGroupToUsersAPI(groupId, userIds, currentUser.id));
        },
        addRotation: (data) => apiAction(() => addRotationAPI(data)),
        updateRotation: (data) => apiAction(() => updateRotationAPI(data)),
        cloneRotation: (id) => apiAction(() => cloneRotationAPI(id), 'Rotation cloned!'),
        runRotation: async (id) => {
            const result = await apiAction(() => runRotationAPI(id));
            if (result) addNotification({ type: 'success', message: (result as any).message });
        },
    }), [addNotification, apiAction, currentUser, updateUser, progressionDispatch, systemDispatch, dispatch, state.quests]);
    
    const contextValue = useMemo(() => ({ dispatch, actions }), [dispatch, actions]);

    return (
        <QuestsStateContext.Provider value={state}>
            <QuestsDispatchContext.Provider value={contextValue}>
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
    return context.actions;
};