

import React, { useState, useMemo, useEffect } from 'react';
import { Quest, QuestType, User, QuestCompletionStatus } from '../../types';
import { AppMode } from '../../types/app';
import { isQuestAvailableForUser, toYMD, isQuestScheduledForDay, questSorter } from '../../utils/quests';
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

const getDueDateString = (quest: Quest): string | null => {
    if (quest.type === QuestType.Venture && quest.startDateTime) {
        return `Due: ${new Date(quest.startDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
    if (quest.type === QuestType.Duty && quest.startTime) {
        const [hours, minutes] = quest.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return `Due at: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return null;
};

const SharedCalendarPage: React.FC = () => {
    const { settings, scheduledEvents } = useSystemState();
    const { guilds } = useCommunityState();
    const { quests, questCompletions } = useQuestsState();
    const { markQuestAsTodo, unmarkQuestAsTodo, completeQuest } = useQuestsDispatch();
    const { users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();

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
        const questsMap = new Map<string, { quest: Quest; user: User }[]>();

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
                     isAssigned = true; 
                 }
                 if (!isAssigned) return;
                 
                 const isDutyToday = quest.rrule && isQuestScheduledForDay(quest, currentDate);
                 const isVentureDueToday = !quest.rrule && quest.startDateTime && toYMD(new Date(quest.startDateTime)) === dateKey;
                 const isTodoForUser = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
                 
                 const isRelevantToday = isDutyToday || isVentureDueToday || isTodoForUser;
                 
                 const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
                 if (isRelevantToday && isQuestAvailableForUser(quest, userCompletions, currentDate, scheduledEvents, questAppMode)) {
                     userQuests.push(quest);
                 }
            });
            
            const uniqueQuests = Array.from(new Map(userQuests.map(q => [q.id, q])).values());
            const sortedQuests = uniqueQuests.sort(questSorter(user, userCompletions, scheduledEvents, currentDate));
            questsMap.set(user.id, sortedQuests.map(quest => ({ quest, user })));
        });

        return questsMap;
    }, [sharedUsers, quests, currentDate, questCompletions, guilds, scheduledEvents]);
    
    const completeQuestWithoutPin = (quest: Quest, user: User) => {
        if (quest.requiresApproval) {
            setQuestForNoteCompletion({ quest, user });
            return;
        }

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

    const handleNoteCompletion = (quest: Quest, user: User) => {
        setQuestForNoteCompletion({ quest, user });
    };
    
    const handleQuickComplete = (quest: Quest, user: User) => {
        if (settings.security.requirePinForUsers && user.pin) {
            setVerifyingQuest({ quest, user });
        } else {
            completeQuestWithoutPin(quest, user);
        }
    };
    
    const onPinSuccess = () => {
        if (verifyingQuest) {
            completeQuestWithoutPin(verifyingQuest.quest, verifyingQuest.user);
            setVerifyingQuest(null);
        }
    };

    const handleDetailView = (quest: Quest, user: User) => {
        setSelectedQuestDetails({ quest, user });
    };

    const handleStartCompletionFromDialog = () => {
        if (!selectedQuestDetails) return;
        const { quest, user } = selectedQuestDetails;

        if (quest.requiresApproval) {
            handleNoteCompletion(quest, user);
        } else {
            handleQuickComplete(quest, user);
        }
        setSelectedQuestDetails(null);
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
    
    return (
        <div className="h-full flex flex-col p-4 md:p-8">
            <div className="flex-grow overflow-x-auto scrollbar-hide">
                <div className="flex space-x-6 min-w-max h-full">
                    {sharedUsers.map(user => (
                        <div key={user.id} className="w-80 flex-shrink-0 flex flex-col">
                            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                                <Avatar user={user} className="w-12 h-12 rounded-full border-2 border-accent" />
                                <h2 className="text-xl font-bold text-stone-200">{user.gameName}</h2>
                            </div>
                            <div className="flex-grow bg-stone-800/50 rounded-lg p-4 space-y-3 overflow-y-auto scrollbar-hide">
                                {(questsByUser.get(user.id) || []).map(({ quest }) => (
                                     <button
                                        key={quest.id}
                                        onClick={() => handleDetailView(quest, user)}
                                        className="w-full text-left bg-stone-900/50 rounded-lg p-3 hover:bg-stone-700/50 transition-colors"
                                    >
                                        <p className="font-semibold text-stone-100 flex items-center gap-2">{quest.icon} {quest.title}</p>
                                        <p className="text-xs text-stone-400 mt-1">{getDueDateString(quest)}</p>
                                     </button>
                                ))}
                                {(questsByUser.get(user.id) || []).length === 0 && (
                                    <p className="text-center text-stone-500 pt-8">No quests for today.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
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