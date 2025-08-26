import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Rank, Trophy, UserTrophy } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';
import { addTrophyAPI, updateTrophyAPI, setRanksAPI } from '../api';

// --- STATE & CONTEXT DEFINITIONS ---

export interface ProgressionState {
    ranks: Rank[];
    trophies: Trophy[];
    userTrophies: UserTrophy[];
}

export type ProgressionAction = 
  | { type: 'SET_PROGRESSION_DATA', payload: Partial<ProgressionState> }
  | { type: 'UPDATE_PROGRESSION_DATA', payload: Partial<ProgressionState> }
  | { type: 'REMOVE_PROGRESSION_DATA', payload: { [key in keyof ProgressionState]?: string[] } };

export interface ProgressionDispatch {
  addTrophy: (trophyData: Omit<Trophy, 'id'>) => Promise<Trophy | null>;
  updateTrophy: (trophyData: Trophy) => Promise<Trophy | null>;
  setRanks: (ranks: Rank[]) => Promise<void>;
}

const ProgressionStateContext = createContext<ProgressionState | undefined>(undefined);
export const ProgressionDispatchContext = createContext<{ dispatch: React.Dispatch<ProgressionAction>, actions: ProgressionDispatch } | undefined>(undefined);


const initialState: ProgressionState = {
    ranks: [],
    trophies: [],
    userTrophies: [],
};

const progressionReducer = (state: ProgressionState, action: ProgressionAction): ProgressionState => {
    switch (action.type) {
        case 'SET_PROGRESSION_DATA':
            return { ...state, ...action.payload };
        case 'UPDATE_PROGRESSION_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof ProgressionState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    const itemsToUpdate = action.payload[typedKey];
                    if (Array.isArray(itemsToUpdate)) {
                        itemsToUpdate.forEach(newItem => existingItems.set(newItem.id, newItem));
                    }
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                }
            }
            return updatedState;
        }
        case 'REMOVE_PROGRESSION_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof ProgressionState;
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

export const ProgressionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(progressionReducer, initialState);
    const { addNotification } = useNotificationsDispatch();

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
    
    const actions = useMemo<ProgressionDispatch>(() => ({
        addTrophy: (data) => apiAction(() => addTrophyAPI(data), 'Trophy created!'),
        updateTrophy: (data) => apiAction(() => updateTrophyAPI(data), 'Trophy updated!'),
        setRanks: async (ranks) => {
            await apiAction(() => setRanksAPI(ranks));
        },
    }), [apiAction]);

    const contextValue = useMemo(() => ({ dispatch, actions }), [dispatch, actions]);

    return (
        <ProgressionStateContext.Provider value={state}>
            <ProgressionDispatchContext.Provider value={contextValue}>
                {children}
            </ProgressionDispatchContext.Provider>
        </ProgressionStateContext.Provider>
    );
};

export const useProgressionState = (): ProgressionState => {
    const context = useContext(ProgressionStateContext);
    if (context === undefined) throw new Error('useProgressionState must be used within a ProgressionProvider');
    return context;
};

export const useProgressionDispatch = (): ProgressionDispatch => {
    const context = useContext(ProgressionDispatchContext);
    if (context === undefined) throw new Error('useProgressionDispatch must be used within a ProgressionProvider');
    return context.actions;
};

export const useProgressionReducerDispatch = (): React.Dispatch<ProgressionAction> => {
  const context = useContext(ProgressionDispatchContext);
  if (!context) {
    throw new Error('useProgressionReducerDispatch must be used within a ProgressionProvider');
  }
  return context.dispatch;
};