import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent } from '../types';
import { INITIAL_SETTINGS, createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, createInitialQuestCompletions, INITIAL_TAGS, INITIAL_QUEST_GROUPS } from '../data/initialData';

// The single, unified state for the entire application
interface AppState extends IAppData {
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  currentUser: User | null;
  activePage: Page;
  appMode: AppMode;
  notifications: Notification[];
  isDataLoaded: boolean;
  activeMarketId: string | null;
  allTags: string[];
  isSwitchingUser: boolean;
  isSharedViewActive: boolean;
  targetedUserForLogin: User | null;
  isAiConfigured: boolean;
  isSidebarCollapsed: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  isChatOpen: boolean;
  isRestarting: boolean;
}

// The single, unified dispatch for the entire application
interface AppDispatch {
  // Auth
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => Promise<User | undefined>;
  updateUser: (userId: string, updatedData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  markUserAsOnboarded: (userId: string) => Promise<void>;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  exitToSharedView: () => void;
  setIsSharedViewActive: (isActive: boolean) => void;
  bypassFirstRunCheck: () => void;
  reinitializeApp: () => Promise<void>;

  // Game Data
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => Promise<Quest | undefined>;
  updateQuest: (updatedQuest: Quest) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;
  cloneQuest: (questId: string) => Promise<void>;
  dismissQuest: (questId: string, userId: string) => Promise<void>;
  claimQuest: (questId: string, userId: string) => Promise<void>;
  releaseQuest: (questId: string, userId: string) => Promise<void>;
  markQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  unmarkQuestAsTodo: (questId: string, userId: string) => Promise<void>;
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => Promise<void>;
  approveQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  rejectQuestCompletion: (completionId: string, note?: string) => Promise<void>;
  addQuestGroup: (group: Omit<QuestGroup, 'id'>) => Promise<QuestGroup | undefined>;
  updateQuestGroup: (group: QuestGroup) => Promise<void>;
  deleteQuestGroup: (groupId: string) => Promise<void>;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => Promise<void>;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | undefined>;
  updateRewardType: (rewardType: RewardTypeDefinition) => Promise<void>;
  deleteRewardType: (rewardTypeId: string) => Promise<void>;
  cloneRewardType: (rewardTypeId: string) => Promise<void>;
  addMarket: (market: Omit<Market, 'id'>) => Promise<Market | undefined>;
  updateMarket: (market: Market) => Promise<void>;
  deleteMarket: (marketId: string) => Promise<void>;
  cloneMarket: (marketId: string) => Promise<void>;
  deleteMarkets: (marketIds: string[]) => Promise<void>;
  updateMarketsStatus: (marketIds: string[], status: 'open' | 'closed') => Promise<void>;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => Promise<void>;
  approvePurchaseRequest: (purchaseId: string) => Promise<void>;
  rejectPurchaseRequest: (purchaseId: string) => Promise<void>;
  cancelPurchaseRequest: (purchaseId: string) => Promise<void>;
  addGuild: (guild: Omit<Guild, 'id'>) => Promise<Guild | undefined>;
  updateGuild: (guild: Guild) => Promise<void>;
  deleteGuild: (guildId: string) => Promise<void>;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => Promise<Trophy | undefined>;
  updateTrophy: (trophy: Trophy) => Promise<void>;
  deleteTrophy: (trophyId: string) => Promise<void>;
  cloneTrophy: (trophyId: string) => Promise<void>;
  deleteTrophies: (trophyIds: string[]) => Promise<void>;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => Promise<void>;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => Promise<GameAsset | undefined>;
  updateGameAsset: (asset: GameAsset) => Promise<void>;
  deleteGameAsset: (assetId: string) => Promise<void>;
  deleteGameAssets: (assetIds: string[]) => Promise<void>;
  cloneGameAsset: (assetId: string) => Promise<void>;
  
  // Themes
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => Promise<ThemeDefinition | undefined>;
  updateTheme: (theme: ThemeDefinition) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // UI
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;

  // Data Management
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => Promise<void>;
  restoreFromBackup: (backupData: any) => Promise<void>;
  restoreDefaultObjects: (objectType: 'trophies') => Promise<void>;
  clearAllHistory: () => Promise<void>;
  resetAllPlayerData: () => Promise<void>;
  deleteAllCustomContent: () => Promise<void>;
  
  // First Run
  completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null) => Promise<{ message: string; adminUser: User; } | undefined>;
  
