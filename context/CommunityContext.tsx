import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Guild } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';

// --- STATE & CONTEXT DEFINITIONS ---

export interface CommunityState {
    guilds: Guild[];
}

export type CommunityAction = 
  | { type: 'SET_COMMUNITY_DATA', payload: Partial<CommunityState> }
  | { type: 'UPDATE_COMMUNITY_DATA', payload: Partial<CommunityState> }
  | { type: 'REMOVE_COMMUNITY_DATA', payload: { [key in keyof CommunityState]?: string[] } };

export interface CommunityDispatch {
  addGuild: (guildData: Omit<Guild, 'id'>) => Promise<Guild | null>;
  updateGuild: (guildData: Guild) => Promise<Guild | null>;
  deleteGuild: (guildId: string) => Promise<void>;
}

const CommunityStateContext = createContext<CommunityState | undefined>(undefined);
export const CommunityDispatchContext = createContext<{ dispatch: React.Dispatch<CommunityAction>, actions: CommunityDispatch } | undefined>(undefined);


const initialState: CommunityState = {
    guilds: [],
};

const communityReducer = (state: CommunityState, action: CommunityAction): CommunityState => {
    switch (action.type) {
        case 'SET_COMMUNITY_DATA':
            return { ...state, ...action.payload };
        case 'UPDATE_COMMUNITY_DATA': {
            const updatedState = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof CommunityState;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(newItem => existingItems.set(newItem.id, newItem));
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                }
            }
            return updatedState;
        }
        case 'REMOVE_COMMUNITY_DATA': {
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof CommunityState;
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

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(communityReducer, initialState);
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
            bugLogger.add({ type: 'STATE_CHANGE', message: `API Error: ${method} ${path} - ${message}` });
            return null;
        }
    }, [addNotification]);
    
    const createAddAction = <T_ADD, T_RETURN extends { id: any }, D extends keyof CommunityState>(path: string, dataType: D) => 
        async (data: T_ADD): Promise<T_RETURN | null> => {
            const result = await apiRequest('POST', path, data);
            if (result) dispatch({ type: 'UPDATE_COMMUNITY_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };
        
    const createUpdateAction = <T extends { id: any }, D extends keyof CommunityState>(pathTemplate: (id: any) => string, dataType: D) => 
        async (data: T): Promise<T | null> => {
            const result = await apiRequest('PUT', pathTemplate(data.id), data);
            if (result) dispatch({ type: 'UPDATE_COMMUNITY_DATA', payload: { [dataType]: [result] } as any });
            return result;
        };

    const actions = useMemo<CommunityDispatch>(() => ({
        addGuild: createAddAction('/api/guilds', 'guilds'),
        updateGuild: createUpdateAction(id => `/api/guilds/${id}`, 'guilds'),
        deleteGuild: async (id) => {
            const result = await apiRequest('DELETE', `/api/guilds/${id}`);
            if (result === null) {
                dispatch({ type: 'REMOVE_COMMUNITY_DATA', payload: { guilds: [id] } });
            }
        },
    }), [apiRequest, createAddAction, createUpdateAction]);
    
    const contextValue = useMemo(() => ({ dispatch, actions }), [dispatch, actions]);

    return (
        <CommunityStateContext.Provider value={state}>
            <CommunityDispatchContext.Provider value={contextValue}>
                {children}
            </CommunityDispatchContext.Provider>
        </CommunityStateContext.Provider>
    );
};

export const useCommunityState = (): CommunityState => {
    const context = useContext(CommunityStateContext);
    if (context === undefined) throw new Error('useCommunityState must be used within a CommunityProvider');
    return context;
};

export const useCommunityDispatch = (): CommunityDispatch => {
    const context = useContext(CommunityDispatchContext);
    if (context === undefined) throw new Error('useCommunityDispatch must be used within a CommunityProvider');
    return context.actions;
};
