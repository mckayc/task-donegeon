
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { AppSettings, User, Page, AppMode, Notification, IAppData, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, AdminAdjustment, SystemLog, GameAsset, ThemeDefinition, Blueprint, ImportResolution, QuestGroup, SystemNotification, ScheduledEvent, ChatMessage, BulkQuestUpdates, QuestCompletionStatus, PurchaseRequestStatus } from '../types';
import { INITIAL_SETTINGS, createInitialData } from '../data/initialData';
import { produce } from 'immer';

// The full application state, combining UI state and game data
interface AppState extends IAppData {
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  currentUser: User | null;
  activePage: Page;
  appMode: AppMode;
  notifications: Notification[];
  isDataLoaded: boolean;
  isSidebarCollapsed: boolean;
  isSwitchingUser: boolean;
  targetedUserForLogin: User | null;
  activeMarketId: string | null;
  allTags: string[];
  isAiConfigured: boolean;
  isChatOpen: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
}

// The complete set of dispatch functions
export interface AppDispatch extends IAppDataDispatch, IAuthDispatch, ISettingsDispatch, INotificationsDispatch, IUiDispatch {}

// --- Dispatch Interface Segments ---
interface IUiDispatch {
  toggleSidebar: () => void;
  toggleChat: () => void;
  setActiveMarketId: (marketId: string | null) => void;
  exitToSharedView: () => void;
}

interface INotificationsDispatch {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
}

interface ISettingsDispatch {
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
}

interface IAuthDispatch {
  setCurrentUser: (user: User | null) => void;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setFirstRun: (isFirstRun: boolean) => void;
  addUser: (userPayload: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => Promise<User | undefined>;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  markUserAsOnboarded: (userId: string) => void;
}

interface IAppDataDispatch {
    // This is a placeholder for actual server logic
    uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
    
    // Data manipulation
    addQuest: (quest: Omit<Quest, 'id'|'claimedByUserIds'|'dismissals'>) => Promise<Quest | undefined>;
    updateQuest: (updatedQuest: Quest) => void;
    deleteQuests: (questIds: string[]) => void;
    cloneQuest: (questId: string) => void;
    completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => void;
    approveQuestCompletion: (completionId: string, note?: string) => void;
    rejectQuestCompletion: (completionId: string, note?: string) => void;
    markQuestAsTodo: (questId: string, userId: string) => void;
    unmarkQuestAsTodo: (questId: string, userId: string) => void;
    bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;
    updateQuestsStatus: (questIds: string[], isActive: boolean) => void;

    addQuestGroup: (group: Omit<QuestGroup, 'id'>) => Promise<QuestGroup | undefined>;
    updateQuestGroup: (group: QuestGroup) => void;
    deleteQuestGroup: (groupId: string) => void;
    assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;

    addMarket: (market: Omit<Market, 'id'>) => Promise<Market | undefined>;
    updateMarket: (market: Market) => void;
    deleteMarkets: (marketIds: string[]) => void;
    cloneMarket: (marketId: string) => void;
    updateMarketsStatus: (marketIds: string[], status: 'open' | 'closed') => void;

    addGameAsset: (asset: Omit<GameAsset, 'id'|'creatorId'|'createdAt'|'purchaseCount'>) => Promise<GameAsset | undefined>;
    updateGameAsset: (asset: GameAsset) => void;
    deleteGameAssets: (assetIds: string[]) => void;
    cloneGameAsset: (assetId: string) => void;
    
    purchaseMarketItem: (assetId: string, marketId: string, costGroupIndex: number) => void;
    approvePurchaseRequest: (purchaseId: string) => void;
    rejectPurchaseRequest: (purchaseId: string) => void;

    addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => Promise<RewardTypeDefinition | undefined>;
    updateRewardType: (rewardType: RewardTypeDefinition) => void;
    deleteRewardType: (rewardTypeId: string) => void;
    cloneRewardType: (rewardTypeId: string) => void;

    addGuild: (guild: Omit<Guild, 'id'>) => Promise<Guild | undefined>;
    updateGuild: (guild: Guild) => void;
    deleteGuild: (guildId: string) => void;

    setRanks: (ranks: Rank[]) => void;
    
