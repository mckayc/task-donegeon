import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType } from '../../types';
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
    const { currentUser, settings } = useAppState();

    const { duties, ventures } = useMemo(() => {
        if (!currentUser) return { duties: [], ventures: [] };
        
        const scheduledDuties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, currentDate));
        
        const allDuties = [...scheduledDuties].sort(questSorter(currentUser, questCompletions, currentDate));
        const allVentures = [...calendarVentures].sort(questSorter(currentUser, questCompletions, currentDate));
        
        return { duties: allDuties, ventures: allVentures };
    }, [currentUser, quests, calendarVentures, currentDate, questCompletions]);


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
                 {duties.length === 0 && ventures.length === 0 ? (
                     <div className="flex items-center justify-center h-full">
                         <p className="text-stone-400 text-center py-8">No quests scheduled for this day.</p>
                     </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-sky-400 border-b-2 border-sky-800/50 pb-2 mb-4">{settings.terminology.recurringTasks}</h3>
                             {duties.length > 0 ? (
                                <QuestList
                                    date={currentDate}
                                    quests={duties}
                                    questCompletions={questCompletions}
                                    onQuestSelect={setSelectedQuest}
                                />
                            ) : <p className="text-sm text-stone-500 italic">No {settings.terminology.recurringTasks.toLowerCase()} for today.</p>}
                        </div>
                         <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-amber-400 border-b-2 border-amber-800/50 pb-2 mb-4">{settings.terminology.singleTasks}</h3>
                             {ventures.length > 0 ? (
                                <QuestList
                                    date={currentDate}
                                    quests={ventures}
                                    questCompletions={questCompletions}
                                    onQuestSelect={setSelectedQuest}
                                />
                            ) : <p className="text-sm text-stone-500 italic">No {settings.terminology.singleTasks.toLowerCase()} for today.</p>}
                        </div>
                    </div>
                 )}
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
