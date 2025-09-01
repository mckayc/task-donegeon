import React, { useState, useMemo, useEffect } from 'react';
import { Quest, QuestType, User, QuestCompletionStatus, QuestKind } from '../../types';
import { AppMode } from '../../types/app';
import { isQuestAvailableForUser, toYMD, isQuestScheduledForDay, questSorter, formatTimeRemaining } from '../../utils/quests';
import Card from '../user-interface/Card';
import Avatar from '../user-interface/Avatar';
import Button from '../user-interface/Button';
import PinEntryDialog from '../auth/PinEntryDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useSystemState } from '../../context/SystemContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';

const SharedCalendarPage: React.FC = () => {
    const { settings, scheduledEvents } = useSystemState();
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { markQuestAsTodo, unmarkQuestAsTodo, completeQuest } = useQuestsDispatch();
    const { users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { rewardTypes } = useEconomyState();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [verifyingQuest, setVerifyingQuest] = useState<{ quest: Quest; user: User } | null>(null);
    const [questForNoteCompletion, setQuestForNoteCompletion] = useState<{ quest: Quest; user: User } | null>(null);
    const [selectedQuestDetails, setSelectedQuestDetails] = useState<{ quest: Quest; user: User } | null>(null);

    // Safely syncs the dialog's quest data with the main quests list from the provider.
    useEffect(() => {
        if (selectedQuestDetails) {
            const updatedQuestInList = quests.find(q => q.id === selectedQuestDetails.quest.id);
            if (updatedQuestInList && JSON.stringify(updatedQuestInList) !== JSON.stringify(selectedQuestDetails.quest)) {
                setSelectedQuestDetails(prev => prev ? { ...prev, quest: updatedQuestInList } : null);
            }
        }
    }, [quests, selectedQuestDetails]);


    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u]));
        const userIdsToShow = settings.sharedMode.userIds;
        return userIdsToShow.map(id => userMap.get(id)).filter((u): u is User => !!u);
    }, [users, settings.sharedMode.userIds]);

    const questsByUser = useMemo(() => {
        const dateKey = toYMD(currentDate);
        const questsMap = new Map<string, { duties: Quest[], ventures: Quest[] }>();

        sharedUsers.forEach(user => {
            if (!user) return;
            const userQuests: Quest[] = [];
            const userCompletions = questCompletions.filter(c => c.userId === user.id);
            
            quests.forEach(quest => {
                 if (!quest.isActive) return;
                 let isAssigned = false;
                 if (quest.assignedUserIds.length > 0) {
                     isAssigned = quest.assignedUserIds.includes(user.id);
                 } else if (quest.guildId) {
                     isAssigned = guilds.find(g => g.id === quest.guildId)?.memberIds.includes(user.id) || false;
                 } else {
                     // This case may not be relevant if all quests have assignments, but as a fallback.
                     isAssigned = true; 
                 }
                 if (!isAssigned) return;
                 
                 const isDutyToday = quest.type === QuestType.Duty && isQuestScheduledForDay(quest, currentDate);
                 const isVentureDueToday = (quest.type === QuestType.Venture || quest.type === QuestType.Journey) && quest.startDateTime && toYMD(new Date(quest.startDateTime)) === dateKey;
                 const isTodoForUser = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
                 // FIX: Added a new condition to show optional, dateless, daily ventures automatically in kiosk mode.
                 const isOptionalDailyVenture = quest.type === QuestType.Venture && quest.isOptional && (quest.dailyCompletionsLimit ?? 0) > 0 && !quest.startDateTime;
                 
                 const isRelevantToday = isDutyToday || isVentureDueToday || isTodoForUser || isOptionalDailyVenture;
                 
                 const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
                 if (isRelevantToday && isQuestAvailableForUser(quest, userCompletions, currentDate, scheduledEvents, questAppMode)) {
                     userQuests.push(quest);
                 }
            });
            
            const uniqueQuests = Array.from(new Map(userQuests.map(q => [q.id, q])).values());
            const sortedQuests = uniqueQuests.sort(questSorter(user, userCompletions, scheduledEvents, currentDate));
            
            questsMap.set(user.id, {
                duties: sortedQuests.filter(q => q.type === QuestType.Duty),
                ventures: sortedQuests.filter(q => q.type === QuestType.Venture || q.type === QuestType.Journey)
            });
        });

        return questsMap;
    }, [sharedUsers, quests, currentDate, questCompletions, guilds, scheduledEvents]);
    
    const dispatchQuickComplete = (quest: Quest, user: User) => {
        const completionData = {
          questId: quest.id,
          userId: user.id,
          completedAt: currentDate.toISOString(),
          status: QuestCompletionStatus.Approved,
          note: 'Quick completed from shared view.',
          guildId: quest.guildId
        };
        completeQuest(completionData);
        addNotification({ type: 'success', message: `"${quest.title}" completed for ${user.gameName}!` });
    };
    
    const proceedWithCompletion = (quest: Quest, user: User) => {
        if (quest.requiresApproval) {
            setQuestForNoteCompletion({ quest, user });
        } else {
            dispatchQuickComplete(quest, user);
        }
    };

    const onPinSuccess = () => {
        if (verifyingQuest) {
            proceedWithCompletion(verifyingQuest.quest, verifyingQuest.user);
            setVerifyingQuest(null);
        }
    };
    
    const handleStartCompletionFromDialog = () => {
        if (!selectedQuestDetails) return;
        const { quest, user } = selectedQuestDetails;

        if (settings.sharedMode.requirePinForCompletion && user.pin) {
            setVerifyingQuest({ quest, user });
        } else {
            proceedWithCompletion(quest, user);
        }
        setSelectedQuestDetails(null);
    };

    const handleDetailView = (quest: Quest, user: User) => {
        setSelectedQuestDetails({ quest, user });
    };

    const handleToggleTodo = () => {
        if (!selectedQuestDetails) return;
        const { quest, user } = selectedQuestDetails;
        const isCurrentlyTodo = quest.todoUserIds?.includes(user.id);

        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(quest.id, user.id);
        } else {
            markQuestAsTodo(quest.id, user.id);
        }
    };
    
    const getRewardInfo = (rewardTypeId: string) => {
        return rewardTypes.find(rt => rt.id === rewardTypeId) || { name: 'Unknown', icon: '❓' };
    };

    const QuestCardComponent: React.FC<{ quest: Quest; user: User }> = ({ quest, user }) => {
        const now = new Date();
        
        const { borderClass, timeStatusText, timeStatusColor, absoluteDueDateString } = useMemo(() => {
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
                return { borderClass: 'border-black', timeStatusText: 'Incomplete', timeStatusColor: 'text-stone-400', absoluteDueDateString: null };
            }

            const isPastDue = deadline && now > deadline;
            const timeDiff = deadline ? deadline.getTime() - now.getTime() : Infinity;

            let bClass = 'border-stone-700';
            let tStatusText = 'No due date';
            let tStatusColor = 'text-stone-400';
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
            
            return { borderClass: bClass, timeStatusText: tStatusText, timeStatusColor: tStatusColor, absoluteDueDateString: finalAbsoluteString };
        }, [quest, now]);

        let baseCardClass = 'bg-stone-800/60';
        if (quest.type === QuestType.Duty) baseCardClass = 'bg-sky-900/30';
        if (quest.type === QuestType.Venture) baseCardClass = 'bg-amber-900/30';
        if (quest.type === QuestType.Journey) baseCardClass = 'bg-purple-900/30';
        if (quest.kind === QuestKind.Redemption) baseCardClass = 'bg-slate-800/50';

        const optionalClass = quest.isOptional ? 'border-dashed' : '';
        const finalBorderClass = `${borderClass} ${optionalClass}`;

        return (
             <button
                key={quest.id}
                onClick={() => handleDetailView(quest, user)}
                className={`w-full text-left rounded-lg p-3 hover:bg-stone-700/50 transition-colors flex flex-col h-full border-2 ${baseCardClass} ${finalBorderClass}`}
            >
                <div className="flex-grow">
                    <p className="font-semibold text-stone-100 flex items-center gap-2">{quest.icon} {quest.title}</p>
                    <div className="text-xs mt-1">
                        <p className={timeStatusColor}>{timeStatusText}</p>
                        {absoluteDueDateString && <p className="text-stone-400">{absoluteDueDateString}</p>}
                    </div>
                </div>
                {quest.rewards.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold mt-2 pt-2 border-t border-stone-700/60">
                        {quest.rewards.map(r => {
                            const { name, icon } = getRewardInfo(r.rewardTypeId);
                            return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+ {r.amount} <span className="text-base">{icon}</span></span>
                        })}
                    </div>
                )}
             </button>
        );
    };


    return (
        <div className="overflow-x-auto scrollbar-hide p-4 md:p-8">
            <div className="flex space-x-6 min-w-max h-full">
                {sharedUsers.map(user => (
                    <div key={user.id} className="w-80 flex-shrink-0 flex flex-col">
                        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                            <Avatar user={user} className="w-12 h-12 rounded-full border-2 border-accent" />
                            <h2 className="text-xl font-bold text-stone-200">{user.gameName}</h2>
                        </div>
                        <div className="flex-grow bg-stone-800/50 rounded-lg p-4 space-y-3 overflow-y-auto scrollbar-hide">
                            {(() => {
                                const userQuests = questsByUser.get(user.id);
                                const hasDuties = userQuests && userQuests.duties.length > 0;
                                const hasVentures = userQuests && userQuests.ventures.length > 0;

                                if (!hasDuties && !hasVentures) {
                                    return <p className="text-center text-stone-500 pt-8">No quests for today.</p>;
                                }

                                return (
                                    <>
                                        {hasDuties && (
                                            <div>
                                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">{settings.terminology.recurringTasks}</h3>
                                                <div className="space-y-3">
                                                    {userQuests.duties.map(quest => (
                                                        <QuestCardComponent quest={quest} user={user} key={quest.id} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {hasVentures && (
                                            <div className={hasDuties ? 'pt-3 mt-3 border-t border-stone-700/60' : ''}>
                                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">{settings.terminology.singleTasks} &amp; {settings.terminology.journeys}</h3>
                                                <div className="space-y-3">
                                                    {userQuests.ventures.map(quest => (
                                                        <QuestCardComponent quest={quest} user={user} key={quest.id} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                ))}
            </div>
            {verifyingQuest && (
                <PinEntryDialog user={verifyingQuest.user} onClose={() => setVerifyingQuest(null)} onSuccess={onPinSuccess} />
            )}
            {questForNoteCompletion && (
                <CompleteQuestDialog 
                    quest={questForNoteCompletion.quest}
                    user={questForNoteCompletion.user}
                    onClose={() => setQuestForNoteCompletion(null)} 
                    completionDate={currentDate}
                />
            )}
             {selectedQuestDetails && (
                <QuestDetailDialog
                    quest={selectedQuestDetails.quest}
                    userForView={selectedQuestDetails.user}
                    onClose={() => setSelectedQuestDetails(null)}
                    onComplete={settings.sharedMode.allowCompletion ? handleStartCompletionFromDialog : undefined}
                    onToggleTodo={handleToggleTodo}
                    isTodo={selectedQuestDetails.quest.type === QuestType.Venture && !!selectedQuestDetails.quest.todoUserIds?.includes(selectedQuestDetails.user.id)}
                    dialogTitle={`For ${selectedQuestDetails.user.gameName}`}
                />
            )}
        </div>
    );
};

export default SharedCalendarPage;