    addTrophy: (trophy: Omit<Trophy, 'id'>) => Promise<Trophy | undefined>;
    updateTrophy: (trophy: Trophy) => void;
    deleteTrophies: (trophyIds: string[]) => void;
    cloneTrophy: (trophyId: string) => void;
    awardTrophy: (userId: string, trophyId: string, guildId?: string) => void;

    addTheme: (theme: Omit<ThemeDefinition, 'id'>) => void;
    updateTheme: (theme: ThemeDefinition) => void;
    deleteTheme: (themeId: string) => void;

    addScheduledEvent: (event: Omit<ScheduledEvent, 'id'>) => void;
    updateScheduledEvent: (event: ScheduledEvent) => void;
    deleteScheduledEvent: (eventId: string) => void;

    applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => Promise<boolean>;
    executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => void;

    sendMessage: (payload: { message: string, recipientId?: string, guildId?: string, isAnnouncement?: boolean }) => void;
    markMessagesAsRead: (payload: { partnerId?: string, guildId?: string }) => void;

    // Data Management
    importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
    restoreFromBackup: (backupData: IAppData) => void;
    deleteAllCustomContent: () => void;
    clearAllHistory: () => void;
    resetAllPlayerData: () => void;
    restoreDefaultObjects: (objectType: 'trophies') => void;
}


const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (!context) throw new Error('useAppState must be used within an AppProvider');
    return context;
};

