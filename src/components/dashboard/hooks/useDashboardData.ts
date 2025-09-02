

import { useMemo, useState, useEffect } from 'react';
import { useSystemState } from '../../../context/SystemContext';
import { useUIState } from '../../../context/UIContext';
import { useAuthState } from '../../../context/AuthContext';
import { Quest, QuestCompletionStatus, RewardCategory, Rank, QuestKind, Trophy, RewardItem, AdminAdjustment, ChronicleEvent } from '../../../types';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, questSorter, toYMD } from '../../../utils/quests';
import { useQuestsState } from '../../../context/QuestsContext';
import { useProgressionState } from '../../../context/ProgressionContext';
import { useEconomyState } from '../../../context/EconomyContext';
import { useCommunityState } from '../../../context/CommunityContext';

interface PendingApprovals {
    quests: { id: string; title: string; submittedAt: string; questId: string; }[];
    purchases: { id: string; title: string; submittedAt: string; }[];
}

export const useDashboardData = () => {
    const { 
        settings, scheduledEvents
    } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { ranks, userTrophies, trophies } = useProgressionState();
    const { appMode } = useUIState();
    const { currentUser, users } = useAuthState();
    
    const [recentActivities, setRecentActivities] = useState<ChronicleEvent[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApprovals>({ quests: [], purchases: [] });


    useEffect(() => {
        if (!currentUser) return;

        const fetchActivities = async () => {
            try {
                const guildId = appMode.mode === 'guild' ? appMode.guildId : 'null';
                
                // Get filters from localStorage to match Chronicles page
                const savedFilters = localStorage.getItem('chronicleFilters');
                // FIX: Safely parse localStorage data to prevent runtime errors and ensure it is a string array.
                let filterTypes = '';
                if (savedFilters) {
                    try {
                        const parsed = JSON.parse(savedFilters);
                        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                            filterTypes = parsed.join(',');
                        }
                    } catch (e) {
                        console.error("Could not parse chronicleFilters from localStorage", e);
                    }
                }
                
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 6);

                const params = new URLSearchParams({
                    page: '1',
                    limit: '50',
                    userId: currentUser.id,
                    guildId,
                    viewMode: 'personal',
                    startDate: toYMD(startDate),
                    endDate: toYMD(endDate),
                    dashboardFetch: 'true',
                });
                if (filterTypes) {
                    params.append('filterTypes', filterTypes);
                }

                const response = await fetch(`/api/chronicles?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch recent activities');
                const data = await response.json();
                setRecentActivities(data.events || []);
            } catch (error) {
                console.error("Failed to fetch dashboard activities:", error);
                setRecentActivities([]);
            }
        };
        
        const fetchPendingApprovals = async () => {
             try {
                const response = await fetch(`/api/users/${currentUser.id}/pending-items`);
                if (!response.ok) throw new Error('Failed to fetch pending items');
                const data = await response.json();
                setPendingApprovals(data);
            } catch (error) {
                console.error("Failed to fetch pending approvals:", error);
                setPendingApprovals({ quests: [], purchases: [] });
            }
        };

        fetchActivities();
        fetchPendingApprovals();
    }, [currentUser, appMode, questCompletions]);

    if (!currentUser) {
        return {
            currentUser: null,
            rankData: { totalXp: 0, currentRank: null, nextRank: null, progressPercentage: 0, currentLevel: 0, xpIntoCurrentRank: 0, xpForNextRank: 0 },
            userCurrencies: [],
            userExperience: [],
            recentActivities: [],
            pendingApprovals: { quests: [], purchases: [] },
            leaderboard: [],
            mostRecentTrophy: null,
            quickActionQuests: [],
            weeklyProgressData: [],
            terminology: settings.terminology
        };
    }
    
    const { terminology } = settings;

    const currentBalances = useMemo(() => {
        if (appMode.mode === 'personal') {
            return { purse: currentUser.personalPurse, experience: currentUser.personalExperience };
        }
        return currentUser.guildBalances[appMode.guildId] || { purse: {}, experience: {} };
    }, [currentUser, appMode]);

    const rankData = useMemo(() => {
        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        const totalXp = Object.values(currentBalances.experience).reduce<number>((sum, amount) => sum + Number(amount), 0);
        
        let currentRank: Rank | null = sortedRanks[0] || null;
        let nextRank: Rank | null = sortedRanks[1] || null;

        if (!currentRank) {
            return { totalXp, currentRank: null, nextRank: null, progressPercentage: 0, currentLevel: 0, xpIntoCurrentRank: 0, xpForNextRank: 0 };
        }

        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                currentRank = sortedRanks[i];
                nextRank = sortedRanks[i + 1] || null;
                break;
            }
        }
        
        const xpForNextRank = (currentRank && nextRank) ? nextRank.xpThreshold - currentRank.xpThreshold : 0;
        const xpIntoCurrentRank = currentRank ? totalXp - currentRank.xpThreshold : 0;
        const clampedXpIntoRank = Math.max(0, xpIntoCurrentRank);
        const progressPercentage = (nextRank && xpForNextRank > 0) ? Math.min(100, (clampedXpIntoRank / xpForNextRank) * 100) : 100;
        const currentLevel = sortedRanks.findIndex(r => r.id === currentRank!.id) + 1;
        
        return { totalXp, currentRank, nextRank, progressPercentage, currentLevel, xpIntoCurrentRank: clampedXpIntoRank, xpForNextRank };
    }, [currentBalances.experience, ranks]);

    const userCurrencies = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === RewardCategory.Currency)
            .map(c => ({ ...c, amount: currentBalances.purse[c.id] || 0 }))
            .filter(c => c.amount > 0);
    }, [currentBalances.purse, rewardTypes]);

    const userExperience = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === RewardCategory.XP)
            .map(xp => ({ ...xp, amount: currentBalances.experience[xp.id] || 0 }))
            .filter(xp => xp.amount > 0);
    }, [currentBalances.experience, rewardTypes]);

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users.map(user => {
            let userTotalXp = 0;
            if (currentGuildId) {
                // FIX: Changed `amount: number` to `amount: any` to satisfy TypeScript's strictness which infers `unknown`.
                userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum: number, amount: any) => sum + Number(amount), 0);
            } else {
                // FIX: Changed `amount: number` to `amount: any` to satisfy TypeScript's strictness which infers `unknown`.
                userTotalXp = Object.values(user.personalExperience).reduce((sum: number, amount: any) => sum + Number(amount), 0);
            }
            return { name: user.gameName, xp: userTotalXp };
        }).sort((a, b) => b.xp - a.xp).slice(0, 5);
    }, [users, appMode]);
        
    const mostRecentTrophy = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const myTrophies = userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId == currentGuildId).sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
        const mostRecentTrophyAward = myTrophies.length > 0 ? myTrophies[0] : null;
        if (!mostRecentTrophyAward) return null;
        return trophies.find(t => t.id === mostRecentTrophyAward.trophyId) || null;
    }, [userTrophies, trophies, currentUser.id, appMode]);

    const quickActionQuests = useMemo(() => {
        const today = new Date();
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);
        const completableQuests = quests.filter(quest => {
            if (!isQuestVisibleToUserInMode(quest, currentUser.id, appMode)) return false;
            
            if (quest.requiresClaim) {
                const totalApproved = quest.approvedClaims?.length || 0;
                const claimLimit = quest.claimLimit || 1;
                return totalApproved < claimLimit || quest.approvedClaims?.some(c => c.userId === currentUser.id);
            }

            return isQuestAvailableForUser(quest, userCompletions, today, scheduledEvents, appMode)
        });
        const uniqueQuests = Array.from(new Map(completableQuests.map(q => [q.id, q])).values());
        return uniqueQuests.sort(questSorter(currentUser, userCompletions, scheduledEvents, today));
    }, [quests, currentUser, questCompletions, appMode, scheduledEvents]);
    
    const weeklyProgressData = useMemo(() => {
        const dataByDay: { [date: string]: number } = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dataByDay[dateKey] = 0;
        }

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId == currentGuildId);

        userCompletions.forEach(completion => {
            const completionDate = new Date(completion.completedAt);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            if (completionDate >= sevenDaysAgo) {
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return;
                const dateKey = completion.completedAt.split('T')[0];
                const xpForThisQuest = quest.rewards.filter((r: RewardItem) => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP).reduce<number>((sum, r) => sum + Number(r.amount), 0);
                if (dateKey in dataByDay) {
                    dataByDay[dateKey] += xpForThisQuest;
                }
            }
        });
        return Object.entries(dataByDay).map(([date, value]) => ({ label: new Date(date + 'T00:00:00').toLocaleDateString('default', { weekday: 'short' }), value }));
    }, [currentUser.id, appMode, questCompletions, quests, rewardTypes]);

    return {
        currentUser,
        rankData,
        userCurrencies,
        userExperience,
        recentActivities,
        pendingApprovals,
        leaderboard,
        mostRecentTrophy,
        quickActionQuests,
        weeklyProgressData,
        terminology
    };
};