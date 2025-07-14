
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { AppSettings, User, Quest, RewardTypeDefinition, QuestCompletion, RewardItem, Market, PurchaseRequest, Guild, Rank, Trophy, UserTrophy, Notification, AppMode, Page, IAppData, ShareableAssetType, GameAsset, Role, QuestCompletionStatus, RewardCategory, PurchaseRequestStatus, AdminAdjustment, AdminAdjustmentType, SystemLog, QuestType, QuestAvailability, Blueprint, ImportResolution, TrophyRequirementType } from '../types';
import { INITIAL_SETTINGS, createMockUsers, INITIAL_REWARD_TYPES, INITIAL_RANKS, INITIAL_TROPHIES, createSampleMarkets, createSampleQuests, createInitialGuilds, createSampleGameAssets } from '../data/initialData';
import { useDebounce } from '../hooks/useDebounce';
import { toYMD } from '../utils/quests';

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
  targetedUserForLogin: User | null;
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

  // Game Data
  addQuest: (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => void;
  updateQuest: (updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  dismissQuest: (questId: string, userId: string) => void;
  claimQuest: (questId: string, userId: string) => void;
  releaseQuest: (questId: string, userId: string) => void;
  completeQuest: (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => void;
  approveQuestCompletion: (completionId: string, note?: string) => void;
  rejectQuestCompletion: (completionId: string, note?: string) => void;
  addRewardType: (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => void;
  updateRewardType: (rewardType: RewardTypeDefinition) => void;
  deleteRewardType: (rewardTypeId: string) => void;
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
  populateInitialGameData: (adminUser: User) => void;
  importBlueprint: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
  restoreFromBackup: (backupData: IAppData) => void;
  clearAllHistory: () => void;
  resetAllPlayerData: () => void;
  deleteAllCustomContent: () => void;
  deleteSelectedAssets: (selection: Record<ShareableAssetType, string[]>) => void;
  uploadFile: (file: File) => Promise<{ url: string } | null>;

  // Settings & UI
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActivePage: (page: Page) => void;
  setAppMode: (mode: AppMode) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveMarketId: (marketId: string | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // === STATE MANAGEMENT ===
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
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // UI State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAppUnlocked, setAppUnlocked] = useState<boolean>(() => sessionStorage.getItem('isAppUnlocked') === 'true');
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [appMode, setAppMode] = useState<AppMode>({ mode: 'personal' });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeMarketId, setActiveMarketId] = useState<string | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);
  const [targetedUserForLogin, setTargetedUserForLogin] = useState<User | null>(null);

  const isFirstRun = isDataLoaded && !users.some(u => u.role === Role.DonegeonMaster);

  // === DATA PERSISTENCE ===
  const appData: IAppData = { users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings };
  const debouncedAppData = useDebounce(appData, 1500);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data/load');
        if (response.ok) {
          const data = await response.json();
          if (Object.keys(data).length > 0) {
            setUsers(data.users || []); setQuests(data.quests || []); setMarkets(data.markets || []); setRewardTypes(data.rewardTypes || []); setQuestCompletions(data.questCompletions || []); setPurchaseRequests(data.purchaseRequests || []); setGuilds(data.guilds || []); setRanks(data.ranks || []); setTrophies(data.trophies || []); setUserTrophies(data.userTrophies || []); setAdminAdjustments(data.adminAdjustments || []); setGameAssets(data.gameAssets || []); setSystemLogs(data.systemLogs || []);
            setSettings(prev => ({...prev, ...data.settings}));
          }
        }
      } catch (error) { console.error("Failed to load data:", error); } 
      finally { setIsDataLoaded(true); }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded || isFirstRun) return;
    const saveData = async () => {
      try { await fetch('/api/data/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(debouncedAppData) }); } 
      catch (error) { console.error("Failed to save data:", error); }
    };
    saveData();
  }, [debouncedAppData, isDataLoaded, isFirstRun]);


  // === BUSINESS LOGIC / DISPATCH FUNCTIONS ===
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    setNotifications(prev => [...prev, { ...notification, id: `notif-${Date.now()}` }]);
  }, []);

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
      return newUsers;
    });
  }, [rewardTypes]);
  
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

  // Auth
  const addUser = (userData: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>): User => {
    const newUser: User = { ...userData, id: `user-${Date.now()}`, avatar: {}, ownedAssetIds: [], personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedThemes: ['emerald', 'rose', 'sky'], hasBeenOnboarded: false };
    setUsers(prev => [...prev, newUser]);
    setGuilds(prev => prev.map(g => g.isDefault ? { ...g, memberIds: [...g.memberIds, newUser.id] } : g));
    return newUser;
  };
  const updateUser = (userId: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...updatedData } as User : null);
  };
  const deleteUser = (userId: string) => { setUsers(prev => prev.filter(u => u.id !== userId)); setGuilds(prev => prev.map(g => ({ ...g, memberIds: g.memberIds.filter(id => id !== userId) }))); setQuests(prev => prev.map(q => ({ ...q, assignedUserIds: q.assignedUserIds.filter(id => id !== userId) }))); };
  const markUserAsOnboarded = (userId: string) => updateUser(userId, { hasBeenOnboarded: true });
  const handleSetAppUnlocked = (isUnlocked: boolean) => { sessionStorage.setItem('isAppUnlocked', String(isUnlocked)); setAppUnlocked(isUnlocked); };
  
  // GameData
  const addQuest = (quest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>) => setQuests(prev => [...prev, { ...quest, id: `quest-${Date.now()}`, claimedByUserIds: [], dismissals: [] }]);
  const updateQuest = (updatedQuest: Quest) => setQuests(prev => prev.map(q => q.id === updatedQuest.id ? updatedQuest : q));
  const deleteQuest = (questId: string) => setQuests(prev => prev.filter(q => q.id !== questId));
  const dismissQuest = (questId: string, userId: string) => { setQuests(prevQuests => prevQuests.map(q => q.id === questId ? { ...q, dismissals: [...q.dismissals.filter(d => d.userId !== userId), { userId, dismissedAt: new Date().toISOString() }] } : q)); };
  const claimQuest = (questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: [...q.claimedByUserIds, userId] } : q));
  const releaseQuest = (questId: string, userId: string) => setQuests(prev => prev.map(q => q.id === questId ? { ...q, claimedByUserIds: q.claimedByUserIds.filter(id => id !== userId) } : q));
  const completeQuest = (questId: string, userId: string, rewards: RewardItem[], requiresApproval: boolean, guildId?: string, options?: { note?: string; completionDate?: Date }) => {
    const newCompletion: QuestCompletion = { id: `comp-${Date.now()}`, questId, userId, completedAt: (options?.completionDate || new Date()).toISOString(), status: requiresApproval ? QuestCompletionStatus.Pending : QuestCompletionStatus.Approved, guildId, note: options?.note };
    setQuestCompletions(prev => [...prev, newCompletion]);
    if (!requiresApproval) { applyRewards(userId, rewards, guildId); const quest = quests.find(q => q.id === questId); addNotification({ type: 'success', message: `Quest Completed: ${quest?.title}`}); checkAndAwardTrophies(userId, guildId); } 
    else { addNotification({ type: 'info', message: `Quest submitted for approval.` }); }
  };
  const approveQuestCompletion = (completionId: string, note?: string) => { const c = questCompletions.find(c => c.id === completionId); if (c) { const q = quests.find(q => q.id === c.questId); if (q) { setQuestCompletions(prev => prev.map(comp => comp.id === completionId ? { ...comp, status: QuestCompletionStatus.Approved, note: note || comp.note } : comp)); applyRewards(c.userId, q.rewards, q.guildId); addNotification({ type: 'success', message: `Quest approved!`}); checkAndAwardTrophies(c.userId, q.guildId); } } };
  const rejectQuestCompletion = (completionId: string, note?: string) => { setQuestCompletions(prev => prev.map(c => c.id === completionId ? { ...c, status: QuestCompletionStatus.Rejected, note: note || c.note } : c)); addNotification({ type: 'info', message: `Quest rejected.`}); };
  const addRewardType = (rewardType: Omit<RewardTypeDefinition, 'id' | 'isCore'>) => setRewardTypes(prev => [...prev, { ...rewardType, id: `custom-${Date.now()}`, isCore: false }]);
  const updateRewardType = (rewardType: RewardTypeDefinition) => setRewardTypes(prev => prev.map(rt => rt.id === rewardType.id ? rewardType : rt));
  const deleteRewardType = (rewardTypeId: string) => setRewardTypes(prev => prev.filter(rt => rt.id !== rewardTypeId));
  const addMarket = (market: Omit<Market, 'id'>) => setMarkets(prev => [...prev, { ...market, id: `market-${Date.now()}` }]);
  const updateMarket = (market: Market) => setMarkets(prev => prev.map(m => m.id === market.id ? market : m));
  const deleteMarket = (marketId: string) => setMarkets(prev => prev.filter(m => m.id !== marketId));
  const purchaseMarketItem = (assetId: string, marketId: string, user: User, cost: RewardItem[], assetDetails: any) => { const m = markets.find(m => m.id === marketId); if(!m) return; const reqApproval = user.role === Role.Explorer; if (reqApproval) { setPurchaseRequests(p => [...p, { id: `purchase-${Date.now()}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Pending, assetDetails, guildId: m.guildId }]); addNotification({type: 'info', message: `"${assetDetails.name}" purchase requested.`}); } else { const a = deductRewards(user.id, cost, m.guildId); if(a){ setUsers(p => p.map(u => u.id === user.id ? { ...u, ownedAssetIds: [...u.ownedAssetIds, assetId] } : u)); addNotification({type: 'success', message: `Purchased "${assetDetails.name}"!`}); setPurchaseRequests(p => [...p, { id: `purchase-${Date.now()}`, userId: user.id, assetId, requestedAt: new Date().toISOString(), status: PurchaseRequestStatus.Completed, assetDetails, guildId: m.guildId }]);} else { addNotification({type: 'error', message: 'You cannot afford this item.'}); } } };
  const cancelPurchaseRequest = (purchaseId: string) => setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Cancelled } : p));
  const approvePurchaseRequest = (purchaseId: string) => { const r = purchaseRequests.find(p => p.id === purchaseId); if (!r) return; if(deductRewards(r.userId, r.assetDetails.cost, r.guildId)){ setUsers(p => p.map(u => u.id === r.userId ? { ...u, ownedAssetIds: [...u.ownedAssetIds, r.assetId] } : u)); setPurchaseRequests(p => p.map(pr => pr.id === purchaseId ? { ...pr, status: PurchaseRequestStatus.Completed } : pr)); addNotification({type: 'success', message: 'Purchase approved.'});} else { addNotification({type: 'error', message: "User can't afford this."});} };
  const rejectPurchaseRequest = (purchaseId: string) => { setPurchaseRequests(prev => prev.map(p => p.id === purchaseId ? { ...p, status: PurchaseRequestStatus.Rejected } : p)); addNotification({ type: 'info', message: 'Purchase request rejected.' }); };
  const addGuild = (guild: Omit<Guild, 'id'>) => setGuilds(prev => [...prev, { ...guild, id: `guild-${Date.now()}`}]);
  const updateGuild = (guild: Guild) => setGuilds(prev => prev.map(g => g.id === guild.id ? guild : g));
  const deleteGuild = (guildId: string) => setGuilds(prev => prev.filter(g => g.id !== guildId));
  const addTrophy = (trophy: Omit<Trophy, 'id'>) => setTrophies(prev => [...prev, { ...trophy, id: `trophy-${Date.now()}`}]);
  const updateTrophy = (trophy: Trophy) => setTrophies(prev => prev.map(t => t.id === trophy.id ? trophy : t));
  const deleteTrophy = (trophyId: string) => setTrophies(prev => prev.filter(t => t.id !== trophyId));
  const awardTrophy = (userId: string, trophyId: string, guildId?: string) => { const t = trophies.find(t => t.id === trophyId); if (t) { setUserTrophies(p => [...p, { id: `award-${Date.now()}`, userId, trophyId, awardedAt: new Date().toISOString(), guildId }]); addNotification({ type: 'trophy', message: `Trophy Unlocked: ${t.name}!`, icon: t.icon }); }};
  const deductRewards = (userId: string, cost: RewardItem[], guildId?: string): boolean => { const u = users.find(u => u.id === userId); if (!u) return false; const canAfford = cost.every(item => { const rd = rewardTypes.find(rt => rt.id === item.rewardTypeId); if (!rd) return false; const bal = guildId ? (rd.category === 'Currency' ? u.guildBalances[guildId]?.purse[item.rewardTypeId] : u.guildBalances[guildId]?.experience[item.rewardTypeId]) : (rd.category === 'Currency' ? u.personalPurse[item.rewardTypeId] : u.personalExperience[item.rewardTypeId]); return (bal || 0) >= item.amount; }); if(!canAfford) return false; setUsers(pU => pU.map(pu => { if(pu.id !== userId) return pu; const nU = {...pu}; cost.forEach(c => { const rd = rewardTypes.find(rt => rt.id === c.rewardTypeId); if (!rd) return; if(guildId){ if(rd.category==='Currency') nU.guildBalances[guildId].purse[c.rewardTypeId] -= c.amount; else nU.guildBalances[guildId].experience[c.rewardTypeId] -= c.amount;}else{ if(rd.category==='Currency') nU.personalPurse[c.rewardTypeId] -= c.amount; else nU.personalExperience[c.rewardTypeId] -= c.amount; }}); return nU; })); return true; };
  const applyManualAdjustment = (adj: Omit<AdminAdjustment, 'id' | 'adjustedAt'>): boolean => { const newAdj: AdminAdjustment = { ...adj, id: `adj-${Date.now()}`, adjustedAt: new Date().toISOString() }; setAdminAdjustments(p => [...p, newAdj]); if (newAdj.type === AdminAdjustmentType.Reward) applyRewards(newAdj.userId, newAdj.rewards, newAdj.guildId); else if (newAdj.type === AdminAdjustmentType.Setback) deductRewards(newAdj.userId, newAdj.setbacks, newAdj.guildId); else if (newAdj.type === AdminAdjustmentType.Trophy && newAdj.trophyId) awardTrophy(newAdj.userId, newAdj.trophyId, newAdj.guildId); addNotification({type: 'success', message: 'Manual adjustment applied.'}); return true; };
  const addGameAsset = (asset: Omit<GameAsset, 'id'|'creatorId'|'createdAt'>) => { setGameAssets(p => [...p, { ...asset, id: `g-asset-${Date.now()}`, creatorId: 'admin', createdAt: new Date().toISOString() }]); addNotification({ type: 'success', message: `Asset "${asset.name}" created.` }); };
  const updateGameAsset = (asset: GameAsset) => setGameAssets(prev => prev.map(ga => ga.id === asset.id ? asset : ga));
  const deleteGameAsset = (assetId: string) => { setGameAssets(prev => prev.filter(ga => ga.id !== assetId)); addNotification({ type: 'info', message: 'Asset deleted.' }); };
  const uploadFile = async (file: File): Promise<{ url: string } | null> => { const fd = new FormData(); fd.append('file', file); try { const r = await fetch('/api/media/upload', { method: 'POST', body: fd }); if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Upload failed'); } return await r.json(); } catch (e) { const m = e instanceof Error ? e.message : 'Unknown error'; addNotification({ type: 'error', message: `Upload failed: ${m}` }); return null; } };
  const populateInitialGameData = (adminUser: User) => { addNotification({ type: 'info', message: 'Your Donegeon is being populated!' }); const sA = createMockUsers().filter(u => u.role !== Role.DonegeonMaster); const aIU = [adminUser, ...sA]; setUsers(aIU); setQuests(createSampleQuests()); setMarkets(createSampleMarkets()); setGameAssets(createSampleGameAssets()); setRewardTypes(INITIAL_REWARD_TYPES); setGuilds(createInitialGuilds(aIU)); setRanks(INITIAL_RANKS); setTrophies(INITIAL_TROPHIES); };
  const restoreFromBackup = async (backupData: IAppData) => { try { await fetch('/api/data/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backupData) }); addNotification({ type: 'success', message: 'Restore successful! Reloading...' }); setTimeout(() => window.location.reload(), 1500); } catch (e) { addNotification({ type: 'error', message: 'Failed to restore from backup.' }); } };
  const importBlueprint = (blueprint: Blueprint, resolutions: ImportResolution[]) => { const idMap = new Map<string, string>(); const genId = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; resolutions.forEach(res => { if (res.resolution !== 'skip') idMap.set(res.id, genId(res.type.slice(0, 2))); }); const newAssets: Partial<IAppData> = { quests: [], rewardTypes: [], ranks: [], trophies: [], markets: [] }; resolutions.forEach(res => { if (res.resolution === 'skip') return; const a = blueprint.assets[res.type]?.find(a => a.id === res.id); if (a) { const nA = { ...a, id: idMap.get(a.id)! }; if (res.resolution === 'rename' && res.newName) { if('title' in nA) nA.title = res.newName; else nA.name = res.newName; } newAssets[res.type]?.push(nA as any); } }); newAssets.quests?.forEach(q => { q.rewards = q.rewards.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); q.lateSetbacks = q.lateSetbacks.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); q.incompleteSetbacks = q.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: idMap.get(r.rewardTypeId) || r.rewardTypeId })); }); newAssets.trophies?.forEach(t => t.requirements.forEach(r => { if(r.type === TrophyRequirementType.AchieveRank) r.value = idMap.get(r.value) || r.value; })); setQuests(p => [...p, ...(newAssets.quests || [])]); setRewardTypes(p => [...p, ...(newAssets.rewardTypes || [])]); setRanks(p => [...p, ...(newAssets.ranks || [])]); setTrophies(p => [...p, ...(newAssets.trophies || [])]); setMarkets(p => [...p, ...(newAssets.markets || [])]); addNotification({ type: 'success', message: `Imported from ${blueprint.name}!`}); };
  const clearAllHistory = () => { setQuestCompletions([]); setPurchaseRequests([]); setAdminAdjustments([]); setSystemLogs([]); addNotification({ type: 'success', message: 'All historical data has been cleared.' }); };
  const resetAllPlayerData = () => { setUsers(prev => prev.map(u => u.role !== Role.DonegeonMaster ? { ...u, personalPurse: {}, personalExperience: {}, guildBalances: {}, ownedAssetIds: [], avatar: {} } : u)); setUserTrophies(prev => prev.filter(ut => users.find(u => u.id === ut.userId)?.role === Role.DonegeonMaster)); addNotification({ type: 'success', message: "All player data has been reset." }); };
  const deleteAllCustomContent = () => { setQuests([]); setMarkets([]); setGameAssets([]); setRewardTypes(p => p.filter(rt => rt.isCore)); setRanks(p => p.filter(r => r.xpThreshold === 0)); setTrophies([]); setGuilds(p => p.filter(g => g.isDefault)); addNotification({ type: 'success', message: 'All custom content has been deleted.' }); };
  const deleteSelectedAssets = (selection: Record<ShareableAssetType, string[]>) => { (Object.keys(selection) as ShareableAssetType[]).forEach(assetType => { const ids = new Set(selection[assetType]); if (ids.size > 0) { switch (assetType) { case 'quests': setQuests(p => p.filter(i => !ids.has(i.id))); break; case 'markets': setMarkets(p => p.filter(i => !ids.has(i.id))); break; case 'rewardTypes': setRewardTypes(p => p.filter(i => !ids.has(i.id))); break; case 'ranks': setRanks(p => p.filter(i => !ids.has(i.id))); break; case 'trophies': setTrophies(p => p.filter(i => !ids.has(i.id))); break; } } }); addNotification({ type: 'success', message: 'Selected assets have been deleted.' }); };

  const handleUpdateSettings = (settingsToUpdate: Partial<AppSettings>) => {
    setSettings(prev => ({...prev, ...settingsToUpdate}));
  };

  // === CONTEXT PROVIDER VALUE ===
  const stateValue: AppState = {
    users, quests, markets, rewardTypes, questCompletions, purchaseRequests, guilds, ranks, trophies, userTrophies, adminAdjustments, gameAssets, systemLogs, settings,
    currentUser, isAppUnlocked, isFirstRun, activePage, appMode, notifications, isDataLoaded, activeMarketId, allTags: useMemo(() => Array.from(new Set(quests.flatMap(q => q.tags))).sort(), [quests]),
    isSwitchingUser, targetedUserForLogin,
  };

  const dispatchValue: AppDispatch = {
    addUser, updateUser, deleteUser, setCurrentUser, markUserAsOnboarded, setAppUnlocked: handleSetAppUnlocked, setIsSwitchingUser, setTargetedUserForLogin,
    addQuest, updateQuest, deleteQuest, dismissQuest, claimQuest, releaseQuest, completeQuest, approveQuestCompletion, rejectQuestCompletion,
    addRewardType, updateRewardType, deleteRewardType, addMarket, updateMarket, deleteMarket, purchaseMarketItem, cancelPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest,
    addGuild, updateGuild, deleteGuild, setRanks, addTrophy, updateTrophy, deleteTrophy, awardTrophy, applyManualAdjustment, addGameAsset, updateGameAsset, deleteGameAsset,
    populateInitialGameData, importBlueprint, restoreFromBackup, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, deleteSelectedAssets, uploadFile,
    updateSettings: handleUpdateSettings, setActivePage, setAppMode, addNotification, removeNotification, setActiveMarketId,
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
