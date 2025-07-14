import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, QuestType, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, TrophyRequirementType, AppMode, AdminAdjustment, AdminAdjustmentType, SystemLog, Blueprint, ImportResolution, IAppData, ShareableAssetType, GameAsset, Theme, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, QuestAvailability, Role } from '../types';
import { createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, INITIAL_SETTINGS, createSampleGameAssets } from '../data/initialData';
import { toYMD } from '../utils/quests';
import { useDebounce } from '../hooks/useDebounce';

interface GameDataState {
  users: User[];
  quests: Quest[];
  markets: Market[];
  rewardTypes: RewardTypeDefinition[];
  questCompletions: QuestCompletion[];
  purchaseRequests: PurchaseRequest[];
  guilds: Guild[];
  ranks: Rank[];
  trophies: Trophy[];
  userTrophies: UserTrophy[];
  adminAdjustments: AdminAdjustment[];
  gameAssets: GameAsset[];
  systemLogs: SystemLog[];
  notifications: Notification[];
  activeMarketId: string | null;
  allTags: string[];
  isDataLoaded: boolean;
}

interface GameDataDispatch {
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  setGuilds: React.Dispatch<React.SetStateAction<Guild[]>>;
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  addMarket: (market: Omit<Market, 'id'>) => void;
  updateMarket: (market: Market) => void;
  deleteMarket: (marketId: string) => void;
  purchaseMarketItem: (assetId: string, marketId: string, user: User, cost: RewardItem[], assetDetails: any) => void;
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
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
  populateInitialGameData: (adminUser: User) => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Record<ShareableAssetType, string[]>) => void;
}

const GameDataStateContext = createContext<GameDataState | undefined>(undefined);
const GameDataDispatchContext = createContext<GameDataDispatch | undefined>(undefined);

