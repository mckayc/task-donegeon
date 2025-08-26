import React, { createContext, useContext, ReactNode, useReducer, useMemo, useCallback } from 'react';
import { Guild } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { bugLogger } from '../utils/bugLogger';
import { addGuildAPI, updateGuildAPI, deleteGuildAPI } from '../api';

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
            return {
                guilds: action.payload.guilds || [],
            };
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
    
    const actions = useMemo<CommunityDispatch>(() => ({
        addGuild: async (data) => {
            try {
                const result = await addGuildAPI(data);
                if (result) {
                    dispatch({ type: 'UPDATE_COMMUNITY_DATA', payload: { guilds: [result] } });
                    addNotification({ type: 'success', message: 'Guild created!' });
                }
                return result;
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create guild.' });
                return null;
            }
        },
        updateGuild: async (data) => {
            try {
                const result = await updateGuildAPI(data);
                if (result) {
                    dispatch({ type: 'UPDATE_COMMUNITY_DATA', payload: { guilds: [result] } });
                    addNotification({ type: 'success', message: 'Guild updated!' });
                }
                return result;
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update guild.' });
                return null;
            }
        },
        deleteGuild: async (id) => {
            try {
                await deleteGuildAPI(id);
                dispatch({ type: 'REMOVE_COMMUNITY_DATA', payload: { guilds: [id] } });
                addNotification({ type: 'info', message: 'Guild deleted.' });
            } catch (error) {
                addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete guild.' });
            }
        },
    }), [addNotification]);
    
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

// FIX: Export useCommunityReducerDispatch
export const useCommunityReducerDispatch = (): React.Dispatch<CommunityAction> => {
  const context = useContext(CommunityDispatchContext);
  if (!context) {
    throw new Error('useCommunityReducerDispatch must be used within a CommunityProvider');
  }
  return context.dispatch;
};