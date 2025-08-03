import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, AppDispatch } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';

declare var Primus: any;

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
  isAiReplying: boolean;
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
        isRestarting: false, isAiReplying: false,
    });

    const isMounted = useRef(true);
    const primusRef = useRef<any | null>(null);

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
    
    // Generic action dispatcher
    const dispatchAction = useCallback(async (type: string, payload: any) => {
        try {
            setState(s => ({ ...s, syncStatus: 'syncing' }));
            const result = await apiRequest('/api/action', {
                method: 'POST',
                body: JSON.stringify({ type, payload })
            });
            // The websocket will handle the state update, so we don't do it here.
            // We just set sync status back to success locally after the request is acknowledged.
            if (isMounted.current) {
                setState(s => ({ ...s, syncStatus: 'success' }));
            }
            return result;
        } catch (error) {
            // Error notification is handled by apiRequest
             if (isMounted.current) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setState(s => ({ ...s, syncStatus: 'error', syncError: errorMessage }));
             }
             throw error;
        }
    }, [apiRequest]);

    const fullUpdate = useCallback((newData: IAppData) => {
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
            
            const isFirstRunNow = !newData.users || newData.users.length === 0;

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
                ...prev,
                ...dataState,
                currentUser: updatedCurrentUser,
                isDataLoaded: true,
                isFirstRun: isFirstRunNow,
                syncStatus: 'success',
                syncError: null,
            };
        });
    }, []);

    const connectPrimus = useCallback(() => {
        if (typeof window === 'undefined' || primusRef.current || typeof Primus === 'undefined') {
            return;
        }

        const primus = Primus.connect('/');
        primusRef.current = primus;

        primus.on('open', () => {
            console.log('Primus connection established.');
            if (isMounted.current) {
                setState(prev => ({ ...prev, syncStatus: 'success', syncError: null }));
            }
        });

        primus.on('data', (message: any) => {
            if (message.type === 'FULL_STATE_UPDATE') {
                fullUpdate(message.payload);
            }
        });

        primus.on('error', (error: any) => {
            console.error('Primus error:', error);
            if (isMounted.current) {
                setState(prev => ({ ...prev, syncStatus: 'error', syncError: 'Real-time connection failed.' }));
            }
        });
        
        primus.on('reconnect', () => {
            console.log('Primus attempting to reconnect...');
            if (isMounted.current) {
                setState(prev => ({ ...prev, syncStatus: 'syncing' }));
            }
        });

        primus.on('end', () => {
            if (!isMounted.current) return;
            console.log('Primus connection ended.');
            setState(prev => ({ ...prev, syncStatus: 'error', syncError: 'Real-time connection lost.' }));
        });

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
        connectPrimus();

        return () => {
            if (primusRef.current) {
                primusRef.current.end();
            }
        };
    }, [connectPrimus, apiRequest]);


    const dispatch: AppDispatch = useMemo(() => ({
        // Auth
        addUser: (userData) => dispatchAction('ADD_USER', userData),
        updateUser: (userId, updatedData) => dispatchAction('UPDATE_USER', { userId, updatedData }),
        deleteUser: (userId) => dispatchAction('DELETE_USER', { userId }),
        setCurrentUser: (user: User | null) => { 
            setState(s => ({...s, currentUser: user, isSharedViewActive: false}));
            if (user) {
                localStorage.setItem('lastUserId', user.id);
                localStorage.removeItem('sharedViewActive');
            } else {
                localStorage.removeItem('lastUserId');
            }
        },
        markUserAsOnboarded: (userId) => dispatch.updateUser(userId, { hasBeenOnboarded: true }),
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
                setTimeout(() => window.location.reload(), 7000);
            } catch (error) {
                if (error instanceof Error) addNotification({ type: 'error', message: `Failed to re-initialize: ${error.message}` });
            }
        },

        // Game Data
        addQuest: (quest) => dispatchAction('ADD_QUEST', quest),
        updateQuest: (updatedQuest) => dispatchAction('UPDATE_QUEST', updatedQuest),
        deleteQuest: (questId) => dispatchAction('DELETE_QUEST', { questId }),
        cloneQuest: (questId) => dispatchAction('CLONE_QUEST', { questId }),
        dismissQuest: (questId, userId) => dispatchAction('DISMISS_QUEST', { questId, userId }),
        claimQuest: (questId, userId) => dispatchAction('CLAIM_QUEST', { questId, userId }),
        releaseQuest: (questId, userId) => dispatchAction('RELEASE_QUEST', { questId, userId }),
        markQuestAsTodo: (questId, userId) => dispatchAction('MARK_QUEST_TODO', { questId, userId }),
        unmarkQuestAsTodo: (questId, userId) => dispatchAction('UNMARK_QUEST_TODO', { questId, userId }),
        completeQuest: (questId, userId, guildId, options) => dispatchAction('COMPLETE_QUEST', { questId, userId, guildId, options }),
        approveQuestCompletion: (completionId, note) => dispatchAction('APPROVE_QUEST_COMPLETION', { completionId, note }),
        rejectQuestCompletion: (completionId, note) => dispatchAction('REJECT_QUEST_COMPLETION', { completionId, note }),
        addQuestGroup: (group) => dispatchAction('ADD_QUEST_GROUP', group),
        updateQuestGroup: (group) => dispatchAction('UPDATE_QUEST_GROUP', group),
        deleteQuestGroup: (groupId) => dispatchAction('DELETE_QUEST_GROUP', { groupId }),
        assignQuestGroupToUsers: (groupId, userIds) => dispatchAction('ASSIGN_QUEST_GROUP_TO_USERS', { groupId, userIds }),
        addRewardType: (rewardType) => dispatchAction('ADD_REWARD_TYPE', rewardType),
        updateRewardType: (rewardType) => dispatchAction('UPDATE_REWARD_TYPE', rewardType),
        deleteRewardType: (rewardTypeId) => dispatchAction('DELETE_REWARD_TYPE', { rewardTypeId }),
        cloneRewardType: (rewardTypeId) => dispatchAction('CLONE_REWARD_TYPE', { rewardTypeId }),
        addMarket: (market) => dispatchAction('ADD_MARKET', market),
        updateMarket: (market) => dispatchAction('UPDATE_MARKET', market),
        deleteMarket: (marketId) => dispatchAction('DELETE_MARKET', { marketId }),
        cloneMarket: (marketId) => dispatchAction('CLONE_MARKET', { marketId }),
        deleteMarkets: (marketIds) => dispatchAction('DELETE_MARKETS', { marketIds }),
        updateMarketsStatus: (marketIds, status) => dispatchAction('UPDATE_MARKETS_STATUS', { marketIds, status }),
        purchaseMarketItem: (assetId, marketId, userId, costGroupIndex, guildId) => dispatchAction('PURCHASE_MARKET_ITEM', { assetId, marketId, userId, costGroupIndex, guildId }),
        approvePurchaseRequest: (purchaseId) => dispatchAction('APPROVE_PURCHASE_REQUEST', { purchaseId }),
        rejectPurchaseRequest: (purchaseId) => dispatchAction('REJECT_PURCHASE_REQUEST', { purchaseId }),
        cancelPurchaseRequest: (purchaseId) => dispatchAction('CANCEL_PURCHASE_REQUEST', { purchaseId }),
        addGuild: (guild) => dispatchAction('ADD_GUILD', guild),
        updateGuild: (guild) => dispatchAction('UPDATE_GUILD', guild),
        deleteGuild: (guildId) => dispatchAction('DELETE_GUILD', { guildId }),
        addTrophy: (trophy) => dispatchAction('ADD_TROPHY', trophy),
        updateTrophy: (trophy) => dispatchAction('UPDATE_TROPHY', trophy),
        deleteTrophy: (trophyId) => dispatchAction('DELETE_TROPHY', { trophyId }),
        cloneTrophy: (trophyId) => dispatchAction('CLONE_TROPHY', { trophyId }),
        deleteTrophies: (trophyIds) => dispatchAction('DELETE_TROPHIES', { trophyIds }),
        awardTrophy: (userId, trophyId, guildId) => dispatchAction('AWARD_TROPHY', { userId, trophyId, guildId }),
        applyManualAdjustment: (adjustment) => dispatchAction('APPLY_MANUAL_ADJUSTMENT', adjustment),
        addGameAsset: (asset) => dispatchAction('ADD_GAME_ASSET', asset),
        updateGameAsset: (asset) => dispatchAction('UPDATE_GAME_ASSET', asset),
        deleteGameAsset: (assetId) => dispatchAction('DELETE_GAME_ASSET', { assetId }),
        deleteGameAssets: (assetIds) => dispatchAction('DELETE_GAME_ASSETS', { assetIds }),
        cloneGameAsset: (assetId) => dispatchAction('CLONE_GAME_ASSET', { assetId }),
        
        // Themes
        addTheme: (theme) => dispatchAction('ADD_THEME', theme),
        updateTheme: (theme) => dispatchAction('UPDATE_THEME', theme),
        deleteTheme: (themeId) => dispatchAction('DELETE_THEME', { themeId }),

        // Settings
        updateSettings: (newSettings: Partial<AppSettings>) => dispatchAction('UPDATE_SETTINGS', newSettings),
        resetSettings: () => dispatchAction('RESET_SETTINGS', {}),
        
        // UI
        setActivePage: (page: Page) => setState(s => ({ ...s, activePage: page })),
        setAppMode: (mode: AppMode) => setState(s => ({ ...s, appMode: mode })),
        addNotification,
        removeNotification,
        setActiveMarketId: (marketId: string | null) => setState(s => ({ ...s, activeMarketId: marketId })),
        toggleSidebar: () => setState(s => ({...s, isSidebarCollapsed: !s.isSidebarCollapsed})),
        toggleChat: () => setState(s => ({...s, isChatOpen: !s.isChatOpen})),

        // Data Management
        importBlueprint: async (blueprint, resolutions) => dispatchAction('IMPORT_BLUEPRINT', { blueprint, resolutions }),
        restoreFromBackup: async (backupData) => dispatchAction('RESTORE_BACKUP', { backupData }),
        restoreDefaultObjects: async (objectType) => dispatchAction('RESTORE_DEFAULT_OBJECTS', { objectType }),
        clearAllHistory: async () => dispatchAction('CLEAR_ALL_HISTORY', {}),
        resetAllPlayerData: async () => dispatchAction('RESET_ALL_PLAYER_DATA', {}),
        deleteAllCustomContent: async () => apiRequest('/api/actions/factory-reset', { method: 'POST' }),
        
        // First Run
        completeFirstRun: async (adminUserData, setupChoice, blueprint) => {
            const result = await apiRequest('/api/first-run', { 
                method: 'POST', 
                body: JSON.stringify({ adminUserData, setupChoice, blueprint }) 
            });

            if (result && result.adminUser && result.fullData) {
                // This is a special case where we get the full data back immediately,
                // so we can update the client state directly to unlock the app.
                setState(prev => ({
                    ...prev,
                    ...result.fullData,
                    isFirstRun: false,
                    isAppUnlocked: true,
                    currentUser: result.adminUser,
                }));
                return { message: result.message, adminUser: result.adminUser };
            }
        },
        
        // Ranks
        setRanks: (ranks: Rank[]) => dispatchAction('SET_RANKS', { ranks }),

        // Chat
        sendMessage: async (message) => {
             // AI chat is special and not a simple data mutation, so it keeps its own endpoint.
            if (message.recipientId === 'user-ai-assistant') {
                setState(s => ({ ...s, isAiReplying: true }));
                try {
                    await apiRequest('/api/ai/chat', { 
                        method: 'POST', 
                        body: JSON.stringify({
                            newMessage: { ...message, senderId: state.currentUser!.id, senderName: state.currentUser?.gameName },
                            history: state.chatMessages,
                        }) 
                    });
                } catch (error) {
                    console.error("AI chat request failed", error);
                } finally {
                    if (isMounted.current) {
                        setState(s => ({ ...s, isAiReplying: false }));
                    }
                }
            } else {
                 await dispatchAction('SEND_MESSAGE', { ...message, senderId: state.currentUser!.id });
            }
        },
        markMessagesAsRead: async (options) => dispatchAction('MARK_MESSAGES_AS_READ', { ...options, currentUserId: state.currentUser!.id }),
        
        // System Notifications
        addSystemNotification: (notification) => dispatchAction('ADD_SYSTEM_NOTIFICATION', notification),
        markSystemNotificationsAsRead: (notificationIds) => dispatchAction('MARK_SYSTEM_NOTIFICATIONS_AS_READ', { notificationIds, currentUserId: state.currentUser!.id }),

        // Scheduled Events
        addScheduledEvent: (event) => dispatchAction('ADD_SCHEDULED_EVENT', event),
        updateScheduledEvent: (event) => dispatchAction('UPDATE_SCHEDULED_EVENT', event),
        deleteScheduledEvent: (eventId) => dispatchAction('DELETE_SCHEDULED_EVENT', { eventId }),
        
        // Bulk Actions
        deleteQuests: (questIds) => dispatchAction('DELETE_QUESTS', { questIds }),
        updateQuestsStatus: (questIds, isActive) => dispatchAction('UPDATE_QUESTS_STATUS', { questIds, isActive }),
        bulkUpdateQuests: (questIds, updates) => dispatchAction('BULK_UPDATE_QUESTS', { questIds, updates }),

        // Assets
        uploadFile: async (file: File, category?: string) => {
            const formData = new FormData();
            formData.append('file', file);
            if (category) {
                formData.append('category', category);
            }
            try {
                // This is not a JSON request, so we can't use the generic apiRequest helper
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
        executeExchange: (userId, payItem, receiveItem, guildId) => dispatchAction('EXECUTE_EXCHANGE', { userId, payItem, receiveItem, guildId }),
    }), [state.currentUser, apiRequest, addNotification, dispatchAction, state.chatMessages]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};