  // Ranks
  setRanks: (ranks: Rank[]) => void;

  // Chat
  sendMessage: (message: Partial<ChatMessage>) => Promise<ChatMessage | undefined>;
  markMessagesAsRead: (options: { partnerId?: string; guildId?: string }) => Promise<void>;

  // System Notifications
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => Promise<SystemNotification | undefined>;
  markSystemNotificationsAsRead: (notificationIds: string[]) => Promise<void>;

  // Scheduled Events
  addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => Promise<ScheduledEvent | undefined>;
  updateScheduledEvent: (event: ScheduledEvent) => Promise<void>;
  deleteScheduledEvent: (eventId: string) => Promise<void>;
  
  // Bulk Actions
  deleteQuests: (questIds: string[]) => Promise<void>;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => Promise<void>;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => Promise<void>;

  // Assets
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => Promise<void>;

}

// This is where the magic happens. We'll implement the provider and hooks here.
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = (): AppDispatch => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};

// Placeholder for now. Actual implementation would involve API calls.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        // Default empty state
        users: [], quests: [], questGroups: [], markets: [], rewardTypes: [], questCompletions: [],
        purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [],
        adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
        themes: [], loginHistory: [], chatMessages: [], systemNotifications: [], scheduledEvents: [],
        isAppUnlocked: false, isFirstRun: true, currentUser: null,
        activePage: 'Dashboard', appMode: { mode: 'personal' }, notifications: [],
        isDataLoaded: false, activeMarketId: null, allTags: [],
        isSwitchingUser: false, isSharedViewActive: false, targetedUserForLogin: null,
        isAiConfigured: false, isSidebarCollapsed: false, syncStatus: 'idle', syncError: null, isChatOpen: false,
        isRestarting: false,
    });

    const isMounted = useRef(true);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeoutId = useRef<number | null>(null);

    useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; }
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notif-${Date.now()}`;
        setState(s => ({ ...s, notifications: [...s.notifications, { ...notification, id }] }));
        setTimeout(() => removeNotification(id), 5000);
    }, []);

    const removeNotification = useCallback((notificationId: string) => {
        setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== notificationId) }));
    }, []);

    // Generic API handler
    const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(endpoint, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
             if (response.status === 204) return null; // Handle No Content response
            return response.json();
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            if (error instanceof Error) {
                addNotification({ type: 'error', message: error.message });
            }
            throw error;
        }
    }, [addNotification]);
    
    // A function to optimistically update state, then persist the entire state to the backend.
    // Use this for operations that don't have a dedicated backend endpoint.
    const updateAndSave = useCallback((updater: (prevState: AppState) => Partial<IAppData>) => {
        setState(prev => {
            const changes = updater(prev);
            const optimisticState = { ...prev, ...changes };
    
            // Separate the data part to be saved
            const {
                isAppUnlocked, isFirstRun, currentUser, activePage, appMode, notifications, isDataLoaded,
                activeMarketId, allTags, isSwitchingUser, isSharedViewActive, targetedUserForLogin,
                isAiConfigured, isSidebarCollapsed, syncStatus, syncError, isChatOpen, isRestarting,
                ...dataToSave
            } = optimisticState;

            // Fire-and-forget the async save operation
            (async () => {
                if (!isMounted.current) return;
                try {
                    setState(s => ({...s, syncStatus: 'syncing'}));
                    await apiRequest('/api/data', {
                        method: 'POST',
                        body: JSON.stringify(dataToSave),
                    });
                    if (isMounted.current) {
                        setState(s => ({ ...s, syncStatus: 'success' }));
                    }
                } catch (error) {
                    if (isMounted.current) {
                        if (error instanceof Error) {
                            setState(s => ({...s, syncStatus: 'error', syncError: error.message }));
                        }
                    }
                    console.error("Failed to save state, optimistic update may be out of sync.", error);
                    // TODO: Implement state rollback on failure. Could restore `prev`.
                }
            })();
    
            return optimisticState;
        });
    }, [apiRequest]);


    const fullUpdate = useCallback((newData: IAppData) => {
        console.log('[FRONTEND LOG] Raw data object from WebSocket fullUpdate:', JSON.parse(JSON.stringify(newData)));
        if (!isMounted.current) return;
        setState(prev => {
            if (!newData || !newData.users || !newData.settings) {
                console.error("Received incomplete or malformed data from WebSocket. Update skipped.", newData);
                return prev;
            }
            
            const currentUserId = prev.currentUser?.id;
            const updatedCurrentUser = currentUserId
                ? (newData.users || prev.users).find(u => u.id === currentUserId) || null
                : null;
            
            // A more robust check: if there are no users, it must be the first run.
            const isFirstRunNow = !newData.users || newData.users.length === 0;

            // Create a new object containing only the data properties from the server payload
            const dataState: IAppData = {
                users: newData.users,
                quests: newData.quests,
                questGroups: newData.questGroups,
                markets: newData.markets,
                rewardTypes: newData.rewardTypes,
                questCompletions: newData.questCompletions,
                purchaseRequests: newData.purchaseRequests,
                guilds: newData.guilds,
                ranks: newData.ranks,
                trophies: newData.trophies,
                userTrophies: newData.userTrophies,
                adminAdjustments: newData.adminAdjustments,
                gameAssets: newData.gameAssets,
                systemLogs: newData.systemLogs,
                settings: newData.settings,
                themes: newData.themes,
                loginHistory: newData.loginHistory,
                chatMessages: newData.chatMessages,
                systemNotifications: newData.systemNotifications,
                scheduledEvents: newData.scheduledEvents,
            };

            return {
                ...prev, // Keep all old state (UI and data)
                ...dataState, // Overwrite only the data part with fresh data
                currentUser: updatedCurrentUser, // Use the fresh user
                isDataLoaded: true,
                isFirstRun: isFirstRunNow,
                syncStatus: 'success',
                syncError: null,
            };
        });
    }, []);

    const connectWebSocket = useCallback(() => {
        if (typeof window === 'undefined' || !window.location.host) {
            console.warn('WebSocket connection skipped: Not in a browser environment or host is missing.');
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        let reconnectAttempts = 0;

        const reconnect = () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) return;
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`WebSocket disconnected. Retrying in ${delay / 1000}s...`);
            setState(prev => ({ ...prev, syncStatus: 'syncing' }));
            if (reconnectTimeoutId.current) clearTimeout(reconnectTimeoutId.current);
            reconnectTimeoutId.current = window.setTimeout(connectWebSocket, delay);
        };

        socket.onopen = () => {
            console.log('WebSocket connected.');
            reconnectAttempts = 0;
            setState(prev => ({ ...prev, syncStatus: 'success', syncError: null }));
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'FULL_STATE_UPDATE') {
                    fullUpdate(message.payload);
                } else if (message.type === 'NEW_CHAT_MESSAGE') {
                    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, message.payload] }));
                }
            } catch (e) { console.error('Error parsing WebSocket message:', e); }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setState(prev => ({ ...prev, syncStatus: 'error', syncError: 'WebSocket connection failed.' }));
            socket.close();
        };

        socket.onclose = () => {
            if (isMounted.current) reconnect();
        };
    }, [fullUpdate]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await apiRequest('/api/data');
                console.log('[FRONTEND LOG] Raw data object from /api/data:', JSON.parse(JSON.stringify(data)));
                if (!data || !data.settings) { // Check for settings, as users can be empty on first run
                    throw new Error("Received malformed data from server. The database might be corrupted.");
                }

                const isFirstRun = !data.users || data.users.length === 0;
                const sharedViewActive = localStorage.getItem('sharedViewActive') === 'true' && data.settings.sharedMode.enabled;
                
                const lastUserId = localStorage.getItem('lastUserId');
                const lastUser = isFirstRun ? null : data.users.find((u: User) => u.id === lastUserId);
                
                if (isMounted.current) {
                  setState(prev => ({
                      ...prev, ...data, isFirstRun, isDataLoaded: true,
                      currentUser: lastUser || null, 
                      isAppUnlocked: !!lastUser || sharedViewActive,
                      isSharedViewActive: sharedViewActive,
                  }));
                }

                try {
                    const aiStatus = await apiRequest('/api/ai/status');
                    if (isMounted.current) {
                        setState(prev => ({ ...prev, isAiConfigured: aiStatus.isConfigured }));
                    }
                } catch (aiError) {
                    console.error("Failed to fetch AI status, continuing without it.", aiError);
                    if (isMounted.current) {
                        setState(prev => ({ ...prev, isAiConfigured: false }));
                    }
                }
            } catch (error) {
                console.error("Failed to load initial data:", error);
                 if (isMounted.current) {
                  setState(prev => ({ ...prev, isDataLoaded: true, syncStatus: 'error', syncError: error instanceof Error ? error.message : 'Failed to connect to server.' }));
                 }
            }
        };

        loadData();
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.onclose = null; // Prevent reconnection on unmount
                ws.current.close();
            }
            if (reconnectTimeoutId.current) {
                clearTimeout(reconnectTimeoutId.current);
            }
        };
    }, [connectWebSocket, apiRequest]);


    const dispatch: AppDispatch = useMemo(() => ({
        // Auth
        addUser: (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(userData) }),
        updateUser: (userId: string, updatedData: Partial<User>) => apiRequest(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updatedData) }),
        deleteUser: (userId: string) => apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
        setCurrentUser: (user: User | null) => { 
            setState(s => ({...s, currentUser: user, isSharedViewActive: false}));
            if (user) {
                localStorage.setItem('lastUserId', user.id);
                localStorage.removeItem('sharedViewActive');
            } else {
                localStorage.removeItem('lastUserId');
            }
        },
        markUserAsOnboarded: (userId: string) => dispatch.updateUser(userId, { hasBeenOnboarded: true }),
        setAppUnlocked: (isUnlocked: boolean) => setState(s => ({ ...s, isAppUnlocked: isUnlocked })),
        setIsSwitchingUser: (isSwitching: boolean) => setState(s => ({ ...s, isSwitchingUser: isSwitching })),
        setTargetedUserForLogin: (user: User | null) => setState(s => ({ ...s, targetedUserForLogin: user })),
        exitToSharedView: () => {
             setState(s => ({...s, currentUser: null, isAppUnlocked: true, isSharedViewActive: true }));
             localStorage.removeItem('lastUserId');
             localStorage.setItem('sharedViewActive', 'true');
        },
        setIsSharedViewActive: (isActive: boolean) => setState(s => ({ ...s, isSharedViewActive: isActive })),
        bypassFirstRunCheck: () => setState(s => ({...s, isFirstRun: false})),
        reinitializeApp: async () => {
            try {
                await apiRequest('/api/actions/reinitialize', { method: 'POST' });
                setState(s => ({ ...s, isRestarting: true }));
                // The page will automatically try to reconnect via websockets.
                // A full reload after a delay is a good fallback.
                setTimeout(() => {
                    window.location.reload();
                }, 7000); // Give it some time for the server to come back up
            } catch (error) {
                if (error instanceof Error) {
                    addNotification({ type: 'error', message: `Failed to send re-initialize command: ${error.message}` });
                }
            }
        },

        // Game Data
        addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => apiRequest('/api/quests', { method: 'POST', body: JSON.stringify(quest) }),
        updateQuest: (updatedQuest: Quest) => apiRequest(`/api/quests/${updatedQuest.id}`, { method: 'PUT', body: JSON.stringify(updatedQuest) }),
        deleteQuest: (questId: string) => apiRequest(`/api/quests/${questId}`, { method: 'DELETE' }),
        cloneQuest: async (questId: string) => updateAndSave(s => {
            const questToClone = s.quests.find(q => q.id === questId);
            if (!questToClone) return {};
            const newQuest = { ...questToClone, id: `quest-${Date.now()}`, title: `${questToClone.title} (Copy)` };
            return { quests: [...s.quests, newQuest] };
        }),
        dismissQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, dismissals: [...q.dismissals, {userId, dismissedAt: new Date().toISOString()}]} : q) })),
        claimQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, claimedByUserIds: [...q.claimedByUserIds, userId]} : q) })),
        releaseQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId)} : q) })),
        markQuestAsTodo: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/actions`, { method: 'POST', body: JSON.stringify({ action: 'mark_todo', userId }) }),
        unmarkQuestAsTodo: (questId: string, userId: string) => apiRequest(`/api/quests/${questId}/actions`, { method: 'POST', body: JSON.stringify({ action: 'unmark_todo', userId }) }),
        completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => apiRequest(`/api/quests/${questId}/complete`, { method: 'POST', body: JSON.stringify({ userId, note: options?.note, completionDate: options?.completionDate }) }),
        approveQuestCompletion: (completionId: string, note?: string) => apiRequest(`/api/completions/${completionId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
        rejectQuestCompletion: (completionId: string, note?: string) => apiRequest(`/api/completions/${completionId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
        addQuestGroup: (group: Omit<QuestGroup, 'id'>) => apiRequest('/api/questGroups', { method: 'POST', body: JSON.stringify(group) }),
        updateQuestGroup: (group: QuestGroup) => apiRequest(`/api/questGroups/${group.id}`, { method: 'PUT', body: JSON.stringify(group) }),
        deleteQuestGroup: (groupId: string) => apiRequest(`/api/questGroups/${groupId}`, { method: 'DELETE' }),
        assignQuestGroupToUsers: async (groupId: string, userIds: string[]) => updateAndSave(s => ({ quests: s.quests.map(q => q.groupId === groupId ? { ...q, assignedUserIds: [...new Set([...q.assignedUserIds, ...userIds])] } : q) })),
        addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => apiRequest('/api/rewardTypes', { method: 'POST', body: JSON.stringify(rewardType) }),
        updateRewardType: (rewardType: RewardTypeDefinition) => apiRequest(`/api/rewardTypes/${rewardType.id}`, { method: 'PUT', body: JSON.stringify(rewardType) }),
        deleteRewardType: (rewardTypeId: string) => apiRequest(`/api/rewardTypes/${rewardTypeId}`, { method: 'DELETE' }),
        cloneRewardType: async (rewardTypeId: string) => updateAndSave(s => {
            const typeToClone = s.rewardTypes.find(rt => rt.id === rewardTypeId);
            if (!typeToClone) return {};
            const newType = { ...typeToClone, isCore: false, id: `rt-${Date.now()}`, name: `${typeToClone.name} (Copy)` };
            return { rewardTypes: [...s.rewardTypes, newType] };
        }),
        addMarket: (market: Omit<Market, 'id'>) => apiRequest('/api/markets', { method: 'POST', body: JSON.stringify(market) }),
        updateMarket: (market: Market) => apiRequest(`/api/markets/${market.id}`, { method: 'PUT', body: JSON.stringify(market) }),
        deleteMarket: (marketId: string) => apiRequest(`/api/markets/${marketId}`, { method: 'DELETE' }),
        cloneMarket: async (marketId: string) => updateAndSave(s => {
            const marketToClone = s.markets.find(m => m.id === marketId);
            if (!marketToClone) return {};
            const newMarket = { ...marketToClone, id: `mkt-${Date.now()}`, title: `${marketToClone.title} (Copy)` };
            return { markets: [...s.markets, newMarket] };
        }),
        deleteMarkets: async (marketIds: string[]) => updateAndSave(s => ({ markets: s.markets.filter(m => !marketIds.includes(m.id)) })),
        updateMarketsStatus: async (marketIds: string[], status: 'open' | 'closed') => updateAndSave(s => ({ markets: s.markets.map(m => marketIds.includes(m.id) ? { ...m, status: { type: status } as MarketStatus } : m) })),
        purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => apiRequest('/api/actions/purchase', { method: 'POST', body: JSON.stringify({ assetId, marketId, userId: user.id, costGroupIndex, guildId: state.appMode.mode === 'guild' ? state.appMode.guildId : undefined }) }),
        approvePurchaseRequest: (purchaseId: string) => apiRequest(`/api/purchase-requests/${purchaseId}/approve`, { method: 'POST' }),
        rejectPurchaseRequest: (purchaseId: string) => apiRequest(`/api/purchase-requests/${purchaseId}/reject`, { method: 'POST' }),
        cancelPurchaseRequest: (purchaseId: string) => apiRequest(`/api/purchase-requests/${purchaseId}/cancel`, { method: 'POST' }),
        addGuild: (guild: Omit<Guild, 'id'>) => apiRequest('/api/guilds', { method: 'POST', body: JSON.stringify(guild) }),
        updateGuild: (guild: Guild) => apiRequest(`/api/guilds/${guild.id}`, { method: 'PUT', body: JSON.stringify(guild) }),
        deleteGuild: (guildId: string) => apiRequest(`/api/guilds/${guildId}`, { method: 'DELETE' }),
        addTrophy: (trophy: Omit<Trophy, 'id'>) => apiRequest('/api/trophies', { method: 'POST', body: JSON.stringify(trophy) }),
        updateTrophy: (trophy: Trophy) => apiRequest(`/api/trophies/${trophy.id}`, { method: 'PUT', body: JSON.stringify(trophy) }),
        deleteTrophy: (trophyId: string) => apiRequest(`/api/trophies/${trophyId}`, { method: 'DELETE' }),
        cloneTrophy: async (trophyId: string) => updateAndSave(s => {
            const trophyToClone = s.trophies.find(t => t.id === trophyId);
            if (!trophyToClone) return {};
            const newTrophy = { ...trophyToClone, id: `t-${Date.now()}`, name: `${trophyToClone.name} (Copy)` };
            return { trophies: [...s.trophies, newTrophy] };
        }),
        deleteTrophies: async (trophyIds: string[]) => updateAndSave(s => ({ trophies: s.trophies.filter(t => !trophyIds.includes(t.id)) })),
        awardTrophy: async (userId: string, trophyId: string, guildId?: string) => updateAndSave(s => ({ userTrophies: [...s.userTrophies, { id: `ut-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }] })),
        applyManualAdjustment: async (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => {
            updateAndSave(s => ({ adminAdjustments: [...s.adminAdjustments, { ...adjustment, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() }] }));
            return true;
        },
        addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>) => apiRequest('/api/gameAssets', { method: 'POST', body: JSON.stringify(asset) }),
        updateGameAsset: (asset: GameAsset) => apiRequest(`/api/gameAssets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) }),
        deleteGameAsset: (assetId: string) => apiRequest(`/api/gameAssets/${assetId}`, { method: 'DELETE' }),
        deleteGameAssets: async (assetIds: string[]) => updateAndSave(s => ({ gameAssets: s.gameAssets.filter(a => !assetIds.includes(a.id)) })),
        cloneGameAsset: async (assetId: string) => updateAndSave(s => {
            const assetToClone = s.gameAssets.find(a => a.id === assetId);
            if (!assetToClone) return {};
            const newAsset = { ...assetToClone, id: `ga-${Date.now()}`, name: `${assetToClone.name} (Copy)` };
            return { gameAssets: [...s.gameAssets, newAsset] };
        }),
        
        // Themes
        addTheme: (theme: Omit<ThemeDefinition, 'id'>) => apiRequest('/api/themes', { method: 'POST', body: JSON.stringify(theme) }),
        updateTheme: (theme: ThemeDefinition) => apiRequest(`/api/themes/${theme.id}`, { method: 'PUT', body: JSON.stringify(theme) }),
        deleteTheme: (themeId: string) => apiRequest(`/api/themes/${themeId}`, { method: 'DELETE' }),

        // Settings
        updateSettings: (newSettings: Partial<AppSettings>) => updateAndSave(s => ({ settings: { ...s.settings, ...newSettings } })),
        resetSettings: () => updateAndSave(() => ({ settings: INITIAL_SETTINGS })),
        
        // UI
        setActivePage: (page: Page) => setState(s => ({ ...s, activePage: page })),
        setAppMode: (mode: AppMode) => setState(s => ({ ...s, appMode: mode })),
        addNotification,
        removeNotification,
        setActiveMarketId: (marketId: string | null) => setState(s => ({ ...s, activeMarketId: marketId })),
        toggleSidebar: () => setState(s => ({...s, isSidebarCollapsed: !s.isSidebarCollapsed})),
        toggleChat: () => setState(s => ({...s, isChatOpen: !s.isChatOpen})),

        // Data Management
        importBlueprint: async (blueprint: Blueprint, resolutions: ImportResolution[]) => updateAndSave(s => { /* complex logic */ return {}; }),
        restoreFromBackup: async (backupData: IAppData) => updateAndSave(() => ({...backupData})),
        restoreDefaultObjects: async (objectType: 'trophies') => updateAndSave(s => ({ trophies: [...s.trophies, ...INITIAL_TROPHIES.filter(it => !s.trophies.some(t => t.id === it.id))] })),
        clearAllHistory: async () => updateAndSave(() => ({ questCompletions: [], purchaseRequests: [], systemLogs: [], adminAdjustments: [] })),
        resetAllPlayerData: async () => updateAndSave(s => ({ users: s.users.map(u => ({...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], userTrophies: []})) })),
        deleteAllCustomContent: async () => {
            try {
                await apiRequest('/api/actions/factory-reset', { method: 'POST' });
                addNotification({ type: 'success', message: 'Custom content has been reset successfully.' });
            } catch (error) {
                // apiRequest will show the error notification
            }
        },
        
        // First Run
        completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null) => apiRequest('/api/first-run', { method: 'POST', body: JSON.stringify({ adminUserData, setupChoice, blueprint }) }),
        
        // Ranks
        setRanks: (ranks: Rank[]) => updateAndSave(() => ({ ranks })),

        // Chat
        sendMessage: (message: Partial<ChatMessage>) => apiRequest('/api/chat/messages', { method: 'POST', body: JSON.stringify({ ...message, senderId: state.currentUser?.id }) }),
        markMessagesAsRead: (options: { partnerId?: string; guildId?: string }) => apiRequest('/api/chat/read', { method: 'POST', body: JSON.stringify({ ...options, userId: state.currentUser?.id }) }),

        // System Notifications
        addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => apiRequest('/api/systemNotifications', { method: 'POST', body: JSON.stringify(notification) }),
        markSystemNotificationsAsRead: (notificationIds: string[]) => apiRequest('/api/systemNotifications/read', { method: 'POST', body: JSON.stringify({ notificationIds, userId: state.currentUser?.id }) }),

        // Scheduled Events
        addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => apiRequest('/api/scheduledEvents', { method: 'POST', body: JSON.stringify(event) }),
        updateScheduledEvent: (event: ScheduledEvent) => apiRequest(`/api/scheduledEvents/${event.id}`, { method: 'PUT', body: JSON.stringify(event) }),
        deleteScheduledEvent: (eventId: string) => apiRequest(`/api/scheduledEvents/${eventId}`, { method: 'DELETE' }),
        
        // Bulk Actions
        deleteQuests: async (questIds: string[]) => updateAndSave(s => ({ quests: s.quests.filter(q => !questIds.includes(q.id)) })),
        updateQuestsStatus: async (questIds: string[], isActive: boolean) => updateAndSave(s => ({ quests: s.quests.map(q => questIds.includes(q.id) ? { ...q, isActive } : q) })),
        bulkUpdateQuests: async (questIds: string[], updates: BulkQuestUpdates) => updateAndSave(s => ({
            quests: s.quests.map(q => {
                if (!questIds.includes(q.id)) return q;

                let updatedQuest = { ...q };
                if (updates.isActive !== undefined) updatedQuest.isActive = updates.isActive;
                if (updates.isOptional !== undefined) updatedQuest.isOptional = updates.isOptional;
                if (updates.requiresApproval !== undefined) updatedQuest.requiresApproval = updates.requiresApproval;
                if (updates.groupId !== undefined) updatedQuest.groupId = updates.groupId === null ? undefined : updates.groupId;
                if (updates.addTags) updatedQuest.tags = [...new Set([...updatedQuest.tags, ...updates.addTags])];
                if (updates.removeTags) updatedQuest.tags = updatedQuest.tags.filter(t => !updates.removeTags!.includes(t));
                if (updates.assignUsers) updatedQuest.assignedUserIds = [...new Set([...updatedQuest.assignedUserIds, ...updates.assignUsers])];
                if (updates.unassignUsers) updatedQuest.assignedUserIds = updatedQuest.assignedUserIds.filter(id => !updates.unassignUsers!.includes(id));
                
                return updatedQuest;
            })
        })),

        // Assets
        uploadFile: async (file: File, category?: string) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) {
                formData.append('category', category);
            }
            try {
                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'File upload failed');
                }
                if (response.status === 204) return null;
                return response.json();
            } catch (error) {
                console.error('File Upload Error:', error);
                if (error instanceof Error) {
                    addNotification({ type: 'error', message: error.message });
                }
                return null;
            }
        },
        executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => apiRequest('/api/actions/exchange', { method: 'POST', body: JSON.stringify({ userId, payItem, receiveItem, guildId }) }),
    }), [state.currentUser, state.appMode, apiRequest, addNotification, removeNotification, updateAndSave]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};