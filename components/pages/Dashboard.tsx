import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Quest, QuestAvailability, QuestCompletionStatus, RewardCategory, Role, User, QuestType, PurchaseRequest, UserTrophy } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, fromYMD, getQuestUserStatus, questSorter } from '../../utils/quests';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useRewardValue } from '../../hooks/useRewardValue';
import { useEconomyState } from '../../context/EconomyContext';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';

const Dashboard: React.FC = () => {
    const { ranks, userTrophies, trophies, settings, scheduledEvents } = useAppState();
    const { quests, questCompletions } = useQuestState();
    const { rewardTypes, purchaseRequests } = useEconomyState();
    const { currentUser, users } = useAuthState();
    const { appMode } = useUIState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestDispatch();
    const { setActivePage } = useUIDispatch();
    
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);

    if (!currentUser) return <div>Loading adventurer's data...</div>;
    
    const { terminology } = settings;

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const handleQuestSelect = (quest: Quest) => {
        setSelectedQuest(quest);
    };

    const handleStartCompletion = (questToComplete: Quest) => {
        setSelectedQuest(null);
        setCompletingQuest(questToComplete);
    };

    const handleToggleTodo = (questToComplete: Quest) => {
        if (!currentUser || questToComplete.type !== QuestType.Venture) return;
        const isTodo = questToComplete.todoUserIds?.includes(currentUser.id);
        if (isTodo) {
            unmarkQuestAsTodo(questToComplete.id, currentUser.id);
        } else {
            markQuestAsTodo(questToComplete.id, currentUser.id);
        }
        // Also update the selectedQuest so the dialog reflects the change immediately
        setSelectedQuest(prev => prev ? {...prev, todoUserIds: isTodo ? (prev.todoUserIds || []).filter(id => id !== currentUser.id) : [...(prev.todoUserIds || []), currentUser.id]} : null);
    };

    const currentBalances = useMemo(() => {
        if (appMode.mode === 'personal') {
            return { purse: currentUser.personalPurse, experience: currentUser.personalExperience };
        }
        return currentUser.guildBalances[appMode.guildId] || { purse: {}, experience: {} };
    }, [currentUser, appMode]);

    const rankData = useMemo(() => {
        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        const totalXp = Object.values(currentBalances.experience).reduce((sum, amount) => sum + Number(amount), 0);
        
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
        
        type Activity = {
            id: string;
            type: 'Quest' | 'Purchase' | 'Trophy';
            title: string;
            date: string;
            note?: string;
            status: string;
            icon: string;
        };

        const allActivities: Activity[] = [
            ...questCompletions
                .filter(c => c.userId === currentUser.id && c.guildId == currentGuildId)
                .map(c => {
                    const quest = quests.find(q => q.id === c.questId);
                    let rewardsText = '';
                    if (c.status === QuestCompletionStatus.Approved && quest && quest.rewards.length > 0) {
                        rewardsText = quest.rewards.map(r => `+${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                    }
                    const noteText = c.note ? `"${c.note}"` : '';
                    const combinedNote = [noteText, rewardsText].filter(Boolean).join(' ');

                    return {
                        id: c.id,
                        type: 'Quest' as const,
                        title: quest?.title || `Unknown ${terminology.task}`,
                        date: c.completedAt,
                        note: combinedNote,
                        status: c.status,
                        icon: quest?.icon || '📜',
                    };
                }),
            ...purchaseRequests
                .filter(p => p.userId === currentUser.id && p.guildId == currentGuildId)
                .map(p => ({
                    id: p.id,
                    type: 'Purchase' as const,
                    title: `Purchased "${p.assetDetails.name}"`,
                    date: p.requestedAt,
                    note: p.assetDetails.cost.map(r => `-${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' '),
                    status: p.status,
                    icon: '💰',
                })),
            ...userTrophies
                .filter(ut => ut.userId === currentUser.id && ut.guildId == currentGuildId)
                .map(ut => {
                    const trophy = trophies.find(t => t.id === ut.trophyId);
                    return {
                        id: ut.id,
                        type: 'Trophy' as const,
                        title: `Earned ${terminology.award}: "${trophy?.name || ''}"`,
                        date: ut.awardedAt,
                        note: undefined,
                        status: 'Awarded!',
                        icon: trophy?.icon || '🏆',
                    };
                })
        ];

        return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [questCompletions, purchaseRequests, userTrophies, quests, trophies, currentUser.id, appMode, terminology, rewardTypes]);

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users
            .map(user => {
                let userTotalXp = 0;
                if (currentGuildId) {
                    userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum, amount) => sum + Number(amount), 0);
                } else {
                    userTotalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + Number(amount), 0);
                }
                return { name: user.gameName, xp: userTotalXp };
            })
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 5);
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

        const completableQuests = quests.filter(quest => {
            return isQuestVisibleToUserInMode(quest, currentUser.id, appMode, quests, questCompletions) &&
                   isQuestAvailableForUser(quest, userCompletions, today, scheduledEvents, appMode);
        });
        
        return completableQuests.sort(questSorter(currentUser, userCompletions, scheduledEvents, today));
    }, [quests, currentUser, questCompletions, appMode, scheduledEvents]);

    const getDueDateString = (quest: Quest): string | null => {
        if (quest.type === QuestType.Venture && quest.startDateTime) {
            return `Due: ${new Date(quest.startDateTime).toLocaleDateString()}`;
        }
        if (quest.type === QuestType.Duty && quest.startTime) {
            return `Due Today at: ${quest.startTime}`;
        }
        return null;
    };

    const statusColorClass = (status: string) => {
        switch (status) {
            case "Awarded!":
            case QuestCompletionStatus.Approved:
            case "Completed":
                return 'text-green-400';
            case QuestCompletionStatus.Pending:
                return 'text-yellow-400';
            case QuestCompletionStatus.Rejected:
                return 'text-red-400';
            default:
                return 'text-stone-400';
        }
    };
    
    const CurrencyDisplay: React.FC<{currency: {id: string, name: string, icon?: string, amount: number}}> = ({ currency }) => {
        const realValue = useRewardValue(currency.amount, currency.id);
        const title = `${currency.name}: ${currency.amount}${realValue ? ` (${realValue})` : ''}`;

        return (
            <div title={title} className="flex items-baseline justify-between">
                <span className="text-stone-200 flex items-center gap-2">
                    <span>{currency.icon}</span>
                    <span>{currency.name}</span>
                </span>
                <span className="font-semibold text-accent-light">{currency.amount}</span>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title={terminology.level}>
                        <div className="cursor-pointer text-center" onClick={() => setActivePage('Ranks')}>
                            <div className="w-32 h-32 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-6xl border-4 border-accent">
                               {rankData.currentRank.icon}
                            </div>
                            <p className="text-2xl font-bold text-accent-light">{rankData.currentRank.name}</p>
                            <p className="text-stone-400">Level {rankData.currentLevel}</p>
                            <div className="w-full bg-stone-700 rounded-full h-4 mt-4 overflow-hidden">
                                <div className="h-4 rounded-full bg-primary" style={{width: `${rankData.progressPercentage}%`}}></div>
                            </div>
                            <p className="text-sm text-stone-300 mt-2">{rankData.totalXp} / {rankData.nextRank ? rankData.nextRank.xpThreshold : rankData.totalXp} {terminology.xp}</p>
                        </div>
                    </Card>

                    <Card title="Inventory">
                        <div className="grid grid-cols-2 gap-x-6">
                            <div>
                                <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{terminology.currency}</h4>
                                <div className="space-y-2 mt-2">
                                    {userCurrencies.length > 0 ? userCurrencies.map(c => 
                                        <CurrencyDisplay key={c.id} currency={c} />
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

                    {mostRecentTrophy && (
                        <Card title={`Latest ${terminology.award}`}>
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActivePage('Trophies')}>
                                <div className="text-5xl">{mostRecentTrophy.icon}</div>
                                <div>
                                    <h4 className="font-bold text-lg text-amber-300">{mostRecentTrophy.name}</h4>
                                    <p className="text-stone-400 text-sm">{mostRecentTrophy.description}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card title="Leaderboard">
                         {leaderboard.length > 0 ? (
                            <ul className="space-y-2">
                                {leaderboard.map((player, index) => (
                                    <li key={player.name} className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-stone-200">{index + 1}. {player.name}</span>
                                        <span className="text-sky-400">{player.xp} XP</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-stone-400 text-sm italic">No players to rank.</p>}
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                     <Card title="Quick Actions">
                        {quickActionQuests.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 max-h-[40rem] overflow-y-auto pr-2 scrollbar-hide">
                                {quickActionQuests.map(quest => {
                                    const cardClass = quest.type === QuestType.Duty
                                        ? 'bg-sky-950/50 border-sky-800/60 hover:border-sky-600'
                                        : 'bg-amber-950/50 border-amber-800/60 hover:border-amber-600';
                                    
                                    return (
                                        <div
                                            key={quest.id}
                                            onClick={() => handleQuestSelect(quest)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer flex items-center justify-between transition-colors ${cardClass}`}
                                        >
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-stone-100 flex items-center gap-2 truncate">
                                                    <span className="text-xl">{quest.icon}</span> 
                                                    <span className="truncate">{quest.title}</span>
                                                </p>
                                                <p className="text-xs text-stone-400 mt-1 pl-8">{getDueDateString(quest)}</p>
                                            </div>

                                            {quest.rewards.length > 0 && (
                                                <div className="flex flex-shrink-0 items-center gap-x-3 text-sm font-semibold ml-4">
                                                    {quest.rewards.map(r => {
                                                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                                                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+{r.amount} <span className="text-base">{icon}</span></span>
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-stone-400 text-center">No available quests right now. Great job!</p>
                        )}
                    </Card>
                    
                    <Card title={`Recent ${terminology.history}`}>
                        {recentActivities.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivities.map(activity => (
                                    <li key={activity.id} className="flex items-start gap-3 text-sm">
                                        <span className="text-xl mt-1">{activity.icon}</span>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-stone-300 truncate" title={activity.title}>{activity.title}</p>
                                            {activity.note && <p className="text-xs text-stone-400 italic truncate">{activity.note}</p>}
                                        </div>
                                        <span className={`font-semibold ${statusColorClass(activity.status)} flex-shrink-0`}>{activity.status}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-stone-400 text-sm italic">No recent activity.</p>}
                    </Card>
                </div>
            </div>
             {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={() => handleToggleTodo(selectedQuest)}
                    isTodo={!!(selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog
                    quest={completingQuest}
                    onClose={() => setCompletingQuest(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;