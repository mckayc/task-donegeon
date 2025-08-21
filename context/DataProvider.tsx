
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useReducer, useRef } from 'react';
import { User } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { CommunityAction, CommunityDispatchContext } from './CommunityContext';
import { EconomyAction, EconomyDispatchContext } from './EconomyContext';
import { ProgressionAction, ProgressionDispatchContext } from './ProgressionContext';
import { QuestsAction, QuestsDispatchContext } from './QuestsContext';
import { SystemAction, SystemDispatchContext } from './SystemContext';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// --- CONTEXT DEFINITIONS ---
const DataLoadedContext = createContext<boolean>(false);
const SyncStatusContext = createContext<{ syncStatus: SyncStatus; syncError: string | null; }>({ syncStatus: 'idle', syncError: null });

// --- DATA PROVIDER COMPONENT ---

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const { addNotification } = useNotificationsDispatch();
  const { setUsers, setCurrentUser, setLoginHistory, updateUser } = useAuthDispatch();
  const { users } = useAuthState();
  const questsDispatch = useContext(QuestsDispatchContext)!;
  const economyDispatch = useContext(EconomyDispatchContext)!.dispatch;
  const progressionDispatch = useContext(ProgressionDispatchContext)!.dispatch;
  const communityDispatch = useContext(CommunityDispatchContext)!.dispatch;
  const systemDispatch = useContext(SystemDispatchContext)!.dispatch;

  const lastSyncTimestamp = useRef<string | null>(null);

  const syncData = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
        const endpoint = lastSyncTimestamp.current ? `/api/data/sync?lastSync=${encodeURIComponent(lastSyncTimestamp.current)}` : '/api/data/sync';
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const { updates, newSyncTimestamp } = await response.json();
        
        const { 
            users: updatedUsers, loginHistory: updatedLoginHistory, 
            quests, questGroups, questCompletions, rotations, 
            markets, gameAssets, purchaseRequests, rewardTypes, tradeOffers, gifts,
            ranks, trophies, userTrophies,
            guilds,
            ...systemUpdates 
        } = updates;
        
        const questsPayload = { quests, questGroups, questCompletions, rotations };
        const economyPayload = { markets, gameAssets, purchaseRequests, rewardTypes, tradeOffers, gifts };
        const progressionPayload = { ranks, trophies, userTrophies };
        const communityPayload = { guilds };

        if (lastSyncTimestamp.current) { // Delta update
            if (Object.values(questsPayload).some(v => v !== undefined)) (questsDispatch as React.Dispatch<QuestsAction>)({ type: 'UPDATE_QUESTS_DATA', payload: questsPayload });
            if (Object.values(economyPayload).some(v => v !== undefined)) (economyDispatch as React.Dispatch<EconomyAction>)({ type: 'UPDATE_ECONOMY_DATA', payload: economyPayload });
            if (Object.values(progressionPayload).some(v => v !== undefined)) (progressionDispatch as React.Dispatch<ProgressionAction>)({ type: 'UPDATE_PROGRESSION_DATA', payload: progressionPayload });
            if (Object.values(communityPayload).some(v => v !== undefined)) (communityDispatch as React.Dispatch<CommunityAction>)({ type: 'UPDATE_COMMUNITY_DATA', payload: communityPayload });
            if (Object.values(systemUpdates).some(v => v !== undefined)) (systemDispatch as React.Dispatch<SystemAction>)({ type: 'UPDATE_SYSTEM_DATA', payload: systemUpdates });
            
            if (updatedUsers) {
                const existingUserIds = new Set(users.map(u => u.id));
                const usersToAdd: User[] = [];
                updatedUsers.forEach((user: User) => {
                    if (existingUserIds.has(user.id)) {
                        updateUser(user.id, user); 
                    } else {
                        usersToAdd.push(user);
                    }
                });
                if (usersToAdd.length > 0) setUsers(currentUsers => [...currentUsers, ...usersToAdd]);
            }
            if (updatedLoginHistory) setLoginHistory(updatedLoginHistory);

        } else { // Initial load
            (questsDispatch as React.Dispatch<QuestsAction>)({ type: 'SET_QUESTS_DATA', payload: questsPayload });
            (economyDispatch as React.Dispatch<EconomyAction>)({ type: 'SET_ECONOMY_DATA', payload: economyPayload });
            (progressionDispatch as React.Dispatch<ProgressionAction>)({ type: 'SET_PROGRESSION_DATA', payload: progressionPayload });
            (communityDispatch as React.Dispatch<CommunityAction>)({ type: 'SET_COMMUNITY_DATA', payload: communityPayload });
            (systemDispatch as React.Dispatch<SystemAction>)({ type: 'SET_SYSTEM_DATA', payload: systemUpdates });

            if (updates.users) {
                setUsers(updates.users);
                 const lastUserId = localStorage.getItem('lastUserId');
                 const lastUser = updates.users.find((u: User) => u.id === lastUserId);
                 if(lastUser) setCurrentUser(lastUser);
            }
            if (updates.loginHistory) setLoginHistory(updates.loginHistory);
            
            setIsDataLoaded(true);

            try {
                const statusRes = await fetch('/api/system/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    (systemDispatch as React.Dispatch<SystemAction>)({ type: 'SET_AI_CONFIGURED', payload: statusData.geminiConnected });
                }
            } catch (e) {
                console.error("Could not fetch system status for AI check", e);
            }
        }

        lastSyncTimestamp.current = newSyncTimestamp;
        setSyncStatus('success');

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("Sync failed:", message);
        setSyncStatus('error');
        setSyncError(message);
    }
  }, [users, setUsers, setCurrentUser, setLoginHistory, updateUser, questsDispatch, economyDispatch, progressionDispatch, communityDispatch, systemDispatch]);

  useEffect(() => {
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
    };
    
    return () => {
        eventSource.close();
    };
  }, [syncData]);

  return (
    <DataLoadedContext.Provider value={isDataLoaded}>
        <SyncStatusContext.Provider value={{ syncStatus, syncError }}>
            {children}
        </SyncStatusContext.Provider>
    </DataLoadedContext.Provider>
  );
};

// --- CUSTOM HOOKS ---
export const useIsDataLoaded = () => useContext(DataLoadedContext);
export const useSyncStatus = () => useContext(SyncStatusContext);
