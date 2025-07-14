

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Quest, RewardTypeDefinition, RewardCategory, QuestAvailability, Role, QuestCompletion, QuestCompletionStatus, RewardItem, Market, QuestType, PurchaseRequest, PurchaseRequestStatus, Guild, Rank, Trophy, UserTrophy, Notification, TrophyRequirement, TrophyRequirementType, AppMode, Page, AdminAdjustment, AdminAdjustmentType, SystemLog, AppSettings, Blueprint, ImportResolution, IAppData, Theme, ShareableAssetType, GameAsset } from '../types';
import { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, INITIAL_SETTINGS, createSampleGameAssets } from '../data/initialData';
import { toYMD, fromYMD } from '../utils/quests';
import { useDebounce } from '../hooks/useDebounce';


// --- STATE ---
// Centralized state object that will be persisted.
// IAppData is now defined in types.ts

// Full state including non-persistent UI state
interface AppState extends IAppData {
  isAppUnlocked: boolean;
  isFirstRun: boolean;
  notifications: Notification[];
  isSwitchingUser: boolean;
  targetedUserForLogin: User | null;
  activePage: Page;
  activeMarketId: string | null;
  allTags: string[];
}

const AppStateContext = createContext<AppState | undefined>(undefined);


// --- DISPATCH ---
interface AppDispatch {
  setAppUnlocked: (isUnlocked: boolean) => void;
  setAppMode: (mode: AppMode) => void;
  addUser: (user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes'>) => User;
  updateUser: (userId: string, updatedData: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  dismissQuest: (questId: string) => void;
  setCurrentUser: (user: User | null) => void;
  setTargetedUserForLogin: (user: User | null) => void;
  setIsSwitchingUser: (isSwitching: boolean) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  completeQuest: (questId: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  claimQuest: (questId: string) => void;
  releaseQuest: (questId: string) => void;
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  purchaseMarketItem: (assetId: string, marketId: string) => void;
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
  addGameAsset: (asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => void;
  updateGameAsset: (asset: GameAsset) => void;
  deleteGameAsset: (assetId: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActivePage: (page: Page) => void;
  setActiveMarketId: (marketId: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
  populateInitialGameData: () => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Record<ShareableAssetType, string[]>) => void;
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
    gameAssets: [],
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
  
  const [isAppUnlocked, setAppUnlockedState] = useState<boolean>(() => {
    return sessionStorage.getItem('isAppUnlocked') === 'true';
  });

  const setAppUnlocked = useCallback((isUnlocked: boolean) => {
    sessionStorage.setItem('isAppUnlocked', String(isUnlocked));
    setAppUnlockedState(isUnlocked);
  }, []);

  const debouncedAppData = useDebounce(appData, 1000);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification = { ...notification, id: `notif-${Date.now()}-${Math.random()}` };
    setNotifications(prev => [...prev, newNotification]);
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

            if (savedData && Object.keys(savedData).length > 0) {
                const finalSettings = deepMergeSettings(INITIAL_SETTINGS, savedData.settings || {});
                setAppData({
                    ...{ users: [], currentUser: null, quests: [], markets: [], rewardTypes: [], questCompletions: [], purchaseRequests: [], guilds: [], ranks: [], trophies: [], userTrophies: [], adminAdjustments: [], gameAssets: [], systemLogs: [], appMode: { mode: 'personal' }, settings: INITIAL_SETTINGS },
                    ...savedData,
                    currentUser: null,
                    settings: finalSettings,
                });
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

  const { users, currentUser, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, appMode, settings } = appData;
  const isFirstRun = isDataLoaded && !users.some(u => u.role === Role.DonegeonMaster) && !backendError;

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

  useEffect(() => {
    if (activePage !== 'Marketplace') {
      setActiveMarketId(null);
    }
  }, [activePage]);

  const populateInitialGameData = useCallback(() => {
    setAppData(prev => {
        if (prev.quests.length > 0) return prev;
        addNotification({ type: 'info', message: 'Your Donegeon is being populated with sample data!' });
        
        const sampleAdventurers = createMockUsers()
            .filter(u => u.role !== Role.DonegeonMaster)
            .map((user, i) => ({
                ...user,
                id: `user-sample-${i}`,
                avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {},
                ownedThemes: ['emerald', 'rose', 'sky'] as Theme[],
            }));
        
        const allUsers = [...prev.users, ...sampleAdventurers];

        return {
            ...prev,
            users: allUsers,
            quests: createSampleQuests(),
            markets: createSampleMarkets(),
            gameAssets: createSampleGameAssets(),
            rewardTypes: prev.rewardTypes.length > 0 ? prev.rewardTypes : INITIAL_REWARD_TYPES,
            guilds: createInitialGuilds(allUsers),
            ranks: prev.ranks.length > 0 ? prev.ranks : INITIAL_RANKS,
            trophies: prev.trophies.length > 0 ? prev.trophies : INITIAL_TROPHIES,
        };
    });
  }, [addNotification]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    setAppData(prev => {
        const user = prev.users.find(u => u.id === userId);
        const trophy = prev.trophies.find(t => t.id === trophyId);
        if (!user || !trophy) return prev;

        if (prev.userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophyId && ut.guildId === guildId)) return prev;

        const newAward: UserTrophy = { id: `award-${Date.now()}`, userId, trophyId, awardedAt: toYMD(new Date()), guildId };

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
            awardTrophy(userId, trophy.id);
          }
      }
      return prev;
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
                if (rewardDef.category === RewardCategory.Currency) balanceSheet.purse[reward.rewardTypeId] = (balanceSheet.purse[reward.rewardTypeId] || 0) + reward.amount;
                else balanceSheet.experience[reward.rewardTypeId] = (balanceSheet.experience[reward.rewardTypeId] || 0) + reward.amount;
            } else {
                if (rewardDef.category === RewardCategory.Currency) userToUpdate.personalPurse[reward.rewardTypeId] = (userToUpdate.personalPurse[reward.rewardTypeId] || 0) + reward.amount;
                else userToUpdate.personalExperience[reward.rewardTypeId] = (userToUpdate.personalExperience[reward.rewardTypeId] || 0) + reward.amount;
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
      if (!rewardDef) { canAfford = false; break; }
      let balance = 0;
      if (guildId) {
          const balanceSheet = user.guildBalances[guildId];
          balance = rewardDef.category === RewardCategory.Currency ? (balanceSheet?.purse[item.rewardTypeId] || 0) : (balanceSheet?.experience[item.rewardTypeId] || 0);
      } else {
          balance = rewardDef.category === RewardCategory.Currency ? (user.personalPurse[item.rewardTypeId] || 0) : (user.personalExperience[item.rewardTypeId] || 0);
      }
      if (balance < item.amount) { canAfford = false; break; }
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

  const addUser = useCallback((user: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes'>): User => {
    const newUser: User = { 
        ...user, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {},
        personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky']
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
    setAppData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId),
        guilds: prev.guilds.map(g => ({ ...g, memberIds: g.memberIds.filter(id => id !== userId) })),
        quests: prev.quests.map(q => ({ ...q, assignedUserIds: q.assignedUserIds.filter(id => id !== userId) })),
    }));
  }, []);

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => {
    setAppData(prev => ({...prev, quests: [...prev.quests, { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] }]}));
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
      questToUpdate.dismissals = questToUpdate.dismissals.filter(d => d.userId !== currentUser.id);
      questToUpdate.dismissals.push({ userId: currentUser.id, dismissedAt: new Date().toISOString() });
      newQuests[questIndex] = questToUpdate;

      return { ...prev, quests: newQuests };
    });
  }, [currentUser]);
  
  const completeQuest = useCallback((questId: string, options?: { note?: string; completionDate?: Date }) => {
      if (!currentUser) return;
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      const newCompletion: QuestCompletion = {
          id: `comp-${Date.now()}`, questId, userId: currentUser.id,
          completedAt: toYMD(options?.completionDate || new Date()),
          status: quest.requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved,
          guildId: quest.guildId, note: options?.note,
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
      setAppData(prev => ({...prev, quests: prev.quests.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, currentUser.id] } : q)}));
  }, [currentUser]);

  const releaseQuest = useCallback((questId: string) => {
      if (!currentUser) return;
      setAppData(prev => ({...prev, quests: prev.quests.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== currentUser.id) } : q)}));
  }, [currentUser]);
  
  const addRewardType = useCallback((rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => {
    setAppData(prev => ({...prev, rewardTypes: [...prev.rewardTypes, { ...rewardType, id: `custom-${Date.now()}`, isCore: false }]}));
  }, []);

  const updateRewardType = useCallback((rewardType: RewardTypeDefinition) => {
    setAppData(prev => ({...prev, rewardTypes: prev.rewardTypes.map(rt => rt.id === rewardType.id ? rewardType : rt)}));
  }, []);

  const deleteRewardType = useCallback((rewardTypeId: string) => {
    setAppData(prev => ({...prev, rewardTypes: prev.rewardTypes.filter(rt => rt.id !== rewardTypeId)}));
  }, []);
  
  const addMarket = useCallback((market: Omit<Market, 'id'>) => {
    setAppData(prev => ({...prev, markets: [...prev.markets, { ...market, id: `market-${Date.now()}` }]}));
  }, []);

  const updateMarket = useCallback((market: Market) => {
    setAppData(prev => ({...prev, markets: prev.markets.map(m => m.id === market.id ? market : m)}));
  }, []);

  const deleteMarket = useCallback((marketId: string) => {
    setAppData(prev => ({...prev, markets: prev.markets.filter(m => m.id !== marketId)}));
  }, []);

  const purchaseMarketItem = useCallback((assetId: string, marketId: string) => {
    if(!currentUser) return;
    const asset = gameAssets.find(a => a.id === assetId);
    if (!asset || !asset.isForSale) return;
    
    const market = markets.find(m => m.id === marketId);
    if(!market) return;

    const requiresApproval = currentUser.role === Role.Explorer;
    const guildId = market.guildId;

    const assetDetails = { name: asset.name, description: asset.description, cost: asset.cost };

    if (requiresApproval) {
        setAppData(prev => ({ ...prev, purchaseRequests: [...prev.purchaseRequests, { id: `purchase-${Date.now()}`, userId: currentUser.id, assetId, requestedAt: toYMD(new Date()), status: PurchaseRequestStatus.Pending, assetDetails, guildId }]}));
        addNotification({type: 'info', message: `"${asset.name}" purchase requested.`})
    } else {
        const affordable = deductRewards(currentUser.id, asset.cost, guildId);
        if (affordable) {
            updateUser(currentUser.id, { ownedAssetIds: [...currentUser.ownedAssetIds, asset.id] });
            addNotification({type: 'success', message: `Purchased "${asset.name}"!`});
            setAppData(prev => ({ ...prev, purchaseRequests: [...prev.purchaseRequests, { id: `purchase-${Date.now()}`, userId: currentUser.id, assetId, requestedAt: toYMD(new Date()), status: PurchaseRequestStatus.Completed, assetDetails, guildId }]}));
        } else {
            addNotification({type: 'error', message: 'You cannot afford this item.'});
        }
    }
  }, [currentUser, gameAssets, markets, deductRewards, addNotification, updateUser]);

  const cancelPurchaseRequest = useCallback((purchaseId: string) => {
      setAppData(prev => ({...prev, purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled } : p)}));
  }, []);
  
  const approvePurchaseRequest = useCallback((purchaseId: string) => {
      const request = purchaseRequests.find(p => p.id === purchaseId);
      if (!request) return;

      const affordable = deductRewards(request.userId, request.assetDetails.cost, request.guildId);
      if (affordable) {
          const user = users.find(u => u.id === request.userId);
          if (user) {
              updateUser(user.id, { ownedAssetIds: [...user.ownedAssetIds, request.assetId] });
          }
          setAppData(prev => ({ ...prev, purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Completed } : p) }));
          addNotification({type: 'success', message: 'Purchase approved.'});
      } else {
          addNotification({type: 'error', message: "User can't afford this."});
      }
  }, [purchaseRequests, users, deductRewards, addNotification, updateUser]);

  const rejectPurchaseRequest = useCallback((purchaseId: string) => {
      setAppData(prev => ({ ...prev, purchaseRequests: prev.purchaseRequests.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected } : p) }));
      addNotification({type: 'info', message: 'Purchase rejected.'});
  }, []);

  const addGuild = useCallback((guild: Omit<Guild, 'id'>) => {
      setAppData(prev => ({ ...prev, guilds: [...prev.guilds, { ...guild, id: `guild-${Date.now()}`}]}));
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
      setAppData(prev => ({ ...prev, trophies: [...prev.trophies, { ...trophy, id: `trophy-${Date.now()}`}]}));
  }, []);
  
  const updateTrophy = useCallback((trophy: Trophy) => {
      setAppData(prev => ({ ...prev, trophies: prev.trophies.map(t => t.id === trophy.id ? trophy : t)}));
  }, []);

  const deleteTrophy = useCallback((trophyId: string) => {
      setAppData(prev => ({...prev, trophies: prev.trophies.filter(t => t.id !== trophyId)}));
  }, []);
  
  const applyManualAdjustment = useCallback((adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt' | 'adjusterId'>): boolean => {
    if (!currentUser) return false;
    const newAdjustment: AdminAdjustment = { ...adjustment, id: `adj-${Date.now()}`, adjustedAt: toYMD(new Date()), adjusterId: currentUser.id };
    setAppData(prev => ({ ...prev, adminAdjustments: [...prev.adminAdjustments, newAdjustment] }));

    if (newAdjustment.type === AdminAdjustmentType.Reward) applyRewards(newAdjustment.userId, newAdjustment.rewards, newAdjustment.guildId);
    else if (newAdjustment.type === AdminAdjustmentType.Setback) deductRewards(newAdjustment.userId, newAdjustment.setbacks, newAdjustment.guildId);
    else if (newAdjustment.type === AdminAdjustmentType.Trophy && newAdjustment.trophyId) awardTrophy(newAdjustment.userId, newAdjustment.trophyId, newAdjustment.guildId);
    
    addNotification({type: 'success', message: 'Manual adjustment applied.'});
    return true;
  }, [currentUser, applyRewards, deductRewards, awardTrophy, addNotification]);

  const addGameAsset = useCallback((asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => {
    if (!currentUser) return;
    const newAsset: GameAsset = {
        ...asset,
        id: `g-asset-${Date.now()}`,
        creatorId: currentUser.id,
        createdAt: new Date().toISOString(),
    };
    setAppData(prev => ({ ...prev, gameAssets: [...prev.gameAssets, newAsset] }));
    addNotification({ type: 'success', message: `Asset "${asset.name}" created.` });
  }, [currentUser, addNotification]);

  const updateGameAsset = useCallback((asset: GameAsset) => {
    setAppData(prev => ({...prev, gameAssets: prev.gameAssets.map(ga => ga.id === asset.id ? asset : ga)}));
  }, []);
  
  const deleteGameAsset = useCallback((assetId: string) => {
    setAppData(prev => ({...prev, gameAssets: prev.gameAssets.filter(ga => ga.id !== assetId)}));
    addNotification({ type: 'info', message: 'Asset deleted.' });
  }, [addNotification]);
  
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setAppData(prev => ({ ...prev, settings: deepMergeSettings(prev.settings, newSettings) }));
  }, []);

  const importBlueprint = useCallback((blueprint: Blueprint, resolutions: ImportResolution[]) => {
    setAppData(prev => {
        const newState = structuredClone(prev);
        const idMap = new Map<string, string>(); // oldId -> newId

        const getNewId = (oldId: string, prefix: string) => {
            if (!idMap.has(oldId)) idMap.set(oldId, `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
            return idMap.get(oldId)!;
        };
        const resolveName = (type: keyof typeof blueprint.assets, originalId: string, originalName: string) => {
            const resolution = resolutions.find(r => r.type === type && r.id === originalId);
            if (resolution?.resolution === 'rename') return resolution.newName || originalName;
            return originalName;
        };
        blueprint.assets.rewardTypes?.forEach(rt => {
            const resolution = resolutions.find(r => r.type === 'rewardTypes' && r.id === rt.id);
            if (resolution?.resolution !== 'skip') {
                newState.rewardTypes.push({ ...rt, id: getNewId(rt.id, 'rt'), name: resolveName('rewardTypes', rt.id, rt.name), isCore: false });
            }
        });
        blueprint.assets.ranks?.forEach(rank => {
            const resolution = resolutions.find(r => r.type === 'ranks' && r.id === rank.id);
            if (resolution?.resolution !== 'skip') newState.ranks.push({ ...rank, id: getNewId(rank.id, 'rank'), name: resolveName('ranks', rank.id, rank.name) });
        });
        blueprint.assets.trophies?.forEach(trophy => {
            const resolution = resolutions.find(r => r.type === 'trophies' && r.id === trophy.id);
            if (resolution?.resolution !== 'skip') {
                const newTrophy = structuredClone(trophy);
                newTrophy.id = getNewId(trophy.id, 'trophy'); newTrophy.name = resolveName('trophies', trophy.id, trophy.name);
                newTrophy.requirements = newTrophy.requirements.map(req => {
                    if (req.type === TrophyRequirementType.AchieveRank && idMap.has(req.value)) req.value = idMap.get(req.value)!;
                    return req;
                });
                newState.trophies.push(newTrophy);
            }
        });
        const remapRewards = (rewards: RewardItem[]) => rewards.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })).filter(r => newState.rewardTypes.some(rt => rt.id === r.rewardTypeId));
        blueprint.assets.quests?.forEach(quest => {
            const resolution = resolutions.find(r => r.type === 'quests' && r.id === quest.id);
            if (resolution?.resolution !== 'skip') {
                const newQuest = structuredClone(quest);
                newQuest.id = getNewId(quest.id, 'quest'); newQuest.title = resolveName('quests', quest.id, quest.title);
                newQuest.rewards = remapRewards(newQuest.rewards); newQuest.lateSetbacks = remapRewards(newQuest.lateSetbacks); newQuest.incompleteSetbacks = remapRewards(newQuest.incompleteSetbacks);
                newState.quests.push(newQuest);
            }
        });
        blueprint.assets.markets?.forEach(market => {
            const resolution = resolutions.find(r => r.type === 'markets' && r.id === market.id);
            if (resolution?.resolution !== 'skip') {
                const newMarket = structuredClone(market);
                newMarket.id = getNewId(market.id, 'market'); newMarket.title = resolveName('markets', market.id, market.title);
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
            const response = await fetch('/api/data/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backupData) });
            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            addNotification({ type: 'success', message: 'Restore successful! The application will now reload.' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) { addNotification({ type: 'error', message: 'Failed to restore from backup.' }); }
    };
    restore();
  }, [addNotification]);

  const clearAllHistory = useCallback(() => {
    setAppData(prev => ({ ...prev, questCompletions: [], purchaseRequests: [], adminAdjustments: [], systemLogs: [] }));
    addNotification({ type: 'success', message: 'All historical data has been cleared.' });
  }, [addNotification]);

  const resetAllPlayerData = useCallback(() => {
    setAppData(prev => {
        const newUsers = prev.users.map(user => {
            if (user.role !== Role.DonegeonMaster) return { ...user, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], avatar: {} };
            return user;
        });
        return { ...prev, userTrophies: prev.userTrophies.filter(ut => prev.users.find(u => u.id === ut.userId)?.role === Role.DonegeonMaster) };
    });
    addNotification({ type: 'success', message: "All player wallets, XP, and trophies have been reset." });
  }, [addNotification]);
  
  const deleteAllCustomContent = useCallback(() => {
    setAppData(prev => ({
        ...prev, quests: [], markets: [], rewardTypes: prev.rewardTypes.filter(rt => rt.isCore),
        ranks: prev.ranks.filter(r => r.xpThreshold === 0), trophies: [], gameAssets: [],
        guilds: prev.guilds.filter(g => g.isDefault),
    }));
    addNotification({ type: 'success', message: 'All custom content (quests, markets, rewards, etc.) has been deleted.' });
  }, [addNotification]);

  const deleteSelectedAssets = useCallback((selection: Record<ShareableAssetType, string[]>) => {
    setAppData(prev => {
        const newState = { ...prev }; let changed = false;
        (Object.keys(selection) as ShareableAssetType[]).forEach(assetType => {
            const idsToDelete = new Set(selection[assetType]);
            if (idsToDelete.size > 0) {
                changed = true;
                const currentAssets = newState[assetType] as { id: string }[];
                newState[assetType] = currentAssets.filter(asset => !idsToDelete.has(asset.id)) as any;
            }
        });
        return changed ? newState : prev;
    });
    addNotification({ type: 'success', message: 'Selected assets have been deleted.' });
  }, [addNotification]);

  useEffect(() => {
    const intervalId = setInterval(() => {
        const now = new Date();
        const { vacationMode, forgivingSetbacks } = appData.settings;
        if (vacationMode.enabled && vacationMode.startDate && vacationMode.endDate) {
            const start = new Date(vacationMode.startDate);
            const end = new Date(vacationMode.endDate);
            end.setHours(23, 59, 59, 999);
            if (now >= start && now <= end) return;
        }
        
        setAppData(prevData => {
            let wasChanged = false; const newSystemLogs: SystemLog[] = []; const newUsers = structuredClone(prevData.users); let usersModified = false;

            if (!forgivingSetbacks) {
                for (const quest of prevData.quests) {
                    if (!quest.isActive) continue;
                    const assignedUsers = quest.assignedUserIds.length > 0 ? quest.assignedUserIds : prevData.users.map(u => u.id);
                    let lateDeadline: Date | null = null; let incompleteDeadline: Date | null = null;
                    if (quest.type === QuestType.Venture) {
                        lateDeadline = quest.lateDateTime ? new Date(quest.lateDateTime) : null;
                        incompleteDeadline = quest.incompleteDateTime ? new Date(quest.incompleteDateTime) : null;
                    } else if (quest.type === QuestType.Duty) {
                         let isScheduledToday = quest.availabilityType === QuestAvailability.Daily || (quest.availabilityType === QuestAvailability.Weekly && quest.weeklyRecurrenceDays.includes(now.getDay())) || (quest.availabilityType === QuestAvailability.Monthly && quest.monthlyRecurrenceDays.includes(now.getDate()));
                        if (isScheduledToday) {
                            if (quest.lateTime) lateDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...quest.lateTime.split(':').map(Number));
                            if (quest.incompleteTime) incompleteDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ...quest.incompleteTime.split(':').map(Number));
                        }
                    }
                    
                    const applySetbacksToUser = (user: User, setbacks: RewardItem[], guildId?: string) => {
                        setbacks.forEach(setback => {
                            const rewardDef = prevData.rewardTypes.find(rt => rt.id === setback.rewardTypeId); if (!rewardDef) return;
                            if (guildId) {
                                if (!user.guildBalances[guildId]) user.guildBalances[guildId] = { purse: {}, experience: {} }; const balanceSheet = user.guildBalances[guildId];
                                if (rewardDef.category === RewardCategory.Currency) balanceSheet.purse[setback.rewardTypeId] = (balanceSheet.purse[setback.rewardTypeId] || 0) - setback.amount;
                                else balanceSheet.experience[setback.rewardTypeId] = (balanceSheet.experience[setback.rewardTypeId] || 0) - setback.amount;
                            } else {
                                if (rewardDef.category === RewardCategory.Currency) user.personalPurse[setback.rewardTypeId] = (user.personalPurse[setback.rewardTypeId] || 0) - setback.amount;
                                else user.personalExperience[setback.rewardTypeId] = (user.personalExperience[setback.rewardTypeId] || 0) - setback.amount;
                            }
                        }); usersModified = true;
                    }

                    const checkAndApply = (deadline: Date | null, setbacks: RewardItem[], logType: 'QUEST_LATE' | 'QUEST_INCOMPLETE') => {
                        if (deadline && deadline < now && setbacks.length > 0) {
                            const logKey = `${quest.id}-${toYMD(deadline)}-${logType.toLowerCase()}`;
                            if (!prevData.systemLogs.some(log => log.id.startsWith(logKey))) {
                                const usersToPenalize = assignedUsers.filter(userId => {
                                    const userCompletions = prevData.questCompletions.filter(c => c.questId === quest.id && c.userId === userId);
                                    if (userCompletions.length === 0) return true;
                                    const lastCompletionDate = userCompletions.sort((a,b) => fromYMD(b.completedAt).getTime() - fromYMD(a.completedAt).getTime())[0]?.completedAt;
                                    return lastCompletionDate ? fromYMD(lastCompletionDate) < deadline : true;
                                });
                                if (usersToPenalize.length > 0) {
                                    newSystemLogs.push({ id: logKey, timestamp: now.toISOString(), type: logType, questId: quest.id, userIds: usersToPenalize, setbacksApplied: setbacks });
                                    usersToPenalize.forEach(userId => {
                                        const userIndex = newUsers.findIndex(u => u.id === userId);
                                        if (userIndex !== -1) applySetbacksToUser(newUsers[userIndex], setbacks, quest.guildId);
                                    });
                                    wasChanged = true;
                                }
                            }
                        }
                    };
                    checkAndApply(lateDeadline, quest.lateSetbacks, 'QUEST_LATE');
                    checkAndApply(incompleteDeadline, quest.incompleteSetbacks, 'QUEST_INCOMPLETE');
                }
            }
            if (!wasChanged) return prevData;
            return { ...prevData, users: usersModified ? newUsers : prevData.users, systemLogs: [...prevData.systemLogs, ...newSystemLogs] };
        });
    }, 60000);
    return () => clearInterval(intervalId);
  }, [appData.settings, appData.quests, appData.users, appData.systemLogs, addNotification]);

  const dispatchValue: AppDispatch = {
    setAppUnlocked, setAppMode, addUser, updateUser, deleteUser, addQuest, updateQuest, deleteQuest, dismissQuest,
    setCurrentUser, setTargetedUserForLogin, setIsSwitchingUser, addRewardType, updateRewardType, deleteRewardType,
    completeQuest, approveQuestCompletion, rejectQuestCompletion, claimQuest, releaseQuest, addMarket, updateMarket,
    deleteMarket, purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest, 
    addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, 
    addGameAsset, updateGameAsset, deleteGameAsset, addNotification, removeNotification, setActivePage, setActiveMarketId,
    updateSettings, importBlueprint, restoreFromBackup, populateInitialGameData, clearAllHistory, resetAllPlayerData,
    deleteAllCustomContent, deleteSelectedAssets
  };

  return (
    <AppStateContext.Provider value={{ ...appData, isAppUnlocked, isFirstRun, notifications, isSwitchingUser, targetedUserForLogin, activePage, activeMarketId, allTags }}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) throw new Error('useAppState must be used within an AppProvider');
  return context;
};

export const useAppDispatch = (): AppDispatch => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) throw new Error('useAppDispatch must be used within an AppProvider');
  return context;
};