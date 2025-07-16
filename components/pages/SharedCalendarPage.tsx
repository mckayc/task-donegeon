
import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType, QuestAvailability, User } from '../../types';
import { isQuestAvailableForUser, toYMD } from '../../utils/quests';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import PinEntryDialog from '../auth/PinEntryDialog';

const SharedCalendarPage: React.FC = () => {
    const { settings, users, quests, questCompletions, guilds } = useAppState();
    const { completeQuest } = useAppDispatch();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sortBy, setSortBy] = useState<'user' | 'time' | 'title'>('user');
    const [verifyingQuest, setVerifyingQuest] = useState<{ quest: Quest; user: User } | null>(null);

    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map(u => [u.id, u]));
        return settings.sharedMode.userIds.map(id => userMap.get(id)).filter((u): u is User => !!u);
    }, [users, settings.sharedMode.userIds]);

    const questsByUser = useMemo(() => {
        const dateKey = toYMD(currentDate);
        const userMap = new Map(users.map(u => [u.id, u]));
        const questsMap = new Map<string, { quest: Quest; user: User }[]>();

        sharedUsers.forEach(user => {
            if (user) questsMap.set(user.id, []);
        });

        quests.forEach(quest => {
            if (!quest.isActive) return;

            const isScheduledToday = (
                (quest.type === QuestType.Venture && quest.lateDateTime && toYMD(new Date(quest.lateDateTime)) === dateKey) ||
                (quest.type === QuestType.Duty && (
                    quest.availabilityType === QuestAvailability.Daily ||
                    (quest.availabilityType === QuestAvailability.Weekly && quest.weeklyRecurrenceDays.includes(currentDate.getDay())) ||
                    (quest.availabilityType === QuestAvailability.Monthly && quest.monthlyRecurrenceDays.includes(currentDate.getDate()))
                ))
            );
            if (!isScheduledToday) return;

            let assigned: string[];
            if (quest.assignedUserIds.length > 0) {
                assigned = quest.assignedUserIds;
            } else if (quest.guildId) {
                assigned = guilds.find(g => g.id === quest.guildId)?.memberIds || [];
            } else {
                // This is a personal quest for everyone
                assigned = users.map(u => u.id);
            }

            assigned.forEach(userId => {
                const user = userMap.get(userId);
                if (user && settings.sharedMode.userIds.includes(userId)) {
                    const userCompletions = questCompletions.filter(c => c.userId === userId);
                    if (isQuestAvailableForUser(quest, userCompletions, currentDate)) {
                        const userTasks = questsMap.get(userId);
                        if (userTasks) {
                            userTasks.push({ quest, user });
                        }
                    }
                }
            });
        });

        questsMap.forEach((tasks) => {
            tasks.sort((a, b) => {
                if (sortBy === 'title') return a.quest.title.localeCompare(b.quest.title);
                const typeA = a.quest.type === QuestType.Duty ? 1 : 2;
                const typeB = b.quest.type === QuestType.Duty ? 1 : 2;
                return typeA - typeB || a.quest.title.localeCompare(b.quest.title);
            });
        });

        return questsMap;
    }, [quests, currentDate, settings.sharedMode.userIds, users, guilds, questCompletions, sortBy]);

    const handleCompleteClick = (quest: Quest, user: User) => {
        if (!settings.sharedMode.allowCompletion) return;
        setVerifyingQuest({ quest, user });
    };
    
    const handlePinSuccess = () => {
        if (!verifyingQuest) return;
        const { quest, user } = verifyingQuest;
        
        if (quest.requiresApproval) {
            const note = window.prompt(`Add an optional note for completing "${quest.title}":`);
            completeQuest(quest.id, user.id, quest.rewards, quest.requiresApproval, quest.guildId, { completionDate: currentDate, note: note || undefined });
        } else {
            completeQuest(quest.id, user.id, quest.rewards, quest.requiresApproval, quest.guildId, { completionDate: currentDate });
        }
        setVerifyingQuest(null);
    };

    return (
        <div className="p-4 md:p-8 flex flex-col h-full">
            <Card className="flex-shrink-0">
                <div className="flex justify-between items-center p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <h2 className="text-2xl font-semibold text-emerald-300">
                        {currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-stone-400">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                        >
                            <option value="user">User</option>
                            <option value="time">Time</option>
                            <option value="title">Title</option>
                        </select>
                    </div>
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
                                {userQuests.length > 0 ? userQuests.map(({ quest }) => (
                                    <div key={quest.id} className="bg-stone-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {quest.icon && <span className="text-2xl">{quest.icon}</span>}
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-stone-200 truncate" title={quest.title}>{quest.title}</p>
                                            </div>
                                        </div>
                                        {settings.sharedMode.allowCompletion && (
                                            <Button
                                                onClick={() => handleCompleteClick(quest, user)}
                                                className="text-sm py-1 px-3 flex-shrink-0"
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                )) : (
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
        </div>
    );
};

export default SharedCalendarPage;
