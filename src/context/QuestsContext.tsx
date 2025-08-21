import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Quest, QuestGroup, QuestCompletion, Rotation, BulkQuestUpdates } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { 
    addQuestAPI, updateQuestAPI, cloneQuestAPI, updateQuestsStatusAPI, bulkUpdateQuestsAPI, 
    completeQuestAPI, approveQuestCompletionAPI, rejectQuestCompletionAPI, 
    markQuestAsTodoAPI, unmarkQuestAsTodoAPI, addQuestGroupAPI, updateQuestGroupAPI, 
    assignQuestGroupToUsersAPI, addRotationAPI, updateRotationAPI, runRotationAPI,
    completeCheckpointAPI
} from '../api';

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
    switch (action.type) {
        case 'SET_QUESTS_DATA':
            return { ...state, ...action.payload, allTags: Array.from(new Set(action.payload.quests?.flatMap(q => q.tags) || [])) };
        case 'UPDATE_QUESTS_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof QuestsState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(newItem => existingItems.set(newItem.id, newItem));
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                }
            }
            if (action.payload.quests) {
                updatedState.allTags = Array.from(new Set(updatedState.quests.flatMap(q => q.tags)));
            }
            return updatedState;
        }
        case 'REMOVE_QUESTS_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof QuestsState;
                if (Array.isArray(stateWithRemoved[typedKey])) {
                    const idsToRemove = new Set(action.payload[typedKey] as string[]);
                    (stateWithRemoved as any)[typedKey] = ((stateWithRemoved as any)[typedKey] as any[]).filter(item => !idsToRemove.has(item.id));
                }
            }
            return stateWithRemoved;
        }
        default:
            return state;
    }
};

export const QuestsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(questsReducer, initialState);
    const { addNotification } = useNotificationsDispatch();

    const createDataApiAction = useCallback(<T,>(apiFn: (...args: any[]) => Promise<T | null>) => {
        return async (...args: any[]): Promise<T | null> => {
            try {
                return await apiFn(...args);
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
                return null;
            }
        };
    }, [addNotification]);
    
    const createVoidApiAction = useCallback(<T extends any[]>(apiFn: (...args: T) => Promise<void | null>) => {
        return async (...args: T): Promise<void> => {
            try {
                await apiFn(...args);
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
            }
        };
    }, [addNotification]);

    const actions = useMemo<QuestsDispatch>(() => ({
        addQuest: createDataApiAction(addQuestAPI),
        updateQuest: createDataApiAction(updateQuestAPI),
        cloneQuest: createDataApiAction(cloneQuestAPI),
        updateQuestsStatus: createVoidApiAction(updateQuestsStatusAPI),
        bulkUpdateQuests: createVoidApiAction(bulkUpdateQuestsAPI),
        completeQuest: createVoidApiAction(completeQuestAPI),
        approveQuestCompletion: createVoidApiAction(approveQuestCompletionAPI),
        rejectQuestCompletion: createVoidApiAction(rejectQuestCompletionAPI),
        markQuestAsTodo: createVoidApiAction(markQuestAsTodoAPI),
        unmarkQuestAsTodo: createVoidApiAction(unmarkQuestAsTodoAPI),
        addQuestGroup: createDataApiAction(addQuestGroupAPI),
        updateQuestGroup: createDataApiAction(updateQuestGroupAPI),
        assignQuestGroupToUsers: createVoidApiAction(assignQuestGroupToUsersAPI),
        addRotation: createDataApiAction(addRotationAPI),
        updateRotation: createDataApiAction(updateRotationAPI),
        runRotation: async (rotationId: string) => {
            try {
                const result = await runRotationAPI(rotationId);
                if (result) addNotification({ type: 'success', message: result.message });
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to run rotation.' });
            }
        },
        completeCheckpoint: createVoidApiAction(completeCheckpointAPI),
    }), [addNotification, createDataApiAction, createVoidApiAction]);
    
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