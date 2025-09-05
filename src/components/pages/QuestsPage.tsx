


import React, { useState, useMemo, useEffect } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { Role, QuestType, Quest, QuestKind, QuestCompletionStatus, ConditionSet } from '../../types';
import { isQuestAvailableForUser, questSorter, isQuestVisibleToUserInMode, getAvailabilityText, formatTimeRemaining, toYMD } from '../../utils/quests';
// FIX: Corrected import paths for quest lock status functions and types to resolve circular dependency issues.
import { getQuestLockStatus, QuestLockStatus, ConditionDependencies } from '../../utils/conditions';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useProgressionState } from '../../context/ProgressionContext';
import QuestConditionStatusDialog from '../quests/QuestConditionStatusDialog';

const QuestItem: React.FC<{ quest: Quest; now: Date; onSelect: (quest: Quest) => void; onImagePreview: (url: string) => void; lockStatus: QuestLockStatus; }> = ({ quest, now, onSelect, onImagePreview, lockStatus }) => {
    const { settings, scheduledEvents } = useSystemState();
    const { guilds } = useCommunityState();
    const { rewardTypes } = useEconomyState();
    const { questGroups, questCompletions } = useQuestsState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    
    if (!currentUser) return null;

    const isAvailable = useMemo(() => isQuestAvailableForUser(quest, questCompletions.filter(c => c.userId === currentUser.id), now, scheduledEvents, appMode), [quest, questCompletions, currentUser.id, now, scheduledEvents, appMode]);
    const questGroup = useMemo(() => { const firstGroupId = quest.groupIds?.[0]; return firstGroupId ? questGroups.find(g => g.id === firstGroupId) : null; }, [quest.groupIds, questGroups]);

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const completionsForThisQuest = useMemo(() => {
        return questCompletions.filter(c => c.questId === quest.id).length;
    }, [questCompletions, quest.id]);
    
    const { borderClass, timeStatusText, timeStatusColor, isDimmed, absoluteDueDateString } = useMemo(() => {
        let deadline: Date | null = null;
        let incompleteDeadline: Date | null = null;
        let absoluteString: string | null = null;

        if (quest.type === QuestType.Duty) {
            if (quest.startTime) {
                const [h, m] = quest.startTime.split(':').map(Number);
                deadline = new Date(now);
                deadline.setHours(h, m, 0, 0);
                absoluteString = `Due daily at ${new Date(`1970-01-01T${quest.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
            }
            if (quest.endTime) {
                const [h, m] = quest.endTime.split(':').map(Number);
                incompleteDeadline = new Date(now);
                incompleteDeadline.setHours(h, m, 0, 0);
            }
        } else if (quest.type === QuestType.Venture || quest.type === QuestType.Journey) {
            if (quest.endDateTime) {
                deadline = new Date(quest.endDateTime);
                absoluteString = `Due: ${deadline.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
            }
        }

        const isIncomplete = incompleteDeadline && now > incompleteDeadline;
        if (isIncomplete) {
            return {
                borderClass: 'border-black',
                timeStatusText: 'Incomplete',
                timeStatusColor: 'text-stone-400',
                isDimmed: true,
                absoluteDueDateString: null
            };
        }

        const isPastDue = deadline && now > deadline;
        const timeDiff = deadline ? deadline.getTime() - now.getTime() : Infinity;

        let bClass = 'border-stone-700';
        let tStatusText = lockStatus.isLocked ? 'Locked' : 'No due date';
        let tStatusColor = lockStatus.isLocked ? 'text-amber-400' : 'text-stone-400';
        let finalAbsoluteString: string | null = absoluteString;

        if (deadline) {
            if (isPastDue) {
                bClass = 'border-red-600 animate-slow-pulse';
                tStatusColor = 'text-red-400';
                if (incompleteDeadline) {
                    tStatusText = `Incomplete in: ${formatTimeRemaining(incompleteDeadline, now)}`;
                    finalAbsoluteString = `Incomplete at ${new Date(`1970-01-01T${quest.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
                } else {
                    tStatusText = 'Past Due';
                }
            } else { // Not past due
                tStatusText = `Due in: ${formatTimeRemaining(deadline, now)}`;
                if (timeDiff < 60 * 60 * 1000) { // Under 1 hour
                    bClass = 'border-orange-500 animate-slow-pulse';
                    tStatusColor = 'text-orange-400';
                } else if (timeDiff < 2 * 60 * 60 * 1000) { // Under 2 hours
                    bClass = 'border-yellow-500';
                    tStatusColor = 'text-yellow-400';
                } else {
                    bClass = 'border-green-600';
                    tStatusColor = 'text-green-400';
                }
            }
        }
        
        const completionsForUserToday = questCompletions.filter(c => 
            c.questId === quest.id && 
            c.userId === currentUser.id && 
            toYMD(new Date(c.completedAt)) === toYMD(now)
        );

        const isCompletedToday = completionsForUserToday.length > 0;
        const finalDimState = isCompletedToday || !isAvailable;
        
        return {
            borderClass: bClass,
            timeStatusText: lockStatus.isLocked ? 'Locked' : tStatusText,
            timeStatusColor: lockStatus.isLocked ? 'text-amber-400' : tStatusColor,
            isDimmed: finalDimState,
            absoluteDueDateString: finalAbsoluteString
        };

    }, [quest, now, questCompletions, currentUser.id, isAvailable, lockStatus]);
    
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
    
    const cardIsDimmed = (isDimmed || lockStatus.isLocked) && !hasPendingCompletion;


    return (
        <div onClick={() => onSelect(quest)} className={`relative border-2 rounded-xl shadow-lg flex flex-col h-full transition-all duration-500 cursor-pointer ${baseCardClass} ${borderClass} ${optionalClass} ${cardIsDimmed ? 'opacity-50' : ''}`}>
             {lockStatus.isLocked && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center z-10">
                    <span className="text-5xl" role="img" aria-label="Locked">🔒</span>
                </div>
            )}
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
                </div>
                <div title={absoluteDueDateString || 'No due date'} className="text-right">
                    <span className={`font-semibold text-sm ${timeStatusColor}`}>{timeStatusText}</span>
                     {absoluteDueDateString && !['No due date', 'Locked', 'Incomplete'].includes(timeStatusText) && (
                        <p className="text-xs text-stone-400">{absoluteDueDateString}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuestsPage: React.FC = () => {
    const systemState = useSystemState();
    const { settings, scheduledEvents } = systemState;
    const { appMode } = useUIState();
    const { quests, questCompletions, questGroups } = useQuestsState();
    const { addQuest, updateQuest } = useQuestsDispatch();
    const { currentUser } = useAuthState();
    const economyState = useEconomyState();
    const progressionState = useProgressionState();
    const communityState = useCommunityState();

    const [isCreateQuestOpen, setIsCreateQuestOpen] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update 'now' every minute
        return () => clearInterval(timer);
    }, []);
    
    const visibleQuests = useMemo(() => {
        if (!currentUser) return [];
        const questsForMode = quests.filter(q => isQuestVisibleToUserInMode(q, currentUser.id, appMode));
        const uniqueQuests = Array.from(new Map(questsForMode.map(q => [q.id, q])).values());
        return uniqueQuests.sort(questSorter(currentUser, questCompletions, scheduledEvents, now));
    }, [quests, currentUser, appMode, questCompletions, scheduledEvents, now]);

    const dutyQuests = useMemo(() => visibleQuests.filter(q => q.type === QuestType.Duty), [visibleQuests]);
    const ventureQuests = useMemo(() => visibleQuests.filter(q => q.type === QuestType.Venture || q.type === QuestType.Journey), [visibleQuests]);

    const conditionDependencies = useMemo<ConditionDependencies & { allConditionSets: ConditionSet[] }>(() => ({
        ...progressionState, ...economyState, ...communityState, quests, questGroups, questCompletions, appMode, allConditionSets: systemState.settings.conditionSets
    }), [progressionState, economyState, communityState, quests, questGroups, questCompletions, appMode, systemState.settings.conditionSets]);

    const handleQuestSelect = (quest: Quest) => {
        if (!currentUser) return;
        const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
        if (lockStatus.isLocked) {
            setViewingConditionsForQuest(quest);
        } else {
            setSelectedQuest(quest);
        }
    };

    const handleImagePreview = (url: string) => setPreviewImageUrl(url);

    const handleStartCompletion = () => {
        if (selectedQuest) {
            setCompletingQuest(selectedQuest);
            setSelectedQuest(null);
        }
    };

    if (!currentUser) return <div>Loading...</div>;

    return (
        <div>
            {currentUser.role === Role.DonegeonMaster && (
                <div className="flex justify-end mb-8">
                    <Button onClick={() => setIsCreateQuestOpen(true)}>
                        Create New {settings.terminology.task}
                    </Button>
                </div>
            )}

            <div className="space-y-10">
                <Card title={settings.terminology.recurringTasks}>
                    {dutyQuests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dutyQuests.map(quest => {
                                const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
                                return <QuestItem key={quest.id} quest={quest} now={now} onSelect={handleQuestSelect} onImagePreview={handleImagePreview} lockStatus={lockStatus} />;
                            })}
                        </div>
                    ) : (
                        <p className="text-stone-400">No {settings.terminology.recurringTasks.toLowerCase()} available right now.</p>
                    )}
                </Card>

                <Card title={`${settings.terminology.singleTasks} & ${settings.terminology.journeys}`}>
                     {ventureQuests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ventureQuests.map(quest => {
                                const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
                                return <QuestItem key={quest.id} quest={quest} now={now} onSelect={handleQuestSelect} onImagePreview={handleImagePreview} lockStatus={lockStatus} />;
                            })}
                        </div>
                    ) : (
                        <p className="text-stone-400">No {settings.terminology.singleTasks.toLowerCase()} available right now.</p>
                    )}
                </Card>
            </div>

            {isCreateQuestOpen && (
                <CreateQuestDialog onClose={() => setIsCreateQuestOpen(false)} />
            )}
            {selectedQuest && (
                <QuestDetailDialog quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleStartCompletion} />
            )}
            {completingQuest && (
                <CompleteQuestDialog quest={completingQuest} onClose={() => setCompletingQuest(null)} />
            )}
            {previewImageUrl && (
                <ImagePreviewDialog imageUrl={previewImageUrl} altText="Quest Icon" onClose={() => setPreviewImageUrl(null)} />
            )}
            {viewingConditionsForQuest && (
                <QuestConditionStatusDialog
                    quest={viewingConditionsForQuest}
                    user={currentUser}
                    onClose={() => setViewingConditionsForQuest(null)}
                />
            )}
        </div>
    );
};

export default QuestsPage;