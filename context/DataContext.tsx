
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useReducer, useRef, useMemo } from 'react';
import { IAppData, User, AppSettings, ThemeDefinition, Quest, QuestGroup, QuestCompletion, Rotation, Market, GameAsset, PurchaseRequest, RewardTypeDefinition, TradeOffer, Gift, Rank, Trophy, UserTrophy, Guild, SystemLog, AdminAdjustment, SystemNotification, ScheduledEvent, ChatMessage, BugReport, ModifierDefinition, AppliedModifier } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import { useNotificationsDispatch } from './NotificationsContext';
import { useAuthDispatch, useAuthState } from './AuthContext';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// --- STATE & CONTEXT DEFINITIONS ---

// Combined state for the reducer
interface DataState extends IAppData {
  isDataLoaded: boolean;
  isAiConfigured: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  allTags: string[];
}

// Context Slice Shapes
interface SyncState { syncStatus: SyncStatus; syncError: string | null; }
interface SettingsState { settings: AppSettings; themes: ThemeDefinition[]; isAiConfigured: boolean; }
interface QuestsState { quests: Quest[]; questGroups: QuestGroup[]; questCompletions: QuestCompletion[]; rotations: Rotation[]; allTags: string[]; }
interface EconomyState { markets: Market[]; gameAssets: GameAsset[]; purchaseRequests: PurchaseRequest[]; rewardTypes: RewardTypeDefinition[]; tradeOffers: TradeOffer[]; gifts: Gift[]; }
interface ProgressionState { ranks: Rank[]; trophies: Trophy[]; userTrophies: UserTrophy[]; }
interface CommunityState { guilds: Guild[]; }
interface SystemState { systemLogs: SystemLog[]; adminAdjustments: AdminAdjustment[]; systemNotifications: SystemNotification[]; scheduledEvents: ScheduledEvent[]; chatMessages: ChatMessage[]; bugReports: BugReport[]; modifierDefinitions: ModifierDefinition[]; appliedModifiers: AppliedModifier[]; }

// Reducer Action
type DataAction = 
  | { type: 'SET_ALL_DATA', payload: Partial<IAppData> }
  | { type: 'UPDATE_DATA', payload: Partial<IAppData> }
  | { type: 'REMOVE_DATA', payload: { [key in keyof IAppData]?: string[] } }
  | { type: 'SET_AI_CONFIGURED', payload: boolean }
  | { type: 'SET_SYNC_STATE', payload: { syncStatus: SyncStatus, syncError: string | null } };

// Context Objects
const DataLoadedContext = createContext<boolean>(false);
const SyncStatusContext = createContext<SyncState>({ syncStatus: 'idle', syncError: null });
const SettingsContext = createContext<SettingsState | undefined>(undefined);
const QuestsContext = createContext<QuestsState | undefined>(undefined);
const EconomyContext = createContext<EconomyState | undefined>(undefined);
const ProgressionContext = createContext<ProgressionState | undefined>(undefined);
const CommunityContext = createContext<CommunityState | undefined>(undefined);
const SystemContext = createContext<SystemState | undefined>(undefined);
export const DataDispatchContext = createContext<React.Dispatch<DataAction> | undefined>(undefined);


