import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates, ScheduledEvent, AppDispatch } from '../types';
import { INITIAL_SETTINGS, createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, createInitialQuestCompletions, INITIAL_TAGS, INITIAL_QUEST_GROUPS } from '../data/initialData';
import { useDebounce } from '../hooks/useDebounce';

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
    const isInitialLoad = useRef(true);

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

    // This function only performs the optimistic local state update.
    // The actual saving is handled by a debounced useEffect below.
    const updateAndSave = useCallback((updater: (prevState: AppState) => Partial<IAppData>) => {
        setState(prev => {
            const changes = updater(prev);
            return { ...prev, ...changes };
        });
    }, []);

    // Extract the data portion of the state that needs to be persisted.
    const {
        isAppUnlocked, isFirstRun, currentUser, activePage, appMode, notifications, isDataLoaded,
        activeMarketId, allTags, isSwitchingUser, isSharedViewActive, targetedUserForLogin,
        isAiConfigured, isSidebarCollapsed, syncStatus, syncError, isChatOpen, isRestarting,
        isAiReplying,
        ...dataToSave
    } = state;

    // Debounce the data that will be saved to the server.
    const debouncedDataToSave = useDebounce(dataToSave, 500);

    // This effect runs automatically when the debounced data changes, saving it to the backend.
    useEffect(() => {
        // Don't save if data isn't loaded yet or we are in the first run wizard.
        if (!state.isDataLoaded || state.isFirstRun) {
            return;
        }

        // Prevent saving on the very first effect run after data is loaded from the server.
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const saveState = async () => {
            if (!isMounted.current) return;
            try {
                setState(s => ({ ...s, syncStatus: 'syncing' }));
                await apiRequest('/api/data', {
                    method: 'POST',
                    body: JSON.stringify(debouncedDataToSave),
                });
                if (isMounted.current) {
                    setState(s => ({ ...s, syncStatus: 'success', syncError: null }));
                }
            } catch (error) {
                if (isMounted.current) {
                    if (error instanceof Error) {
                        setState(s => ({ ...s, syncStatus: 'error', syncError: error.message }));
                    }
                }
                console.error("Failed to save state, optimistic update may be out of sync.", error);
            }
        };

        saveState();
    }, [debouncedDataToSave, state.isDataLoaded, state.isFirstRun]);


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
        addUser: async (userData) => {
            const newId = `user-${Date.now()}`;
            const newUser: User = {
                ...userData,
                id: newId,
                personalPurse: {}, personalExperience: {}, guildBalances: {},
                avatar: {}, ownedAssetIds: [],
                ownedThemes: ['emerald', 'rose', 'sky'],
                hasBeenOnboarded: false,
            };
            updateAndSave(s => ({ users: [...s.users, newUser] }));
            return Promise.resolve(newUser);
        },
        updateUser: async (userId, updatedData) => updateAndSave(s => ({ users: s.users.map(u => u.id === userId ? { ...u, ...updatedData } : u) })),
        deleteUser: async (userId) => updateAndSave(s => ({ users: s.users.filter(u => u.id !== userId) })),
        setCurrentUser: (user: User | null) => { 
            setState(s => ({...s, currentUser: user, isSharedViewActive: false}));
            if (user) {
                localStorage.setItem('lastUserId', user.id);
                localStorage.removeItem('sharedViewActive');
            } else {
                localStorage.removeItem('lastUserId');
            }
        },
        markUserAsOnboarded: async (userId: string) => dispatch.updateUser(userId, { hasBeenOnboarded: true }),
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
        addQuest: async (quest) => {
            const newQuest: Quest = { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] };
            updateAndSave(s => ({ quests: [...s.quests, newQuest] }));
            return newQuest;
        },
        updateQuest: async (updatedQuest) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === updatedQuest.id ? updatedQuest : q) })),
        deleteQuest: async (questId) => updateAndSave(s => ({ quests: s.quests.filter(q => q.id !== questId) })),
        cloneQuest: async (questId: string) => updateAndSave(s => {
            const questToClone = s.quests.find(q => q.id === questId);
            if (!questToClone) return {};
            const newQuest = { ...questToClone, id: `quest-${Date.now()}`, title: `${questToClone.title} (Copy)` };
            return { quests: [...s.quests, newQuest] };
        }),
        dismissQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, dismissals: [...q.dismissals, {userId, dismissedAt: new Date().toISOString()}]} : q) })),
        claimQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, claimedByUserIds: [...q.claimedByUserIds, userId]} : q) })),
        releaseQuest: async (questId: string, userId: string) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? {...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId)} : q) })),
        markQuestAsTodo: async (questId, userId) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, todoUserIds: [...(q.todoUserIds || []), userId] } : q) })),
        unmarkQuestAsTodo: async (questId, userId) => updateAndSave(s => ({ quests: s.quests.map(q => q.id === questId ? { ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId) } : q) })),
        completeQuest: (questId, userId, guildId, options) => {
            return apiRequest(`/api/quests/${questId}/complete`, {
                method: 'POST',
                body: JSON.stringify({ userId, guildId, options }),
            });
        },
        approveQuestCompletion: (completionId, note) => apiRequest(`/api/completions/${completionId}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
        rejectQuestCompletion: (completionId, note) => apiRequest(`/api/completions/${completionId}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
        addQuestGroup: async (group) => {
            const newGroup: QuestGroup = { ...group, id: `qg-${Date.now()}` };
            updateAndSave(s => ({ questGroups: [...s.questGroups, newGroup] }));
            return newGroup;
        },
        updateQuestGroup: async (group) => updateAndSave(s => ({ questGroups: s.questGroups.map(g => g.id === group.id ? group : g) })),
        deleteQuestGroup: async (groupId) => updateAndSave(s => ({ questGroups: s.questGroups.filter(g => g.id !== groupId) })),
        assignQuestGroupToUsers: async (groupId, userIds) => updateAndSave(s => ({ quests: s.quests.map(q => q.groupId === groupId ? { ...q, assignedUserIds: [...new Set([...q.assignedUserIds, ...userIds])] } : q) })),
        addRewardType: async (rewardType) => {
            const newRewardType: RewardTypeDefinition = { ...rewardType, id: `rt-${Date.now()}`, isCore: false };
            updateAndSave(s => ({ rewardTypes: [...s.rewardTypes, newRewardType] }));
            return newRewardType;
        },
        updateRewardType: async (rewardType) => updateAndSave(s => ({ rewardTypes: s.rewardTypes.map(rt => rt.id === rewardType.id ? rewardType : rt) })),
        deleteRewardType: async (rewardTypeId) => updateAndSave(s => ({ rewardTypes: s.rewardTypes.filter(rt => rt.id !== rewardTypeId) })),
        cloneRewardType: async (rewardTypeId: string) => updateAndSave(s => {
            const typeToClone = s.rewardTypes.find(rt => rt.id === rewardTypeId);
            if (!typeToClone) return {};
            const newType = { ...typeToClone, isCore: false, id: `rt-${Date.now()}`, name: `${typeToClone.name} (Copy)` };
            return { rewardTypes: [...s.rewardTypes, newType] };
        }),
        addMarket: async (market) => {
            const newMarket: Market = { ...market, id: `mkt-${Date.now()}` };
            updateAndSave(s => ({ markets: [...s.markets, newMarket] }));
            return newMarket;
        },
        updateMarket: async (market) => updateAndSave(s => ({ markets: s.markets.map(m => m.id === market.id ? market : m) })),
        deleteMarket: async (marketId) => updateAndSave(s => ({ markets: s.markets.filter(m => m.id !== marketId) })),
        cloneMarket: async (marketId: string) => updateAndSave(s => {
            const marketToClone = s.markets.find(m => m.id === marketId);
            if (!marketToClone) return {};
            const newMarket = { ...marketToClone, id: `mkt-${Date.now()}`, title: `${marketToClone.title} (Copy)` };
            return { markets: [...s.markets, newMarket] };
        }),
        deleteMarkets: async (marketIds: string[]) => updateAndSave(s => ({ markets: s.markets.filter(m => !marketIds.includes(m.id)) })),
        updateMarketsStatus: async (marketIds: string[], status: 'open' | 'closed') => updateAndSave(s => ({ markets: s.markets.map(m => marketIds.includes(m.id) ? { ...m, status: { type: status } as MarketStatus } : m) })),
        purchaseMarketItem: async (assetId, marketId, userId, costGroupIndex, guildId) => {
            updateAndSave(s => {
                const user = s.users.find(u => u.id === userId);
                const asset = s.gameAssets.find(a => a.id === assetId);
                if (!user || !asset) return {};
                
                const cost = asset.costGroups[costGroupIndex];
                if (!cost) return {};

                const updatedUsers = [...s.users];
                const userIndex = updatedUsers.findIndex(u => u.id === userId);
                const userToUpdate = JSON.parse(JSON.stringify(updatedUsers[userIndex]));

                const balanceTarget = guildId ? (userToUpdate.guildBalances[guildId] = userToUpdate.guildBalances[guildId] || { purse: {}, experience: {} }) : { purse: userToUpdate.personalPurse, experience: userToUpdate.personalExperience };

                // Check affordability
                for (const item of cost) {
                    const rewardDef = s.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                    if (!rewardDef) return {};
                    const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                    if ((balanceTarget[balanceKey][item.rewardTypeId] || 0) < item.amount) {
                        addNotification({ type: 'error', message: "You can't afford this item." });
                        return {};
                    }
                }
                
                const newPurchaseRequest: PurchaseRequest = {
                    id: `pr-${Date.now()}`, userId, assetId, requestedAt: new Date().toISOString(),
                    status: asset.requiresApproval ? PurchaseRequestStatus.Pending : PurchaseRequestStatus.Completed,
                    assetDetails: { name: asset.name, description: asset.description, cost },
                    guildId,
                };
                
                // Deduct cost (escrow for pending, spend for completed)
                cost.forEach(item => {
                    const rewardDef = s.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                    if (rewardDef) {
                        const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                        balanceTarget[balanceKey][item.rewardTypeId] -= item.amount;
                    }
                });

                if (asset.requiresApproval) {
                    updatedUsers[userIndex] = userToUpdate;
                    return { users: updatedUsers, purchaseRequests: [...s.purchaseRequests, newPurchaseRequest] };
                }

                // If not approval, complete transaction
                newPurchaseRequest.actedAt = new Date().toISOString();
                userToUpdate.ownedAssetIds.push(assetId);
                if(asset.linkedThemeId && !userToUpdate.ownedThemes.includes(asset.linkedThemeId)) {
                    userToUpdate.ownedThemes.push(asset.linkedThemeId);
                }
                // Handle payouts (exchanges)
                (asset.payouts || []).forEach(payout => {
                    const rewardDef = s.rewardTypes.find(rt => rt.id === payout.rewardTypeId);
                     if (rewardDef) {
                        const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                        balanceTarget[balanceKey][payout.rewardTypeId] = (balanceTarget[balanceKey][payout.rewardTypeId] || 0) + payout.amount;
                    }
                });
                
                updatedUsers[userIndex] = userToUpdate;
                const updatedAssets = s.gameAssets.map(a => a.id === assetId ? {...a, purchaseCount: a.purchaseCount + 1} : a);

                return { users: updatedUsers, gameAssets: updatedAssets, purchaseRequests: [...s.purchaseRequests, newPurchaseRequest] };
            });
        },
        approvePurchaseRequest: async (purchaseId) => updateAndSave(s => {
            const reqIndex = s.purchaseRequests.findIndex(pr => pr.id === purchaseId);
            if (reqIndex === -1) return {};
            const updatedRequests = [...s.purchaseRequests];
            const request = { ...updatedRequests[reqIndex], status: PurchaseRequestStatus.Completed, actedAt: new Date().toISOString() };
            updatedRequests[reqIndex] = request;

            const userIndex = s.users.findIndex(u => u.id === request.userId);
            const asset = s.gameAssets.find(a => a.id === request.assetId);
            if(userIndex === -1 || !asset) return { purchaseRequests: updatedRequests }; // Escrow lost but state is consistent
            
            const updatedUsers = [...s.users];
            const userToUpdate = JSON.parse(JSON.stringify(updatedUsers[userIndex]));
            userToUpdate.ownedAssetIds = [...userToUpdate.ownedAssetIds, request.assetId];
            if(asset.linkedThemeId && !userToUpdate.ownedThemes.includes(asset.linkedThemeId)) {
                 userToUpdate.ownedThemes = [...userToUpdate.ownedThemes, asset.linkedThemeId];
            }
            // Handle payouts
            const balanceTarget = request.guildId ? (userToUpdate.guildBalances[request.guildId] = userToUpdate.guildBalances[request.guildId] || { purse: {}, experience: {} }) : { purse: userToUpdate.personalPurse, experience: userToUpdate.personalExperience };
            (asset.payouts || []).forEach(payout => {
                const rewardDef = s.rewardTypes.find(rt => rt.id === payout.rewardTypeId);
                 if (rewardDef) {
                    const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                    balanceTarget[balanceKey][payout.rewardTypeId] = (balanceTarget[balanceKey][payout.rewardTypeId] || 0) + payout.amount;
                }
            });
            updatedUsers[userIndex] = userToUpdate;
            
            const updatedAssets = s.gameAssets.map(a => a.id === asset.id ? {...a, purchaseCount: a.purchaseCount + 1} : a);

            return { purchaseRequests: updatedRequests, users: updatedUsers, gameAssets: updatedAssets };
        }),
        rejectPurchaseRequest: async (purchaseId) => updateAndSave(s => {
            const reqIndex = s.purchaseRequests.findIndex(pr => pr.id === purchaseId);
            if (reqIndex === -1) return {};
            const updatedRequests = [...s.purchaseRequests];
            const request = { ...updatedRequests[reqIndex], status: PurchaseRequestStatus.Rejected, actedAt: new Date().toISOString() };
            updatedRequests[reqIndex] = request;

            const userIndex = s.users.findIndex(u => u.id === request.userId);
            if(userIndex === -1) return { purchaseRequests: updatedRequests };
            
            const updatedUsers = [...s.users];
            const userToUpdate = JSON.parse(JSON.stringify(updatedUsers[userIndex]));

            // Refund cost
            const balanceTarget = request.guildId ? (userToUpdate.guildBalances[request.guildId] = userToUpdate.guildBalances[request.guildId] || { purse: {}, experience: {} }) : { purse: userToUpdate.personalPurse, experience: userToUpdate.personalExperience };
            request.assetDetails.cost.forEach(item => {
                const rewardDef = s.rewardTypes.find(rt => rt.id === item.rewardTypeId);
                if (rewardDef) {
                    const balanceKey = rewardDef.category === RewardCategory.Currency ? 'purse' : 'experience';
                    balanceTarget[balanceKey][item.rewardTypeId] = (balanceTarget[balanceKey][item.rewardTypeId] || 0) + item.amount;
                }
            });
            updatedUsers[userIndex] = userToUpdate;

            return { purchaseRequests: updatedRequests, users: updatedUsers };
        }),
        cancelPurchaseRequest: async (purchaseId) => dispatch.rejectPurchaseRequest(purchaseId), // Same logic as reject
        addGuild: async (guild) => {
            const newGuild: Guild = { ...guild, id: `g-${Date.now()}` };
            updateAndSave(s => ({ guilds: [...s.guilds, newGuild] }));
            return newGuild;
        },
        updateGuild: async (guild) => updateAndSave(s => ({ guilds: s.guilds.map(g => g.id === guild.id ? guild : g) })),
        deleteGuild: async (guildId) => updateAndSave(s => ({ guilds: s.guilds.filter(g => g.id !== guildId) })),
        addTrophy: async (trophy) => {
            const newTrophy: Trophy = { ...trophy, id: `t-${Date.now()}` };
            updateAndSave(s => ({ trophies: [...s.trophies, newTrophy] }));
            return newTrophy;
        },
        updateTrophy: async (trophy) => updateAndSave(s => ({ trophies: s.trophies.map(t => t.id === trophy.id ? trophy : t) })),
        deleteTrophy: async (trophyId) => updateAndSave(s => ({ trophies: s.trophies.filter(t => t.id !== trophyId) })),
        cloneTrophy: async (trophyId: string) => updateAndSave(s => {
            const trophyToClone = s.trophies.find(t => t.id === trophyId);
            if (!trophyToClone) return {};
            const newTrophy = { ...trophyToClone, id: `t-${Date.now()}`, name: `${trophyToClone.name} (Copy)` };
            return { trophies: [...s.trophies, newTrophy] };
        }),
        deleteTrophies: async (trophyIds: string[]) => updateAndSave(s => ({ trophies: s.trophies.filter(t => !trophyIds.includes(t.id)) })),
        awardTrophy: async (userId, trophyId, guildId) => updateAndSave(s => ({ userTrophies: [...s.userTrophies, { id: `ut-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }] })),
        applyManualAdjustment: async (adjustment) => {
            updateAndSave(s => ({ adminAdjustments: [...s.adminAdjustments, { ...adjustment, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() }] }));
            return true;
        },
        addGameAsset: async (asset) => {
            const newAsset: GameAsset = { ...asset, id: `ga-${Date.now()}`, creatorId: state.currentUser?.id || 'system', createdAt: new Date().toISOString(), purchaseCount: 0 };
            updateAndSave(s => ({ gameAssets: [...s.gameAssets, newAsset] }));
            return newAsset;
        },
        updateGameAsset: async (asset) => updateAndSave(s => ({ gameAssets: s.gameAssets.map(a => a.id === asset.id ? asset : a) })),
        deleteGameAsset: async (assetId) => updateAndSave(s => ({ gameAssets: s.gameAssets.filter(a => a.id !== assetId) })),
        deleteGameAssets: async (assetIds: string[]) => updateAndSave(s => ({ gameAssets: s.gameAssets.filter(a => !assetIds.includes(a.id)) })),
        cloneGameAsset: async (assetId: string) => updateAndSave(s => {
            const assetToClone = s.gameAssets.find(a => a.id === assetId);
            if (!assetToClone) return {};
            const newAsset = { ...assetToClone, id: `ga-${Date.now()}`, name: `${assetToClone.name} (Copy)` };
            return { gameAssets: [...s.gameAssets, newAsset] };
        }),
        
        // Themes
        addTheme: async (theme) => {
            const newTheme: ThemeDefinition = { ...theme, id: `theme-${Date.now()}` };
            updateAndSave(s => ({ themes: [...s.themes, newTheme] }));
            return newTheme;
        },
        updateTheme: async (theme) => updateAndSave(s => ({ themes: s.themes.map(t => t.id === theme.id ? theme : t) })),
        deleteTheme: async (themeId) => updateAndSave(s => ({ themes: s.themes.filter(t => t.id !== themeId) })),

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
        deleteAllCustomContent: async () => apiRequest('/api/actions/factory-reset', { method: 'POST' }),
        
        // First Run
        completeFirstRun: (adminUserData, setupChoice, blueprint) => apiRequest('/api/first-run', { method: 'POST', body: JSON.stringify({ adminUserData, setupChoice, blueprint }) }),
        
        // Ranks
        setRanks: (ranks: Rank[]) => updateAndSave(() => ({ ranks })),

        // Chat
        sendMessage: async (message) => {
            const newMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                senderId: state.currentUser!.id,
                timestamp: new Date().toISOString(),
                readBy: [state.currentUser!.id],
                ...message,
            };

            if (message.recipientId !== 'user-ai-assistant') {
                updateAndSave(s => ({ chatMessages: [...s.chatMessages, newMessage] }));
            }
            
            if (message.recipientId === 'user-ai-assistant') {
                setState(s => ({ ...s, isAiReplying: true }));
                try {
                    await apiRequest('/api/ai/chat', { 
                        method: 'POST', 
                        body: JSON.stringify({
                            newMessage: { ...newMessage, senderName: state.currentUser?.gameName },
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
            }

            return newMessage;
        },
        markMessagesAsRead: async (options) => updateAndSave(s => {
            const currentUserId = state.currentUser?.id;
            if (!currentUserId) return {};
            return {
                chatMessages: s.chatMessages.map(msg => {
                    const isUnread = !msg.readBy.includes(currentUserId);
                    const isGuildMatch = options.guildId && msg.guildId === options.guildId;
                    const isDMMatch = options.partnerId && ((msg.recipientId === currentUserId && msg.senderId === options.partnerId) || (msg.recipientId === options.partnerId && msg.senderId === currentUserId));
                    
                    if (isUnread && (isGuildMatch || isDMMatch)) {
                        return { ...msg, readBy: [...msg.readBy, currentUserId] };
                    }
                    return msg;
                })
            }
        }),

        // System Notifications
        addSystemNotification: async (notification) => {
            const newNotification: SystemNotification = { ...notification, id: `sys-notif-${Date.now()}`, timestamp: new Date().toISOString(), readByUserIds: [] };
            updateAndSave(s => ({ systemNotifications: [...s.systemNotifications, newNotification] }));
            return newNotification;
        },
        markSystemNotificationsAsRead: async (notificationIds) => updateAndSave(s => ({ systemNotifications: s.systemNotifications.map(n => notificationIds.includes(n.id) ? { ...n, readByUserIds: [...new Set([...n.readByUserIds, state.currentUser!.id])] } : n) })),

        // Scheduled Events
        addScheduledEvent: async (event) => {
            const newEvent: ScheduledEvent = { ...event, id: `event-${Date.now()}` };
            updateAndSave(s => ({ scheduledEvents: [...s.scheduledEvents, newEvent] }));
            return newEvent;
        },
        updateScheduledEvent: async (event) => updateAndSave(s => ({ scheduledEvents: s.scheduledEvents.map(e => e.id === event.id ? event : e) })),
        deleteScheduledEvent: async (eventId) => updateAndSave(s => ({ scheduledEvents: s.scheduledEvents.filter(e => e.id !== eventId) })),
        
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
        executeExchange: (userId, payItem, receiveItem, guildId) => apiRequest('/api/actions/exchange', { method: 'POST', body: JSON.stringify({ userId, payItem, receiveItem, guildId }) }),
    }), [state.currentUser, state.appMode, apiRequest, addNotification, removeNotification, updateAndSave, state.chatMessages]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};