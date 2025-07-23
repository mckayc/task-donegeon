import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType, ThemeDefinition, ChatMessage, SystemNotification, SystemNotificationType, MarketStatus, QuestGroup, BulkQuestUpdates } from '../types';
import { INITIAL_SETTINGS, createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets, INITIAL_THEMES, createInitialQuestCompletions, INITIAL_TAGS, INITIAL_QUEST_GROUPS } from '../data/initialData';
import { toYMD } from '../utils/quests';
import { analyzeBlueprintForConflicts } from '../utils/sharing';

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
}

// The single, unified dispatch for the entire application
interface AppDispatch {
  // Auth
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>) => User;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setCurrentUser: (user: User | null) => void;
  markUserAsOnboarded: (userId: string) => void;
  setAppUnlocked: (isUnlocked: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  exitToSharedView: () => void;
  setIsSharedViewActive: (isActive: boolean) => void;

  // Game Data
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  cloneQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  markQuestAsTodo: (questId: string, userId: string) => void;
  unmarkQuestAsTodo: (questId: string, userId: string) => void;
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  addQuestGroup: (group: Omit<QuestGroup, 'id'>) => QuestGroup;
  updateQuestGroup: (group: QuestGroup) => void;
  deleteQuestGroup: (groupId: string) => void;
  assignQuestGroupToUsers: (groupId: string, userIds: string[]) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  cloneRewardType: (rewardTypeId: string) => void;
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  cloneMarket: (marketId: string) => void;
  deleteMarkets: (marketIds: string[]) => void;
  updateMarketsStatus: (marketIds: string[], statusType: 'open' | 'closed') => void;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, costGroupIndex: number) => void;
  cancelPurchaseRequest: (purchaseId: string) => void;
  approvePurchaseRequest: (purchaseId: string) => void;
  rejectPurchaseRequest: (purchaseId: string) => void;
  addGuild: (guild: Omit<Guild, 'id'>) => void;
  updateGuild: (guild: Guild) => void;
  deleteGuild: (guildId: string) => void;
  setRanks: (ranks: Rank[]) => void;
  addTrophy: (trophy: Omit<Trophy, 'id'>) => void;
  updateTrophy: (trophy: Trophy) => void;
  deleteTrophy: (trophyId: string) => void;
  awardTrophy: (userId: string, trophyId: string, guildId?: string) => void;
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>) => boolean;
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => void;
  updateGameAsset: (asset: GameAsset) => void;
  deleteGameAsset: (assetId: string) => void;
  cloneGameAsset: (assetId: string) => void;
  addTheme: (theme: Omit<ThemeDefinition, 'id'>) => void;
  updateTheme: (theme: ThemeDefinition) => void;
  deleteTheme: (themeId: string) => void;
  completeFirstRun: (adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint?: Blueprint | null) => void;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Record<ShareableAssetType, string[]>) => void;
  deleteQuests: (questIds: string[]) => void;
  deleteTrophies: (trophyIds: string[]) => void;
  deleteGameAssets: (assetIds: string[]) => void;
  updateQuestsStatus: (questIds: string[], isActive: boolean) => void;
  bulkUpdateQuests: (questIds: string[], updates: BulkQuestUpdates) => void;
  uploadFile: (file: File, category?: string) => Promise<{ url: string } | null>;
  executeExchange: (userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => void;

  // Settings & UI
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => void;
  markMessagesAsRead: (params: { partnerId?: string; guildId?: string; }) => void;
  addSystemNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => void;
  markSystemNotificationsAsRead: (notificationIds: string[]) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced as (...args: Parameters<F>) => void;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // === STATE MANAGEMENT ===
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questGroups, setQuestGroups] = useState<QuestGroup[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [rewardTypes, setRewardTypes] = useState<RewardTypeDefinition[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [userTrophies, setUserTrophies] = useState<UserTrophy[]>([]);
  const [adminAdjustments, setAdminAdjustments] = useState<AdminAdjustment[]>([]);
  const [gameAssets, setGameAssets] = useState<GameAsset[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [themes, setThemes] = useState<ThemeDefinition[]>(INITIAL_THEMES);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);

  // UI State
  const [currentUser, _setCurrentUser] = useState<User | null>(null);
  const [isAppUnlocked, _setAppUnlocked] = useState<boolean>(() => localStorage.getItem('isAppUnlocked') === 'true');
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [isSharedViewActive, _setIsSharedViewActive] = useState(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('isSidebarCollapsed') === 'true');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const inactivityTimer = useRef<number | null>(null);
  const stateRef = useRef<AppState | null>(null);
  
  // State for debounced saving and sync management
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const appDataRef = useRef<IAppData | null>(null);
  const initialLoadCompleted = useRef(false);

  const isFirstRun = isDataLoaded && settings.contentVersion < 1;

  // === DATA PERSISTENCE ===
  const appData = useMemo((): IAppData => ({ users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings, themes, loginHistory, chatMessages, systemNotifications }), [users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings, themes, loginHistory, chatMessages, systemNotifications]);
  appDataRef.current = appData;

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id: uniqueId }]);
  }, []);

  useEffect(() => {
    (async () => {
        let dataToSet: IAppData | null = null;
        try {
            const response = await window.fetch('/api/data/load');
            if (response.ok) {
                const data = await response.json();
                if (data && data.users) { // Basic check for valid data structure
                    console.log("Loading data from server.");
                    dataToSet = data;
                }
            }
        } catch (error) {
            console.error("Could not load data from server, will proceed without initial data.", error);
        }

        if (!dataToSet) {
            console.log("No existing data found. Awaiting first-run setup.");
            dataToSet = {
                users: [], quests: [], markets: [], rewardTypes: INITIAL_REWARD_TYPES, questCompletions: [],
                purchaseRequests: [], guilds: [], ranks: INITIAL_RANKS, trophies: [], userTrophies: [],
                adminAdjustments: [], gameAssets: [], systemLogs: [], settings: INITIAL_SETTINGS,
                themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [],
                questGroups: INITIAL_QUEST_GROUPS,
            };
        }

        if (dataToSet) {
            const savedSettings: Partial<AppSettings> = dataToSet.settings || {};
            
            const loadedSettings: AppSettings = {
                ...INITIAL_SETTINGS,
                ...savedSettings,
                questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
                security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
                sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
                automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
                loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
                chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
                sidebars: { ...INITIAL_SETTINGS.sidebars, ...(savedSettings.sidebars || {}) },
                terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
                rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
            };
            
            setUsers(dataToSet.users || []);
            setQuests(dataToSet.quests || []);
            setQuestGroups(dataToSet.questGroups && dataToSet.questGroups.length > 0 ? dataToSet.questGroups : INITIAL_QUEST_GROUPS);
            setMarkets(dataToSet.markets || []);
            setRewardTypes(dataToSet.rewardTypes || []);
            setQuestCompletions(dataToSet.questCompletions || []);
            setPurchaseRequests(dataToSet.purchaseRequests || []);
            setGuilds(dataToSet.guilds || []);
            setRanks(dataToSet.ranks || []);
            setTrophies(dataToSet.trophies || []);
            setUserTrophies(dataToSet.userTrophies || []);
            setAdminAdjustments(dataToSet.adminAdjustments || []);
            setGameAssets(dataToSet.gameAssets || []);
            setSystemLogs(dataToSet.systemLogs || []);
            setSettings(loadedSettings);
            setThemes(dataToSet.themes || INITIAL_THEMES);
            setLoginHistory(dataToSet.loginHistory || []);
            setChatMessages(dataToSet.chatMessages || []);
            setSystemNotifications(dataToSet.systemNotifications || []);

            const lastUserId = localStorage.getItem('lastUserId');
            if (lastUserId && dataToSet.users) {
              const lastUser = dataToSet.users.find((u:User) => u.id === lastUserId);
              if (lastUser) _setCurrentUser(lastUser);
            }
             _setIsSharedViewActive(loadedSettings.sharedMode.enabled && !localStorage.getItem('lastUserId'));
        }

        try {
            const aiResponse = await window.fetch('/api/ai/status');
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                setIsAiConfigured(aiData.isConfigured);
            }
        } catch (aiError) {
            console.error("Failed to fetch AI status:", aiError);
            setIsAiConfigured(false);
        }

        setIsDataLoaded(true);
    })();
  }, []);

  // Debounced save logic
  const saveData = useCallback(async () => {
    if (!appDataRef.current) return;
    try {
        const response = await window.fetch('/api/data/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appDataRef.current)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error from server.' }));
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
        console.log("Data saved successfully.");
        setIsDirty(false); // Mark as clean on successful save
    } catch (error) {
        console.error("Failed to save data:", error);
        addNotification({ type: 'error', message: `Data save failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        // Keep it dirty so the next change can trigger another save attempt.
    }
  }, [addNotification]);

  const debouncedSave = useCallback(debounce(saveData, 1000), [saveData]);

  useEffect(() => {
      if (isDataLoaded && !isRestoring) {
          if (!initialLoadCompleted.current) {
              initialLoadCompleted.current = true;
              return;
          }
          setIsDirty(true);
          debouncedSave();
      }
  }, [appData, isDataLoaded, isRestoring, debouncedSave]);


  // === BUSINESS LOGIC / DISPATCH FUNCTIONS ===

  const addSystemNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'timestamp' | 'readByUserIds'>) => {
    if (!notification.recipientUserIds || notification.recipientUserIds.length === 0) return;
    const newNotification: SystemNotification = {
        id: `sysnotif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        readByUserIds: [],
        ...notification
    };
    setSystemNotifications(prev => [...prev, newNotification]);
  }, []);

  const markSystemNotificationsAsRead = useCallback((notificationIds: string[]) => {
    if (!currentUser) return;
    const idsToMark = new Set(notificationIds);
    setSystemNotifications(prev => prev.map(n => {
        if (idsToMark.has(n.id) && !n.readByUserIds.includes(currentUser.id)) {
            return { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] };
        }
        return n;
    }));
  }, [currentUser]);

  // Polling for data sync
  useEffect(() => {
    if (!currentUser || isFirstRun || !isDataLoaded) return;

    const syncData = async () => {
      if (document.hidden) {
        return;
      }

      if (isDirtyRef.current) {
          console.log("Local data has unsaved changes. Skipping sync to prevent data loss.");
          return;
      }

      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const response = await window.fetch('/api/data/load');
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Sync failed: Server returned status ${response.status}`);
          throw new Error(`Server error: ${response.status} ${errorText || ''}`);
        }

        const serverData: IAppData = await response.json();
        
        const currentLocalData = stateRef.current ? {
            users: stateRef.current.users,
            quests: stateRef.current.quests,
            questGroups: stateRef.current.questGroups,
            markets: stateRef.current.markets,
            rewardTypes: stateRef.current.rewardTypes,
            questCompletions: stateRef.current.questCompletions,
            purchaseRequests: stateRef.current.purchaseRequests,
            guilds: stateRef.current.guilds,
            ranks: stateRef.current.ranks,
            trophies: stateRef.current.trophies,
            userTrophies: stateRef.current.userTrophies,
            adminAdjustments: stateRef.current.adminAdjustments,
            gameAssets: stateRef.current.gameAssets,
            systemLogs: stateRef.current.systemLogs,
            settings: stateRef.current.settings,
            themes: stateRef.current.themes,
            loginHistory: stateRef.current.loginHistory,
            chatMessages: stateRef.current.chatMessages,
            systemNotifications: stateRef.current.systemNotifications,
        } : null;

        if (currentLocalData && JSON.stringify(currentLocalData) !== JSON.stringify(serverData)) {
            console.log("Data out of sync. Refreshing from server.");
            
            const savedSettings: Partial<AppSettings> = serverData.settings || {};

            const loadedSettings: AppSettings = {
                ...INITIAL_SETTINGS, ...savedSettings,
                questDefaults: { ...INITIAL_SETTINGS.questDefaults, ...(savedSettings.questDefaults || {}) },
                security: { ...INITIAL_SETTINGS.security, ...(savedSettings.security || {}) },
                sharedMode: { ...INITIAL_SETTINGS.sharedMode, ...(savedSettings.sharedMode || {}) },
                automatedBackups: { ...INITIAL_SETTINGS.automatedBackups, ...(savedSettings.automatedBackups || {}) },
                loginNotifications: { ...INITIAL_SETTINGS.loginNotifications, ...(savedSettings.loginNotifications || {}) },
                chat: { ...INITIAL_SETTINGS.chat, ...(savedSettings.chat || {}) },
                sidebars: { ...INITIAL_SETTINGS.sidebars, ...(savedSettings.sidebars || {}) },
                terminology: { ...INITIAL_SETTINGS.terminology, ...(savedSettings.terminology || {}) },
                rewardValuation: { ...INITIAL_SETTINGS.rewardValuation, ...(savedSettings.rewardValuation || {}) },
            };

            setUsers(serverData.users || []);
            setQuests(serverData.quests || []);
            setQuestGroups(serverData.questGroups || []);
            setMarkets(serverData.markets || []);
            setRewardTypes(serverData.rewardTypes || []);
            setQuestCompletions(serverData.questCompletions || []);
            setPurchaseRequests(serverData.purchaseRequests || []);
            setGuilds(serverData.guilds || []);
            setRanks(serverData.ranks || []);
            setTrophies(serverData.trophies || []);
            setUserTrophies(serverData.userTrophies || []);
            setAdminAdjustments(serverData.adminAdjustments || []);
            setGameAssets(serverData.gameAssets || []);
            setSystemLogs(serverData.systemLogs || []);
            setSettings(loadedSettings);
            setThemes(serverData.themes || INITIAL_THEMES);
            setLoginHistory(serverData.loginHistory || []);
            setChatMessages(serverData.chatMessages || []);
            setSystemNotifications(serverData.systemNotifications || []);

            if (stateRef.current?.currentUser) {
              const updatedUser = (serverData.users || []).find(u => u.id === stateRef.current!.currentUser!.id);
              if (updatedUser) {
                _setCurrentUser(updatedUser);
              }
            }
            setSyncStatus('success');
        } else {
            setSyncStatus('success');
        }
      } catch (error) {
        console.error("Data sync failed:", error);
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'An unknown error occurred during sync.');
      }
    };

    const intervalId = setInterval(syncData, 15000); // Poll every 15 seconds
    document.addEventListener('visibilitychange', syncData);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', syncData);
    };
  }, [currentUser, isFirstRun, isDataLoaded, addNotification]);


  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const applyRewards = useCallback((userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) return prevUsers;
      const newUsers = [...prevUsers];
      const userToUpdate = { ...newUsers[userIndex] };
      rewardsToApply.forEach(reward => {
          const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
          if (!rewardDef) return;
          if (guildId) {
              userToUpdate.guildBalances = { ...userToUpdate.guildBalances };
              if (!userToUpdate.guildBalances[guildId]) userToUpdate.guildBalances[guildId] = { purse: {}, experience: {} };
              const balanceSheet = { ...userToUpdate.guildBalances[guildId] };
              if (rewardDef.category === RewardCategory.Currency) {
                  balanceSheet.purse = { ...balanceSheet.purse };
                  balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
              } else {
                  balanceSheet.experience = { ...balanceSheet.experience };
                  balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
              }
              userToUpdate.guildBalances[guildId] = balanceSheet;
          } else {
              if (rewardDef.category === RewardCategory.Currency) {
                  userToUpdate.personalPurse = { ...userToUpdate.personalPurse };
                  userToUpdate.personalPurse[reward.rewardTypeId] = (userToUpdate.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
              } else {
                  userToUpdate.personalExperience = { ...userToUpdate.personalExperience };
                  userToUpdate.personalExperience[reward.rewardTypeId] = (userToUpdate.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
              }
          }
      });
      newUsers[userIndex] = userToUpdate;
      
      if (currentUser?.id === userId) {
        _setCurrentUser(userToUpdate);
      }

      return newUsers;
    });
  }, [rewardTypes, currentUser]);
  
  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    const t = trophies.find(t => t.id === trophyId);
    if (t) {
      setUserTrophies(p => [...p, { id: `award-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }]);
      addNotification({ type: 'trophy', message: `Trophy Unlocked: ${t.name}!`, icon: t.icon });
      addSystemNotification({
        type: SystemNotificationType.TrophyAwarded,
        message: `You unlocked a new trophy: "${t.name}"!`,
        recipientUserIds: [userId],
        guildId,
        icon: t.icon,
        link: 'Trophies',
      });
    }
  }, [trophies, addNotification, addSystemNotification]);

  const checkAndAwardTrophies = useCallback((userId: string, guildId?: string) => {
    if (guildId) return; // Automatic trophies are personal-only for now
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const userCompletedQuests = questCompletions.filter(c => c.userId === userId && !c.guildId && c.status === QuestCompletionStatus.Approved);
    const totalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    const automaticTrophies = trophies.filter(t => !t.isManual);
    
    for (const trophy of automaticTrophies) {
      if (userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophy.id && !ut.guildId)) continue;
      const meetsAllRequirements = trophy.requirements.every(req => {
        switch (req.type) {
          case TrophyRequirementType.CompleteQuestType: return userCompletedQuests.filter(c => quests.find(q => q.id === c.questId)?.type === req.value).length >= req.count;
          case TrophyRequirementType.CompleteQuestTag: return userCompletedQuests.filter(c => quests.find(q => q.id === c.questId)?.tags?.includes(req.value)).length >= req.count;
          case TrophyRequirementType.AchieveRank: return userRank?.id === req.value;
          default: return false;
        }
      });
      if (meetsAllRequirements) {
        awardTrophy(userId, trophy.id, guildId);
      }
    }
  }, [users, questCompletions, ranks, trophies, userTrophies, quests, awardTrophy]);

  // Auth
  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user);
    _setIsSharedViewActive(false); // Entering a user profile always deactivates shared view
    if (user) {
        setActivePage('Dashboard');
        localStorage.setItem('lastUserId', user.id);
        setLoginHistory(prev => [user.id, ...prev.filter(id => id !== user.id).slice(0, 9)]);
    } else {
        localStorage.removeItem('lastUserId');
    }
  };
  const exitToSharedView = useCallback(() => {
    _setCurrentUser(null);
    _setIsSharedViewActive(true);
    localStorage.removeItem('lastUserId');
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>): User => {
    const newUser: User = { ...userData, id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
    setUsers(prev => [...prev, newUser]);
    setGuilds(prev => prev.map(g => g.isDefault ? { ...g, memberIds: [...g.memberIds, newUser.id] } : g));
    
    const roleTag = `tutorial-${newUser.role.toLowerCase().replace(/ /g, '-')}`;
    setQuests(prevQuests => {
        return prevQuests.map(q => {
            if (q.tags.includes(roleTag)) {
                if (!q.assignedUserIds.includes(newUser.id)) {
                    return { ...q, assignedUserIds: [...q.assignedUserIds, newUser.id] };
                }
            }
            return q;
        });
    });

    return newUser;
  }, []);
  const updateUser = useCallback((userId: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser?.id === userId) {
        _setCurrentUser(prev => prev ? { ...prev, ...updatedData } as User : null);
    }
  }, [currentUser]);
  const deleteUser = useCallback((userId: string) => { setUsers(prev => prev.filter(u => u.id !== userId)); setGuilds(prev => prev.map(g => ({ ...g, memberIds: g.memberIds.filter(id => id !== userId) }))); setQuests(prev => prev.map(q => ({ ...q, assignedUserIds: q.assignedUserIds.filter(id => id !== userId) }))); }, []);
  const markUserAsOnboarded = useCallback((userId: string) => updateUser(userId, { hasBeenOnboarded: true }), [updateUser]);
  const setAppUnlocked = useCallback((isUnlocked: boolean) => { localStorage.setItem('isAppUnlocked', String(isUnlocked)); _setAppUnlocked(isUnlocked); }, []);
  
  // GameData
  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
    const newQuest: Quest = { ...quest, id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, claimedByUserIds: [], dismissals: [], todoUserIds: [] };
    setQuests(prev => [...prev, newQuest]);
    if (newQuest.assignedUserIds.length > 0) {
        addSystemNotification({
            type: SystemNotificationType.QuestAssigned,
            message: `You have been assigned a new quest: "${newQuest.title}"`,
            recipientUserIds: newQuest.assignedUserIds,
            guildId: newQuest.guildId,
            link: 'Quests',
        });
    } else if (newQuest.guildId) {
        const guild = guilds.find(g => g.id === newQuest.guildId);
        if (guild) {
             addSystemNotification({
                type: SystemNotificationType.QuestAssigned,
                message: `A new guild quest is available: "${newQuest.title}"`,
                recipientUserIds: guild.memberIds,
                guildId: newQuest.guildId,
                link: 'Quests',
            });
        }
    }
  }, [addSystemNotification, guilds]);
  const cloneQuest = useCallback((questId: string) => {
    const questToClone = quests.find(q => q.id === questId);
    if (!questToClone) return;

    const newQuest: Quest = {
        ...JSON.parse(JSON.stringify(questToClone)), // Deep copy
        id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${questToClone.title} (Copy)`,
        claimedByUserIds: [],
        dismissals: [],
        todoUserIds: [],
    };
    setQuests(prev => [...prev, newQuest]);
    addNotification({ type: 'success', message: `Cloned quest: ${newQuest.title}` });
  }, [quests, addNotification]);
  const updateQuest = useCallback((updatedQuest: Quest) => {
    setQuests(prev => {
        const oldQuest = prev.find(q => q.id === updatedQuest.id);
        const newQuests = prev.map(q => q.id === updatedQuest.id ? updatedQuest : q);
        if (oldQuest) {
            const oldAssignees = new Set(oldQuest.assignedUserIds);
            const newAssignees = new Set(updatedQuest.assignedUserIds);
            const newlyAssigned = [...newAssignees].filter(id => !oldAssignees.has(id));
            if (newlyAssigned.length > 0) {
                addSystemNotification({
                    type: SystemNotificationType.QuestAssigned,
                    message: `You have been assigned a new quest: "${updatedQuest.title}"`,
                    recipientUserIds: newlyAssigned,
                    guildId: updatedQuest.guildId,
                    link: 'Quests',
                });
            }
        }
        return newQuests;
    });
  }, [addSystemNotification]);
  const deleteQuest = useCallback((questId: string) => setQuests(prev => prev.filter(q => q.id !== questId)), []);
  const dismissQuest = useCallback((questId: string, userId: string) => { setQuests(prevQuests => prevQuests.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals.filter(d => d.userId !== userId), { userId, dismissedAt: new Date().toISOString() }] } : q)); }, []);
  const claimQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, userId] } : q)), []);
  const releaseQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId) } : q)), []);
  const markQuestAsTodo = useCallback((questId: string, userId: string) => { setQuests(prevQuests => prevQuests.map(q => q.id === questId ? { ...q, todoUserIds: Array.from(new Set([...(q.todoUserIds || []), userId])) } : q)); }, []);
  const unmarkQuestAsTodo = useCallback((questId: string, userId: string) => { setQuests(prevQuests => prevQuests.map(q => q.id === questId ? { ...q, todoUserIds: (q.todoUserIds || []).filter(id => id !== userId) } : q)); }, []);
  const completeQuest = useCallback((questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => {
    const newCompletion: QuestCompletion = { id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, questId, userId, completedAt: (options?.completionDate || new Date()).toISOString(), status: requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved, guildId, note: options?.note };
    setQuestCompletions(prev => [...prev, newCompletion]);
    if (!requiresApproval) { applyRewards(userId, rewards, guildId); const quest = quests.find(q => q.id === questId); addNotification({ type: 'success', message: `Quest Completed: ${quest?.title}`}); checkAndAwardTrophies(userId, guildId); } 
    else { 
        addNotification({ type: 'info', message: `Quest submitted for approval.` }); 
        const recipients = users.filter(u => {
            const isAdmin = u.role === Role.DonegeonMaster;
            const isGatekeeper = u.role === Role.Gatekeeper;
            if (guildId) {
                const guild = guilds.find(g => g.id === guildId);
                return guild?.memberIds.includes(u.id) && (isAdmin || isGatekeeper);
            }
            return isAdmin || isGatekeeper; // Personal scope
        }).map(u => u.id).filter(id => id !== userId);

        if (recipients.length > 0) {
            const quest = quests.find(q => q.id === questId);
            const user = users.find(u => u.id === userId);
            addSystemNotification({
                type: SystemNotificationType.ApprovalRequired,
                message: `${user?.gameName || 'A user'} submitted "${quest?.title || 'a quest'}" for approval.`,
                recipientUserIds: recipients,
                guildId,
                link: 'Approvals',
            });
        }
    }
  }, [quests, applyRewards, addNotification, checkAndAwardTrophies, users, guilds, addSystemNotification]);
  const approveQuestCompletion = useCallback((completionId: string, note?: string) => { const c = questCompletions.find(c => c.id === completionId); if (c) { const q = quests.find(q => q.id === c.questId); if (q) { setQuestCompletions(prev => prev.map(comp => comp.id === completionId ? { ...comp, note: note || comp.note } : comp)); applyRewards(c.userId, q.rewards, q.guildId); addNotification({ type: 'success', message: `Quest approved!`}); checkAndAwardTrophies(c.userId, q.guildId); } } }, [questCompletions, quests, applyRewards, addNotification, checkAndAwardTrophies]);
  const rejectQuestCompletion = useCallback((completionId: string, note?: string) => { setQuestCompletions(prev => prev.map(c => c.id === completionId ? { ...c, note: note || c.note } : c)); addNotification({ type: 'info', message: `Quest rejected.`}); }, [addNotification]);
  const addRewardType = useCallback((rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => setRewardTypes(prev => [...prev, { ...rewardType, id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, isCore: false }]), []);
  const updateRewardType = useCallback((rewardType: RewardTypeDefinition) => setRewardTypes(prev => prev.map(rt => rt.id === rewardType.id ? rewardType : rt)), []);
  const deleteRewardType = useCallback((rewardTypeId: string) => setRewardTypes(prev => prev.filter(rt => rt.id !== rewardTypeId)), []);
  const cloneRewardType = useCallback((rewardTypeId: string) => {
    const rewardToClone = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!rewardToClone || rewardToClone.isCore) {
        addNotification({ type: 'error', message: 'Core rewards cannot be cloned.' });
        return;
    }
    const newReward: RewardTypeDefinition = {
        ...JSON.parse(JSON.stringify(rewardToClone)),
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${rewardToClone.name} (Copy)`,
        isCore: false,
    };
    setRewardTypes(prev => [...prev, newReward]);
    addNotification({ type: 'success', message: `Cloned reward: ${newReward.name}` });
  }, [rewardTypes, addNotification]);
  const addMarket = useCallback((market: Omit<Market, 'id'>) => setMarkets(prev => [...prev, { ...market, id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }]), []);
  const updateMarket = useCallback((market: Market) => setMarkets(prev => prev.map(m => m.id === market.id ? market : m)), []);
  const deleteMarket = useCallback((marketId: string) => setMarkets(prev => prev.filter(m => m.id !== marketId)), []);
  const cloneMarket = useCallback((marketId: string) => {
    if (marketId === 'market-bank') {
        addNotification({ type: 'error', message: 'The Exchange Post cannot be cloned.' });
        return;
    }
    const marketToClone = markets.find(m => m.id === marketId);
    if (!marketToClone) return;
    const newMarket: Market = {
        ...JSON.parse(JSON.stringify(marketToClone)),
        id: `market-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: `${marketToClone.title} (Copy)`,
    };
    setMarkets(prev => [...prev, newMarket]);
    addNotification({ type: 'success', message: `Cloned market: ${newMarket.title}` });
  }, [markets, addNotification]);
  const deleteMarkets = useCallback((marketIds: string[]) => {
      const idsToDelete = new Set(marketIds.filter(id => id !== 'market-bank'));
      if (marketIds.includes('market-bank')) {
          addNotification({ type: 'error', message: 'The Exchange Post cannot be deleted.' });
      }
      setMarkets(prev => prev.filter(m => !idsToDelete.has(m.id)));
      if (idsToDelete.size > 0) {
        addNotification({ type: 'info', message: `${idsToDelete.size} market(s) deleted.` });
      }
  }, [addNotification]);
  const updateMarketsStatus = useCallback((marketIds: string[], statusType: 'open' | 'closed') => {
      const idsToUpdate = new Set(marketIds);
      const newStatus: MarketStatus = { type: statusType };
      setMarkets(prev => prev.map(m => {
          if (idsToUpdate.has(m.id) && m.status.type !== 'conditional') {
              return { ...m, status: newStatus };
          }
          return m;
      }));
      addNotification({ type: 'success', message: `${marketIds.length} market(s) updated.` });
  }, [addNotification]);
  
  const deductRewards = useCallback((userId: string, cost: RewardItem[], guildId?: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const canAfford = cost.every(item => {
        const rd = rewardTypes.find(rt => rt.id === item.rewardTypeId);
        if (!rd) return false;
        const bal = guildId ? 
            (rd.category === 'Currency' ? user.guildBalances[guildId]?.purse[item.rewardTypeId] : user.guildBalances[guildId]?.experience[item.rewardTypeId])
            : (rd.category === 'Currency' ? user.personalPurse[item.rewardTypeId] : user.personalExperience[item.rewardTypeId]);
        return (bal || 0) >= item.amount;
    });

    if (!canAfford) return false;

    const updatedUser = { ...user };
    cost.forEach(c => {
        const rd = rewardTypes.find(rt => rt.id === c.rewardTypeId);
        if (!rd) return;

        if (guildId) {
            if (!updatedUser.guildBalances[guildId]) updatedUser.guildBalances[guildId] = { purse: {}, experience: {} };
            if (rd.category === 'Currency') {
                updatedUser.guildBalances[guildId].purse[c.rewardTypeId] = (updatedUser.guildBalances[guildId].purse[c.rewardTypeId] || 0) - c.amount;
            } else {
                updatedUser.guildBalances[guildId].experience[c.rewardTypeId] = (updatedUser.guildBalances[guildId].experience[c.rewardTypeId] || 0) - c.amount;
            }
        } else {
            if (rd.category === 'Currency') {
                updatedUser.personalPurse[c.rewardTypeId] = (updatedUser.personalPurse[c.rewardTypeId] || 0) - c.amount;
            } else {
                updatedUser.personalExperience[c.rewardTypeId] = (updatedUser.personalExperience[c.rewardTypeId] || 0) - c.amount;
            }
        }
    });

    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
    if (currentUser?.id === userId) {
        _setCurrentUser(updatedUser);
    }
    return true;
  }, [users, rewardTypes, currentUser]);
  
  const purchaseMarketItem = useCallback((assetId: string, marketId: string, user: User, costGroupIndex: number) => {
    const market = markets.find(m => m.id === marketId);
    const asset = gameAssets.find(ga => ga.id === assetId);
    if (!market || !asset) return;
    
    const cost = asset.costGroups[costGroupIndex];
    if (!cost) {
        addNotification({ type: 'error', message: 'Invalid cost option selected.' });
        return;
    }

    if (asset.requiresApproval) {
        if (deductRewards(user.id, cost, market.guildId)) {
            const newRequest: PurchaseRequest = {
                id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Pending,
                assetDetails: { name: asset.name, description: asset.description, cost }, guildId: market.guildId,
            };
            setPurchaseRequests(p => [...p, newRequest]);
            addNotification({ type: 'info', message: 'Purchase requested. Funds have been held.' });
            
            const recipients = users.filter(u => {
                const isAdmin = u.role === Role.DonegeonMaster;
                if (market.guildId) {
                    const guild = guilds.find(g => g.id === market.guildId);
                    return guild?.memberIds.includes(u.id) && isAdmin;
                }
                return isAdmin;
            }).map(u => u.id).filter(id => id !== user.id);

            if (recipients.length > 0) {
                addSystemNotification({
                    type: SystemNotificationType.ApprovalRequired,
                    message: `${user.gameName} requested to purchase "${asset.name}".`,
                    recipientUserIds: recipients, guildId: market.guildId, link: 'Approvals',
                });
            }
        } else {
            addNotification({ type: 'error', message: 'You cannot afford this item.' });
        }
    } else {
        if (deductRewards(user.id, cost, market.guildId)) {
            let wasModified = false;
            const updatedUser = { ...user };

            if (asset.payouts && asset.payouts.length > 0) {
                applyRewards(user.id, asset.payouts, market.guildId);
                addNotification({ type: 'success', message: `Exchanged for ${asset.name}!` });
                wasModified = true;
            }
            if (asset.linkedThemeId && !updatedUser.ownedThemes.includes(asset.linkedThemeId)) {
                updatedUser.ownedThemes = [...updatedUser.ownedThemes, asset.linkedThemeId];
                addNotification({ type: 'success', message: `Theme Unlocked: ${asset.name}!` });
                wasModified = true;
            }
            if (!asset.payouts || asset.payouts.length === 0) {
                 updatedUser.ownedAssetIds = [...updatedUser.ownedAssetIds, asset.id];
                 addNotification({ type: 'success', message: `Purchased "${asset.name}"!` });
                 wasModified = true;
            }

            if (wasModified) updateUser(user.id, updatedUser);

            setPurchaseRequests(p => [...p, { id: `purchase-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Completed, assetDetails: { name: asset.name, description: asset.description, cost: cost }, guildId: market.guildId }]);
        } else {
          addNotification({ type: 'error', message: 'You cannot afford this item.' });
        }
    }
  }, [markets, gameAssets, deductRewards, addNotification, applyRewards, updateUser, users, guilds, addSystemNotification]);

  const cancelPurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (r && r.status === PurchaseRequestStatus.Pending) {
        applyRewards(r.userId, r.assetDetails.cost, r.guildId);
        addNotification({ type: 'info', message: 'Purchase cancelled. Funds returned.' });
    }
    setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled, actedAt: new Date().toISOString() } : p));
  }, [purchaseRequests, applyRewards, addNotification]);
  
  const approvePurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (!r) return;
    const asset = gameAssets.find(a => a.id === r.assetId);
    if (!asset) return;
    
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => {
        if (u.id === r.userId) {
          const updatedUser = { ...u };
          if (asset.linkedThemeId && !updatedUser.ownedThemes.includes(asset.linkedThemeId)) {
              updatedUser.ownedThemes = [...updatedUser.ownedThemes, asset.linkedThemeId];
          }
          if (!asset.payouts || asset.payouts.length === 0) {
              updatedUser.ownedAssetIds = [...updatedUser.ownedAssetIds, r.assetId];
          }
          return updatedUser;
        }
        return u;
      });
      
      if (currentUser?.id === r.userId) {
        const updatedCurrentUser = newUsers.find(u => u.id === r.userId);
        if (updatedCurrentUser) _setCurrentUser(updatedCurrentUser);
      }
      return newUsers;
    });

    if (asset.payouts && asset.payouts.length > 0) {
      applyRewards(r.userId, asset.payouts, r.guildId);
    }

    setPurchaseRequests(p => p.map(pr => pr.id === purchaseId ? { ...pr, status: PurchaseRequestStatus.Completed, actedAt: new Date().toISOString() } : pr));
    addNotification({type: 'success', message: 'Purchase approved.'});
  }, [purchaseRequests, gameAssets, addNotification, currentUser, applyRewards]);
  
  const rejectPurchaseRequest = useCallback((purchaseId: string) => {
    const r = purchaseRequests.find(p => p.id === purchaseId);
    if (r && r.status === PurchaseRequestStatus.Pending) {
        applyRewards(r.userId, r.assetDetails.cost, r.guildId);
        addNotification({ type: 'info', message: 'Purchase rejected. Funds returned.' });
    }
    setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected, actedAt: new Date().toISOString() } : p));
  }, [purchaseRequests, applyRewards, addNotification]);
  const addGuild = useCallback((guild: Omit<Guild, 'id'>) => setGuilds(prev => [...prev, { ...guild, id: `guild-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}]), []);
  const updateGuild = useCallback((guild: Guild) => setGuilds(prev => prev.map(g => g.id === guild.id ? guild : g)), []);
  const deleteGuild = useCallback((guildId: string) => setGuilds(prev => prev.filter(g => g.id !== guildId)), []);
  const addTrophy = useCallback((trophy: Omit<Trophy, 'id'>) => setTrophies(prev => [...prev, { ...trophy, id: `trophy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}]), []);
  const updateTrophy = useCallback((trophy: Trophy) => setTrophies(prev => prev.map(t => t.id === trophy.id ? trophy : t)), []);
  const deleteTrophy = useCallback((trophyId: string) => setTrophies(prev => prev.filter(t => t.id !== trophyId)), []);

  const applyManualAdjustment = useCallback((adj: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): boolean => { const newAdj: AdminAdjustment = { ...adj, id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, adjustedAt: new Date().toISOString() }; setAdminAdjustments(p => [...p, newAdj]); if (newAdj.type === AdminAdjustmentType.Reward) applyRewards(newAdj.userId, newAdj.rewards, newAdj.guildId); else if (newAdj.type === AdminAdjustmentType.Setback) deductRewards(newAdj.userId, newAdj.setbacks, newAdj.guildId); else if (newAdj.type === AdminAdjustmentType.Trophy && newAdj.trophyId) awardTrophy(newAdj.userId, newAdj.trophyId, newAdj.guildId); addNotification({type: 'success', message: 'Manual adjustment applied.'}); return true; }, [applyRewards, deductRewards, awardTrophy, addNotification]);
  const addGameAsset = useCallback((asset: Omit<GameAsset, 'id'|'creatorId'|'createdAt'>) => { setGameAssets(p => [...p, { ...asset, id: `g-asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, creatorId: 'admin', createdAt: new Date().toISOString() }]); addNotification({ type: 'success', message: `Asset "${asset.name}" created.` }); }, [addNotification]);
  const updateGameAsset = useCallback((asset: GameAsset) => setGameAssets(prev => prev.map(ga => ga.id === asset.id ? asset : ga)), []);
  const deleteGameAsset = useCallback((assetId: string) => { setGameAssets(prev => prev.filter(ga => ga.id !== assetId)); addNotification({ type: 'info', message: 'Asset deleted.' }); }, [addNotification]);
  const cloneGameAsset = useCallback((assetId: string) => {
    const assetToClone = gameAssets.find(a => a.id === assetId);
    if (!assetToClone) return;

    const newAsset: GameAsset = {
        ...JSON.parse(JSON.stringify(assetToClone)),
        id: `g-asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: `${assetToClone.name} (Copy)`,
        purchaseCount: 0,
        createdAt: new Date().toISOString(),
    };
    setGameAssets(prev => [...prev, newAsset]);
    addNotification({ type: 'success', message: `Cloned asset: ${newAsset.name}` });
  }, [gameAssets, addNotification]);
  const uploadFile = useCallback(async (file: File, category: string = 'Miscellaneous'): Promise<{ url: string } | null> => { const fd = new FormData(); fd.append('file', file); fd.append('category', category); try { const r = await window.fetch('/api/media/upload', { method: 'POST', body: fd }); if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Upload failed'); } return await r.json(); } catch (e) { const m = e instanceof Error ? e.message : 'Unknown error'; addNotification({ type: 'error', message: `Upload failed: ${m}` }); return null; } }, [addNotification]);
  
  const executeExchange = useCallback((userId: string, payItem: RewardItem, receiveItem: RewardItem, guildId?: string) => {
    // This function assumes payItem.amount already includes any fees and is a whole number.
    // receiveItem.amount should also be a whole number.
    if (deductRewards(userId, [payItem], guildId)) {
        applyRewards(userId, [receiveItem], guildId);
    } else {
        addNotification({ type: 'error', message: 'Exchange failed due to insufficient funds.' });
    }
  }, [deductRewards, applyRewards, addNotification]);
  
  const importBlueprint = useCallback((blueprint: Blueprint, resolutions: ImportResolution[]) => { const idMap = new Map<string, string>(); const genId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; resolutions.forEach(res => { if (res.resolution !== 'skip') idMap.set(res.id, genId(res.type.slice(0, 2))); }); const newAssets: Partial<IAppData> = { quests: [], rewardTypes: [], ranks: [], trophies: [], markets: [] }; resolutions.forEach(res => { if (res.resolution === 'skip') return; const a = blueprint.assets[res.type]?.find(a => a.id === res.id); if (a) { const nA = { ...a, id: idMap.get(a.id)! }; if (res.resolution === 'rename' && res.newName) { if('title' in nA) nA.title = res.newName; else nA.name = res.newName; } newAssets[res.type]?.push(nA as any); } }); newAssets.quests?.forEach(q => { q.rewards = q.rewards.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); q.lateSetbacks = q.lateSetbacks.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); q.incompleteSetbacks = q.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); }); newAssets.trophies?.forEach(t => t.requirements.forEach(r => { if(r.type === TrophyRequirementType.AchieveRank) r.value = idMap.get(r.value) || r.value; })); setQuests(p => [...p, ...(newAssets.quests || [])]); setRewardTypes(p => p.filter(rt => rt.isCore).concat(newAssets.rewardTypes || [])); setRanks(p => [...p, ...(newAssets.ranks || [])]); setTrophies(p => [...p, ...(newAssets.trophies || [])]); setMarkets(p => [...p, ...(newAssets.markets || [])]); addNotification({ type: 'success', message: `Imported from ${blueprint.name}!`}); }, [addNotification]);
  
  const completeFirstRun = useCallback((adminUserData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>, setupChoice: 'guided' | 'scratch' | 'import', blueprint?: Blueprint | null) => {
    // 1. Create the admin user object
    const adminUser: User = { 
        ...adminUserData, 
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
        avatar: {}, 
        ownedAssetIds: [], 
        personalPurse: {}, 
        personalExperience: {}, 
        guildBalances: {}, 
        ownedThemes: ['emerald', 'rose', 'sky'], 
        hasBeenOnboarded: false 
    };

    // 2. Set core data that's always present
    setUsers([adminUser]);
    setGuilds(createInitialGuilds([adminUser]));
    setRewardTypes(INITIAL_REWARD_TYPES);
    setRanks(INITIAL_RANKS);
    setTrophies(INITIAL_TROPHIES);
    setThemes(INITIAL_THEMES);
    setQuestGroups(INITIAL_QUEST_GROUPS);
    
    // 3. Clear any potential old sample data from a failed previous run
    setQuests([]);
    setMarkets([]);
    setGameAssets([]);
    setQuestCompletions([]);
    setSystemLogs([]);
    setAdminAdjustments([]);
    setPurchaseRequests([]);
    
    // 4. Choice-specific setup
    if (setupChoice === 'guided') {
        const sampleQuests = createSampleQuests([adminUser]);
        setQuests(sampleQuests);
        setMarkets(createSampleMarkets());
        setGameAssets(createSampleGameAssets());
        setQuestCompletions(createInitialQuestCompletions([adminUser], sampleQuests));
        addNotification({ type: 'info', message: 'Your Donegeon is being populated with sample data!' });
    } else if (setupChoice === 'scratch') {
        const exchangeMarket = createSampleMarkets().find(m => m.id === 'market-bank');
        if (exchangeMarket) {
            setMarkets([exchangeMarket]);
        }
    } else if (setupChoice === 'import' && blueprint) {
        const freshState: IAppData = { users: [adminUser], quests: [], questGroups: [], rewardTypes: INITIAL_REWARD_TYPES, ranks: INITIAL_RANKS, trophies: INITIAL_TROPHIES, userTrophies: [], markets: [], gameAssets: [], questCompletions: [], purchaseRequests: [], guilds: [], adminAdjustments: [], systemLogs: [], settings: INITIAL_SETTINGS, themes: INITIAL_THEMES, loginHistory: [], chatMessages: [], systemNotifications: [] };
        const resolutions = analyzeBlueprintForConflicts(blueprint, freshState);
        const allKeepResolutions = resolutions.map(r => ({ ...r, resolution: 'keep' as const }));
        importBlueprint(blueprint, allKeepResolutions);
        
        // Ensure Exchange Post exists if not in blueprint
        setMarkets(prev => {
            if (!prev.some(m => m.id === 'market-bank')) {
                 const exchangeMarket = createSampleMarkets().find(m => m.id === 'market-bank');
                 if (exchangeMarket) return [...prev, exchangeMarket];
            }
            return prev;
        });
    }
    
    // 5. Finalize
    setSettings(prev => ({...prev, contentVersion: 1}));
    setCurrentUser(adminUser);

  }, [setCurrentUser, importBlueprint, addNotification]);

  const restoreFromBackup = useCallback(async (backupData: IAppData) => {
    setIsRestoring(true); // Prevent save
    try {
        await window.fetch('/api/data/save', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(backupData) 
        });
        addNotification({ type: 'success', message: 'Restore successful! The app will now reload.' });
        setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
        addNotification({ type: 'error', message: 'Failed to restore from backup.' });
        setIsRestoring(false); // Reset flag on failure
    }
  }, [addNotification]);

  const clearAllHistory = useCallback(() => { setQuestCompletions([]); setPurchaseRequests([]); setAdminAdjustments([]); setSystemLogs([]); addNotification({ type: 'success', message: 'All historical data has been cleared.' }); }, [addNotification]);
  const resetAllPlayerData = useCallback(() => { setUsers(prev => prev.map(u => u.role !== Role.DonegeonMaster ? { ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], avatar: {} } : u)); setUserTrophies(prev => prev.filter(ut => users.find(u => u.id === ut.userId)?.role === Role.DonegeonMaster)); addNotification({ type: 'success', message: "All player data has been reset." }); }, [users, addNotification]);
  const deleteAllCustomContent = useCallback(() => { setQuests([]); setQuestGroups([]); setMarkets([]); setGameAssets([]); setRewardTypes(p => p.filter(rt => rt.isCore)); setRanks(p => p.filter(r => r.xpThreshold === 0)); setTrophies([]); setGuilds(p => p.filter(g => g.isDefault)); addNotification({ type: 'success', message: 'All custom content has been deleted.' }); }, [addNotification]);
  const deleteSelectedAssets = useCallback((selection: Record<ShareableAssetType, string[]>) => { (Object.keys(selection) as ShareableAssetType[]).forEach(assetType => { const ids = new Set(selection[assetType]); if (ids.size > 0) { switch (assetType) { case 'quests': setQuests(p => p.filter(i => !ids.has(i.id))); break; case 'markets': setMarkets(p => p.filter(i => !ids.has(i.id))); break; case 'rewardTypes': setRewardTypes(p => p.filter(i => !ids.has(i.id))); break; case 'ranks': setRanks(p => p.filter(i => !ids.has(i.id))); break; case 'trophies': setTrophies(p => p.filter(i => !ids.has(i.id))); break; case 'gameAssets': setGameAssets(p => p.filter(i => !ids.has(i.id))); break; } } }); addNotification({ type: 'success', message: 'Selected assets have been deleted.' }); }, [addNotification]);
  const deleteQuests = useCallback((questIds: string[]) => { setQuests(prev => prev.filter(q => !questIds.includes(q.id))); addNotification({ type: 'info', message: `${questIds.length} quest(s) deleted.` }); }, [addNotification]);
  const deleteTrophies = useCallback((trophyIds: string[]) => { setTrophies(prev => prev.filter(t => !trophyIds.includes(t.id))); addNotification({ type: 'info', message: `${trophyIds.length} trophy(s) deleted.` }); }, [addNotification]);
  const deleteGameAssets = useCallback((assetIds: string[]) => { setGameAssets(prev => prev.filter(ga => !assetIds.includes(ga.id))); addNotification({ type: 'info', message: `${assetIds.length} asset(s) deleted.` }); }, [addNotification]);
  const updateQuestsStatus = useCallback((questIds: string[], isActive: boolean) => { setQuests(prev => prev.map(q => questIds.includes(q.id) ? { ...q, isActive } : q)); addNotification({ type: 'success', message: `${questIds.length} quest(s) updated.` }); }, [addNotification]);

  const bulkUpdateQuests = useCallback((questIds: string[], updates: BulkQuestUpdates) => {
    setQuests(prevQuests => {
        const questIdSet = new Set(questIds);
        return prevQuests.map(quest => {
            if (questIdSet.has(quest.id)) {
                const updatedQuest = { ...quest };

                if (updates.isActive !== undefined) updatedQuest.isActive = updates.isActive;
                if (updates.isOptional !== undefined) updatedQuest.isOptional = updates.isOptional;
                if (updates.requiresApproval !== undefined) updatedQuest.requiresApproval = updates.requiresApproval;
                if (updates.groupId !== undefined) updatedQuest.groupId = updates.groupId === null ? undefined : updates.groupId;
                
                if (updates.addTags) updatedQuest.tags = Array.from(new Set([...quest.tags, ...updates.addTags]));
                if (updates.removeTags) updatedQuest.tags = quest.tags.filter(tag => !updates.removeTags!.includes(tag));
                
                if (updates.assignUsers) updatedQuest.assignedUserIds = Array.from(new Set([...quest.assignedUserIds, ...updates.assignUsers]));
                if (updates.unassignUsers) updatedQuest.assignedUserIds = quest.assignedUserIds.filter(id => !updates.unassignUsers!.includes(id));
                
                return updatedQuest;
            }
            return quest;
        });
    });
    addNotification({type: 'success', message: `Bulk updated ${questIds.length} quest(s).`});
  }, [addNotification]);

  // Quest Group Management
  const addQuestGroup = useCallback((group: Omit<QuestGroup, 'id'>): QuestGroup => {
    const newGroup: QuestGroup = { ...group, id: `q-group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
    setQuestGroups(prev => [...prev, newGroup]);
    addNotification({ type: 'success', message: `Quest group "${newGroup.name}" created.` });
    return newGroup;
  }, [addNotification]);
  const updateQuestGroup = useCallback((group: QuestGroup) => { setQuestGroups(prev => prev.map(g => g.id === group.id ? group : g)); addNotification({ type: 'success', message: `Quest group "${group.name}" updated.` }); }, [addNotification]);
  const deleteQuestGroup = useCallback((groupId: string) => { setQuestGroups(prev => prev.filter(g => g.id !== groupId)); setQuests(prevQuests => prevQuests.map(q => q.groupId === groupId ? { ...q, groupId: undefined } : q)); addNotification({ type: 'info', message: 'Quest group deleted.' }); }, [addNotification]);
  const assignQuestGroupToUsers = useCallback((groupId: string, userIds: string[]) => {
    const group = questGroups.find(g => g.id === groupId);
    if (!group) return;

    setQuests(prevQuests => {
        const groupQuests = prevQuests.filter(q => q.groupId === groupId);

        if (groupQuests.length > 0) {
            userIds.forEach(userId => {
                const newlyAssignedQuests = groupQuests.filter(q => !q.assignedUserIds.includes(userId));
                if (newlyAssignedQuests.length > 0) {
                    addSystemNotification({
                        type: SystemNotificationType.QuestAssigned,
                        message: `You have been assigned ${newlyAssignedQuests.length} new quest(s) from the "${group.name}" group.`,
                        recipientUserIds: [userId],
                        link: 'Quests',
                    });
                }
            });
        }

        return prevQuests.map(q => {
            if (q.groupId === groupId) {
                const newAssignees = Array.from(new Set([...q.assignedUserIds, ...userIds]));
                return { ...q, assignedUserIds: newAssignees };
            }
            return q;
        });
    });
  }, [addSystemNotification, questGroups]);

  // Theme Management
  const addTheme = useCallback((theme: Omit<ThemeDefinition, 'id'>) => {
    const newTheme: ThemeDefinition = { ...theme, id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, isCustom: true };
    setThemes(prev => [...prev, newTheme]);
    addNotification({ type: 'success', message: 'Theme created!' });
  }, [addNotification]);
  const updateTheme = useCallback((theme: ThemeDefinition) => {
    setThemes(prev => prev.map(t => t.id === theme.id ? theme : t));
    addNotification({ type: 'success', message: 'Theme updated!' });
  }, [addNotification]);
  const deleteTheme = useCallback((themeId: string) => {
    setThemes(prev => prev.filter(t => t.id !== themeId));
    addNotification({ type: 'info', message: 'Theme deleted.' });
  }, [addNotification]);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
        const newState = !prev;
        localStorage.setItem('isSidebarCollapsed', String(newState));
        return newState;
    });
  }, []);

  const updateSettings = useCallback((settingsToUpdate: Partial<AppSettings>) => {
    setSettings(prev => ({...prev, ...settingsToUpdate}));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(INITIAL_SETTINGS);
    addNotification({ type: 'success', message: 'All application settings have been reset to their defaults.' });
  }, [addNotification]);

  // Inactivity Timer for Shared Mode
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (settings.sharedMode.enabled && settings.sharedMode.autoExit && currentUser) {
        inactivityTimer.current = window.setTimeout(
            exitToSharedView,
            settings.sharedMode.autoExitMinutes * 60 * 1000
        );
    }
  }, [settings.sharedMode, currentUser, exitToSharedView]);

  useEffect(() => {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keydown', resetInactivityTimer);
      window.addEventListener('click', resetInactivityTimer);
      resetInactivityTimer(); // Initial setup
      return () => {
          window.removeEventListener('mousemove', resetInactivityTimer);
          window.removeEventListener('keydown', resetInactivityTimer);
          window.removeEventListener('click', resetInactivityTimer);
          if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      };
  }, [resetInactivityTimer]);

  // Chat functions
  const toggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);

  const sendMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy' | 'senderId'> & { isAnnouncement?: boolean }) => {
    if (!currentUser) return;

    const { isAnnouncement, ...chatMessageData } = message;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUser.id,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id], // Sender has read their own message
      ...chatMessageData,
      isAnnouncement: isAnnouncement || undefined,
    };

    if (isAnnouncement && message.guildId) {
        const guild = guilds.find(g => g.id === message.guildId);
        if (guild) {
            addSystemNotification({
                type: SystemNotificationType.Announcement,
                message: message.message,
                senderId: currentUser.id,
                recipientUserIds: guild.memberIds, // Send to all members, including sender
                guildId: message.guildId,
            });
        }
    }

    setChatMessages(prevMessages => [...prevMessages, newMessage]);
  }, [currentUser, guilds, addSystemNotification]);

  const markMessagesAsRead = useCallback((params: { partnerId?: string; guildId?: string; }) => {
    if (!currentUser) return;
    const { partnerId, guildId } = params;

    setChatMessages(prev => prev.map(msg => {
        // Condition for DM
        const isUnreadDm = partnerId && msg.recipientId === currentUser.id && msg.senderId === partnerId;
        // Condition for Guild Chat
        const isUnreadGuildMsg = guildId && msg.guildId === guildId;

        if ((isUnreadDm || isUnreadGuildMsg) && !msg.readBy.includes(currentUser.id)) {
            return { ...msg, readBy: [...msg.readBy, currentUser.id] };
        }
        return msg;
    }));
  }, [currentUser]);

  // === CONTEXT PROVIDER VALUE ===
  const stateValue: AppState = {
    users, quests, questGroups, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings, themes, loginHistory, chatMessages, systemNotifications,
    currentUser, isAppUnlocked, isFirstRun, activePage, appMode, notifications, isDataLoaded, activeMarketId, 
    allTags: useMemo(() => Array.from(new Set([...INITIAL_TAGS, ...quests.flatMap(q => q.tags || [])])).sort(), [quests]),
    isSwitchingUser, isSharedViewActive, targetedUserForLogin, isAiConfigured, isSidebarCollapsed,
    syncStatus, syncError, isChatOpen,
  };

  // Keep a ref to the state to use in the polling effect without causing re-renders
  stateRef.current = stateValue;

  const dispatchValue: AppDispatch = {
    addUser, updateUser, deleteUser, setCurrentUser, markUserAsOnboarded, setAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin, exitToSharedView, setIsSharedViewActive: _setIsSharedViewActive,
    addQuest, updateQuest, deleteQuest, cloneQuest, dismissQuest, claimQuest, releaseQuest, markQuestAsTodo, unmarkQuestAsTodo, completeQuest, approveQuestCompletion, rejectQuestCompletion,
    addQuestGroup, updateQuestGroup, deleteQuestGroup, assignQuestGroupToUsers,
    addRewardType, updateRewardType, deleteRewardType, cloneRewardType, addMarket, updateMarket, deleteMarket, cloneMarket, deleteMarkets, updateMarketsStatus, purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest,
    addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addGameAsset, updateGameAsset, deleteGameAsset, cloneGameAsset,
    addTheme, updateTheme, deleteTheme,
    completeFirstRun, importBlueprint, restoreFromBackup, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, 
    deleteQuests, deleteTrophies, deleteGameAssets, updateQuestsStatus, bulkUpdateQuests,
    uploadFile,
    executeExchange,
    updateSettings, resetSettings, setActivePage, setAppMode, addNotification, removeNotification, setActiveMarketId, toggleSidebar,
    toggleChat, sendMessage, markMessagesAsRead,
    addSystemNotification, markSystemNotificationsAsRead
  };

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

// Global hook for accessing the combined state
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) throw new Error('useAppState must be used within an AppProvider');
  return context;
};

// Global hook for accessing the combined dispatch functions
export const useAppDispatch = (): AppDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) throw new Error('useAppDispatch must be used within an AppProvider');
  return context;
};
