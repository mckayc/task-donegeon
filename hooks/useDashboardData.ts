
import { useMemo, useState, useEffect } from 'react';
import { useSystemState } from '../context/SystemContext';
import { useUIState } from '../context/UIContext';
import { useAuthState } from '../context/AuthContext';
import { Quest, QuestCompletionStatus, RewardCategory, Rank, QuestKind, Trophy } from '../types';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, questSorter } from '../components/quests/utils/quests';
import { useQuestsState } from '../context/QuestsContext';
import { useProgressionState } from '../context/ProgressionContext';
import { useEconomyState } from '../context/EconomyContext';
import { useCommunityState } from '../context/CommunityContext';
import { ChronicleEvent } from '../components/chronicles/types';

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
    const [weeklyProgressData, setWeeklyProgressData] = useState<{ label: string; value: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            setIsLoading(true);
            const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : 'null';

            // Fetch recent activities
            const chroniclesParams = new URLSearchParams({
                page: '1',
                limit: '10',
                userId: currentUser.id,
                guildId: currentGuildId,
                viewMode: 'all',
            });
            const chroniclesPromise = fetch(`/api/chronicles?${chroniclesParams.toString()}`).then(res => res.json());

            // Fetch weekly progress
            const progressParams = new URLSearchParams({
                userId: currentUser.id,
                guildId: currentGuildId,
            });
            const progressPromise = fetch(`/api/system/progress/weekly?${progressParams.toString()}`).then(res => res.json());

            try {
                const [chroniclesData, progressData] = await Promise.all([chroniclesPromise, progressPromise]);
                setRecentActivities(chroniclesData.events || []);
                setWeeklyProgressData(progressData || []);
            } catch (error) {
                console.error("Dashboard data fetch failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, appMode]);


    if (!currentUser) {
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

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users.map(user => {
            let userTotalXp = 0;
            if (currentGuildId) {
                userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum: number, amount: number) => sum + amount, 0);
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
        return mostRecentTrophyAward ? trophies.find(t => t.id === mostRecentTrophyAward.trophyId) : null;
    }, [userTrophies, trophies, currentUser.id, appMode]);

    const quickActionQuests = useMemo(() => {
        const today = new Date();
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);
        const completableQuests = quests.filter(quest => 
            isQuestVisibleToUserInMode(quest, currentUser.id, appMode) &&
            isQuestAvailableForUser(quest, userCompletions, today, scheduledEvents, appMode)
        );
        return completableQuests.sort(questSorter(currentUser, userCompletions, scheduledEvents, today));
    }, [quests, currentUser, questCompletions, appMode, scheduledEvents]);

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
