import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
// FIX: Corrected type imports to use the main types barrel file by adjusting the relative path.
import { User, IAppData, SystemState } from '../types';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';
import { CommunityDispatchContext } from './CommunityContext';
import { EconomyDispatchContext } from './EconomyContext';
import { ProgressionDispatchContext } from './ProgressionContext';
import { QuestsDispatchContext } from './QuestsContext';
import { SystemDispatchContext } from './SystemContext';

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
  const questsDispatch = useContext(QuestsDispatchContext)!.dispatch;
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

        // FIX: Completed the syncData function logic.
        const { updates, newSyncTimestamp } = await response.json();

        if (updates) {
            // Dispatch updates to all relevant contexts
            if (updates.settings) systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { settings: updates.settings } });
            if (updates.themes) systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: { themes: updates.themes } });
            if (updates.users) setUsers(updates.users);
            if (updates.loginHistory) setLoginHistory(updates.loginHistory);
            if (updates.quests) questsDispatch({ type: 'UPDATE_QUESTS_DATA', payload: { quests: updates.quests } });
            if (updates.questGroups) questsDispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questGroups: updates.questGroups } });
            if (updates.questCompletions) questsDispatch({ type: 'UPDATE_QUESTS_DATA', payload: { questCompletions: updates.questCompletions } });
            if (updates.rotations) questsDispatch({ type: 'UPDATE_QUESTS_DATA', payload: { rotations: updates.rotations } });
            if (updates.markets) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { markets: updates.markets } });
            if (updates.gameAssets) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gameAssets: updates.gameAssets } });
            if (updates.purchaseRequests) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { purchaseRequests: updates.purchaseRequests } });
            if (updates.rewardTypes) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { rewardTypes: updates.rewardTypes } });
            if (updates.tradeOffers) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { tradeOffers: updates.tradeOffers } });
            if (updates.gifts) economyDispatch({ type: 'UPDATE_ECONOMY_DATA', payload: { gifts: updates.gifts } });
            if (updates.ranks) progressionDispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { ranks: updates.ranks } });
            if (updates.trophies) progressionDispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { trophies: updates.trophies } });
            if (updates.userTrophies) progressionDispatch({ type: 'UPDATE_PROGRESSION_DATA', payload: { userTrophies: updates.userTrophies } });
            if (updates.guilds) communityDispatch({ type: 'UPDATE_COMMUNITY_DATA', payload: { guilds: updates.guilds } });
            
            const systemPayload: Partial<SystemState> = {};
            if (updates.systemLogs) systemPayload.systemLogs = updates.systemLogs;
            if (updates.adminAdjustments) systemPayload.adminAdjustments = updates.adminAdjustments;
            if (updates.systemNotifications) systemPayload.systemNotifications = updates.systemNotifications;
            if (updates.scheduledEvents) systemPayload.scheduledEvents = updates.scheduledEvents;
            if (updates.chatMessages) systemPayload.chatMessages = updates.chatMessages;
            if (updates.bugReports) systemPayload.bugReports = updates.bugReports;
            if (updates.modifierDefinitions) systemPayload.modifierDefinitions = updates.modifierDefinitions;
            if (updates.appliedModifiers) systemPayload.appliedModifiers = updates.appliedModifiers;
            if (updates.chronicleEvents) systemPayload.chronicleEvents = updates.chronicleEvents;
            if (updates.minigames) systemPayload.minigames = updates.minigames;
            if (updates.gameScores) systemPayload.gameScores = updates.gameScores;
            if (updates.aiTutors) systemPayload.aiTutors = updates.aiTutors;
            if (updates.aiTutorSessionLogs) systemPayload.aiTutorSessionLogs = updates.aiTutorSessionLogs;
            if (Object.keys(systemPayload).length > 0) {
                systemDispatch({ type: 'UPDATE_SYSTEM_DATA', payload: systemPayload });
            }
        }
        
        lastSyncTimestamp.current = newSyncTimestamp;
        setSyncStatus('success');
        
        if (!isDataLoaded) {
            setIsDataLoaded(true);
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown sync error';
        setSyncStatus('error');
        setSyncError(message);
    }
  }, [isDataLoaded, addNotification, setUsers, setLoginHistory, questsDispatch, economyDispatch, progressionDispatch, communityDispatch, systemDispatch]);

  useEffect(() => {
    syncData(); // Initial full sync
  }, [syncData]);

  useEffect(() => {
    const eventSource = new EventSource('/api/data/events');
    eventSource.onmessage = (event) => {
      if (event.data === 'sync') {
        syncData();
      }
    };
    eventSource.onerror = () => {
      console.error('SSE connection error. Disconnected from live updates.');
      eventSource.close();
    };
    return () => eventSource.close();
  }, [syncData]);
  
  const syncContextValue = useMemo(() => ({ syncStatus, syncError }), [syncStatus, syncError]);

  return (
    <DataLoadedContext.Provider value={isDataLoaded}>
      <SyncStatusContext.Provider value={syncContextValue}>
        {isDataLoaded ? children : <div className="flex items-center justify-center h-screen bg-stone-900 text-white"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div></div>}
      </SyncStatusContext.Provider>
    </DataLoadedContext.Provider>
  );
};

export const useDataLoaded = () => useContext(DataLoadedContext);
// FIX: Export the missing useSyncStatus hook.
export const useSyncStatus = () => useContext(SyncStatusContext);
