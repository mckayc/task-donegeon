import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestAvailability, QuestCompletionStatus, RewardCategory, Role, User, QuestType } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { TrophyIcon } from '../ui/Icons';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, fromYMD, getQuestUserStatus } from '../../utils/quests';

const Dashboard: React.FC = () => {
    const { currentUser, quests, rewardTypes, users, ranks, userTrophies, trophies, questCompletions, purchaseRequests, appMode, settings } = useAppState();
    const { completeQuest, setActivePage } = useAppDispatch();

    if (!currentUser) return <div>Loading adventurer's data...</div>;
    
    const { terminology } = settings;

    const handleCompleteQuest = (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        const needsNote = quest.requiresApproval;
        if (needsNote) {
            const note = window.prompt(`Add an optional note for this ${terminology.task.toLowerCase()} completion:`);
            completeQuest(questId, { note: note || undefined });
        } else {
            completeQuest(questId);
        }
    };

    const currentBalances = useMemo(() => {
        if (appMode.mode === 'personal') {
            return { purse: currentUser.personalPurse, experience: currentUser.personalExperience };
        }
        return currentUser.guildBalances[appMode.guildId] || { purse: {}, experience: {} };
    }, [currentUser, appMode]);

    const rankData = useMemo(() => {
        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        const totalXp = Object.values(currentBalances.experience).reduce((sum: number, amount: number) => sum + amount, 0);
        
        let currentRank = sortedRanks[0];
        let nextRank = sortedRanks[1] || null;

        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                currentRank = sortedRanks[i];
                nextRank = sortedRanks[i + 1] || null;
                break;
            }
        }
        
        const xpForNextRank = nextRank ? nextRank.xpThreshold - currentRank.xpThreshold : 0;
        const xpIntoCurrentRank = totalXp - currentRank.xpThreshold;
        const progressPercentage = nextRank ? Math.min(100, (xpIntoCurrentRank / xpForNextRank) * 100) : 100;
        const currentLevel = sortedRanks.findIndex(r => r.id === currentRank.id) + 1;
        
        return { totalXp, currentRank, nextRank, progressPercentage, currentLevel };
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
    
    const recentActivities = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const allActivities = [
            ...questCompletions.map(c => ({ type: 'Quest' as const, data: c, date: c.completedAt })),
            ...purchaseRequests.map(p => ({ type: 'Purchase' as const, data: p, date: p.requestedAt })),
            ...userTrophies.map(ut => ({ type: 'Trophy' as const, data: ut, date: ut.awardedAt }))
        ].filter(a => a.data.userId === currentUser.id && a.data.guildId === currentGuildId);

        return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [questCompletions, purchaseRequests, userTrophies, currentUser.id, appMode]);

    const getQuestTitle = (id: string) => quests.find(q => q.id === id)?.title;
    const getTrophyName = (id: string) => trophies.find(t => t.id === id)?.name;

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users
            .map(user => {
                let userTotalXp = 0;
                if (currentGuildId) {
                    userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum: number, amount: number) => sum + amount, 0);
                } else {
                    userTotalXp = Object.values(user.personalExperience).reduce((sum: number, amount: number) => sum + amount, 0);
                }
                return { name: user.gameName, xp: userTotalXp };
            })
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 5);
    }, [users, appMode]);
        
    const mostRecentTrophy = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const myTrophies = userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId === currentGuildId).sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
        const mostRecentTrophyAward = myTrophies.length > 0 ? myTrophies[0] : null;
        return mostRecentTrophyAward ? trophies.find(t => t.id === mostRecentTrophyAward.trophyId) : null;
    }, [userTrophies, trophies, currentUser.id, appMode]);

    const quickActionQuests = useMemo(() => {
        const getQuestPriority = (quest: Quest) => {
            if (quest.isOptional) return 6;
            if (quest.claimedByUserIds.includes(currentUser.id)) return 1;

            let lateDeadline: Date | null = null;
            if (quest.type === QuestType.Venture && quest.lateDateTime) {
                lateDeadline = new Date(quest.lateDateTime);
            } else if (quest.type === QuestType.Duty && quest.lateTime) {
                const now = new Date();
                const [hours, minutes] = quest.lateTime.split(':').map(Number);
                lateDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            }

            if (lateDeadline && lateDeadline < new Date() && quest.lateSetbacks.length > 0) return 2;
            if (quest.availabilityType === QuestAvailability.Daily) return 4;
            return 5;
        };

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.guildId === currentGuildId);
        const today = new Date();

        const completableQuests = quests.filter(quest => {
            return isQuestVisibleToUserInMode(quest, currentUser.id, appMode) &&
                   isQuestAvailableForUser(quest, userCompletions, today);
        });

        return completableQuests.sort((a, b) => getQuestPriority(a) - getQuestPriority(b));
    }, [quests, currentUser, questCompletions, appMode]);

    const getDueDateString = (quest: Quest): string | null => {
        if (quest.type === QuestType.Venture && quest.lateDateTime) {
            return `Due: ${new Date(quest.lateDateTime).toLocaleDateString()}`;
        }
        if (quest.type === QuestType.Duty && quest.lateTime) {
            return `Due Today at: ${quest.lateTime}`;
        }
        return null;
    };

    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">Adventurer Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card 
                    title={terminology.level} 
                    className="lg:col-span-1"
                    headerAction={
                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => setActivePage('Ranks')}>
                            View All
                        </Button>
                    }
                >
                    <div className="cursor-pointer text-center" onClick={() => setActivePage('Ranks')}>
                        <div className="w-32 h-32 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-6xl border-4 border-accent">
                           {rankData.currentRank.icon}
                        </div>
                        <p className="text-2xl font-bold text-accent-light">{rankData.currentRank.name}</p>
                        <p className="text-stone-400">Level {rankData.currentLevel}</p>
                        <div className="w-full bg-stone-700 rounded-full h-4 mt-4 overflow-hidden">
                            <div className="h-4 rounded-full btn-primary" style={{width: `${rankData.progressPercentage}%`}}></div>
                        </div>
                        <p className="text-sm text-stone-300 mt-2">{rankData.totalXp} / {rankData.nextRank ? rankData.nextRank.xpThreshold : rankData.totalXp} {terminology.xp}</p>
                    </div>
                </Card>
                <Card title={`Recent ${terminology.history}`} className="lg:col-span-2">
                    {recentActivities.length > 0 ? (
                        <ul className="space-y-3">
                            {recentActivities.map(activity => {
                                let text = 'did something';
                                let value = '';
                                if (activity.type === 'Quest') {
                                    text = `Completed "${getQuestTitle(activity.data.questId)}"`;
                                } else if (activity.type === 'Purchase') {
                                    text = `Purchased "${activity.data.assetDetails.name}"`;
                                } else if (activity.type === 'Trophy') {
                                    text = `Earned ${terminology.award}: "${getTrophyName(activity.data.trophyId)}"`;
                                    value = "New Achievement!"
                                }
                                return (
                                <li key={activity.data.id} className="flex justify-between items-center text-stone-300">
                                    <span>{text}</span> 
                                    <span className={`${value.startsWith('+') ? 'text-green-400' : value.startsWith('-') ? 'text-red-400' : 'text-amber-400'} font-semibold`}>{value}</span>
                                </li>
                                )
                            })}
                        </ul>
                    ) : (
                         <p className="text-stone-400">No recent activity. Go complete a {terminology.task.toLowerCase()}!</p>
                    )}
                </Card>

                <Card title="Inventory" className="lg:col-span-1">
                    <div className="grid grid-cols-2 gap-x-6">
                        <div>
                            <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{terminology.currency}</h4>
                            <div className="space-y-2 mt-2">
                                {userCurrencies.length > 0 ? userCurrencies.map(c => 
                                    <div key={c.id} className="flex items-baseline justify-between">
                                        <span className="text-stone-200 flex items-center gap-2">
                                            <span>{c.icon}</span>
                                            <span>{c.name}</span>
                                        </span>
                                        <span className="font-semibold text-accent-light">{c.amount}</span>
                                    </div>
                                ) : <p className="text-stone-400 text-sm italic">None</p>}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{terminology.xp}</h4>
                            <div className="space-y-2 mt-2">
                                {userExperience.length > 0 ? userExperience.map(xp => 
                                    <div key={xp.id} className="flex items-baseline justify-between">
                                        <span className="text-stone-200 flex items-center gap-2">
                                            <span>{xp.icon}</span>
                                            <span>{xp.name}</span>
                                        </span>
                                        <span className="font-semibold text-sky-400">{xp.amount}</span>
                                    </div>
                                ) : <p className="text-stone-400 text-sm italic">None</p>}
                            </div>
                        </div>
                    </div>
                </Card>
                 <Card title={`Top Adventurers (Total ${terminology.xp})`} className="lg:col-span-2">
                    <ol className="space-y-2 text-stone-200">
                        {leaderboard.map((player, index) => (
                             <li key={player.name} className="flex justify-between items-center font-semibold">
                                <span>{index + 1}. {player.name} {player.name === currentUser.gameName && '(You)'}</span>
                                <span>{player.xp} {terminology.xp}</span>
                            </li>
                        ))}
                    </ol>
                </Card>

                <Card 
                    title={`Latest ${terminology.award}`}
                    className="lg:col-span-1"
                    headerAction={
                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => setActivePage('Trophies')}>
                            View All
                        </Button>
                    }
                >
                    <div className="cursor-pointer" onClick={() => setActivePage('Trophies')}>
                        {mostRecentTrophy ? (
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-amber-900/50 rounded-full flex items-center justify-center text-amber-400 text-3xl">{mostRecentTrophy.icon}</div>
                                <p className="mt-2 text-lg font-semibold text-amber-300">{mostRecentTrophy.name}</p>
                                <p className="text-sm text-stone-400">{mostRecentTrophy.description}</p>
                            </div>
                        ) : ( <p className="text-stone-400 text-center">No {terminology.awards.toLowerCase()} earned yet in this mode.</p> )}
                    </div>
                </Card>
                
                <div className="lg:col-span-2">
                     <Card title="Quick Actions">
                        {quickActionQuests.length > 0 ? (
                            <ul className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide pr-2">
                                {quickActionQuests.map(quest => {
                                    const status = getQuestUserStatus(quest, currentUser, questCompletions);
                                    const dueDateString = getDueDateString(quest);
                                    
                                    return (
                                        <li key={quest.id} className="bg-stone-900/40 p-3 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {quest.icon && <span className="text-2xl">{quest.icon}</span>}
                                                <div className="flex-grow overflow-hidden">
                                                    <p className="font-semibold text-stone-100 truncate" title={quest.title}>{quest.title}</p>
                                                    {dueDateString && <p className="text-xs text-stone-400">{dueDateString}</p>}
                                                </div>
                                            </div>
                                            <Button 
                                                variant={status.isActionDisabled ? 'secondary' : 'primary'} 
                                                className="text-sm py-1 px-3 ml-2 flex-shrink-0" 
                                                onClick={() => handleCompleteQuest(quest.id)} 
                                                disabled={status.isActionDisabled}>
                                                    {status.buttonText}
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : ( <p className="text-stone-400">No pressing {terminology.tasks.toLowerCase()} at the moment. Check the main {terminology.tasks} page for more!</p> )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