// --- REDUCER & INITIAL STATE ---

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
  modifierDefinitions: [],
  appliedModifiers: [],
  tradeOffers: [],
  gifts: [],
  settings: INITIAL_SETTINGS,
  loginHistory: [],
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
    switch (action.type) {
        case 'SET_SYNC_STATE':
            return { ...state, syncStatus: action.payload.syncStatus, syncError: action.payload.syncError };
        case 'SET_AI_CONFIGURED':
            return { ...state, isAiConfigured: action.payload };
        case 'SET_ALL_DATA':
            return {
                ...state,
                ...action.payload,
                isDataLoaded: true,
                allTags: Array.from(new Set(action.payload.quests?.flatMap(q => q.tags) || [])),
            };
        case 'REMOVE_DATA':
            const stateWithRemoved = { ...state };
            for (const key in action.payload) {
                const typedKey = key as keyof IAppData;
                if (Array.isArray(stateWithRemoved[typedKey])) {
                    const idsToRemove = new Set(action.payload[typedKey] as string[]);
                    (stateWithRemoved as any)[typedKey] = (stateWithRemoved[typedKey] as any[]).filter(item => !idsToRemove.has(item.id));
                }
            }
            return {
                ...stateWithRemoved,
                allTags: Array.from(new Set(stateWithRemoved.quests.flatMap(q => q.tags))),
            };
        case 'UPDATE_DATA':
             const updatedState = { ...state };
             for (const key in action.payload) {
                if (key === 'users') continue; // Let AuthContext handle user updates exclusively to prevent conflicts.

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

// --- DATA PROVIDER COMPONENT ---

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { addNotification } = useNotificationsDispatch();
  const { setUsers, setCurrentUser, setLoginHistory, updateUser } = useAuthDispatch();
  const { users } = useAuthState();

  const lastSyncTimestamp = useRef<string | null>(null);

  const syncData = useCallback(async () => {
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
            if (updates.users) {
                const existingUserIds = new Set(users.map(u => u.id));
                const usersToAdd: User[] = [];
                updates.users.forEach((user: User) => {
                    if (existingUserIds.has(user.id)) {
                        updateUser(user.id, user); 
                    } else {
                        usersToAdd.push(user);
                    }
                });
                if (usersToAdd.length > 0) {
                    setUsers(currentUsers => [...currentUsers, ...usersToAdd]);
                }
            }
            if (updates.loginHistory) {
                setLoginHistory(updates.loginHistory);
            }
        } else { // Initial load
            dispatch({ type: 'SET_ALL_DATA', payload: updates });
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

            // After initial load, check system status for AI configuration
            try {
                const statusRes = await fetch('/api/system/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    dispatch({ type: 'SET_AI_CONFIGURED', payload: statusData.geminiConnected });
                }
            } catch (e) {
                console.error("Could not fetch system status for AI check", e);
            }
        }

        lastSyncTimestamp.current = newSyncTimestamp;
        dispatch({ type: 'SET_SYNC_STATE', payload: { syncStatus: 'success', syncError: null } });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("Sync failed:", message);
        dispatch({ type: 'SET_SYNC_STATE', payload: { syncStatus: 'error', syncError: message } });
    }
  }, [users, addNotification, setUsers, setCurrentUser, setLoginHistory, updateUser]);

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

  // Memoized State Slices
  const syncState = useMemo(() => ({ syncStatus: state.syncStatus, syncError: state.syncError }), [state.syncStatus, state.syncError]);
  const settingsState = useMemo(() => ({ settings: state.settings, themes: state.themes, isAiConfigured: state.isAiConfigured }), [state.settings, state.themes, state.isAiConfigured]);
  const questsState = useMemo(() => ({ quests: state.quests, questGroups: state.questGroups, questCompletions: state.questCompletions, rotations: state.rotations, allTags: state.allTags }), [state.quests, state.questGroups, state.questCompletions, state.rotations, state.allTags]);
  const economyState = useMemo(() => ({ markets: state.markets, gameAssets: state.gameAssets, purchaseRequests: state.purchaseRequests, rewardTypes: state.rewardTypes, tradeOffers: state.tradeOffers, gifts: state.gifts }), [state.markets, state.gameAssets, state.purchaseRequests, state.rewardTypes, state.tradeOffers, state.gifts]);
  const progressionState = useMemo(() => ({ ranks: state.ranks, trophies: state.trophies, userTrophies: state.userTrophies }), [state.ranks, state.trophies, state.userTrophies]);
  const communityState = useMemo(() => ({ guilds: state.guilds }), [state.guilds]);
  const systemState = useMemo(() => ({ systemLogs: state.systemLogs, adminAdjustments: state.adminAdjustments, systemNotifications: state.systemNotifications, scheduledEvents: state.scheduledEvents, chatMessages: state.chatMessages, bugReports: state.bugReports, modifierDefinitions: state.modifierDefinitions, appliedModifiers: state.appliedModifiers }), [state.systemLogs, state.adminAdjustments, state.systemNotifications, state.scheduledEvents, state.chatMessages, state.bugReports, state.modifierDefinitions, state.appliedModifiers]);


  return (
    <DataDispatchContext.Provider value={dispatch}>
        <DataLoadedContext.Provider value={state.isDataLoaded}>
            <SyncStatusContext.Provider value={syncState}>
                <SettingsContext.Provider value={settingsState}>
                    <QuestsContext.Provider value={questsState}>
                        <EconomyContext.Provider value={economyState}>
                            <ProgressionContext.Provider value={progressionState}>
                                <CommunityContext.Provider value={communityState}>
                                    <SystemContext.Provider value={systemState}>
                                        {children}
                                    </SystemContext.Provider>
                                </CommunityContext.Provider>
                            </ProgressionContext.Provider>
                        </EconomyContext.Provider>
                    </QuestsContext.Provider>
                </SettingsContext.Provider>
            </SyncStatusContext.Provider>
        </DataLoadedContext.Provider>
    </DataDispatchContext.Provider>
  );
};

// --- CUSTOM HOOKS ---

export const useDataDispatch = (): React.Dispatch<DataAction> => {
    const context = useContext(DataDispatchContext);
    if (context === undefined) throw new Error('useDataDispatch must be used within a DataProvider');
    return context;
};

export const useIsDataLoaded = (): boolean => useContext(DataLoadedContext);

export const useSyncStatus = (): SyncState => useContext(SyncStatusContext);

const createHook = <T,>(Context: React.Context<T | undefined>, name: string): () => T => {
    return () => {
        const context = useContext(Context);
        if (context === undefined) throw new Error(`${name} must be used within a DataProvider`);
        return context;
    };
};

export const useSettings = createHook<SettingsState>(SettingsContext, 'useSettings');
export const useQuests = createHook<QuestsState>(QuestsContext, 'useQuests');
export const useEconomy = createHook<EconomyState>(EconomyContext, 'useEconomy');
export const useProgression = createHook<ProgressionState>(ProgressionContext, 'useProgression');
export const useCommunity = createHook<CommunityState>(CommunityContext, 'useCommunity');
export const useSystem = createHook<SystemState>(SystemContext, 'useSystem');
