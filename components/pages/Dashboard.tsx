


import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useActionsDispatch } from '../../context/ActionsContext';
import { useAuthState } from '../../context/AuthContext';
import { Quest, QuestCompletionStatus, RewardCategory, QuestType, QuestKind } from '../../types';
import Card from '../user-interface/Card';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, questSorter } from '../../utils/quests';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useRewardValue } from '../../hooks/useRewardValue';
import BarChart from '../user-interface/BarChart';
import GuildDashboard from './GuildDashboard';
import ContributeToQuestDialog from '../quests/ContributeToQuestDialog';

const Dashboard: React.FC = () => {
    const { ranks, userTrophies, trophies, settings, scheduledEvents, quests, questCompletions, rewardTypes, purchaseRequests, users, guilds } = useData();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useActionsDispatch();
    const { setActivePage } = useUIDispatch();
    
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [contributingQuest, setContributingQuest] = useState<Quest | null>(null);
    const [chartColor, setChartColor] = useState<string>('hsl(158 84% 39%)');

    const activeThemeId = useMemo(() => {
        let themeId: string | undefined = settings.theme;
        if (appMode.mode === 'guild') {
            const currentGuild = guilds.find(g => g.id === appMode.guildId);
            if (currentGuild?.themeId) {
                themeId = currentGuild.themeId;
            } else if (currentUser?.theme) {
                themeId = currentUser.theme;
            }
        } else {
            if (currentUser?.theme) {
                themeId = currentUser.theme;
            }
        }
        return themeId || 'default'; // fallback key
    }, [settings.theme, currentUser?.theme, appMode, guilds]);

    useEffect(() => {
        // This effect now runs reliably after the component re-mounts with the correct theme styles.
        if (typeof window !== 'undefined') {
            const style = getComputedStyle(document.documentElement);
            const h = style.getPropertyValue('--color-primary-hue').trim();
            const s = style.getPropertyValue('--color-primary-saturation').trim();
            const l = style.getPropertyValue('--color-primary-lightness').trim();
            if (h && s && l) {
                setChartColor(`hsl(${h} ${s} ${l})`);
            }
        }
    }, [activeThemeId]); // Depend on the theme ID.


    if (!currentUser) return <div>Loading adventurer's data...</div>;

    if (appMode.mode === 'guild' && currentUser.role === 'Donegeon Master') {
        // Conditional rendering for a component that might not exist
        return GuildDashboard ? <GuildDashboard /> : <Card title="Guild Dashboard"><p>Loading...</p></Card>;
    }
    
    const { terminology } = settings;

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const handleQuestSelect = (quest: Quest) => {
        setSelectedQuest(quest);
    };

    const handleStartAction = (questToAction: Quest) => {
        setSelectedQuest(null);
        if (questToAction.kind === QuestKind.GuildCollaborative) {
            setContributingQuest(questToAction);
        } else {
            setCompletingQuest(questToAction);
        }
    };

    const handleToggleTodo = (questToToggle: Quest) => {
        if (!currentUser || questToToggle.type !== QuestType.Venture) return;
        const isTodo = questToToggle.todoUserIds?.includes(currentUser.id);
        if (isTodo) {
            unmarkQuestAsTodo(questToToggle.id, currentUser.id);
        } else {
            markQuestAsTodo(questToToggle.id, currentUser.id);
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
        
        type Activity = {
            id: string;
            type: 'Quest' | 'Purchase' | 'Trophy';
            title: string;
            date: string;
            note?: string;
            rewardsText?: string;
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

                    return {
                        id: c.id,
                        type: 'Quest' as const,
                        title: quest?.title || `Unknown ${terminology.task}`,
                        date: c.completedAt,
                        note: c.note ? `"${c.note}"` : undefined,
                        rewardsText: rewardsText || undefined,
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
                        note: trophy?.description,
                        status: 'Awarded!',
                        icon: trophy?.icon || '🏆',
                    };
                })
        ];

        return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [questCompletions, purchaseRequests, userTrophies, quests, trophies, currentUser.id, appMode, terminology, rewardTypes]);

    const leaderboard = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return users
            .map(user => {
                let userTotalXp = 0;
                if (currentGuildId) {
                    userTotalXp = Object.values(user.guildBalances[currentGuildId]?.experience || {}).reduce((sum: number, amount) => sum + (amount as number), 0);
                } else {
                    userTotalXp = Object.values(user.personalExperience).reduce((sum: number, amount) => sum + (amount as number), 0);
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
        if (quest.type === QuestType.Venture && quest.endDateTime) {
            return `Due: ${new Date(quest.endDateTime).toLocaleDateString()}`;
        }
        if (quest.type === QuestType.Duty && quest.startTime) {
            return `Due Today at: ${new Date(`1970-01-01T${quest.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
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
        const userCompletions = questCompletions.filter(
            c => c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && c.guildId == currentGuildId
        );

        userCompletions.forEach(completion => {
            const completionDate = new Date(completion.completedAt);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);

            if (completionDate >= sevenDaysAgo) {
                const quest = quests.find(q => q.id === completion.questId);
                if (!quest) return;
                
                const dateKey = completion.completedAt.split('T')[0];
                const xpForThisQuest = quest.rewards
                    .filter(r => rewardTypes.find(rt => rt.id === r.rewardTypeId)?.category === RewardCategory.XP)
                    .reduce((sum, r) => sum + r.amount, 0);

                if (dateKey in dataByDay) {
                    dataByDay[dateKey] += xpForThisQuest;
                }
            }
        });

        return Object.entries(dataByDay)
            .map(([date, value]) => ({
                label: new Date(date + 'T00:00:00').toLocaleDateString('default', { weekday: 'short' }),
                value
            }));
            
    }, [currentUser.id, appMode, questCompletions, quests, rewardTypes]);


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
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {quickActionQuests.slice(0, 10).map(quest => {
                                    const cardClass = quest.type === QuestType.Duty
                                        ? 'bg-blue-950/70 border-blue-800/80 hover:border-blue-600'
                                        : 'bg-purple-950/70 border-purple-800/80 hover:border-purple-600';
                                    
                                    const isCollaborative = quest.kind === QuestKind.GuildCollaborative;
                                    const progress = isCollaborative ? ((quest.contributions?.length || 0) / (quest.completionGoal || 1)) * 100 : 0;
                                    
                                    return (
                                        <div
                                            key={quest.id}
                                            onClick={() => handleQuestSelect(quest)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors grid grid-cols-1 md:grid-cols-3 gap-2 items-center ${cardClass}`}
                                        >
                                            <div className="md:col-span-1 truncate">
                                                <p className="font-semibold text-stone-100 flex items-center gap-2 truncate" title={quest.title}>
                                                    {quest.icon} {quest.title}
                                                </p>
                                                {isCollaborative && (
                                                    <div className="w-full bg-stone-700 rounded-full h-2.5 mt-2">
                                                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                                                    </div>
                                                )}
                                            </div>
                                             <p className="text-xs text-stone-400 md:col-span-1 md:text-center truncate">{getDueDateString(quest)}</p>

                                            {quest.rewards.length > 0 && (
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold md:col-span-1 md:justify-end">
                                                    {quest.rewards.map(r => {
                                                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                                                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+ {r.amount} <span className="text-base">{icon}</span></span>
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
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {recentActivities.map(activity => (
                                    <div key={activity.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm">
                                        <p className="text-stone-300 truncate md:col-span-1 flex items-center gap-2" title={activity.title}>
                                           <span className="text-xl">{activity.icon}</span>
                                           <span>{activity.title}</span>
                                        </p>
                                        <p className="text-stone-400 italic truncate md:col-span-1 md:text-center" title={activity.note}>
                                            {activity.note}
                                        </p>
                                        <p className={`font-semibold ${statusColorClass(activity.status)} flex-shrink-0 md:col-span-1 md:text-right flex items-center md:justify-end gap-2`}>
                                            {activity.rewardsText && <span className="text-stone-300 font-semibold">{activity.rewardsText}</span>}
                                            <span>{activity.status}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-stone-400 text-sm italic">No recent activity.</p>}
                    </Card>

                    <Card title="Weekly Progress">
                        <div className="h-80">
                           {weeklyProgressData.some(d => d.value > 0) ? (
                                <BarChart key={activeThemeId} data={weeklyProgressData} color={chartColor} />
                            ) : (
                                <p className="text-stone-400 text-center pt-16">No XP earned this week. Time for a quest!</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
             {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartAction(selectedQuest)}
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
            {ContributeToQuestDialog && contributingQuest && (
                <ContributeToQuestDialog
                    quest={contributingQuest}
                    onClose={() => setContributingQuest(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;