export const GameDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const appData = { users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs };
  const debouncedAppData = useDebounce(appData, 1000);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification = { ...notification, id: `notif-${Date.now()}-${Math.random()}` };
    setNotifications(prev => [...prev, newNotification]);
  }, []);
  
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const allTags = useMemo(() => Array.from(new Set(quests.flatMap(q => q.tags))).sort(), [quests]);

  const applyRewards = useCallback((userId: string, rewardsToApply: RewardItem[], guildId?: string) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) return prevUsers;
      const newUsers = [...prevUsers];
      const userToUpdate = structuredClone(newUsers[userIndex]);
      rewardsToApply.forEach(reward => {
          const rewardDef = rewardTypes.find(rd => rd.id === reward.rewardTypeId);
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
      return newUsers;
    });
  }, [rewardTypes]);

  const deductRewards = useCallback((userId: string, cost: RewardItem[], guildId?: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    for (const item of cost) {
      const rewardDef = rewardTypes.find(rt => rt.id === item.rewardTypeId);
      if (!rewardDef) { return false; }
      let balance = 0;
      if (guildId) {
          const balanceSheet = user.guildBalances[guildId];
          balance = rewardDef.category === RewardCategory.Currency ? (balanceSheet?.purse[item.rewardTypeId] || 0) : (balanceSheet?.experience[item.rewardTypeId] || 0);
      } else {
          balance = rewardDef.category === RewardCategory.Currency ? (user.personalPurse[item.rewardTypeId] || 0) : (user.personalExperience[item.rewardTypeId] || 0);
      }
      if (balance < item.amount) return false;
    }
    setUsers(prevUsers => {
        const userIndex = prevUsers.findIndex(u => u.id === userId);
        if(userIndex === -1) return prevUsers;
        const newUsers = [...prevUsers];
        const userToUpdate = structuredClone(newUsers[userIndex]);
        cost.forEach(c => {
            const rewardDef = rewardTypes.find(rt => rt.id === c.rewardTypeId);
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
        return newUsers;
    });
    return true;
  }, [users, rewardTypes]);

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
        setUserTrophies(prev => [...prev, { id: `award-${Date.now()}-${Math.random()}`, userId, trophyId: trophy.id, awardedAt: new Date().toISOString(), guildId }]);
        addNotification({ type: 'trophy', message: `Trophy Unlocked: ${trophy.name}!`, icon: trophy.icon });
      }
    }
  }, [users, questCompletions, ranks, trophies, userTrophies, quests, addNotification]);
  
  const awardTrophy = useCallback((userId: string, trophyId: string, guildId?: string) => {
    const user = users.find(u => u.id === userId);
    const trophy = trophies.find(t => t.id === trophyId);
    if (!user || !trophy || userTrophies.some(ut => ut.userId === userId && ut.trophyId === trophyId && ut.guildId === guildId)) return;
    const newAward: UserTrophy = { id: `award-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId };
    setUserTrophies(prev => [...prev, newAward]);
    addNotification({ type: 'trophy', message: `Trophy Unlocked: ${trophy.name}!`, icon: trophy.icon });
  }, [users, trophies, userTrophies, addNotification]);
  
  const completeQuest = useCallback((questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => {
      const newCompletion: QuestCompletion = {
          id: `comp-${Date.now()}`, questId, userId: userId,
          completedAt: (options?.completionDate || new Date()).toISOString(),
          status: requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved,
          guildId, note: options?.note,
      };
      setQuestCompletions(prev => [...prev, newCompletion]);
      if (!requiresApproval) {
          applyRewards(userId, rewards, guildId);
          const quest = quests.find(q => q.id === questId);
          addNotification({ type: 'success', message: `Quest Completed: ${quest?.title}`});
      } else {
          addNotification({ type: 'info', message: `Quest submitted for approval.` });
      }
      checkAndAwardTrophies(userId, guildId);
  }, [applyRewards, addNotification, quests, checkAndAwardTrophies]);

  const approveQuestCompletion = useCallback((completionId: string, note?: string) => {
    const completion = questCompletions.find(c => c.id === completionId);
    if (!completion) return;
    const quest = quests.find(q => q.id === completion.questId);
    if (!quest) return;
    setQuestCompletions(prev => prev.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Approved, note: note || c.note } : c));
    applyRewards(completion.userId, quest.rewards, quest.guildId);
    addNotification({ type: 'success', message: `Quest approved!`});
    checkAndAwardTrophies(completion.userId, quest.guildId);
  }, [questCompletions, quests, applyRewards, addNotification, checkAndAwardTrophies]);
  
    const rejectQuestCompletion = useCallback((completionId: string, note?: string) => {
    setQuestCompletions(prev => prev.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Rejected, note: note || c.note } : c));
    addNotification({ type: 'info', message: `Quest rejected.`});
  }, [addNotification]);
  
  const purchaseMarketItem = useCallback((assetId: string, marketId: string, user: User, cost: RewardItem[], assetDetails: any) => {
    const market = markets.find(m => m.id === marketId);
    if(!market) return;
    const requiresApproval = user.role === Role.Explorer;
    const guildId = market.guildId;
    if (requiresApproval) {
        setPurchaseRequests(prev => [...prev, { id: `purchase-${Date.now()}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Pending, assetDetails, guildId }]);
        addNotification({type: 'info', message: `"${assetDetails.name}" purchase requested.`})
    } else {
        const affordable = deductRewards(user.id, cost, guildId);
        if (affordable) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ownedAssetIds: [...u.ownedAssetIds, assetId] } : u));
            addNotification({type: 'success', message: `Purchased "${assetDetails.name}"!`});
            setPurchaseRequests(prev => [...prev, { id: `purchase-${Date.now()}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Completed, assetDetails, guildId }]);
        } else {
            addNotification({type: 'error', message: 'You cannot afford this item.'});
        }
    }
  }, [markets, deductRewards, addNotification]);

  const approvePurchaseRequest = useCallback((purchaseId: string) => {
      const request = purchaseRequests.find(p => p.id === purchaseId);
      if (!request) return;
      const affordable = deductRewards(request.userId, request.assetDetails.cost, request.guildId);
      if (affordable) {
          setUsers(prev => prev.map(u => u.id === request.userId ? { ...u, ownedAssetIds: [...u.ownedAssetIds, request.assetId] } : u));
          setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Completed } : p));
          addNotification({type: 'success', message: 'Purchase approved.'});
      } else {
          addNotification({type: 'error', message: "User can't afford this."});
      }
  }, [purchaseRequests, deductRewards, addNotification]);

  const rejectPurchaseRequest = useCallback((purchaseId: string) => {
    setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected } : p));
    addNotification({ type: 'info', message: 'Purchase request rejected.' });
  }, [addNotification]);
  
  const applyManualAdjustment = useCallback((adjustment: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): boolean => {
    const newAdjustment: AdminAdjustment = { ...adjustment, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() };
    setAdminAdjustments(prev => [...prev, newAdjustment]);
    if (newAdjustment.type === AdminAdjustmentType.Reward) applyRewards(newAdjustment.userId, newAdjustment.rewards, newAdjustment.guildId);
    else if (newAdjustment.type === AdminAdjustmentType.Setback) deductRewards(newAdjustment.userId, newAdjustment.setbacks, newAdjustment.guildId);
    else if (newAdjustment.type === AdminAdjustmentType.Trophy && newAdjustment.trophyId) awardTrophy(newAdjustment.userId, newAdjustment.trophyId, newAdjustment.guildId);
    addNotification({type: 'success', message: 'Manual adjustment applied.'});
    return true;
  }, [applyRewards, deductRewards, awardTrophy, addNotification]);

  const addQuest = useCallback((quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => setQuests(prev => [...prev, { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] }]), []);
  const updateQuest = useCallback((updatedQuest: Quest) => setQuests(prev => prev.map(q => q.id === updatedQuest.id ? updatedQuest : q)), []);
  const deleteQuest = useCallback((questId: string) => setQuests(prev => prev.filter(q => q.id !== questId)), []);
  const dismissQuest = useCallback((questId: string, userId: string) => {
    setQuests(prevQuests => prevQuests.map(q => {
        if (q.id === questId) {
            const newDismissals = q.dismissals.filter(d => d.userId !== userId);
            newDismissals.push({ userId, dismissedAt: new Date().toISOString() });
            return { ...q, dismissals: newDismissals };
        }
        return q;
    }));
  }, []);
  const addRewardType = useCallback((rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => setRewardTypes(prev => [...prev, { ...rewardType, id: `custom-${Date.now()}`, isCore: false }]), []);
  const updateRewardType = useCallback((rewardType: RewardTypeDefinition) => setRewardTypes(prev => prev.map(rt => rt.id === rewardType.id ? rewardType : rt)), []);
  const deleteRewardType = useCallback((rewardTypeId: string) => setRewardTypes(prev => prev.filter(rt => rt.id !== rewardTypeId)), []);
  const claimQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, userId] } : q)), []);
  const releaseQuest = useCallback((questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId) } : q)), []);
  const addMarket = useCallback((market: Omit<Market, 'id'>) => setMarkets(prev => [...prev, { ...market, id: `market-${Date.now()}` }]), []);
  const updateMarket = useCallback((market: Market) => setMarkets(prev => prev.map(m => m.id === market.id ? market : m)), []);
  const deleteMarket = useCallback((marketId: string) => setMarkets(prev => prev.filter(m => m.id !== marketId)), []);
  const cancelPurchaseRequest = useCallback((purchaseId: string) => setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled } : p)), []);
  const addGuild = useCallback((guild: Omit<Guild, 'id'>) => setGuilds(prev => [...prev, { ...guild, id: `guild-${Date.now()}`}]), []);
  const updateGuild = useCallback((guild: Guild) => setGuilds(prev => prev.map(g => g.id === guild.id ? guild : g)), []);
  const deleteGuild = useCallback((guildId: string) => setGuilds(prev => prev.filter(g => g.id !== guildId)), []);
  const addTrophy = useCallback((trophy: Omit<Trophy, 'id'>) => setTrophies(prev => [...prev, { ...trophy, id: `trophy-${Date.now()}`}]), []);
  const updateTrophy = useCallback((trophy: Trophy) => setTrophies(prev => prev.map(t => t.id === trophy.id ? trophy : t)), []);
  const deleteTrophy = useCallback((trophyId: string) => setTrophies(prev => prev.filter(t => t.id !== trophyId)), []);
  const addGameAsset = useCallback((asset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>) => {
    const newAsset: GameAsset = { ...asset, id: `g-asset-${Date.now()}`, creatorId: 'admin', createdAt: new Date().toISOString() };
    setGameAssets(prev => [...prev, newAsset]);
    addNotification({ type: 'success', message: `Asset "${asset.name}" created.` });
  }, [addNotification]);
  const updateGameAsset = useCallback((asset: GameAsset) => setGameAssets(prev => prev.map(ga => ga.id === asset.id ? asset : ga)), []);
  const deleteGameAsset = useCallback((assetId: string) => {
    setGameAssets(prev => prev.filter(ga => ga.id !== assetId));
    addNotification({ type: 'info', message: 'Asset deleted.' });
  }, [addNotification]);
  
  const restoreFromBackup = useCallback(async (backupData: IAppData) => {
    try {
        await fetch('/api/data/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backupData) });
        addNotification({ type: 'success', message: 'Restore successful! Reloading...' });
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) { addNotification({ type: 'error', message: 'Failed to restore from backup.' }); }
  }, [addNotification]);
  
  const populateInitialGameData = useCallback((adminUser: User) => {
    addNotification({ type: 'info', message: 'Your Donegeon is being populated with sample data!' });
    const sampleAdventurers = createMockUsers().filter(u => u.role !== Role.DonegeonMaster);
    const allInitialUsers = [adminUser, ...sampleAdventurers];
    setUsers(allInitialUsers);
    setQuests(createSampleQuests());
    setMarkets(createSampleMarkets());
    setGameAssets(createSampleGameAssets());
    setRewardTypes(INITIAL_REWARD_TYPES);
    setGuilds(createInitialGuilds(allInitialUsers));
    setRanks(INITIAL_RANKS);
    setTrophies(INITIAL_TROPHIES);
  }, [addNotification]);
  
  const clearAllHistory = useCallback(() => {
    setQuestCompletions([]); setPurchaseRequests([]); setAdminAdjustments([]); setSystemLogs([]);
    addNotification({ type: 'success', message: 'All historical data has been cleared.' });
  }, [addNotification]);
  
  const resetAllPlayerData = useCallback(() => {
    setUsers(prev => prev.map(u => u.role !== Role.DonegeonMaster ? { ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], avatar: {} } : u));
    setUserTrophies(prev => prev.filter(ut => users.find(u => u.id === ut.userId)?.role === Role.DonegeonMaster));
    addNotification({ type: 'success', message: "All player wallets, XP, and trophies have been reset." });
  }, [addNotification, users]);
  
  const deleteAllCustomContent = useCallback(() => {
    setQuests([]); setMarkets([]); setGameAssets([]);
    setRewardTypes(prev => prev.filter(rt => rt.isCore));
    setRanks(prev => prev.filter(r => r.xpThreshold === 0));
    setTrophies([]); setGuilds(prev => prev.filter(g => g.isDefault));
    addNotification({ type: 'success', message: 'All custom content has been deleted.' });
  }, [addNotification]);

  const deleteSelectedAssets = useCallback((selection: Record<ShareableAssetType, string[]>) => {
    (Object.keys(selection) as ShareableAssetType[]).forEach(assetType => {
        const idsToDelete = new Set(selection[assetType]);
        if (idsToDelete.size === 0) return;
        switch (assetType) {
            case 'quests': setQuests(p => p.filter(i => !idsToDelete.has(i.id))); break;
            case 'markets': setMarkets(p => p.filter(i => !idsToDelete.has(i.id))); break;
            case 'rewardTypes': setRewardTypes(p => p.filter(i => !idsToDelete.has(i.id))); break;
            case 'ranks': setRanks(p => p.filter(i => !idsToDelete.has(i.id))); break;
            case 'trophies': setTrophies(p => p.filter(i => !idsToDelete.has(i.id))); break;
        }
    });
    addNotification({ type: 'success', message: 'Selected assets have been deleted.' });
  }, [addNotification]);

  const stateValue: GameDataState = {
    users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs,
    notifications, activeMarketId, allTags, isDataLoaded
  };

  const dispatchValue: GameDataDispatch = {
    setUsers, setQuests, setGuilds, addQuest, updateQuest, deleteQuest, dismissQuest, addRewardType, updateRewardType, deleteRewardType,
    completeQuest, approveQuestCompletion, rejectQuestCompletion, claimQuest, releaseQuest, addMarket, updateMarket, deleteMarket,
    purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest, addGuild, updateGuild, deleteGuild, setRanks,
    addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addGameAsset, updateGameAsset, deleteGameAsset,
    addNotification, removeNotification, setActiveMarketId, importBlueprint: () => {}, restoreFromBackup, populateInitialGameData, clearAllHistory, resetAllPlayerData,
    deleteAllCustomContent, deleteSelectedAssets
  };

  return (
    <GameDataStateContext.Provider value={stateValue}>
      <GameDataDispatchContext.Provider value={dispatchValue}>
        {children}
      </GameDataDispatchContext.Provider>
    </GameDataStateContext.Provider>
  );
};

export const useGameData = (): GameDataState => {
  const context = useContext(GameDataStateContext);
  if (context === undefined) throw new Error('useGameData must be used within a GameDataProvider');
  return context;
};

export const useGameDataDispatch = (): GameDataDispatch => {
  const context = useContext(GameDataDispatchContext);
  if (context === undefined) throw new Error('useGameDataDispatch must be used within a GameDataProvider');
  return context;
};
