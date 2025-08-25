

import { useMemo } from 'react';
import { useSystemState } from '../../../context/SystemContext';
import { useUIState } from '../../../context/UIContext';
import { useAuthState } from '../../../context/AuthContext';
import { Quest, QuestCompletionStatus, RewardCategory, Rank, QuestKind, Trophy } from '../../../types';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, questSorter } from '../../quests/utils/quests';
import { useQuestsState } from '../../../context/QuestsContext';
import { useProgressionState } from '../../../context/ProgressionContext';
import { useEconomyState } from '../../../context/EconomyContext';
import { useCommunityState } from '../../../context/CommunityContext';

export const useDashboardData = () => {
    const { 
        settings, scheduledEvents, 
        adminAdjustments 
    } = useSystemState();
    const { rewardTypes, purchaseRequests } = useEconomyState();
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { ranks, userTrophies, trophies } = useProgressionState();
    const { appMode } = useUIState();
    const { currentUser, users } = useAuthState();

    if (!currentUser) {
        // Return a default or empty state if there's no user.
        // The calling component should handle this case.
        return {
            currentUser: null,
            rankData: { totalXp: 0, currentRank: null, nextRank: null, progressPercentage: 0, currentLevel: 0, xpIntoCurrentRank: 0, xpForNextRank: 0 },
            userCurrencies: [],
            userExperience: [],
            recentActivities: [],
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
        const totalXp = Object.values(currentBalances.experience).reduce((sum: number, amount: number) => sum + amount, 0);
        
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
        
        const xpForNextRank = nextRank ? nextRank.xpThreshold - currentRank.xpThreshold : 0;
        const xpIntoCurrentRank = totalXp - currentRank.xpThreshold;
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
    
    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const recentActivities = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        type Activity = { id: string; type: 'Quest' | 'Purchase' | 'Trophy' | 'Adjustment'; title: string; date: string; note?: string; rewardsText?: string; status: string; icon: string; };

        const allActivities: Activity[] = [
            ...questCompletions.filter(c => c.userId === currentUser.id && c.guildId == currentGuildId).map(c => {
                const quest = quests.find(q => q.id === c.questId);
                let rewardsText = '';
                if (c.status === QuestCompletionStatus.Approved && quest && quest.rewards.length > 0) {
                    rewardsText = quest.rewards.map(r => `+${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                }
                return { id: c.id, type: 'Quest' as const, title: quest?.title || `Unknown ${terminology.task}`, date: c.completedAt, note: c.note ? `"${c.note}"` : undefined, rewardsText: rewardsText || undefined, status: c.status, icon: quest?.icon || '📜' };
            }),
            ...purchaseRequests.filter(p => p.userId === currentUser.id && p.guildId == currentGuildId).map(p => ({ id: p.id, type: 'Purchase' as const, title: `Purchased "${p.assetDetails.name}"`, date: p.requestedAt, note: p.assetDetails.cost.map(r => `-${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' '), status: p.status, icon: '💰' })),
            ...userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId == currentGuildId).map(ut => {
                const trophy = trophies.find(t => t.id === ut.trophyId);
                return { id: ut.id, type: 'Trophy' as const, title: `Earned ${terminology.award}: "${trophy?.name || ''}"`, date: ut.awardedAt, note: trophy?.description, status: 'Awarded!', icon: trophy?.icon || '🏆' };
            }),
            ...adminAdjustments.filter(a => a.userId === currentUser.id && a.guildId == currentGuildId).map(a => {
                const isExchange = a.userId === a.adjusterId && a.reason.startsWith('Exchanged');
                if (!isExchange) return null;
                const title = `Made an Exchange`;
                let rewardsText = '';
                if (a.rewards.length > 0 || a.setbacks.length > 0) {
                    const paid = a.setbacks.map(r => `-${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                    const received = a.rewards.map(r => `+${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                    rewardsText = `${paid} ${received}`.trim();
                }
                return { id: a.id, type: 'Adjustment' as const, title, date: a.adjustedAt, note: a.reason, rewardsText: rewardsText || undefined, status: 'Exchanged!', icon: '⚖️' };
            }).filter((a): a is NonNullable<typeof a> => !!a),
        ];

        return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [adminAdjustments, questCompletions, purchaseRequests, userTrophies, quests, trophies, currentUser.id, appMode, terminology, rewardTypes]);

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users.map(user => {
            let userTotalXp = 0;
            if (currentGuildId) {
                userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum, amount) => sum + amount, 0);
            } else {
                userTotalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + amount, 0);
            }
            return { name: user.gameName, xp: userTotalXp };
        }).sort((a, b) => b.xp - a.xp).slice(0, 5);
    }, [users, appMode]);
        
    const mostRecentTrophy = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const myTrophies = userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId == currentGuildId).sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
        const mostRecentTrophyAward = myTrophies.length > 0 ? myTrophies[0] : null;
        return mostRecentTrophyAward ? trophies.find(t => t.id === mostRecentTrophyAward.trophyId) || null : null;
    }, [userTrophies, trophies, currentUser.id, appMode]);

    const quickActionQuests = useMemo(() => {
        const today = new Date();
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);
        const completableQuests = quests.filter(quest => 
            isQuestVisibleToUserInMode(quest, currentUser.id, appMode) &&
            isQuestAvailableForUser(quest, userCompletions, today, scheduledEvents, appMode)
        );
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
                const xpForThisQuest = quest.rewards.filter(r => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP).reduce((sum, r) => sum + r.amount, 0);
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
        leaderboard,
        mostRecentTrophy,
        quickActionQuests,
        weeklyProgressData,
        terminology
    };
};