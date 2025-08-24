
import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Quest, QuestGroup, QuestCompletion, Rotation, BulkQuestUpdates } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { 
    addQuestAPI, updateQuestAPI, cloneQuestAPI, updateQuestsStatusAPI, bulkUpdateQuestsAPI, 
    completeQuestAPI, approveQuestCompletionAPI, rejectQuestCompletionAPI, 
    markQuestAsTodoAPI, unmarkQuestAsTodoAPI, addQuestGroupAPI, updateQuestGroupAPI, 
    assignQuestGroupToUsersAPI, addRotationAPI, updateRotationAPI, cloneRotationAPI, runRotationAPI,
    completeCheckpointAPI
} from '../api';
import { useAuthDispatch } from './AuthContext';
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
  completeQuest: (completionData: Omit<QuestCompletion, 'id'>) => Promise<void>;
  approveQuestCompletion: (completionId: string, approverId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, rejecterId: string, note?: string) => Promise<void>;
  markQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  unmarkQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  addQuestGroup: (groupData: Omit<QuestGroup, 'id'>) => Promise<QuestGroup | null>;
  updateQuestGroup: (groupData: QuestGroup) => Promise<QuestGroup | null>;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => Promise<void>;
  addRotation: (rotationData: Omit<Rotation, 'id'>) => Promise<Rotation | null>;
  updateRotation: (rotationData: Rotation) => Promise<Rotation | null>;
  cloneRotation: (rotationId: string) => Promise<Rotation | null>;
  runRotation: (rotationId: string) => Promise<void>;
  completeCheckpoint: (questId: string, userId: string) => Promise<void>;
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
        addQuest: (data) => apiAction(() => addQuestAPI(data), 'Quest created!'),
        updateQuest: (data) => apiAction(() => updateQuestAPI(data), 'Quest updated!'),
        cloneQuest: (id) => apiAction(() => cloneQuestAPI(id), 'Quest cloned!'),
        updateQuestsStatus: (ids, isActive) => apiAction(() => updateQuestsStatusAPI(ids, isActive)),
        bulkUpdateQuests: (ids, updates) => apiAction(() => bulkUpdateQuestsAPI(ids, updates)),
        
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
            const result = await apiAction<Quest>(() => markQuestAsTodoAPI(questId, userId));
            if (result) dispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: [result] } });
        },
        unmarkQuestAsTodo: async (questId, userId) => {
            const result = await apiAction<Quest>(() => unmarkQuestAsTodoAPI(questId, userId));
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
        addQuestGroup: (data) => apiAction(() => addQuestGroupAPI(data)),
        updateQuestGroup: (data) => apiAction(() => updateQuestGroupAPI(data)),
        assignQuestGroupToUsers: (groupId, userIds) => apiAction(() => assignQuestGroupToUsersAPI(groupId, userIds)),
        addRotation: (data) => apiAction(() => addRotationAPI(data)),
        updateRotation: (data) => apiAction(() => updateRotationAPI(data)),
        cloneRotation: (id) => apiAction(() => cloneRotationAPI(id), 'Rotation cloned!'),
        runRotation: async (id) => {
            const result = await apiAction(() => runRotationAPI(id));
            if (result) addNotification({ type: 'success', message: (result as any).message });
        },
    }), [addNotification, apiAction, updateUser, progressionDispatch, systemDispatch]);
    
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
