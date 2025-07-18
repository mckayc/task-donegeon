import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType, QuestAvailability } from '../../types';
import QuestList from './QuestList';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { questSorter, isQuestScheduledForDay } from '../../utils/quests';
import Card from '../ui/Card';

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
    const { currentUser, settings } = useAppState();

    const scheduledDuties = useMemo(() => {
        if (!currentUser) return [];
        const duties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, currentDate));
        return duties.sort(questSorter(currentUser, questCompletions, currentDate));
    }, [quests, currentDate, currentUser, questCompletions]);
    
    const sortedVentures = useMemo(() => {
        if (!currentUser) return [];
        return [...calendarVentures].sort(questSorter(currentUser, questCompletions, currentDate));
    }, [calendarVentures, currentUser, questCompletions, currentDate]);

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
            <div className="p-4 h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2">
                    <QuestList
                        title={settings.terminology.recurringTasks}
                        date={currentDate}
                        quests={scheduledDuties}
                        questCompletions={questCompletions}
                        onQuestSelect={setSelectedQuest}
                    />
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2">
                    <QuestList
                        title={settings.terminology.singleTasks}
                        date={currentDate}
                        quests={sortedVentures}
                        questCompletions={questCompletions}
                        onQuestSelect={setSelectedQuest}
                    />
                </div>
            </div>
            {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest)}
                    onToggleTodo={handleToggleTodo}
                    isTodo={!!(currentUser && selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
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