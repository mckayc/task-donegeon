import React, { useState, useMemo, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, QuestType, Quest, QuestAvailability } from '../../types';
import { isQuestAvailableForUser, questSorter } from '../../utils/quests';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';

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

const QuestItem: React.FC<{ quest: Quest; now: Date; onSelect: (quest: Quest) => void; }> = ({ quest, now, onSelect }) => {
    const { rewardTypes, currentUser, questCompletions, settings } = useAppState();
    
    if (!currentUser) return null;

    const isAvailable = useMemo(() => isQuestAvailableForUser(quest, questCompletions.filter(c => c.userId === currentUser.id), now), [quest, questCompletions, currentUser.id, now]);
    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(currentUser.id);

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const completionsForThisQuest = useMemo(() => {
        return questCompletions.filter(c => c.questId === quest.id).length;
    }, [questCompletions, quest.id]);
    
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
    
    if (isTodo) {
        borderClass = 'border-purple-500 ring-2 ring-purple-500/50';
    } else if (lateDeadline || incompleteDeadline) {
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

    const absoluteDueDateString = useMemo(() => {
        if (quest.type === QuestType.Venture && quest.lateDateTime) {
            return `Due: ${new Date(quest.lateDateTime).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
        }
        if (quest.type === QuestType.Duty && quest.lateTime) {
            return `Due daily at ${new Date(`1970-01-01T${quest.lateTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
        }
        return null;
    }, [quest]);

    const isDuty = quest.type === QuestType.Duty;
    let baseCardClass = isDuty ? 'bg-sky-900/30' : 'bg-amber-900/30';
    const optionalClass = quest.isOptional ? 'border-dashed' : '';

    return (
        <div onClick={() => onSelect(quest)} className={`border-2 rounded-xl shadow-lg flex flex-col h-full transition-all duration-500 cursor-pointer ${baseCardClass} ${borderClass} ${optionalClass} ${!isAvailable ? 'opacity-50' : ''}`}>
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
                    {absoluteDueDateString && (
                        <p className="text-xs text-stone-400">{absoluteDueDateString}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const FilterButton: React.FC<{ type: 'all' | QuestType, children: React.ReactNode, activeFilter: 'all' | QuestType, setFilter: (filter: 'all' | QuestType) => void }> = ({ type, children, activeFilter, setFilter }) => (
    <button
        onClick={() => setFilter(type)}
        className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${activeFilter === type ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
    >
        {children}
    </button>
);

const QuestsPage: React.FC = () => {
    const [isCreateQuestDialogOpen, setIsCreateQuestDialogOpen] = useState(false);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [filter, setFilter] = useState<'all' | QuestType>('all');
    const { currentUser, quests, questCompletions, appMode, settings } = useAppState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const handleStartCompletion = (quest: Quest) => {
        setSelectedQuest(null);
        setCompletingQuest(quest);
    };

    const handleToggleTodo = (quest: Quest) => {
        if (!currentUser || quest.type !== QuestType.Venture) return;
        const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);

        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(quest.id, currentUser.id);
        } else {
            markQuestAsTodo(quest.id, currentUser.id);
        }
        
        // Update the dialog's state immediately for better UX
        setSelectedQuest(prev => {
            if (!prev) return null;
            const newTodoUserIds = isCurrentlyTodo
                ? (prev.todoUserIds || []).filter(id => id !== currentUser.id)
                : [...(prev.todoUserIds || []), currentUser.id];
            return { ...prev, todoUserIds: newTodoUserIds };
        });
    };

    const availableQuests = useMemo(() => {
        if (!currentUser) return [];
        
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        return quests.filter(quest => 
            quest.isActive &&
            (quest.assignedUserIds.length === 0 || quest.assignedUserIds.includes(currentUser.id)) &&
            quest.guildId === currentGuildId
        );
    }, [currentUser, quests, appMode]);

    const filteredAndSortedQuests = useMemo(() => {
        if(!currentUser) return [];
        const questsToProcess = filter === 'all' ? availableQuests : availableQuests.filter(q => q.type === filter);
        return [...questsToProcess].sort(questSorter(currentUser, questCompletions, now));
    }, [availableQuests, filter, currentUser, now, questCompletions]);
    
    if (!currentUser) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg max-w-sm">
                    <FilterButton type="all" activeFilter={filter} setFilter={setFilter}>All {settings.terminology.tasks}</FilterButton>
                    <FilterButton type={QuestType.Duty} activeFilter={filter} setFilter={setFilter}>{settings.terminology.recurringTasks}</FilterButton>
                    <FilterButton type={QuestType.Venture} activeFilter={filter} setFilter={setFilter}>{settings.terminology.singleTasks}</FilterButton>
                </div>
                <div className="flex items-center gap-4">
                    {currentUser?.role === Role.DonegeonMaster && (
                        <Button onClick={() => setIsCreateQuestDialogOpen(true)}>Create {settings.terminology.task}</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedQuests.length > 0 ? (
                    filteredAndSortedQuests.map(quest => (
                        <QuestItem key={quest.id} quest={quest} onSelect={setSelectedQuest} now={now} />
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
            {selectedQuest && (
                <QuestDetailDialog 
                    quest={selectedQuest} 
                    onClose={() => setSelectedQuest(null)} 
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={() => handleToggleTodo(selectedQuest)}
                    isTodo={!!(currentUser && selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
                />
            )}
        </div>
    );
};

export default QuestsPage;
