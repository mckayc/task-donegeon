import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestAvailability, QuestCompletionStatus, RewardCategory, Role, User, QuestType, PurchaseRequest, UserTrophy, Rank } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, fromYMD, getQuestUserStatus, questSorter } from '../../utils/quests';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useRewardValue } from '../../hooks/useRewardValue';

const Dashboard: React.FC = () => {
    const { currentUser, quests, rewardTypes, users, ranks, userTrophies, trophies, questCompletions, purchaseRequests, appMode, settings, scheduledEvents } = useAppState();
    const { completeQuest, setActivePage, markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);

    if (!currentUser) return <div>Loading adventurer's data...</div>;
    
    const { terminology } = settings;

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
            return { purse: currentUser.personalPurse || {}, experience: currentUser.personalExperience || {} };
        }
        return currentUser.guildBalances?.[appMode.guildId] || { purse: {}, experience: {} };
    }, [currentUser, appMode]);

    const rankData = useMemo(() => {
        const totalXp = (Object.values(currentBalances.experience) as number[]).reduce((sum, amount) => sum + amount, 0);

        if (!ranks || ranks.length === 0) {
            return { totalXp, currentRank: null, nextRank: null, progressPercentage: 0, currentLevel: 0 };
        }

        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        let currentRank: Rank | null = null;
        let nextRank: Rank | null = null;

        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                currentRank = sortedRanks[i];
                nextRank = sortedRanks[i + 1] || null;
                break;
            }
        }

        if (!currentRank && sortedRanks.length > 0) {
            currentRank = sortedRanks[0];
            nextRank = sortedRanks[1] || null;
        }
        
        const xpForNextRank = nextRank ? nextRank.xpThreshold - (currentRank?.xpThreshold || 0) : 0;
        const xpIntoCurrentRank = totalXp - (currentRank?.xpThreshold || 0);
        const progressPercentage = nextRank && xpForNextRank > 0 ? Math.min(100, (xpIntoCurrentRank / xpForNextRank) * 100) : 100;
        const currentLevel = currentRank ? sortedRanks.findIndex(r => r.id === currentRank!.id) + 1 : 1;
        
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
            icon?: string;
        };

        const getRewardInfo = (id: string) => {
            const rewardDef = rewardTypes.find(rt => rt.id === id);
            return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
        };

        const allActivities: Activity[] = [
            ...questCompletions
                .filter(c => c.userId === currentUser.id && c.guildId === currentGuildId)
                .map(c => {
                    const quest = quests.find(q => q.id === c.questId);
                    let rewardsNote = c.note || '';
                    if (c.status === QuestCompletionStatus.Approved && quest && quest.rewards.length > 0) {
                        const rewardsText = quest.rewards.map(r => `+${r.amount} ${getRewardInfo(r.rewardTypeId).icon}`).join(' ');
                        rewardsNote = rewardsNote ? `${rewardsNote} (${rewardsText})` : rewardsText;
                    }
                    return {
                        id: c.id, type: 'Quest' as const, title: quest?.title || `Unknown ${terminology.task}`,
                        date: c.completedAt, note: rewardsNote, status: c.status, icon: quest?.icon,
                    };
                }),
            ...purchaseRequests
                .filter(p => p.userId === currentUser.id && p.guildId === currentGuildId)
                .map(p => ({
                    id: p.id, type: 'Purchase' as const, title: `Purchased "${p.assetDetails.name}"`,
                    date: p.requestedAt, note: undefined, status: p.status, icon: '🛒',
                })),
            ...userTrophies
                .filter(ut => ut.userId === currentUser.id && ut.guildId === currentGuildId)
                .map(ut => {
                    const trophy = trophies.find(t => t.id === ut.trophyId);
                    return {
                        id: ut.id, type: 'Trophy' as const, title: `Earned ${terminology.award}: "${trophy?.name || ''}"`,
                        date: ut.awardedAt, note: undefined, status: 'Awarded!', icon: trophy?.icon,
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
                    userTotalXp = (Object.values(user.guildBalances?.[currentGuildId]?.experience || {}) as number[]).reduce((sum, amount) => sum + amount, 0);
                } else {
                    userTotalXp = (Object.values(user.personalExperience || {}) as number[]).reduce((sum, amount) => sum + amount, 0);
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
        const today = new Date();
        const completableQuests = quests.filter(quest => {
            return isQuestVisibleToUserInMode(quest, currentUser.id, appMode) &&
                   isQuestAvailableForUser(quest, questCompletions, today, scheduledEvents, appMode);
        });

        return completableQuests.sort(questSorter(currentUser, questCompletions, scheduledEvents, today));
    }, [quests, currentUser, questCompletions, appMode, scheduledEvents]);

    const getDueDateString = (quest: Quest): string | null => {
        if (quest.type === QuestType.Venture && quest.lateDateTime) {
            return `Due: ${new Date(quest.lateDateTime).toLocaleDateString()}`;
        }
        if (quest.type === QuestType.Duty && quest.lateTime) {
            return `Due Today at: ${quest.lateTime}`;
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
                return 'text-muted-foreground';
        }
    };
    
    const CurrencyDisplay: React.FC<{currency: {id: string, name: string, icon?: string, amount: number}}> = ({ currency }) => {
        const realValue = useRewardValue(currency.amount, currency.id);
        const title = `${currency.name}: ${currency.amount}${realValue ? ` (${realValue})` : ''}`;

        return (
            <div title={title} className="flex items-baseline justify-between">
                <span className="text-foreground flex items-center gap-2">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="capitalize">{terminology.level}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {rankData.currentRank ? (
                                <div className="cursor-pointer text-center" onClick={() => setActivePage('Ranks')}>
                                    <div className="w-32 h-32 mx-auto mb-4 bg-card rounded-full flex items-center justify-center text-6xl border-4 border-accent">
                                    {rankData.currentRank.icon}
                                    </div>
                                    <p className="text-2xl font-bold text-accent-light">{rankData.currentRank.name}</p>
                                    <p className="text-muted-foreground">Level {rankData.currentLevel}</p>
                                    <div className="w-full bg-background rounded-full h-4 mt-4 overflow-hidden">
                                        <div className="h-4 rounded-full bg-primary" style={{width: `${rankData.progressPercentage}%`}}></div>
                                    </div>
                                    <p className="text-sm text-foreground mt-2">
                                        {rankData.nextRank 
                                            ? `${rankData.totalXp} / ${rankData.nextRank.xpThreshold} ${terminology.xp}` 
                                            : `You have reached the highest rank! (${rankData.totalXp} ${terminology.xp})`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <p>No ranks configured.</p>
                                    <p className="text-sm">Total XP: {rankData.totalXp}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-6">
                                <div>
                                    <h4 className="font-bold text-lg text-foreground mb-2 border-b border-border pb-1 capitalize">{terminology.currency}</h4>
                                    <div className="space-y-2 mt-2">
                                        {userCurrencies.length > 0 ? userCurrencies.map(c => 
                                            <CurrencyDisplay key={c.id} currency={c} />
                                        ) : <p className="text-muted-foreground text-sm italic">None</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-foreground mb-2 border-b border-border pb-1 capitalize">{terminology.xp}</h4>
                                    <div className="space-y-2 mt-2">
                                        {userExperience.length > 0 ? userExperience.map(xp => 
                                            <div key={xp.id} className="flex items-baseline justify-between">
                                                <span className="text-foreground flex items-center gap-2">
                                                    <span>{xp.icon}</span>
                                                    <span>{xp.name}</span>
                                                </span>
                                                <span className="font-semibold text-sky-400">{xp.amount}</span>
                                            </div>
                                        ) : <p className="text-muted-foreground text-sm italic">None</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                        <CardContent>
                            {quickActionQuests.length > 0 ? (
                                <ul className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide pr-2">
                                    {quickActionQuests.map(quest => {
                                        const status = getQuestUserStatus(quest, currentUser, questCompletions);
                                        const dueDateString = getDueDateString(quest);
                                        const isDisabled = status.isActionDisabled || status.status === 'COMPLETED' || status.status === 'PENDING';
                                        const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(currentUser.id);

                                        let bgClass = quest.type === QuestType.Duty ? 'bg-sky-900/50 hover:bg-sky-800/60' : 'bg-amber-900/40 hover:bg-amber-800/50';
                                        let borderClass = 'border-transparent';

                                        if(isTodo) {
                                            borderClass = 'border-purple-500';
                                        }

                                        return (
                                            <li key={quest.id}>
                                                <Button
                                                    onClick={() => handleQuestSelect(quest)}
                                                    disabled={isDisabled}
                                                    variant="ghost"
                                                    className={`w-full text-left p-3 h-auto rounded-lg flex justify-between items-center transition-colors border-2 ${bgClass} ${borderClass} ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {quest.icon && <span className="text-2xl">{quest.icon}</span>}
                                                        <div className="flex-grow overflow-hidden">
                                                            <p className="font-semibold text-foreground truncate flex items-center gap-2" title={quest.title}>
                                                                <span>{quest.title}</span>
                                                                {quest.isOptional && <span className="font-normal text-xs px-2 py-0.5 rounded-full bg-card text-muted-foreground border">Optional</span>}
                                                            </p>
                                                            {dueDateString && <p className="text-xs text-muted-foreground">{dueDateString}</p>}
                                                        </div>
                                                    </div>
                                                </Button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : ( <p className="text-muted-foreground">{`No pressing ${terminology.tasks.toLowerCase()} at the moment. Check the main ${terminology.link_quests} page for more!`}</p> )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Recent {terminology.history}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                {recentActivities.length > 0 ? (
                                    <ul className="space-y-3">
                                        {recentActivities.map(activity => (
                                            <li key={activity.id} className="flex items-start gap-4 p-3 bg-card rounded-lg">
                                                <div className="text-xl mt-0.5">{activity.icon}</div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-foreground">{activity.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(activity.date).toLocaleString()}</p>
                                                    {activity.note && (
                                                        <div className="w-full text-sm text-muted-foreground italic mt-1" title={activity.note}>
                                                            "{activity.note}"
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`w-1/5 text-right font-semibold ${statusColorClass(activity.status)}`}>
                                                    {activity.status}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground">{`No recent activity. Go complete a ${terminology.task.toLowerCase()}!`}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 
                {/* Full-width bottom row */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Latest {terminology.award}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="cursor-pointer" onClick={() => setActivePage('Trophies')}>
                                    {mostRecentTrophy ? (
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto bg-amber-900/50 rounded-full flex items-center justify-center text-amber-400 text-3xl">{mostRecentTrophy.icon}</div>
                                            <p className="mt-2 text-lg font-semibold text-amber-300">{mostRecentTrophy.name}</p>
                                            <p className="text-sm text-muted-foreground">{mostRecentTrophy.description}</p>
                                        </div>
                                    ) : ( <p className="text-muted-foreground text-center">{`No ${terminology.awards.toLowerCase()} earned yet in this mode.`}</p> )}
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="md:col-span-2">
                            <CardHeader><CardTitle>Top Adventurers (Total {terminology.xp})</CardTitle></CardHeader>
                            <CardContent>
                                <ol className="space-y-2 text-foreground">
                                    {leaderboard.map((player, index) => (
                                        <li key={player.name} className="flex justify-between items-center font-semibold">
                                            <span>{index + 1}. {player.name} {player.name === currentUser.gameName && '(You)'}</span>
                                            <span>{player.xp} {terminology.xp}</span>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={() => handleToggleTodo(selectedQuest)}
                    isTodo={!!(currentUser && selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
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