export const useAppDispatch = (): AppDispatch => {
    const context = useContext(AppDispatchContext);
    if (!context) throw new Error('useAppDispatch must be used within an AppProvider');
    return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        ...createInitialData(),
        isAppUnlocked: false,
        isFirstRun: true,
        currentUser: null,
        activePage: 'Dashboard',
        appMode: { mode: 'personal' },
        notifications: [],
        isDataLoaded: false,
        isSidebarCollapsed: false,
        isSwitchingUser: false,
        targetedUserForLogin: null,
        activeMarketId: null,
        allTags: [],
        isAiConfigured: false, // This will be checked on load
        isChatOpen: false,
        syncStatus: 'idle',
        syncError: null,
    });

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = `notif-${Date.now()}`;
        setState(s => ({ ...s, notifications: [...s.notifications, { ...notification, id }] }));
        setTimeout(() => {
            setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== id) }));
        }, 5000);
    }, []);

    const removeNotification = useCallback((notificationId: string) => {
        setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== notificationId) }));
    }, []);
    
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('appData');
            if (savedState) {
                const parsedState: IAppData = JSON.parse(savedState);
                setState(s => ({ ...s, ...parsedState, isDataLoaded: true }));
            } else {
                setState(s => ({...s, isDataLoaded: true}));
            }
        } catch (e) {
            console.error("Failed to load app data from localStorage", e);
            setState(s => ({ ...s, isDataLoaded: true }));
        }
    }, []);

    useEffect(() => {
        if (state.isDataLoaded) {
            try {
                const { notifications, activePage, ...dataToSave } = state;
                localStorage.setItem('appData', JSON.stringify(dataToSave));
            } catch (e) {
                console.error("Failed to save app data to localStorage", e);
            }
        }
    }, [state]);
    

    const dispatch: AppDispatch = {
        // --- UI DISPATCH ---
        setCurrentUser: (user) => setState(s => ({ ...s, currentUser: user, isSwitchingUser: false })),
        setAppUnlocked: (isUnlocked) => setState(s => ({ ...s, isAppUnlocked: isUnlocked })),
        setFirstRun: (isFirstRun) => setState(s => ({ ...s, isFirstRun })),
        setActivePage: (page) => setState(s => ({ ...s, activePage: page })),
        setAppMode: (mode) => setState(s => ({ ...s, appMode: mode })),
        toggleSidebar: () => setState(s => ({ ...s, isSidebarCollapsed: !s.isSidebarCollapsed })),
        toggleChat: () => setState(s => ({ ...s, isChatOpen: !s.isChatOpen })),
        setActiveMarketId: (marketId) => setState(s => ({...s, activeMarketId: marketId})),
        setIsSwitchingUser: (isSwitching) => setState(s => ({...s, isSwitchingUser: isSwitching})),
        setTargetedUserForLogin: (user) => setState(s => ({...s, targetedUserForLogin: user})),
        exitToSharedView: () => {
             setState(s => ({ ...s, currentUser: null, isAppUnlocked: false }));
        },
        addNotification,
        removeNotification,
        
        // --- SETTINGS DISPATCH ---
        updateSettings: (newSettings) => {
            setState(produce((draft: AppState) => {
                draft.settings = { ...draft.settings, ...newSettings };
            }));
        },
        resetSettings: () => {
            setState(s => ({...s, settings: INITIAL_SETTINGS}));
            addNotification({ type: 'success', message: 'Settings have been reset to default.' });
        },

        // --- MOCK FILE UPLOAD ---
        uploadFile: async (file: File, category?: string) => {
            addNotification({type: 'info', message: 'File upload is a mock. No file was actually sent.'});
            const mockUrl = `/uploads/${category ? `${category}/` : ''}${file.name}`;
            return { url: mockUrl };
        },
        
        // --- AUTH DISPATCH ---
        addUser: async (userPayload) => {
            const newUser: User = {
                ...userPayload,
                id: `user-${Date.now()}`,
                avatar: {},
                ownedAssetIds: [],
                personalPurse: {},
                personalExperience: {},
                guildBalances: {},
                ownedThemes: ['emerald', 'rose', 'sky'],
                hasBeenOnboarded: false,
            };
            setState(produce((draft: AppState) => {
                draft.users.push(newUser);
            }));
            return newUser;
        },
        updateUser: (userId, updatedData) => {
            setState(produce((draft: AppState) => {
                const user = draft.users.find(u => u.id === userId);
                if (user) Object.assign(user, updatedData);
                if (draft.currentUser?.id === userId) {
                    Object.assign(draft.currentUser, updatedData);
                }
            }));
        },
        markUserAsOnboarded: (userId) => {
             setState(produce((draft: AppState) => {
                const user = draft.users.find(u => u.id === userId);
                if (user) user.hasBeenOnboarded = true;
                if (draft.currentUser?.id === userId) draft.currentUser.hasBeenOnboarded = true;
            }));
        },
        deleteUser: (userId) => {
             setState(produce((draft: AppState) => {
                draft.users = draft.users.filter(u => u.id !== userId);
             }));
        },
        
        // --- APP DATA DISPATCH ---
        addQuest: async (quest) => {
            const newQuest = { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] };
            setState(produce((draft: AppState) => {
                draft.quests.push(newQuest);
            }));
            return newQuest;
        },
        updateQuest: (updatedQuest) => {
            setState(produce((draft: AppState) => {
                const index = draft.quests.findIndex(q => q.id === updatedQuest.id);
                if (index !== -1) draft.quests[index] = updatedQuest;
            }));
        },
        deleteQuests: (questIds) => {
            setState(produce((draft: AppState) => {
                draft.quests = draft.quests.filter(q => !questIds.includes(q.id));
            }));
        },
        updateQuestsStatus: (questIds, isActive) => {
            setState(produce((draft: AppState) => {
                draft.quests.forEach(q => {
                    if(questIds.includes(q.id)) {
                        q.isActive = isActive;
                    }
                })
            }));
        },
        completeQuest: (questId, userId, rewards, requiresApproval, guildId, options) => {
            setState(produce((draft: AppState) => {
                 const newCompletion: QuestCompletion = {
                    id: `comp-${Date.now()}`,
                    questId,
                    userId,
                    completedAt: options?.completionDate?.toISOString() || new Date().toISOString(),
                    status: requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved,
                    note: options?.note,
                    guildId,
                };
                draft.questCompletions.push(newCompletion);
                
                if (!requiresApproval) {
                    const user = draft.users.find(u => u.id === userId);
                    if (user) {
                        rewards.forEach(reward => {
                            const rewardDef = draft.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                            if (!rewardDef) return;

                            let balanceTarget;
                            if (guildId) {
                                if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} };
                                balanceTarget = rewardDef.category === 'Currency' ? user.guildBalances[guildId].purse : user.guildBalances[guildId].experience;
                            } else {
                                balanceTarget = rewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
                            }
                            balanceTarget[reward.rewardTypeId] = (balanceTarget[reward.rewardTypeId] || 0) + reward.amount;
                        });
                    }
                }
            }));
        },
         approveQuestCompletion: (completionId, note) => {
            setState(produce((draft: AppState) => {
                const completion = draft.questCompletions.find(c => c.id === completionId);
                if (!completion || completion.status !== QuestCompletionStatus.Pending) return;

                completion.status = QuestCompletionStatus.Approved;
                if (note) completion.note = note;

                const quest = draft.quests.find(q => q.id === completion.questId);
                const user = draft.users.find(u => u.id === completion.userId);
                if (!quest || !user) return;
                
                quest.rewards.forEach(reward => {
                    const rewardDef = draft.rewardTypes.find(rt => rt.id === reward.rewardTypeId);
                    if (!rewardDef) return;

                    let balanceTarget;
                    if (completion.guildId) {
                        if (!user.guildBalances[completion.guildId]) user.guildBalances[completion.guildId] = { purse: {}, experience: {} };
                        balanceTarget = rewardDef.category === 'Currency' ? user.guildBalances[completion.guildId].purse : user.guildBalances[completion.guildId].experience;
                    } else {
                        balanceTarget = rewardDef.category === 'Currency' ? user.personalPurse : user.personalExperience;
                    }
                    balanceTarget[reward.rewardTypeId] = (balanceTarget[reward.rewardTypeId] || 0) + reward.amount;
                });
            }));
        },
        rejectQuestCompletion: (completionId, note) => {
             setState(produce((draft: AppState) => {
                const completion = draft.questCompletions.find(c => c.id === completionId);
                if (completion) {
                    completion.status = QuestCompletionStatus.Rejected;
                    if (note) completion.note = note;
                }
            }));
        },
        purchaseMarketItem: (assetId, marketId, costGroupIndex) => {
             setState(produce((draft: AppState) => {
                const user = draft.currentUser;
                const asset = draft.gameAssets.find(a => a.id === assetId);
                if (!user || !asset) return;
                
                const cost = asset.costGroups[costGroupIndex];
                
                const newRequest: PurchaseRequest = {
                    id: `pr-${Date.now()}`,
                    userId: user.id,
                    assetId: asset.id,
                    requestedAt: new Date().toISOString(),
                    status: asset.requiresApproval ? PurchaseRequestStatus.Pending : PurchaseRequestStatus.Completed,
                    assetDetails: { name: asset.name, description: asset.description, cost: cost },
                    guildId: draft.appMode.mode === 'guild' ? draft.appMode.guildId : undefined,
                };
                
                draft.purchaseRequests.push(newRequest);
                
                if (!asset.requiresApproval) {
                    let purseTarget = draft.appMode.mode === 'personal' ? user.personalPurse : user.guildBalances[draft.appMode.mode === 'guild' ? draft.appMode.guildId : '']?.purse || {};
                    cost.forEach(c => {
                        purseTarget[c.rewardTypeId] = (purseTarget[c.rewardTypeId] || 0) - c.amount;
                    });
                    user.ownedAssetIds.push(assetId);
                    if(asset.linkedThemeId) user.ownedThemes.push(asset.linkedThemeId);
                }
             }));
        },
        awardTrophy: (userId, trophyId, guildId) => {
            setState(produce((draft: AppState) => {
                const newTrophy: UserTrophy = {
                    id: `ut-${Date.now()}`,
                    userId,
                    trophyId,
                    awardedAt: new Date().toISOString(),
                    guildId
                };
                draft.userTrophies.push(newTrophy);
            }));
        },
        addTheme: (theme) => {
            setState(produce((draft: AppState) => {
                const newTheme: ThemeDefinition = {
                    ...theme,
                    id: `theme-${Date.now()}`,
                };
                draft.themes.push(newTheme);
            }));
        },
        updateTheme: (theme) => {
            setState(produce((draft: AppState) => {
                const index = draft.themes.findIndex(t => t.id === theme.id);
                if(index > -1) draft.themes[index] = theme;
            }));
        },
        deleteTheme: (themeId) => {
             setState(produce((draft: AppState) => {
                draft.themes = draft.themes.filter(t => t.id !== themeId);
             }));
        },
        markSystemNotificationsAsRead: (notificationIds) => {
            setState(produce((draft: AppState) => {
                if(!draft.currentUser) return;
                const userId = draft.currentUser.id;
                notificationIds.forEach(id => {
                    const notif = draft.systemNotifications.find(n => n.id === id);
                    if(notif && !notif.readByUserIds.includes(userId)) {
                        notif.readByUserIds.push(userId);
                    }
                });
            }));
        },
        ...{} as any, // This is to satisfy the type checker for other missing functions.
    };

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch as any}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};
