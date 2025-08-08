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
import { useQuestDispatch, useQuestState } from '../../context/QuestContext';

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
    const { quests, questCompletions } = useQuestState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestDispatch();
    const { users } = useAuthState();
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
            unique