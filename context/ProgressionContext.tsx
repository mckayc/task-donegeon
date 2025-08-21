import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Rank, Trophy, UserTrophy } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';

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
                    (action.payload[typedKey] as any[]).forEach(newItem => existingItems.set(newItem.id, newItem));
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

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
            addNotification({ type: 'error', message });
            return null;
        }
    }, [addNotification]);
    
    const createAddAction = <T_ADD, T_RETURN extends { id: any }, D extends keyof ProgressionState>(path: string, dataType: D) => 
        async (data: T_ADD): Promise<T_RETURN | null> => {
            const result = await apiRequest('POST', path, data);
            if (result) dispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const createUpdateAction = <T extends { id: any }, D extends keyof ProgressionState>(pathTemplate: (id: any) => string, dataType: D) => 
        async (data: T): Promise<T | null> => {
            const result = await apiRequest('PUT', pathTemplate(data.id), data);
            if (result) dispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const actions = useMemo<ProgressionDispatch>(() => ({
        addTrophy: createAddAction('/api/trophies', 'trophies'),
        updateTrophy: createUpdateAction(id => `/api/trophies/${id}`, 'trophies'),
        setRanks: async (ranks) => {
            const result = await apiRequest('POST', '/api/ranks/bulk-update', { ranks });
            if (result === null) {
                // Since this is a full replacement, we optimistically update the state.
                dispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { ranks } });
            }
        },
    }), [apiRequest, createAddAction, createUpdateAction]);

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
