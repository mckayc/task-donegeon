

import React, { useState, useMemo, useEffect } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { Role, QuestType, Quest, QuestKind, QuestCompletionStatus } from '../../types';
// FIX: Imported the missing 'toYMD' utility function.
import { isQuestAvailableForUser, questSorter, isQuestVisibleToUserInMode, getAvailabilityText, formatTimeRemaining, toYMD } from '../../utils/quests';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';

const QuestItem: React.FC<{ quest: Quest; now: Date; onSelect: (quest: Quest) => void; onImagePreview: (url: string) => void; }> = ({ quest, now, onSelect, onImagePreview }) => {
    const { settings, scheduledEvents } = useSystemState();
    const { guilds } = useCommunityState();
    const { rewardTypes } = useEconomyState();
    const { questGroups, questCompletions } = useQuestsState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    
    if (!currentUser) return null;

    const isAvailable = useMemo(() => isQuestAvailableForUser(quest, questCompletions.filter(c => c.userId === currentUser.id), now, scheduledEvents, appMode), [quest, questCompletions, currentUser.id, now, scheduledEvents, appMode]);
    const questGroup = useMemo(() => quest.groupId ? questGroups.find(g => g.id === quest.groupId) : null, [quest.groupId, questGroups]);
    const scopeName = useMemo(() => quest.guildId ? guilds.find(g => g.id === quest.guildId)?.name || 'Guild Scope' : 'Personal', [quest.guildId, guilds]);

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const completionsForThisQuest = useMemo(() => {
        return questCompletions.filter(c => c.questId === quest.id).length;
    }, [questCompletions, quest.id]);
    
    const { borderClass, timeStatusText, timeStatusColor, isDimmed } = useMemo(() => {
        let deadline: Date | null = null;
        let incompleteDeadline: Date | null = null;

        if (quest.type === QuestType.Duty) {
            if (quest.startTime) {
                const [h, m] = quest.startTime.split(':').map(Number);
                deadline = new Date(now);
                deadline.setHours(h, m, 0, 0);
            }
            if (quest.endTime) {
                const [h, m] = quest.endTime.split(':').map(Number);
                incompleteDeadline = new Date(now);
                incompleteDeadline.setHours(h, m, 0, 0);
            }
        } else if (quest.type === QuestType.Venture || quest.type === QuestType.Journey) {
            if (quest.endDateTime) {
                deadline = new Date(quest.endDateTime);
            }
        }

        const isIncomplete = incompleteDeadline && now > incompleteDeadline;
        if (isIncomplete) {
            return { borderClass: 'border-black', timeStatusText: 'Incomplete', timeStatusColor: 'text-stone-400', isDimmed: true };
        }

        const isPastDue = deadline && now > deadline;
        const timeDiff = deadline ? deadline.getTime() - now.getTime() : Infinity;

        let bClass = 'border-stone-700';
        let tStatusText = '';
        let tStatusColor = 'text-green-400';

        if (deadline) {
            if (isPastDue) {
                bClass = 'border-red-600 animate-pulse';
                tStatusText = 'Past Due';
                tStatusColor = 'text-red-400';
            } else if (timeDiff < 60 * 60 * 1000) { // Under 1 hour
                bClass = 'border-orange-500 animate-pulse';
                tStatusText = `Due in: ${formatTimeRemaining(deadline, now)}`;
                tStatusColor = 'text-orange-400';
            } else if (timeDiff < 2 * 60 * 60 * 1000) { // Under 2 hours
                bClass = 'border-yellow-500';
                tStatusText = `Due in: ${formatTimeRemaining(deadline, now)}`;
                tStatusColor = 'text-yellow-400';
            } else {
                bClass = 'border-green-600';
                tStatusText = `Due in: ${formatTimeRemaining(deadline, now)}`;
                tStatusColor = 'text-green-400';
            }
        }
        
        const completionsForUserToday = questCompletions.filter(c => 
            c.questId === quest.id && 
            c.userId === currentUser.id && 
            toYMD(new Date(c.completedAt)) === toYMD(now)
        );

        const isCompletedToday = completionsForUserToday.length > 0;
        const finalDimState = isCompletedToday || !isAvailable;

        return { borderClass: bClass, timeStatusText: tStatusText, timeStatusColor: tStatusColor, isDimmed: finalDimState };

    }, [quest, now, questCompletions, currentUser.id, isAvailable]);
    
    const absoluteDueDateString = useMemo(() => {
        if (quest.type === QuestType.Venture && quest.endDateTime) {
            return `Due: ${new Date(quest.endDateTime).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
        }
        if (quest.type === QuestType.Duty && quest.startTime) {
            return `Due daily at ${new Date(`1970-01-01T${quest.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
        }
        return null;
    }, [quest]);

    let baseCardClass = 'bg-stone-800/60';
    if (quest.type === QuestType.Duty) baseCardClass = 'bg-sky-900/30';
    if (quest.type === QuestType.Venture) baseCardClass = 'bg-amber-900/30';
    if (quest.type === QuestType.Journey) baseCardClass = 'bg-purple-900/30';
    if (quest.kind === QuestKind.Redemption) baseCardClass = 'bg-slate-800/50';

    const optionalClass = quest.isOptional ? 'border-dashed' : '';
    
    const { progressHeader, progressPercent, hasPendingCompletion } = useMemo(() => {
        if (quest.type !== QuestType.Journey || !quest.checkpoints || quest.checkpoints.length === 0) {
            return { progressHeader: null, progressPercent: 0, hasPendingCompletion: false };
        }
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.questId === quest.id);
        const completed = userCompletions.filter(c => c.status === QuestCompletionStatus.Approved).length;
        const pending = userCompletions.some(c => c.status === QuestCompletionStatus.Pending);
        const total = quest.checkpoints.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;
        
        let header = `Checkpoint ${completed + 1} / ${total}`;
        if(pending) header = `Awaiting Approval (${completed}/${total})`;

        return {
            progressHeader: header,
            progressPercent: percent,
            hasPendingCompletion: pending
        };
    }, [quest, currentUser.id, questCompletions]);

    const isClickable = quest.type === QuestType.Journey || isAvailable;
    const cardIsDimmed = isDimmed && !hasPendingCompletion;


    return (
        <div onClick={() => isClickable && onSelect(quest)} className={`border-2 rounded-xl shadow-lg flex flex-col h-full transition-all duration-500 ${baseCardClass} ${borderClass} ${optionalClass} ${cardIsDimmed ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-3xl overflow-hidden bg-black/30`}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (quest.iconType === 'image' && quest.imageUrl) {
                                onImagePreview(quest.imageUrl);
                            }
                        }}
                        disabled={quest.iconType !== 'image' || !quest.imageUrl}
                        className="w-full h-full disabled:cursor-default"
                    >
                        <DynamicIcon iconType={quest.iconType} icon={quest.icon} imageUrl={quest.imageUrl} className="w-full h-full text-3xl" altText={`${quest.title} icon`} />
                    </button>
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-lg text-stone-100 flex items-center gap-2 flex-wrap">
                        {quest.kind === QuestKind.Redemption && <span title="Redemption Quest">⚖️</span>}
                        <span>{quest.title}</span>
                        {quest.isOptional && <span className="font-normal text-xs px-2 py-0.5 rounded-md bg-stone-700 text-stone-400 border border-stone-600">Optional</span>}
                    </h4>
                     <p className="text-xs text-stone-400 mt-1">{progressHeader || getAvailabilityText(quest, completionsForThisQuest)}</p>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-grow">
                {quest.type === QuestType.Journey && progressPercent > 0 && (
                    <div className="w-full bg-stone-700 rounded-full h-2.5 mb-4">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${progressPercent}%`}}></div>
                    </div>
                )}
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
                <div className="flex items-center gap-2 text-xs text-stone-400 overflow-hidden">
                    <span title={questGroup ? questGroup.name : 'Uncategorized'}>{questGroup ? questGroup.icon : '📂'}</span>
                    <span className="truncate">{questGroup ? questGroup.name : 'Uncategorized'}</span>
                    <span className="font-semibold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full text-xs" title={`This quest exists in the ${scopeName} scope.`}>{scopeName}</span>
                </div>
                <div className="text-right">
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
        data-log-id={`quests-page-filter-${type.toLowerCase().replace(' ', '-')}`}
        className={`flex-1 text-center py-1.5 px-3 rounded-md font-semibold text-sm transition-colors ${activeFilter === type ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
    >
        {children}
    </button>
);

const QuestsPage: React.FC = () => {
    const { settings, scheduledEvents } = useSystemState();
    const { quests, questCompletions } = useQuestsState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();
    const [filter, setFilter] = useState<'all' | QuestType>('all');
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [now, setNow] = useState(new Date());
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Safely syncs the dialog's quest data with the main quests list from the provider.
    useEffect(() => {
        if (selectedQuest) {
            const updatedQuestInList = quests.find(q => q.id === selectedQuest.id);
            if (updatedQuestInList && JSON.stringify(updatedQuestInList) !== JSON.stringify(selectedQuest)) {
                setSelectedQuest(updatedQuestInList);
            }
        }
    }, [quests, selectedQuest]);

    if (!currentUser) return null;

    const handleToggleTodo = (quest: Quest) => {
        if (!currentUser || quest.type !== QuestType.Venture) return;
        const isTodo = quest.todoUserIds?.includes(currentUser.id);
        if (isTodo) {
            unmarkQuestAsTodo(quest.id, currentUser.id);
        } else {
            markQuestAsTodo(quest.id, currentUser.id);
        }
    };

    const handleStartCompletion = (quest: Quest) => {
        setCompletingQuest(quest);
        setSelectedQuest(null);
    };

    const sortedQuests = useMemo(() => {
        const today = now;
        const visibleQuests = quests.filter(quest => isQuestVisibleToUserInMode(quest, currentUser.id, appMode));
        const uniqueQuests = Array.from(new Map(visibleQuests.map(q => [q.id, q])).values());
        return uniqueQuests.sort(questSorter(currentUser, questCompletions, scheduledEvents, today));
    }, [quests, currentUser, appMode, questCompletions, now, scheduledEvents]);
    
    const filteredSortedQuests = useMemo(() => {
        if (filter === 'all') return sortedQuests;
        return sortedQuests.filter(q => q.type === filter);
    }, [sortedQuests, filter]);

    return (
        <div className="space-y-6">
            <div className="max-w-md mx-auto p-1 bg-stone-900/50 rounded-lg border border-stone-700/60 flex gap-1">
                <FilterButton type="all" activeFilter={filter} setFilter={setFilter}>All Quests</FilterButton>
                <FilterButton type={QuestType.Duty} activeFilter={filter} setFilter={setFilter}>{settings.terminology.recurringTasks}</FilterButton>
                <FilterButton type={QuestType.Venture} activeFilter={filter} setFilter={setFilter}>{settings.terminology.singleTasks}</FilterButton>
                <FilterButton type={QuestType.Journey} activeFilter={filter} setFilter={setFilter}>{settings.terminology.journeys}</FilterButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSortedQuests.map(quest => (
                    <QuestItem 
                        key={quest.id} 
                        quest={quest} 
                        now={now} 
                        onSelect={setSelectedQuest} 
                        onImagePreview={setPreviewImageUrl}
                    />
                ))}
            </div>

            {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={() => handleToggleTodo(selectedQuest)}
                    isTodo={!!(currentUser && selectedQuest.type === QuestType.Venture && (selectedQuest.todoUserIds || []).includes(currentUser.id))}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog
                    quest={completingQuest}
                    onClose={() => setCompletingQuest(null)}
                />
            )}
            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Quest icon preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default QuestsPage;