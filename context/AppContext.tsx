

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Quest, RewardTypeDefinition, RewardCategory, QuestAvailability, Role, QuestCompletion, QuestCompletionStatus, RewardItem, Market, MarketItem, QuestType, PurchaseRequest, PurchaseRequestStatus, Guild, Rank, Trophy, UserTrophy, Notification, TrophyRequirement, TrophyRequirementType, AppMode, Page, AdminAdjustment, AdminAdjustmentType, AvatarAsset, DigitalAsset, SystemLog, AppSettings, Blueprint, ImportResolution, IAppData, Theme } from '../types';
import { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createInitialDigitalAssets, INITIAL_SETTINGS } from '../data/initialData';
import { toYMD } from '../utils/quests';
import { useDebounce } from '../hooks/useDebounce';


// --- STATE ---
// Centralized state object that will be persisted.
// IAppData is now defined in types.ts

// Full state including non-persistent UI state
interface AppState extends IAppData {
  isFirstRun: boolean;
  notifications: Notification[];
  isSwitchingUser: boolean;
  targetedUserForLogin: User | null;
  activePage: Page;
  activeMarketId: string | null;
  allTags: string[];
  svgContent: string | null;
}

const AppStateContext = createContext<AppState | undefined>(undefined);


// --- DISPATCH ---
interface AppDispatch {
  setAppMode: (mode: AppMode) => void;
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAvatarAssets' | 'ownedThemes'>) => User;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  dismissQuest: (questId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  setIsFirstRun: (isFirstRun: boolean) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  completeQuest: (questId: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  claimQuest: (questId: string) => void;
  releaseQuest: (questId: string) => void;
  addMarket: (market: Omit<Market, 'id' | 'items'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  addMarketItem: (marketId: string, item: Omit<MarketItem, 'id'>) => void;
  updateMarketItem: (marketId: string, item: MarketItem) => void;
  deleteMarketItem: (marketId: string, itemId: string) => void;
  purchaseMarketItem: (marketId: string, itemId: string) => void;
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
  applyManualAdjustment: (adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt' | 'adjusterId'>) => boolean;
  addDigitalAsset: (asset: Omit<DigitalAsset, 'id'>) => void;
  updateDigitalAsset: (asset: DigitalAsset) => void;
  deleteDigitalAsset: (assetId: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActivePage: (page: Page) => void;
  setActiveMarketId: (marketId: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
}

const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

const deepMergeSettings = (initial: AppSettings, saved: Partial<AppSettings>): AppSettings => {
    return {
        ...initial,
        ...saved,
        questDefaults: {
            ...initial.questDefaults,
            ...saved?.questDefaults,
        },
        vacationMode: {
            ...initial.vacationMode,
            ...saved?.vacationMode,
        },
        terminology: {
            ...initial.terminology,
            ...saved?.terminology,
        },
    };
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appData, setAppData] = useState<IAppData>({
    users: [],
    currentUser: null,
    quests: [],
    markets: [],
    rewardTypes: [],
    questCompletions: [],
    purchaseRequests: [],
    guilds: [],
    ranks: [],
    trophies: [],
    userTrophies: [],
    adminAdjustments: [],
    digitalAssets: [],
    systemLogs: [],
    appMode: { mode: 'personal' },
    settings: INITIAL_SETTINGS,
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  const debouncedAppData = useDebounce(appData, 1000);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification = { ...notification, id: `notif-${Date.now()}-${Math.random()}` };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  // Fetch avatar SVG once on app load
  useEffect(() => {
    fetch('/assets/avatar.svg')
      .then(res => res.text())
      .then(setSvgContent)
      .catch(console.error);
  }, []);

  // Load data from backend or initialize
  useEffect(() => {
    const loadData = async () => {
        try {
            const response = await fetch('/api/data/load');
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorBody}`);
            }
            const savedData = await response.json() as IAppData;

            if (savedData && Object.keys(savedData).length > 0 && savedData.users && savedData.users.length > 0) {
                const finalSettings = deepMergeSettings(INITIAL_SETTINGS, savedData.settings || {});
                setAppData({
                    ...savedData,
                    currentUser: null,
                    settings: finalSettings,
                });
            } else {
                // First run, initialize with sample data
                const initialUsers = createMockUsers();
                const initialGuilds = createInitialGuilds(initialUsers);
                const initialQuests = createSampleQuests();
                const initialMarkets = createSampleMarkets();
                
                const initialData: IAppData = {
                    users: initialUsers,
                    quests: initialQuests,
                    markets: initialMarkets,
                    rewardTypes: INITIAL_REWARD_TYPES,
                    questCompletions: [],
                    purchaseRequests: [],
                    guilds: initialGuilds,
                    ranks: INITIAL_RANKS,
                    trophies: INITIAL_TROPHIES,
                    userTrophies: [],
                    adminAdjustments: [],
                    digitalAssets: createInitialDigitalAssets(),
                    systemLogs: [],
                    appMode: { mode: 'personal' },
                    currentUser: null,
                    settings: INITIAL_SETTINGS,
                };
                setAppData(initialData);

                // Save this initial state to the backend
                const saveResponse = await fetch('/api/data/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(initialData),
                });
                if (!saveResponse.ok) {
                    throw new Error('Failed to save initial data to the server.');
                }
                addNotification({ type: 'info', message: 'Welcome! Your Donegeon has been created.' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Failed to load or initialize data:', errorMessage);
            addNotification({ type: 'error', message: 'Could not connect to the server.' });
            setBackendError(errorMessage);
        } finally {
            setIsDataLoaded(true);
        }
    };
    loadData();
  }, [addNotification]);

  // Save data to backend on change (debounced)
  useEffect(() => {
    if (!isDataLoaded || backendError) return;

    const saveData = async () => {
      try {
        const response = await fetch('/api/data/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debouncedAppData),
        });
        if (!response.ok) {
          throw new Error('Failed to save data to the server.');
        }
      } catch (error) {
        console.error("Could not save data to backend:", error);
        addNotification({ type: 'error', message: 'Failed to save progress.' });
      }
    };

    saveData();
  }, [debouncedAppData, isDataLoaded, addNotification, backendError]);

  const { users, currentUser, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, digitalAssets, systemLogs, appMode, settings } = appData;
  const isFirstRun = isDataLoaded && users.length === 0 && !backendError;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    if (appData.quests) {
        appData.quests.forEach(quest => {
            if (quest.tags) {
                quest.tags.forEach(tag => tags.add(tag));
            }
        });
    }
    return Array.from(tags).sort();
  }, [appData.quests]);

  const setCurrentUser = useCallback((user: User | null) => {
    setAppData(prev => ({ ...prev, currentUser: user }));
    setIsSwitchingUser(false);
  }, []);

  const setAppMode = useCallback((mode: AppMode) => {
    setAppData(prev => ({ ...prev, appMode: mode }));
  }, []);

  // Reset to personal mode if current guild is no longer valid
  useEffect(() => {
    if (appMode.mode === 'guild' && currentUser) {
      const userGuilds = guilds.filter(g => g.memberIds.includes(currentUser.id));
      if (!userGuilds.some(g => g.id === appMode.guildId)) {
        setAppMode({ mode: 'personal' });
      }
    }
  }, [currentUser, guilds, appMode, setAppMode]);

  // Reset active market if page changes
  useEffect(() => {
    if (activePage !== 'Marketplace') {
      setActiveMarketId(null);
    }
  }, [activePage]);

  // --- DISPATCH FUNCTIONS ---

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    setAppData(prev => {
        const user = prev.users.find(u => u.id === userId);
        const trophy = prev.trophies.find(t => t.id === trophyId);
        if (!user || !trophy) return prev;

        if (prev.userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophyId && ut.guildId === guildId)) return prev;

        const newAward: UserTrophy = {
            id: `award-${Date.now()}`,
            userId,
            trophyId,
            awardedAt: toYMD(new Date()),
            guildId
        };

        const awardInCurrentMode = (guildId === undefined && prev.appMode.mode === 'personal') || (prev.appMode.mode === 'guild' && prev.appMode.guildId === guildId);
        if (prev.currentUser?.id === userId && awardInCurrentMode) {
            addNotification({ type: 'trophy', message: `${prev.settings.terminology.award} Unlocked: ${trophy.name}!`, icon: trophy.icon });
        }
        
        return { ...prev, userTrophies: [...prev.userTrophies, newAward] };
    });
  }, [addNotification]);

  const checkAndAwardTrophies = useCallback((userId: string, guildId?: string) => {
    if (guildId) return; // Automatic trophies are personal-only for now
    
    setAppData(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) return prev;

      const userCompletedQuests = prev.questCompletions.filter(c => c.userId === userId && !c.guildId && c.status === QuestCompletionStatus.Approved);
      const totalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + amount, 0);
      const userRank = prev.ranks.slice().sort((a,b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

      const automaticTrophies = prev.trophies.filter(t => !t.isManual);
      let trophiesAwarded = false;

      for (const trophy of automaticTrophies) {
          if (prev.userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophy.id && !ut.guildId)) continue;

          const meetsAllRequirements = trophy.requirements.every(req => {
              switch (req.type) {
                  case TrophyRequirementType.CompleteQuestType:
                      return userCompletedQuests.filter(c => prev.quests.find(q => q.id === c.questId)?.type === req.value).length >= req.count;
                  case TrophyRequirementType.CompleteQuestTag:
                      return userCompletedQuests.filter(c => prev.quests.find(q => q.id === c.questId)?.tags?.includes(req.value)).length >= req.count;
                  case TrophyRequirementType.AchieveRank:
                      return userRank?.id === req.value;
                  default: return false;
              }
          });
          if (meetsAllRequirements) {
            awardTrophy(userId, trophy.id); // This will trigger another state update, but it's how the original was structured
            trophiesAwarded = true;
          }
      }
      return prev; // No direct state change here, relies on awardTrophy
    });
  }, [awardTrophy]);

  const applyRewards = useCallback((userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
    setAppData(prev => {
        const newUsers = [...prev.users];
        const userIndex = newUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) return prev;
        
        const userToUpdate = structuredClone(newUsers[userIndex]);

        rewardsToApply.forEach(reward => {
            const rewardDef = prev.rewardTypes.find(rd => rd.id === reward.rewardTypeId);
            if (!rewardDef) return;

            if (guildId) {
                if (!userToUpdate.guildBalances[guildId]) userToUpdate.guildBalances[guildId] = { purse: {}, experience: {} };
                const balanceSheet = userToUpdate.guildBalances[guildId];
                if (rewardDef.category === RewardCategory.Currency) {
                    balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                } else {
                    balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
                }
            } else {
                if (rewardDef.category === RewardCategory.Currency) {
                    userToUpdate.personalPurse[reward.rewardTypeId] = (userToUpdate.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                } else {
                    userToUpdate.personalExperience[reward.rewardTypeId] = (userToUpdate.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
                }
            }
        });
        newUsers[userIndex] = userToUpdate;
        const newCurrentUser = prev.currentUser?.id === userId ? userToUpdate : prev.currentUser;
        
        return { ...prev, users: newUsers, currentUser: newCurrentUser };
    });
    checkAndAwardTrophies(userId, guildId);
  }, [checkAndAwardTrophies]);
  
  const deductRewards = useCallback((userId: string, cost: RewardItem[], guildId?: string): boolean => {
    let canAfford = true;
    const user = appData.users.find(u => u.id === userId);
    if (!user) return false;

    for (const item of cost) {
      const rewardDef = appData.rewardTypes.find(rt => rt.id === item.rewardTypeId);
      if (!rewardDef) {
          canAfford = false;
          break;
      }
      let balance = 0;
      if (guildId) {
          const balanceSheet = user.guildBalances[guildId];
          balance = rewardDef.category === RewardCategory.Currency ? (balanceSheet?.purse[item.rewardTypeId] || 0) : (balanceSheet?.experience[item.rewardTypeId] || 0);
      } else {
          balance = rewardDef.category === RewardCategory.Currency ? (user.personalPurse[item.rewardTypeId] || 0) : (user.personalExperience[item.rewardTypeId] || 0);
      }
      if (balance < item.amount) {
        canAfford = false;
        break;
      }
    }
    if (!canAfford) return false;

    setAppData(prev => {
        const newUsers = [...prev.users];
        const userIndex = newUsers.findIndex(u => u.id === userId);
        if(userIndex === -1) return prev;
        
        const userToUpdate = structuredClone(newUsers[userIndex]);
        cost.forEach(c => {
            const rewardDef = prev.rewardTypes.find(rt => rt.id === c.rewardTypeId);
            if (!rewardDef) return;
            if (guildId) {
                 const balanceSheet = userToUpdate.guildBalances[guildId];
                 if (rewardDef.category === RewardCategory.Currency) { if (balanceSheet.purse[c.rewardTypeId]) balanceSheet.purse[c.rewardTypeId] -= c.amount; } 
                 else { if (balanceSheet.experience[c.rewardTypeId]) balanceSheet.experience[c.rewardTypeId] -= c.amount; }
            } else {
                 if (rewardDef.category === RewardCategory.Currency) { if (userToUpdate.personalPurse[c.rewardTypeId]) userToUpdate.personalPurse[c.rewardTypeId] -= c.amount; } 
                 else { if (userToUpdate.personalExperience[c.rewardTypeId]) userToUpdate.personalExperience[c.rewardTypeId] -= c.amount; }
            }
        });
        newUsers[userIndex] = userToUpdate;
        const newCurrentUser = prev.currentUser?.id === userId ? userToUpdate : prev.currentUser;
        return { ...prev, users: newUsers, currentUser: newCurrentUser };
    });
    return true;
  }, [appData.users, appData.rewardTypes]);

  const addUser = useCallback((user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAvatarAssets' | 'ownedThemes'>): User => {
    const newUser: User = { 
        ...user, 
        id: `user-${Date.now()}`,
        avatar: {},
        ownedAvatarAssets: [],
        personalPurse: {},
        personalExperience: {},
        guildBalances: {},
        ownedThemes: ['emerald', 'rose', 'sky'] // New users get default themes
    };
    
    setAppData(prev => {
        const newUsers = [...prev.users, newUser];
        const newGuilds = prev.guilds.map(g => {
            if (g.isDefault) {
                newUser.guildBalances[g.id] = { purse: {}, experience: {} };
                return { ...g, memberIds: [...g.memberIds, newUser.id] };
            }
            return g;
        });
        return { ...prev, users: newUsers, guilds: newGuilds };
    });
    return newUser;
  }, []);
  
  const updateUser = useCallback((userId: string, updatedData: Partial<User>) => {
    setAppData(prev => {
        const newUsers = prev.users.map(u => u.id === userId ? { ...u, ...updatedData } : u);
        const newCurrentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, ...updatedData } as User : prev.currentUser;
        return { ...prev, users: newUsers, currentUser: newCurrentUser };
    });
  }, []);
  
  const deleteUser = useCallback((userId: string) => {
    setAppData(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        // Also remove user from guilds, quests, etc.
        guilds: prev.guilds.map(g => ({ ...g, memberIds: g.memberIds.filter(id => id !== userId) })),
        quests: prev.quests.map(q => ({ ...q, assignedUserIds: q.assignedUserIds.filter(id => id !== userId) })),
    }));
  }, []);

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
    const newQuest: Quest = { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] };
    setAppData(prev => ({...prev, quests: [...prev.quests, newQuest]}));
  }, []);

  const updateQuest = useCallback((updatedQuest: Quest) => {
    setAppData(prev => ({...prev, quests: prev.quests.map(q => q.id === updatedQuest.id ? updatedQuest : q)}));
  }, []);

  const deleteQuest = useCallback((questId: string) => {
    setAppData(prev => ({ ...prev, quests: prev.quests.filter(q => q.id !== questId)}));
  }, []);

  const dismissQuest = useCallback((questId: string) => {
    if (!currentUser) return;
    setAppData(prev => {
      const questIndex = prev.quests.findIndex(q => q.id === questId);
      if (questIndex === -1) return prev;
      
      const newQuests = [...prev.quests];
      const questToUpdate = { ...newQuests[questIndex] };
      
      // Remove any existing dismissal for the user before adding a new one
      questToUpdate.dismissals = questToUpdate.dismissals.filter(d => d.userId !== currentUser.id);
      questToUpdate.dismissals.push({
          userId: currentUser.id,
          dismissedAt: new Date().toISOString()
      });
      
      newQuests[questIndex] = questToUpdate;

      return { ...prev, quests: newQuests };
    });
  }, [currentUser]);
  
  const completeQuest = useCallback((questId: string, options?: { note?: string; completionDate?: Date }) => {
      if (!currentUser) return;
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      const newCompletion: QuestCompletion = {
          id: `comp-${Date.now()}`,
          questId,
          userId: currentUser.id,
          completedAt: toYMD(options?.completionDate || new Date()),
          status: quest.requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved,
          guildId: quest.guildId,
          note: options?.note,
      };

      setAppData(prev => ({...prev, questCompletions: [...prev.questCompletions, newCompletion]}));

      if (!quest.requiresApproval) {
          applyRewards(currentUser.id, quest.rewards, quest.guildId);
          addNotification({ type: 'success', message: `${settings.terminology.task} Completed: ${quest.title}`});
      } else {
          addNotification({ type: 'info', message: `"${quest.title}" submitted for approval.` });
      }
  }, [currentUser, quests, applyRewards, addNotification, settings]);

  const approveQuestCompletion = useCallback((completionId: string, note?: string) => {
      const completion = questCompletions.find(c => c.id === completionId);
      if (!completion) return;
      const quest = quests.find(q => q.id === completion.questId);
      if (!quest) return;
      
      setAppData(prev => ({ ...prev, questCompletions: prev.questCompletions.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Approved, note: note || c.note } : c)}));
      applyRewards(completion.userId, quest.rewards, quest.guildId);
      addNotification({ type: 'success', message: `${settings.terminology.task} approved!`});
  }, [questCompletions, quests, applyRewards, addNotification, settings]);

  const rejectQuestCompletion = useCallback((completionId: string, note?: string) => {
      setAppData(prev => ({ ...prev, questCompletions: prev.questCompletions.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Rejected, note: note || c.note } : c)}));
      addNotification({ type: 'info', message: `${settings.terminology.task} rejected.`});
  }, [settings]);

  const claimQuest = useCallback((questId: string) => {
      if (!currentUser) return;
      setAppData(prev => ({
          ...prev,
          quests: prev.quests.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, currentUser.id] } : q)
      }))
  }, [currentUser]);

  const releaseQuest = useCallback((questId: string) => {
      if (!currentUser) return;
      setAppData(prev => ({
          ...prev,
          quests: prev.quests.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== currentUser.id) } : q)
      }))
  }, [currentUser]);
  
  const addRewardType = useCallback((rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => {
    const newReward = { ...rewardType, id: `custom-${Date.now()}`, isCore: false };
    setAppData(prev => ({...prev, rewardTypes: [...prev.rewardTypes, newReward]}));
  }, []);

  const updateRewardType = useCallback((rewardType: RewardTypeDefinition) => {
    setAppData(prev => ({...prev, rewardTypes: prev.rewardTypes.map(rt => rt.id === rewardType.id ? rewardType : rt)}));
  }, []);

  const deleteRewardType = useCallback((rewardTypeId: string) => {
    setAppData(prev => ({...prev, rewardTypes: prev.rewardTypes.filter(rt => rt.id !== rewardTypeId)}));
  }, []);
  
  const addMarket = useCallback((market: Omit<Market, 'id'|'items'>) => {
    const newMarket = { ...market, id: `market-${Date.now()}`, items: [] };
    setAppData(prev => ({...prev, markets: [...prev.markets, newMarket]}));
  }, []);

  const updateMarket = useCallback((market: Market) => {
    setAppData(prev => ({...prev, markets: prev.markets.map(m => m.id === market.id ? market : m)}));
  }, []);

  const deleteMarket = useCallback((marketId: string) => {
    setAppData(prev => ({...prev, markets: prev.markets.filter(m => m.id !== marketId)}));
  }, []);

  const addMarketItem = useCallback((marketId: string, item: Omit<MarketItem, 'id'>) => {
    const newItem = { ...item, id: `item-${Date.now()}` };
    setAppData(prev => ({
        ...prev,
        markets: prev.markets.map(m => m.id === marketId ? { ...m, items: [...m.items, newItem] } : m)
    }));
  }, []);
  
  const updateMarketItem = useCallback((marketId: string, item: MarketItem) => {
    setAppData(prev => ({
        ...prev,
        markets: prev.markets.map(m => m.id === marketId ? { ...m, items: m.items.map(i => i.id === item.id ? item : i) } : m)
    }));
  }, []);

  const deleteMarketItem = useCallback((marketId: string, itemId: string) => {
    setAppData(prev => ({
        ...prev,
        markets: prev.markets.map(m => m.id === marketId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m)
    }));
  }, []);

  const purchaseMarketItem = useCallback((marketId: string, itemId: string) => {
    if(!currentUser) return;
    const market = markets.find(m => m.id === marketId);
    const item = market?.items.find(i => i.id === itemId);
    if (!market || !item) return;

    const requiresApproval = currentUser.role === Role.Explorer; // Example logic

    const itemDetails = { 
        title: item.title, 
        cost: item.cost, 
        payout: item.payout, 
        avatarAssetPayout: item.avatarAssetPayout,
        themePayout: item.themePayout,
    };

    if (requiresApproval) {
        const newRequest: PurchaseRequest = {
            id: `purchase-${Date.now()}`,
            userId: currentUser.id,
            marketId,
            itemId,
            requestedAt: toYMD(new Date()),
            status: PurchaseRequestStatus.Pending,
            itemDetails,
            guildId: market.guildId,
        };
        setAppData(prev => ({ ...prev, purchaseRequests: [...prev.purchaseRequests, newRequest]}));
        addNotification({type: 'info', message: `"${item.title}" purchase requested.`})
    } else {
        const affordable = deductRewards(currentUser.id, item.cost, market.guildId);
        if (affordable) {
            applyRewards(currentUser.id, item.payout, market.guildId);
            if(item.avatarAssetPayout) {
              updateUser(currentUser.id, { ownedAvatarAssets: [...currentUser.ownedAvatarAssets, item.avatarAssetPayout] });
            }
            if(item.themePayout) {
              updateUser(currentUser.id, { ownedThemes: [...currentUser.ownedThemes, item.themePayout] });
            }
            addNotification({type: 'success', message: `Purchased "${item.title}"!`});

            const newPurchaseLog: PurchaseRequest = {
                id: `purchase-${Date.now()}`,
                userId: currentUser.id,
                marketId,
                itemId,
                requestedAt: toYMD(new Date()),
                status: PurchaseRequestStatus.Completed,
                itemDetails,
                guildId: market.guildId,
            };
            setAppData(prev => ({ ...prev, purchaseRequests: [...prev.purchaseRequests, newPurchaseLog]}));
        } else {
            addNotification({type: 'error', message: 'You cannot afford this item.'});
        }
    }
  }, [currentUser, markets, deductRewards, applyRewards, addNotification, updateUser]);

  const cancelPurchaseRequest = useCallback((purchaseId: string) => {
      setAppData(prev => ({
          ...prev,
          purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled } : p)
      }));
  }, []);
  
  const approvePurchaseRequest = useCallback((purchaseId: string) => {
      const request = purchaseRequests.find(p => p.id === purchaseId);
      if (!request) return;

      const affordable = deductRewards(request.userId, request.itemDetails.cost, request.guildId);
      if (affordable) {
          applyRewards(request.userId, request.itemDetails.payout, request.guildId);
          const user = users.find(u => u.id === request.userId);
          if (user) {
              let updates: Partial<User> = {};
              if (request.itemDetails.avatarAssetPayout) {
                  updates.ownedAvatarAssets = [...user.ownedAvatarAssets, request.itemDetails.avatarAssetPayout];
              }
              if (request.itemDetails.themePayout) {
                  updates.ownedThemes = [...user.ownedThemes, request.itemDetails.themePayout];
              }
              if (Object.keys(updates).length > 0) {
                  updateUser(user.id, updates);
              }
          }
          setAppData(prev => ({ ...prev, purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Completed } : p) }));
          addNotification({type: 'success', message: 'Purchase approved.'});
      } else {
          addNotification({type: 'error', message: "User can't afford this."});
      }
  }, [purchaseRequests, users, deductRewards, applyRewards, addNotification, updateUser]);

  const rejectPurchaseRequest = useCallback((purchaseId: string) => {
      setAppData(prev => ({ ...prev, purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected } : p) }));
      addNotification({type: 'info', message: 'Purchase rejected.'});
  }, []);

  const addGuild = useCallback((guild: Omit<Guild, 'id'>) => {
      const newGuild = { ...guild, id: `guild-${Date.now()}`};
      setAppData(prev => ({ ...prev, guilds: [...prev.guilds, newGuild]}));
  }, []);
  
  const updateGuild = useCallback((guild: Guild) => {
      setAppData(prev => ({ ...prev, guilds: prev.guilds.map(g => g.id === guild.id ? guild : g)}));
  }, []);
  
  const deleteGuild = useCallback((guildId: string) => {
      setAppData(prev => ({...prev, guilds: prev.guilds.filter(g => g.id !== guildId)}));
  }, []);
  
  const setRanks = useCallback((ranks: Rank[]) => {
      setAppData(prev => ({...prev, ranks}));
  }, []);

  const addTrophy = useCallback((trophy: Omit<Trophy, 'id'>) => {
      const newTrophy = { ...trophy, id: `trophy-${Date.now()}`};
      setAppData(prev => ({ ...prev, trophies: [...prev.trophies, newTrophy]}));
  }, []);
  
  const updateTrophy = useCallback((trophy: Trophy) => {
      setAppData(prev => ({ ...prev, trophies: prev.trophies.map(t => t.id === trophy.id ? trophy : t)}));
  }, []);

  const deleteTrophy = useCallback((trophyId: string) => {
      setAppData(prev => ({...prev, trophies: prev.trophies.filter(t => t.id !== trophyId)}));
  }, []);
  
  const applyManualAdjustment = useCallback((adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt' | 'adjusterId'>): boolean => {
    if (!currentUser) return false;
    const newAdjustment: AdminAdjustment = {
        ...adjustment,
        id: `adj-${Date.now()}`,
        adjustedAt: toYMD(new Date()),
        adjusterId: currentUser.id
    };

    setAppData(prev => ({ ...prev, adminAdjustments: [...prev.adminAdjustments, newAdjustment] }));

    if (newAdjustment.type === AdminAdjustmentType.Reward) {
        applyRewards(newAdjustment.userId, newAdjustment.rewards, newAdjustment.guildId);
    } else if (newAdjustment.type === AdminAdjustmentType.Setback) {
        deductRewards(newAdjustment.userId, newAdjustment.setbacks, newAdjustment.guildId);
    } else if (newAdjustment.type === AdminAdjustmentType.Trophy && newAdjustment.trophyId) {
        awardTrophy(newAdjustment.userId, newAdjustment.trophyId, newAdjustment.guildId);
    }
    
    addNotification({type: 'success', message: 'Manual adjustment applied.'});
    return true;
  }, [currentUser, applyRewards, deductRewards, awardTrophy, addNotification]);

  const addDigitalAsset = useCallback((asset: Omit<DigitalAsset, 'id'>) => {
      const newAsset = { ...asset, id: `da-${Date.now()}` };
      setAppData(prev => ({ ...prev, digitalAssets: [...prev.digitalAssets, newAsset] }));
  }, []);

  const updateDigitalAsset = useCallback((asset: DigitalAsset) => {
      setAppData(prev => ({ ...prev, digitalAssets: prev.digitalAssets.map(da => da.id === asset.id ? asset : da)}));
  }, []);
  
  const deleteDigitalAsset = useCallback((assetId: string) => {
      setAppData(prev => ({ ...prev, digitalAssets: prev.digitalAssets.filter(da => da.id !== assetId)}));
  }, []);
  
  const setIsFirstRun = (isFirstRun: boolean) => {
      // This is a derived value now, so this function does nothing.
      // Kept for API consistency if needed.
  }

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setAppData(prev => ({
        ...prev,
        settings: deepMergeSettings(prev.settings, newSettings)
    }));
  }, []);

  const importBlueprint = useCallback((blueprint: Blueprint, resolutions: ImportResolution[]) => {
    setAppData(prev => {
        const newState = structuredClone(prev);
        const idMap = new Map<string, string>(); // oldId -> newId

        const getNewId = (oldId: string, prefix: string) => {
            if (!idMap.has(oldId)) {
                idMap.set(oldId, `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
            }
            return idMap.get(oldId)!;
        };

        const resolveName = (type: keyof typeof blueprint.assets, originalId: string, originalName: string) => {
            const resolution = resolutions.find(r => r.type === type && r.id === originalId);
            if (resolution?.resolution === 'rename') return resolution.newName || originalName;
            return originalName;
        };

        // 1. Process Reward Types first (as they are dependencies)
        blueprint.assets.rewardTypes?.forEach(rt => {
            const resolution = resolutions.find(r => r.type === 'rewardTypes' && r.id === rt.id);
            if (resolution?.resolution !== 'skip') {
                const newId = getNewId(rt.id, 'rt');
                newState.rewardTypes.push({
                    ...rt,
                    id: newId,
                    name: resolveName('rewardTypes', rt.id, rt.name),
                    isCore: false, // Imported rewards are never core
                });
            }
        });

        // 2. Process Ranks
        blueprint.assets.ranks?.forEach(rank => {
            const resolution = resolutions.find(r => r.type === 'ranks' && r.id === rank.id);
            if (resolution?.resolution !== 'skip') {
                const newId = getNewId(rank.id, 'rank');
                newState.ranks.push({
                    ...rank,
                    id: newId,
                    name: resolveName('ranks', rank.id, rank.name),
                });
            }
        });
        
        // 3. Process Trophies (and their rank dependencies)
        blueprint.assets.trophies?.forEach(trophy => {
            const resolution = resolutions.find(r => r.type === 'trophies' && r.id === trophy.id);
            if (resolution?.resolution !== 'skip') {
                const newId = getNewId(trophy.id, 'trophy');
                const newTrophy = structuredClone(trophy);
                newTrophy.id = newId;
                newTrophy.name = resolveName('trophies', trophy.id, trophy.name);

                newTrophy.requirements = newTrophy.requirements.map(req => {
                    if (req.type === TrophyRequirementType.AchieveRank && idMap.has(req.value)) {
                        req.value = idMap.get(req.value)!;
                    }
                    return req;
                });
                newState.trophies.push(newTrophy);
            }
        });
        
        // 4. Process Quests (and their reward dependencies)
        blueprint.assets.quests?.forEach(quest => {
            const resolution = resolutions.find(r => r.type === 'quests' && r.id === quest.id);
            if (resolution?.resolution !== 'skip') {
                const newId = getNewId(quest.id, 'quest');
                const newQuest = structuredClone(quest);
                newQuest.id = newId;
                newQuest.title = resolveName('quests', quest.id, quest.title);

                const remapRewards = (rewards: RewardItem[]) => rewards.map(r => ({
                    ...r,
                    rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId
                })).filter(r => newState.rewardTypes.some(rt => rt.id === r.rewardTypeId));

                newQuest.rewards = remapRewards(newQuest.rewards);
                newQuest.lateSetbacks = remapRewards(newQuest.lateSetbacks);
                newQuest.incompleteSetbacks = remapRewards(newQuest.incompleteSetbacks);

                newState.quests.push(newQuest);
            }
        });
        
        // 5. Process Markets (and their reward dependencies)
        blueprint.assets.markets?.forEach(market => {
            const resolution = resolutions.find(r => r.type === 'markets' && r.id === market.id);
            if (resolution?.resolution !== 'skip') {
                const newId = getNewId(market.id, 'market');
                const newMarket = structuredClone(market);
                newMarket.id = newId;
                newMarket.title = resolveName('markets', market.id, market.title);
                
                const remapRewards = (rewards: RewardItem[]) => rewards.map(r => ({
                    ...r,
                    rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId
                })).filter(r => newState.rewardTypes.some(rt => rt.id === r.rewardTypeId));
                
                newMarket.items = newMarket.items.map(item => {
                    item.id = getNewId(item.id, 'item');
                    item.cost = remapRewards(item.cost);
                    item.payout = remapRewards(item.payout);
                    return item;
                });
                newState.markets.push(newMarket);
            }
        });

        return newState;
    });
    addNotification({ type: 'success', message: 'Blueprint imported successfully!' });
  }, [addNotification]);
  
  const restoreFromBackup = useCallback((backupData: IAppData) => {
    const restore = async () => {
        try {
            const response = await fetch('/api/data/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorBody}`);
            }
            addNotification({ type: 'success', message: 'Restore successful! The application will now reload.' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Failed to restore from backup:", error);
            addNotification({ type: 'error', message: 'Failed to restore from backup.' });
        }
    };
    restore();
  }, [addNotification]);


  // GAME LOOP for checking quest timers
  useEffect(() => {
    const intervalId = setInterval(() => {
        const now = new Date();

        // Check for vacation mode
        const { vacationMode, forgivingSetbacks } = appData.settings;
        if (vacationMode.enabled && vacationMode.startDate && vacationMode.endDate) {
            const start = new Date(vacationMode.startDate);
            const end = new Date(vacationMode.endDate);
            end.setHours(23, 59, 59, 999); // End of the selected day
            if (now >= start && now <= end) {
                return; // In vacation mode, do nothing.
            }
        }
        
        setAppData(prevData => {
            let wasChanged = false;
            let logsToCreate: SystemLog[] = [];
            let setbacksToApply: { userId: string, setbacks: RewardItem[], guildId?: string}[] = [];

            // --- Hardcore Mode Logic ---
            if (!forgivingSetbacks) {
                for (const quest of prevData.quests) {
                    if (!quest.isActive) continue;

                    const assignedUsers = quest.assignedUserIds.length > 0 ? quest.assignedUserIds : prevData.users.map(u => u.id);
                    let lateDeadline: Date | null = null;
                    let incompleteDeadline: Date | null = null;

                    if (quest.type === QuestType.Venture) {
                        lateDeadline = quest.lateDateTime ? new Date(quest.lateDateTime) : null;
                        incompleteDeadline = quest.incompleteDateTime ? new Date(quest.incompleteDateTime) : null;
                    } else if (quest.type === QuestType.Duty) {
                         let isScheduledToday = false;
                        switch (quest.availabilityType) {
                            case QuestAvailability.Daily: isScheduledToday = true; break;
                            case QuestAvailability.Weekly: isScheduledToday = quest.weeklyRecurrenceDays.includes(now.getDay()); break;
                            case QuestAvailability.Monthly: isScheduledToday = quest.monthlyRecurrenceDays.includes(now.getDate()); break;
                        }
                        if (isScheduledToday) {
                            if (quest.lateTime) {
                                const [h, m] = quest.lateTime.split(':').map(Number);
                                lateDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                            }
                            if (quest.incompleteTime) {
                                const [h, m] = quest.incompleteTime.split(':').map(Number);
                                incompleteDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                            }
                        }
                    }

                    if (lateDeadline && lateDeadline < now && quest.lateSetbacks.length > 0) {
                        const logKey = `${quest.id}-${toYMD(lateDeadline)}-late`;
                        const alreadyLogged = prevData.systemLogs.some(log => log.id.startsWith(logKey));
                        if (!alreadyLogged) {
                           logsToCreate.push({ id: `${logKey}-${Date.now()}`, timestamp: now.toISOString(), type: 'QUEST_LATE', questId: quest.id, userIds: assignedUsers, setbacksApplied: quest.lateSetbacks });
                           assignedUsers.forEach(uid => setbacksToApply.push({ userId: uid, setbacks: quest.lateSetbacks, guildId: quest.guildId }));
                           wasChanged = true;
                        }
                    }

                    if (incompleteDeadline && incompleteDeadline < now && quest.incompleteSetbacks.length > 0) {
                        const logKey = `${quest.id}-${toYMD(incompleteDeadline)}-incomplete`;
                        const alreadyLogged = prevData.systemLogs.some(log => log.id.startsWith(logKey));
                         if (!alreadyLogged) {
                           logsToCreate.push({ id: `${logKey}-${Date.now()}`, timestamp: now.toISOString(), type: 'QUEST_INCOMPLETE', questId: quest.id, userIds: assignedUsers, setbacksApplied: quest.incompleteSetbacks });
                           assignedUsers.forEach(uid => setbacksToApply.push({ userId: uid, setbacks: quest.incompleteSetbacks, guildId: quest.guildId }));
                           wasChanged = true;
                         }
                    }
                }
            }
            // End of hardcore mode logic

            // TODO: Add forgiving mode logic here later. For now, it just bypasses the immediate setback.

            if (wasChanged) {
                // Apply side effects (notifications, deductions) after determining state changes
                setTimeout(() => {
                    logsToCreate.forEach(log => {
                        const quest = prevData.quests.find(q => q.id === log.questId);
                        if (quest) {
                            const message = log.type === 'QUEST_LATE' ? `${prevData.settings.terminology.task} is now LATE: "${quest.title}"` : `${prevData.settings.terminology.task} is INCOMPLETE: "${quest.title}"`;
                            addNotification({ type: 'error', message });
                        }
                    });
                     setbacksToApply.forEach(s => {
                        deductRewards(s.userId, s.setbacks, s.guildId);
                    });
                }, 0);

                return { ...prevData, systemLogs: [...prevData.systemLogs, ...logsToCreate] };
            }

            return prevData;
        });

    }, 1000 * 30); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [addNotification, deductRewards, appData.settings]);

  // --- STATE & DISPATCH PROVIDER ---

  const state: AppState = {
    isFirstRun, users, currentUser, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, digitalAssets, systemLogs, notifications, appMode, isSwitchingUser, targetedUserForLogin, activePage, activeMarketId, allTags, svgContent, settings
  };

  const dispatch: AppDispatch = useMemo(() => ({
    setAppMode, addUser, updateUser, addQuest, updateQuest, deleteQuest, setCurrentUser, setIsFirstRun,
    setIsSwitchingUser, setTargetedUserForLogin, addNotification, removeNotification, setActivePage, setActiveMarketId, deleteUser,
    addRewardType, updateRewardType, deleteRewardType, completeQuest, approveQuestCompletion,
    rejectQuestCompletion, claimQuest, releaseQuest, addMarket, updateMarket, deleteMarket,
    addMarketItem, updateMarketItem, deleteMarketItem, purchaseMarketItem, cancelPurchaseRequest,
    approvePurchaseRequest, rejectPurchaseRequest, addGuild, updateGuild, deleteGuild, setRanks,
    addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addDigitalAsset,
    updateDigitalAsset, deleteDigitalAsset, dismissQuest, updateSettings, importBlueprint, restoreFromBackup
  }), [
      setAppMode, addUser, updateUser, addQuest, updateQuest, deleteQuest, setCurrentUser,
      setIsSwitchingUser, setTargetedUserForLogin, addNotification, removeNotification, setActivePage, setActiveMarketId, deleteUser,
      addRewardType, updateRewardType, deleteRewardType, completeQuest, approveQuestCompletion,
      rejectQuestCompletion, claimQuest, releaseQuest, addMarket, updateMarket, deleteMarket,
      addMarketItem, updateMarketItem, deleteMarketItem, purchaseMarketItem, cancelPurchaseRequest,
      approvePurchaseRequest, rejectPurchaseRequest, addGuild, updateGuild, deleteGuild, setRanks,
      addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addDigitalAsset,
      updateDigitalAsset, deleteDigitalAsset, dismissQuest, updateSettings, importBlueprint, restoreFromBackup
  ]);

  if (!isDataLoaded) {
      return <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200"><h1 className="text-3xl font-medieval animate-pulse">Loading the Donegeon...</h1></div>
  }
  
  if (backendError) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200 p-4">
            <div className="max-w-lg text-center">
                <h1 className="text-4xl font-medieval text-red-500 mb-4">Connection Error</h1>
                <p className="text-stone-300 mb-6">Could not connect to the Task Donegeon server. Please ensure the backend is running and accessible.</p>
                <p className="text-xs text-stone-500 bg-stone-800 p-3 rounded-md font-mono">{backendError}</p>
            </div>
         </div>
      )
  }

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};