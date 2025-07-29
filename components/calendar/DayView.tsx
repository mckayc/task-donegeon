import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType, ScheduledEvent } from '../../frontendTypes';
import QuestList from './QuestList';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { questSorter, isQuestScheduledForDay, toYMD } from '../../utils/quests';
import Card from '../ui/Card';

interface DayViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
    scheduledEvents: ScheduledEvent[];
    onEventSelect: (event: ScheduledEvent) => void;
}

const getTextColorForBg = (bgColorHsl: string) => {
    const parts = bgColorHsl.trim().replace(/%/g, '').split(' ').map(Number);
    if (parts.length < 3) return 'text-black';
    const l = parts[2];
    return l > 50 ? 'text-stone-900' : 'text-stone-100';
};

const DayView: React.FC<DayViewProps> = ({ currentDate, quests, questCompletions, scheduledEvents, onEventSelect }) => {
    const calendarVentures = useCalendarVentures(currentDate);
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const { currentUser, settings, appMode, scheduledEvents: allScheduledEvents } = useAppState();

    const scheduledDuties = useMemo(() => {
        if (!currentUser) return [];
        const duties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, currentDate));
        return duties.sort(questSorter(currentUser, questCompletions, allScheduledEvents, currentDate));
    }, [quests, currentDate, currentUser, questCompletions, allScheduledEvents]);
    
    const sortedVentures = useMemo(() => {
        if (!currentUser) return [];
        return [...calendarVentures].sort(questSorter(currentUser, questCompletions, allScheduledEvents, currentDate));
    }, [calendarVentures, currentUser, questCompletions, currentDate, allScheduledEvents]);
    
    const dailyEvents = useMemo(() => {
        const dateKey = toYMD(currentDate);
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return scheduledEvents.filter(event => {
            const scopeMatch = !event.guildId || event.guildId === currentGuildId;
            const dateMatch = dateKey >= event.startDate && dateKey <= event.endDate;
            return scopeMatch && dateMatch;
        });
    }, [currentDate, scheduledEvents, appMode]);

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
            <div className="p-4 h-[70vh] flex flex-col gap-6">
                {dailyEvents.length > 0 && (
                    <div className="flex-shrink-0">
                        <h3 className="text-xl font-bold text-stone-300 mb-2">Today's Events</h3>
                        <div className="space-y-2">
                             {dailyEvents.map(event => {
                                 const textColor = getTextColorForBg(event.color || '');
                                 return (
                                    <button
                                        key={event.id}
                                        onClick={() => onEventSelect(event)}
                                        className={`w-full text-left p-3 rounded font-bold flex items-center gap-2 ${textColor}`}
                                        style={{ backgroundColor: `hsl(${event.color})` }}
                                    >
                                        <span>{event.icon || '🎉'}</span>
                                        <span>{event.title}</span>
                                    </button>
                                 )
                             })}
                        </div>
                    </div>
                )}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
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