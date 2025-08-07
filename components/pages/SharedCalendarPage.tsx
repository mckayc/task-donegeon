import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { Quest, QuestType, QuestAvailability, User, AppMode } from '../../types';
import { isQuestAvailableForUser, toYMD, isQuestScheduledForDay, questSorter } from '../../utils/quests';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import PinEntryDialog from '../auth/PinEntryDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';

const getDueDateString = (quest: Quest): string | null => {
    if (quest.type === QuestType.Venture && quest.lateDateTime) {
        return `Due: ${new Date(quest.lateDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
    if (quest.type === QuestType.Duty && quest.lateTime) {
        const [hours, minutes] = quest.lateTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return `Due at: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return null;
};

const SharedCalendarPage: React.FC = () => {
    const { settings, guilds, scheduledEvents } = useAppState();
    const { quests, questCompletions } = useQuestsState();
    const { users } = useAuthState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [verifyingQuest, setVerifyingQuest] = useState<{ quest: Quest; user: User } | null>(null);
    const [questForNoteCompletion, setQuestForNoteCompletion] = useState<{ quest: Quest; user: User } | null>(null);
    const [selectedQuestDetails, setSelectedQuestDetails] = useState<{ quest: Quest; user: User } | null>(null);

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
                 // Check assignment
                 let isAssigned = false;
                 if (quest.assignedUserIds.length > 0) {
                     isAssigned = quest.assignedUserIds.includes(user.id);
                 } else if (quest.guildId) {
                     isAssigned = guilds.find(g => g.id === quest.guildId)?.memberIds.includes(user.id) || false;
                 } else {
                     isAssigned = true; // Personal quest for everyone
                 }
                 if (!isAssigned) return;
                 
                 // Check if quest should appear today for this user
                 const isDutyToday = quest.type === QuestType.Duty && isQuestScheduledForDay(quest, currentDate);
                 const isVentureDueToday = quest.type === QuestType.Venture && quest.lateDateTime && toYMD(new Date(quest.lateDateTime)) === dateKey;
                 const isTodoForUser = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
                 
                 const isRelevantToday = isDutyToday || isVentureDueToday || isTodoForUser;
                 
                 const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
                 if (isRelevantToday && isQuestAvailableForUser(quest, userCompletions, currentDate, scheduledEvents, questAppMode)) {
                     userQuests.push(quest);
                 }
            });
            
            const uniqueQuests = Array.from(new Set(userQuests.map(q => q.id))).map(id => userQuests.find(q => q.id === id)!);
            uniqueQuests.sort(questSorter(user, userCompletions, scheduledEvents, currentDate));
            questsMap.set(user.id, uniqueQuests.map(q => ({quest: q, user})));
        });

        return questsMap;
    }, [quests, currentDate, sharedUsers, users, guilds, questCompletions, scheduledEvents]);

    const handleCompleteClick = (quest: Quest, user: User) => {
        if (!settings.sharedMode.allowCompletion) return;
        setVerifyingQuest({ quest, user });
        setSelectedQuestDetails(null);
    };

    const handlePinSuccess = () => {
        if (!verifyingQuest) return;
        setQuestForNoteCompletion({ ...verifyingQuest });
        setVerifyingQuest(null);
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

        setSelectedQuestDetails(prev => {
            if (!prev) return null;
            const newTodoUserIds = isCurrentlyTodo
                ? (prev.quest.todoUserIds || []).filter(id => id !== user.id)
                : [...(prev.quest.todoUserIds || []), user.id];
            return { ...prev, quest: { ...prev.quest, todoUserIds: newTodoUserIds } };
        });
    };

    const dialogTitle = selectedQuestDetails ? `${selectedQuestDetails.user.gameName}'s ${selectedQuestDetails.quest.type}` : undefined;

    return (
        <div className="p-4 md:p-8 flex flex-col h-full">
            <div className="flex-grow flex gap-4 overflow-x-auto pt-6 pb-4 scrollbar-hide">
                {sharedUsers.map(user => {
                    if (!user) return null;
                    const userQuests = questsByUser.get(user.id) || [];
                    return (
                        <div key={user.id} className="flex-shrink-0 w-80 bg-stone-800/50 rounded-lg flex flex-col">
                            <div className="p-3 border-b border-stone-700 flex items-center gap-3 flex-shrink-0">
                                <Avatar user={user} className="w-10 h-10 rounded-full overflow-hidden" />
                                <h3 className="font-bold text-lg text-stone-100">{user.gameName}</h3>
                            </div>
                            <div className="p-3 space-y-2 overflow-y-auto scrollbar-hide flex-grow">
                                {userQuests.length > 0 ? userQuests.map(({ quest }) => {
                                    const bgClass = quest.type === QuestType.Duty ? 'bg-sky-900/50 hover:bg-sky-900/80' : 'bg-amber-900/50 hover:bg-amber-900/80';
                                    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
                                    const dueDateString = getDueDateString(quest);
                                    return (
                                    <button
                                        type="button"
                                        key={quest.id}
                                        onClick={() => setSelectedQuestDetails({ quest, user })}
                                        className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-4 transition-colors ${bgClass} ${isTodo ? 'border-2 border-purple-500' : 'border-2 border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {quest.icon && <span className="text-2xl">{quest.icon}</span>}
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-stone-200 truncate" title={quest.title}>{quest.title}</p>
                                                {dueDateString && <p className="text-xs text-stone-400 mt-1">{dueDateString}</p>}
                                            </div>
                                        </div>
                                    </button>
                                    )
                                }) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-center text-stone-500 text-sm p-4">No quests today!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
             {verifyingQuest && (
                <PinEntryDialog 
                    user={verifyingQuest.user}
                    onClose={() => setVerifyingQuest(null)}
                    onSuccess={handlePinSuccess}
                />
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
                    dialogTitle={dialogTitle}
                    quest={selectedQuestDetails.quest}
                    onClose={() => setSelectedQuestDetails(null)}
                    onComplete={settings.sharedMode.allowCompletion ? () => handleCompleteClick(selectedQuestDetails.quest, selectedQuestDetails.user) : undefined}
                    onToggleTodo={handleToggleTodo}
                    isTodo={!!selectedQuestDetails.quest.todoUserIds?.includes(selectedQuestDetails.user.id)}
                />
            )}
        </div>
    );
};

export default SharedCalendarPage;
