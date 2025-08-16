
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useReducer, useRef } from 'react';
import { IAppData, User } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface DataState extends IAppData {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  allTags: string[];
}

type DataAction = 
  | { type: 'SET_ALL_DATA', payload: Partial<IAppData> }
  | { type: 'UPDATE_DATA', payload: Partial<IAppData> }
  | { type: 'SET_SYNC_STATE', payload: { syncStatus: SyncStatus, syncError: string | null } };

const initialState: DataState = {
  isDataLoaded: false,
  isAiConfigured: false,
  syncStatus: 'idle',
  syncError: null,
  allTags: [],
  users: [],
  quests: [],
  questGroups: [],
  markets: [],
  rewardTypes: [],
  questCompletions: [],
  purchaseRequests: [],
  guilds: [],
  ranks: [],
  trophies: [],
  userTrophies: [],
  adminAdjustments: [],
  gameAssets: [],
  systemLogs: [],
  themes: [],
  chatMessages: [],
  systemNotifications: [],
  scheduledEvents: [],
  rotations: [],
  bugReports: [],
  setbackDefinitions: [],
  appliedSetbacks: [],
  tradeOffers: [],
  gifts: [],
  settings: INITIAL_SETTINGS,
  loginHistory: [],
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
    switch (action.type) {
        case 'SET_SYNC_STATE':
            return { ...state, syncStatus: action.payload.syncStatus, syncError: action.payload.syncError };
        case 'SET_ALL_DATA':
            return {
                ...state,
                ...action.payload,
                isDataLoaded: true,
                allTags: Array.from(new Set(action.payload.quests?.flatMap(q => q.tags) || [])),
            };
        case 'UPDATE_DATA':
             const updatedState = { ...state };
             for (const key in action.payload) {
                const typedKey = key as keyof IAppData;
                if (Array.isArray(updatedState[typedKey])) {
                    const existingItems = new Map((updatedState[typedKey] as any[]).map(item => [item.id, item]));
                    (action.payload[typedKey] as any[]).forEach(newItem => {
                        existingItems.set(newItem.id, newItem);
                    });
                    (updatedState as any)[typedKey] = Array.from(existingItems.values());
                } else if (typeof updatedState[typedKey] === 'object' && updatedState[typedKey] !== null) {
                    (updatedState as any)[typedKey] = { ...(updatedState[typedKey] as object), ...(action.payload[typedKey] as object) };
                } else {
                    (updatedState as any)[typedKey] = action.payload[typedKey];
                }
            }
            return {
                ...updatedState,
                allTags: Array.from(new Set(updatedState.quests.flatMap(q => q.tags))),
            };
        default:
            return state;
    }
};

export const DataStateContext = createContext<DataState | undefined>(undefined);
export const DataDispatchContext = createContext<React.Dispatch<DataAction> | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { addNotification } = useNotificationsDispatch();
  const { setUsers, setCurrentUser, setLoginHistory } = useAuthDispatch();
  const { users } = useAuthState();

  const lastSyncTimestamp = useRef<string | null>(null);

  useEffect(() => {
    const syncData = async () => {
        dispatch({ type: 'SET_SYNC_STATE', payload: { syncStatus: 'syncing', syncError: null } });
        try {
            const endpoint = lastSyncTimestamp.current ? `/api/data/sync?lastSync=${encodeURIComponent(lastSyncTimestamp.current)}` : '/api/data/sync';
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const { updates, newSyncTimestamp } = await response.json();
            
            if (lastSyncTimestamp.current) { // Delta update
                dispatch({ type: 'UPDATE_DATA', payload: updates });
            } else { // Initial load
                dispatch({ type: 'SET_ALL_DATA', payload: updates });
            }
            dispatch({ type: 'SET_SYNC_STATE', payload: { syncStatus: 'success', syncError: null } });


            // Sync user data with AuthContext
            if (updates.users) {
                setUsers(updates.users);
                 const lastUserId = localStorage.getItem('lastUserId');
                 const lastUser = updates.users.find((u: User) => u.id === lastUserId);
                 if(lastUser) {
                    setCurrentUser(lastUser);
                 }
            }
             if (updates.loginHistory) {
                setLoginHistory(updates.loginHistory);
            }

            lastSyncTimestamp.current = newSyncTimestamp;

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error("Sync failed:", message);
            dispatch({ type: 'SET_SYNC_STATE', payload: { syncStatus: 'error', syncError: message } });
        }
    };
    
    syncData(); // Initial sync

    const eventSource = new EventSource('/api/data/events');
    eventSource.onmessage = (event) => {
        if (event.data === 'sync') {
            console.log('[SSE] Received sync event from server, fetching updates...');
            syncData();
        }
    };
    eventSource.onerror = () => {
        console.error('[SSE] Connection error. Attempting to reconnect...');
        // The browser will automatically attempt to reconnect.
    };
    
    return () => {
        eventSource.close();
    };
  }, []);

  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={dispatch}>
        {children}
      </DataDispatchContext.Provider>
    </DataStateContext.Provider>
  );
};

export const useData = (): DataState => {
  const context = useContext(DataStateContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const useDataDispatch = (): React.Dispatch<DataAction> => {
    const context = useContext(DataDispatchContext);
    if (context === undefined) throw new Error('useDataDispatch must be used within a DataProvider');
    return context;
};
