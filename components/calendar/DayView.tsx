import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType, QuestAvailability } from '../../types';
import QuestList from './QuestList';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { questSorter, isQuestScheduledForDay } from '../../utils/quests';

interface DayViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const DayView: React.FC<DayViewProps> = ({ currentDate, quests, questCompletions }) => {
    const calendarVentures = useCalendarVentures(currentDate);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const { currentUser } = useAppState();

    const scheduledDuties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, currentDate));
    
    const sortedQuests = useMemo(() => {
        if (!currentUser) return [];
        const allQuestsForDay = [...scheduledDuties, ...calendarVentures];
        const uniqueQuests = Array.from(new Set(allQuestsForDay.map(q => q.id))).map(id => allQuestsForDay.find(q => q.id === id)!);
        return uniqueQuests.sort(questSorter(currentUser, currentDate));
    }, [currentUser, scheduledDuties, calendarVentures, currentDate]);

    const handleStartCompletion = (quest: Quest) => {
        setCompletingQuest(quest);
        setSelectedQuest(null);
    };

    const handleToggleTodo = () => {
        if (!selectedQuest || !currentUser) return;
        const isCurrentlyTodo = selectedQuest.todoUserIds?.includes(currentUser.id);
        
        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(selectedQuest.id, currentUser.id);
        } else {
            markQuestAsTodo(selectedQuest.id, currentUser.id);
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

    return (
         <>
            <div className="p-4 h-[70vh] overflow-y-auto scrollbar-hide">
                 <QuestList
                    date={currentDate}
                    quests={sortedQuests}
                    questCompletions={questCompletions}
                    onQuestSelect={setSelectedQuest}
                />
            </div>
            {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={handleToggleTodo}
                    isTodo={currentUser && selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id)}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog
                    quest={completingQuest}
                    onClose={() => setCompletingQuest(null)}
                    completionDate={currentDate}
                />
            )}
        </>
    );
};

export default DayView;