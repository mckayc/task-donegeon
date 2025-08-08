import React, { useMemo, useState } from 'react';
import { Quest, QuestCompletion, QuestType, ScheduledEvent } from '../../types';
import { isQuestScheduledForDay, questSorter, toYMD } from '../../utils/quests';
import { useAppState } from '../../context/AppContext';
import { useUIState } from '../../context/UIStateContext';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import QuestList from './QuestList';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useAuthState } from '../../context/AuthContext';
import { useQuestDispatch } from '../../context/QuestContext';

interface WeekViewProps {
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

const WeekView: React.FC<WeekViewProps> = ({ currentDate, quests, questCompletions, scheduledEvents, onEventSelect }) => {
    const { currentUser } = useAuthState();
    const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestDispatch();
    const [selectedQuest, setSelectedQuest] = useState<{quest: Quest, date: Date} | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{quest: Quest, date: Date} | null>(null);

    const days = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    }, [currentDate]);

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
                        scheduledEvents={scheduledEvents}
                        onSelectQuest={(quest) => setSelectedQuest({ quest, date: day })}
                        onEventSelect={onEventSelect}
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
const DayColumn = React.memo(({ day, quests, questCompletions, scheduledEvents, onSelectQuest, onEventSelect }: { day: Date, quests: Quest[], questCompletions: QuestCompletion[], scheduledEvents: ScheduledEvent[], onSelectQuest: (quest: Quest) => void, onEventSelect: (event: ScheduledEvent) => void }) => {
    const calendarVentures = useCalendarVentures(day);
    const { scheduledEvents: allScheduledEvents } = useAppState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();

    const sortedQuests = useMemo(() => {
        if (!currentUser) return [];
        const scheduledDuties = quests.filter(q => q.type === QuestType.Duty && isQuestScheduledForDay(q, day));
        const allQuestsForDay = [...scheduledDuties, ...calendarVentures];
        const uniqueQuests = Array.from(new Set(allQuestsForDay.map(q => q.id))).map(id => allQuestsForDay.find(q => q.id === id)!);
        return uniqueQuests.sort(questSorter(currentUser, questCompletions, allScheduledEvents, day));
    }, [currentUser, day, quests, questCompletions, calendarVentures, allScheduledEvents]);
    
    const dailyEvents = useMemo(() => {
        const dateKey = toYMD(day);
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return scheduledEvents.filter(event => {
            const scopeMatch = !event.guildId || event.guildId === currentGuildId;
            const dateMatch = dateKey >= event.startDate && dateKey <= event.endDate;
            return scopeMatch && dateMatch;
        });
    }, [day, scheduledEvents, appMode]);

    const isToday = toYMD(day) === toYMD(new Date());

    return (
        <div className={`flex-1 min-w-[200px] flex flex-col ${isToday ? 'bg-emerald-900/20' : ''}`}>
            <div className={`text-center font-semibold py-2 ${isToday ? 'bg-emerald-800/30' : 'bg-stone-800/50'} text-stone-300 border-b border-stone-700/60 flex-shrink-0`}>
                <p>{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                <p className="text-2xl">{day.getDate()}</p>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto scrollbar-hide flex-grow h-[65vh]">
                {dailyEvents.map(event => {
                    const textColor = getTextColorForBg(event.color || '');
                    return (
                        <button
                            key={event.id}
                            onClick={() => onEventSelect(event)}
                            className={`w-full text-left text-xs px-1.5 py-1 rounded font-bold truncate flex items-center gap-1 ${textColor}`}
                            style={{ backgroundColor: `hsl(${event.color})` }}
                        >
                           <span>{event.icon || '🎉'}</span>
                           <span className="truncate">{event.title}</span>
                        </button>
                    )
                })}
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