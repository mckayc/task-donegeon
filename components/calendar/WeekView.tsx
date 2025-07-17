import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType } from '../../types';
import { isQuestScheduledForDay, questSorter } from '../../utils/quests';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import QuestList from './QuestList';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';

interface WeekViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, quests, questCompletions }) => {
    const { currentUser } = useAppState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const [selectedQuest, setSelectedQuest] = useState<{quest: Quest, date: Date} | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{quest: Quest, date: Date} | null>(null);

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const handleStartCompletion = (quest: Quest, date: Date) => {
        setCompletingQuest({ quest, date });
        setSelectedQuest(null);
    };
    
    const handleToggleTodo = () => {
        if (!selectedQuest || !currentUser) return;
        const { quest } = selectedQuest;
        const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);

        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(quest.id, currentUser.id);
        } else {
            markQuestAsTodo(quest.id, currentUser.id);
        }
        
        // Update the dialog's state immediately for better UX
        setSelectedQuest(prev => {
            if (!prev) return null;
            const newTodoUserIds = isCurrentlyTodo
                ? (prev.quest.todoUserIds || []).filter(id => id !== currentUser.id)
                : [...(prev.quest.todoUserIds || []), currentUser.id];
            return { ...prev, quest: { ...prev.quest, todoUserIds: newTodoUserIds } };
        });
    };


    return (
        <>
            <div className="flex flex-row divide-x divide-stone-700/60 bg-stone-900/20">
                {days.map(day => (
                    <DayColumn
                        key={day.toISOString()}
                        day={day}
                        quests={quests}
                        questCompletions={questCompletions}
                        onSelectQuest={(quest) => setSelectedQuest({ quest, date: day })}
                    />
                ))}
            </div>
             {selectedQuest && (
                <QuestDetailDialog
                    quest={selectedQuest.quest}
                    onClose={() => setSelectedQuest(null)}
                    onComplete={() => handleStartCompletion(selectedQuest.quest, selectedQuest.date)}
                    onToggleTodo={handleToggleTodo}
                    isTodo={!!(currentUser && selectedQuest.quest.todoUserIds?.includes(currentUser.id))}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog
                    quest={completingQuest.quest}
                    onClose={() => setCompletingQuest(null)}
                    completionDate={completingQuest.date}
                />
            )}
        </>
    );
};

// Memoize DayColumn to prevent re-renders when other days' data changes.
const DayColumn = React.memo(({ day, quests, questCompletions, onSelectQuest }: { day: Date, quests: Quest[], questCompletions: QuestCompletion[], onSelectQuest: (quest: Quest) => void }) => {
    const calendarVentures = useCalendarVentures(day);
    const { currentUser } = useAppState();

    const sortedQuests = useMemo(() => {
        if (!currentUser) return [];
        const scheduledDuties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, day));
        const allQuestsForDay = [...scheduledDuties, ...calendarVentures];
        const uniqueQuests = Array.from(new Set(allQuestsForDay.map(q => q.id))).map(id => allQuestsForDay.find(q => q.id === id)!);
        return uniqueQuests.sort(questSorter(currentUser, questCompletions, day));
    }, [currentUser, day, quests, questCompletions, calendarVentures]);
    
    return (
        <div className="flex-1 min-w-[200px] flex flex-col">
            <div className="text-center font-semibold py-2 bg-stone-800/50 text-stone-300 border-b border-stone-700/60 flex-shrink-0">
                <p>{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                <p className="text-2xl">{day.getDate()}</p>
            </div>
            <div className="p-2 space-y-4 overflow-y-auto scrollbar-hide flex-grow h-[65vh]">
            <QuestList
                    date={day}
                    quests={sortedQuests}
                    questCompletions={questCompletions}
                    onQuestSelect={onSelectQuest}
                />
            </div>
        </div>
    );
});


export default WeekView;