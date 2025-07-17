
import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType, QuestAvailability, User } from '../../types';
import { isQuestAvailableForUser, toYMD, isQuestScheduledForDay, questSorter } from '../../utils/quests';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import PinEntryDialog from '../auth/PinEntryDialog';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';

const SharedCalendarPage: React.FC = () => {
    const { settings, users, quests, questCompletions, guilds } = useAppState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sortBy, setSortBy] = useState<'user' | 'time' | 'title'>('user');
    const [verifyingQuest, setVerifyingQuest] = useState<{ quest: Quest; user: User } | null>(null);
    const [questForNoteCompletion, setQuestForNoteCompletion] = useState<{ quest: Quest; user: User } | null>(null);
    const [selectedQuestDetails, setSelectedQuestDetails] = useState<{ quest: Quest; user: User } | null>(null);

    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u]));
        const userIdsToShow = settings.sharedMode.userIds.length > 0 ? settings.sharedMode.userIds : users.map(u => u.id);
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
                 
                 if (isRelevantToday && isQuestAvailableForUser(quest, userCompletions, currentDate)) {
                     userQuests.push(quest);
                 }
            });
            
            const uniqueQuests = Array.from(new Set(userQuests.map(q => q.id))).map(id => userQuests.find(q => q.id === id)!);
            uniqueQuests.sort(questSorter(user, userCompletions, currentDate));
            questsMap.set(user.id, uniqueQuests.map(q => ({quest: q, user})));
        });

        return questsMap;
    }, [quests, currentDate, sharedUsers, users, guilds, questCompletions]);

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
            <Card className="flex-shrink-0">
                <div className="flex justify-between items-center p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <h2 className="text-2xl font-semibold text-emerald-300">
                        {currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                </div>
            </Card>

            <div className="flex-grow flex gap-4 overflow-x-auto pt-6 pb-4 scrollbar-hide">
                {sharedUsers.map(user => {
                    if (!user) return null;
                    const userQuests = questsByUser.get(user.id) || [];
                    return (
                        <div key={user.id} className="flex-shrink-0 w-80 bg-stone-800/50 rounded-lg flex flex-col">
                            <div className="p-3 border-b border-stone-700 flex items-center gap-3 flex-shrink-0">
                                <Avatar user={user} className="w-10 h-10" />
                                <h3 className="font-bold text-lg text-stone-100">{user.gameName}</h3>
                            </div>
                            <div className="p-3 space-y-2 overflow-y-auto scrollbar-hide flex-grow">
                                {userQuests.length > 0 ? userQuests.map(({ quest }) => {
                                    const bgClass = quest.type === QuestType.Duty ? 'bg-sky-900/50 hover:bg-sky-900/80' : 'bg-amber-900/50 hover:bg-amber-900/80';
                                    const isTodo = quest.type === QuestType.Venture && quest.todoUserIds?.includes(user.id);
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
                    quest={selectedQuestDetails.quest}
                    dialogTitle={dialogTitle}
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
