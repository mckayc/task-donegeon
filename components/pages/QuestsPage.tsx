
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, QuestType, Quest, QuestAvailability } from '../../types';
import { isQuestAvailableForUser, isQuestVisibleToUserInMode, getQuestUserStatus } from '../../utils/quests';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';

const getAvailabilityText = (quest: Quest, completionsCount: number): string => {
    switch (quest.availabilityType) {
        case QuestAvailability.Daily:
            return 'Resets Daily';
        case QuestAvailability.Weekly:
            const days = quest.weeklyRecurrenceDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
            return `Resets on ${days}`;
        case QuestAvailability.Monthly:
            return `Resets on date(s) ${quest.monthlyRecurrenceDays.join(', ')}`;
        case QuestAvailability.Frequency: {
            return `${completionsCount} / ${quest.availabilityCount} completed`;
        }
        case QuestAvailability.Unlimited:
            return 'One-time Venture';
        default:
            return '';
    }
};

const formatTimeRemaining = (targetDate: Date, now: Date): string => {
    let diffMs = targetDate.getTime() - now.getTime();

    if (diffMs <= 0) return '0m';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diffMs / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const QuestItem: React.FC<{ quest: Quest; onCompleteWithNote: (quest: Quest) => void; now: Date; }> = ({ quest, onCompleteWithNote, now }) => {
    const { rewardTypes, currentUser, questCompletions, settings } = useAppState();
    const { claimQuest, releaseQuest, completeQuest, dismissQuest } = useAppDispatch();
    
    if (!currentUser) return null;

    const status = getQuestUserStatus(quest, currentUser, questCompletions);
    
    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const completionsForThisQuest = useMemo(() => {
        return questCompletions.filter(c => c.questId === quest.id).length;
    }, [questCompletions, quest.id]);
    
    const handleSimpleComplete = () => {
        if (!currentUser) return;
        completeQuest(quest.id, currentUser.id, quest.rewards, quest.requiresApproval, quest.guildId);
    };

    let lateDeadline: Date | null = null;
    let incompleteDeadline: Date | null = null;
    let borderClass = 'border-stone-700';
    let timeStatusText = '';
    let timeStatusColor = 'text-green-400';

    if (quest.type === QuestType.Venture) {
        lateDeadline = quest.lateDateTime ? new Date(quest.lateDateTime) : null;
        incompleteDeadline = quest.incompleteDateTime ? new Date(quest.incompleteDateTime) : null;
    } else if (quest.type === QuestType.Duty) {
        if (quest.lateTime) {
            const [hours, minutes] = quest.lateTime.split(':').map(Number);
            lateDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        }
        if (quest.incompleteTime) {
            const [hours, minutes] = quest.incompleteTime.split(':').map(Number);
            incompleteDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        }
    }

    const isLate = lateDeadline ? now > lateDeadline : false;
    const isIncomplete = incompleteDeadline ? now > incompleteDeadline : false;
    
    if (lateDeadline || incompleteDeadline) {
      borderClass = isIncomplete ? 'border-red-600' : isLate ? 'border-yellow-600' : 'border-green-600';
    }
    
    if (isIncomplete) {
        timeStatusText = 'Incomplete';
        timeStatusColor = 'text-red-400';
    } else if (isLate) {
        if (incompleteDeadline && incompleteDeadline > now) {
            timeStatusText = `Incomplete in: ${formatTimeRemaining(incompleteDeadline, now)}`;
            timeStatusColor = 'text-yellow-400';
        } else {
            timeStatusText = 'Late';
            timeStatusColor = 'text-yellow-400';
        }
    } else if (lateDeadline && lateDeadline > now) {
        timeStatusText = `Late in: ${formatTimeRemaining(lateDeadline, now)}`;
    }


    const renderButtons = () => {
        if (isIncomplete) {
            return <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => dismissQuest(quest.id, currentUser.id)}>Dismiss</Button>;
        }
        switch (status.status) {
            case 'CLAIMABLE':
                return <Button variant="primary" className="text-sm py-1 px-3 !bg-sky-600 hover:!bg-sky-500" onClick={() => claimQuest(quest.id, currentUser.id)}>{status.buttonText}</Button>;
            case 'RELEASEABLE':
                return <>
                    <Button variant="secondary" className="text-sm py-1 px-3 !bg-orange-800/60 hover:!bg-orange-700/70 text-orange-200" onClick={() => releaseQuest(quest.id, currentUser.id)}>Release</Button>
                    <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => onCompleteWithNote(quest)}>With Note</Button>
                    <Button variant="primary" className="text-sm py-1 px-3" onClick={handleSimpleComplete}>{status.buttonText}</Button>
                </>;
            case 'PENDING':
            case 'COMPLETED':
            case 'FULLY_CLAIMED':
                 return <Button variant="secondary" className="text-sm py-1 px-3" disabled>{status.buttonText}</Button>;
            default: // AVAILABLE
                return <>
                    <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => onCompleteWithNote(quest)} disabled={status.isActionDisabled}>With Note</Button>
                    <Button variant="primary" className="text-sm py-1 px-3" onClick={handleSimpleComplete} disabled={status.isActionDisabled}>Complete</Button>
                </>;
        }
    };

    const isDuty = quest.type === QuestType.Duty;
    
    let baseCardClass = isDuty ? 'bg-sky-900/30' : 'bg-amber-900/30';

    return (
        <div className={`border-2 rounded-xl shadow-lg flex flex-col h-full transition-colors duration-500 ${baseCardClass} ${borderClass}`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-3xl ${isDuty ? 'bg-sky-900/70' : 'bg-amber-900/70'}`}>
                    {quest.icon || '📝'}
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-lg text-stone-100 flex items-center gap-2 flex-wrap">
                        <span>{quest.title}</span>
                        {quest.isOptional && <span className="font-normal text-xs px-2 py-0.5 rounded-md bg-stone-700 text-stone-400 border border-stone-600">Optional</span>}
                    </h4>
                    <p className="text-xs text-stone-400 mt-1">{getAvailabilityText(quest, completionsForThisQuest)}</p>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-grow">
                <p className="text-stone-300 text-sm mb-4">{quest.description}</p>
                
                {quest.rewards.length > 0 && (
                    <div className="pt-4 border-t border-white/10 space-y-2">
                        <div>
                            <p className="text-xs font-semibold text-accent/80 uppercase tracking-wider">{settings.terminology.points}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                                {quest.rewards.map(r => {
                                    const { name, icon } = getRewardInfo(r.rewardTypeId);
                                    return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+ {r.amount} <span className="text-base">{icon}</span></span>
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 mt-auto bg-black/20 border-t border-white/10 flex items-center justify-between gap-2">
                <div>
                    {timeStatusText && (
                        <p className={`text-xs font-semibold ${timeStatusColor}`}>{timeStatusText}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    {renderButtons()}
                </div>
            </div>
        </div>
    );
};

const QuestsPage: React.FC = () => {
    const [isCreateQuestDialogOpen, setIsCreateQuestDialogOpen] = useState(false);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [filter, setFilter] = useState<'all' | QuestType>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'title' | 'dueDate'>('priority');
    const { currentUser, quests, questCompletions, appMode, settings } = useAppState();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const availableQuests = useMemo(() => {
        if (!currentUser) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.guildId === currentGuildId);

        return quests.filter(quest => 
            isQuestVisibleToUserInMode(quest, currentUser.id, appMode) && 
            isQuestAvailableForUser(quest, userCompletions, now)
        );
    }, [currentUser, quests, questCompletions, appMode, now]);

    const filteredAndSortedQuests = useMemo(() => {
        const questsToProcess = filter === 'all' ? availableQuests : availableQuests.filter(q => q.type === filter);
        
        const getQuestSortScore = (quest: Quest): { priority: number; dueDate: number; title: string; } => {
            let lateDeadline: Date | null = null;
            let incompleteDeadline: Date | null = null;

            if (quest.type === QuestType.Venture) {
                lateDeadline = quest.lateDateTime ? new Date(quest.lateDateTime) : null;
                incompleteDeadline = quest.incompleteDateTime ? new Date(quest.incompleteDateTime) : null;
            } else if (quest.type === QuestType.Duty) {
                if (quest.lateTime) {
                    const [hours, minutes] = quest.lateTime.split(':').map(Number);
                    lateDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                }
                if (quest.incompleteTime) {
                    const [hours, minutes] = quest.incompleteTime.split(':').map(Number);
                    incompleteDeadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                }
            }
            
            // Check for dismissal first.
            if (currentUser && quest.dismissals) {
              const myDismissal = quest.dismissals.find(d => d.userId === currentUser.id);
              if (myDismissal) {
                  const dismissedTime = new Date(myDismissal.dismissedAt).getTime();
                  const thirtyMinutesAgo = now.getTime() - 30 * 60 * 1000;
                  if (dismissedTime < thirtyMinutesAgo) {
                      return {
                          priority: 1000, // Long-dismissed quests go to the bottom.
                          dueDate: lateDeadline?.getTime() ?? Infinity,
                          title: quest.title
                      };
                  }
              }
            }
            
            const isOverdue = lateDeadline && lateDeadline < now;
            const isIncomplete = incompleteDeadline && incompleteDeadline < now;

            if (isIncomplete) {
                return {
                    priority: 50, // Incomplete quests are very low priority.
                    dueDate: lateDeadline?.getTime() ?? Infinity,
                    title: quest.title
                };
            }
            
            let priority = 5; // Base priority

            if (isOverdue && quest.lateSetbacks.length > 0) priority = 1;
            else if (isOverdue) priority = 2;
            else if (lateDeadline) priority = 3;
            else if (quest.type === QuestType.Duty) priority = 4;

            if (quest.isOptional) priority += 10;
        
            return {
                priority,
                dueDate: lateDeadline?.getTime() ?? Infinity,
                title: quest.title
            };
        };
        
        return [...questsToProcess].sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === 'dueDate') {
                const dateA = a.lateDateTime ? new Date(a.lateDateTime).getTime() : (a.lateTime ? -1 : Infinity);
                const dateB = b.lateDateTime ? new Date(b.lateDateTime).getTime() : (b.lateTime ? -1 : Infinity);
                if(dateA === -1 && dateB !== -1) return -1;
                if(dateB === -1 && dateA !== -1) return 1;

                if (dateA !== dateB) return dateA - dateB;
                return a.title.localeCompare(b.title);
            }
            // Default to priority sort
            const scoreA = getQuestSortScore(a);
            const scoreB = getQuestSortScore(b);
            if (scoreA.priority !== scoreB.priority) return scoreA.priority - scoreB.priority;
            if (scoreA.dueDate !== scoreB.dueDate) return scoreA.dueDate - scoreB.dueDate;
            return scoreA.title.localeCompare(b.title);
        });
    }, [availableQuests, filter, sortBy, currentUser, now]);
    
    if (!currentUser) return null;

    const FilterButton: React.FC<{ type: 'all' | QuestType, children: React.ReactNode }> = ({ type, children }) => (
        <button
            onClick={() => setFilter(type)}
            className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${filter === type ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-4xl font-medieval text-stone-100">The {settings.terminology.task} Board</h1>
                {currentUser?.role === Role.DonegeonMaster && (
                    <Button onClick={() => setIsCreateQuestDialogOpen(true)}>Create {settings.terminology.task}</Button>
                )}
            </div>
            
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg max-w-sm">
                    <FilterButton type="all">All {settings.terminology.tasks}</FilterButton>
                    <FilterButton type={QuestType.Duty}>{settings.terminology.recurringTasks}</FilterButton>
                    <FilterButton type={QuestType.Venture}>{settings.terminology.singleTasks}</FilterButton>
                </div>
                <div>
                    <label htmlFor="sort-quests" className="text-sm font-medium text-stone-400 mr-2">Sort by:</label>
                    <select
                        id="sort-quests"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'priority' | 'title' | 'dueDate')}
                        className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                    >
                        <option value="priority">Priority</option>
                        <option value="title">Title</option>
                        <option value="dueDate">Due Date</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedQuests.length > 0 ? (
                    filteredAndSortedQuests.map(quest => (
                        <QuestItem key={quest.id} quest={quest} onCompleteWithNote={setCompletingQuest} now={now} />
                    ))
                ) : (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <p className="text-stone-400 text-center py-8">
                            No {settings.terminology.tasks.toLowerCase()} match the current filter. Adventure awaits elsewhere!
                        </p>
                    </Card>
                )}
            </div>

            {isCreateQuestDialogOpen && <CreateQuestDialog onClose={() => setIsCreateQuestDialogOpen(false)} />}
            {completingQuest && <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />}
        </div>
    );
};

export default QuestsPage;
