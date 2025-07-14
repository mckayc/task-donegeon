import React, { useState, useMemo } from 'react';
import { Quest, QuestCompletion, QuestAvailability, QuestType, QuestCompletionStatus } from '../../types';
import { toYMD } from '../../utils/quests';
import DailyDetailDialog from './DailyDetailDialog';

interface WeekViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, quests, questCompletions }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });
    
    const questsByDate = useMemo(() => {
        const map = new Map<string, Quest[]>();
        days.forEach(day => {
            const dateKey = toYMD(day);
            quests.forEach(quest => {
                let isScheduled = false;
                if (quest.type === QuestType.Venture && quest.lateDateTime) {
                    if (toYMD(new Date(quest.lateDateTime)) === dateKey) isScheduled = true;
                } else if (quest.type === QuestType.Duty) {
                    switch (quest.availabilityType) {
                        case QuestAvailability.Daily: isScheduled = true; break;
                        case QuestAvailability.Weekly: if (quest.weeklyRecurrenceDays.includes(day.getDay())) isScheduled = true; break;
                        case QuestAvailability.Monthly: if (quest.monthlyRecurrenceDays.includes(day.getDate())) isScheduled = true; break;
                    }
                }
                if (isScheduled) {
                    const collection = map.get(dateKey) || [];
                    if (!collection.includes(quest)) collection.push(quest);
                    map.set(dateKey, collection);
                }
            });
        });
        return map;
    }, [quests, days]);

    const completionsByDate = useMemo(() => {
        const map = new Map<string, QuestCompletion[]>();
        questCompletions.forEach(comp => {
            if (comp.status === QuestCompletionStatus.Approved) {
                const dateKey = toYMD(new Date(comp.completedAt));
                map.set(dateKey, [...(map.get(dateKey) || []), comp]);
            }
        });
        return map;
    }, [questCompletions]);

     const pendingCompletionsByDate = useMemo(() => {
        const map = new Map<string, QuestCompletion[]>();
        questCompletions.forEach(comp => {
            if (comp.status === QuestCompletionStatus.Pending) {
                const dateKey = toYMD(new Date(comp.completedAt));
                map.set(dateKey, [...(map.get(dateKey) || []), comp]);
            }
        });
        return map;
    }, [questCompletions]);

    return (
        <>
            <div className="grid grid-cols-7 divide-x divide-stone-700/60 bg-stone-900/20">
                {days.map(day => {
                    const dateKey = toYMD(day);
                    const dueQuests = questsByDate.get(dateKey) || [];
                    const completedQuests = completionsByDate.get(dateKey) || [];
                    const pendingQuests = pendingCompletionsByDate.get(dateKey) || [];
                    const incompleteCount = dueQuests.length - completedQuests.length - pendingQuests.length;

                    return (
                        <div key={day.toISOString()} className="flex-1 min-w-[120px]">
                            <div className="text-center font-semibold py-2 bg-stone-800/50 text-stone-300 border-b border-stone-700/60">
                                <p>{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                                <p className="text-2xl">{day.getDate()}</p>
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedDate(day)}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedDate(day)}
                                className="p-2 space-y-2 h-48 overflow-y-auto scrollbar-hide cursor-pointer hover:bg-stone-700/30 transition-colors"
                            >
                                {incompleteCount > 0 && <span className="block text-center text-sm font-bold text-amber-400">{incompleteCount} To-Do</span>}
                                {pendingQuests.length > 0 && <span className="block text-center text-sm text-yellow-500">{pendingQuests.length} Pending</span>}
                                {completedQuests.length > 0 && <span className="block text-center text-sm text-green-500">{completedQuests.length} Done</span>}
                                {dueQuests.length === 0 && <div className="h-full w-full opacity-30"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <DailyDetailDialog
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    dueQuests={questsByDate.get(toYMD(selectedDate)) || []}
                    completedForDay={completionsByDate.get(toYMD(selectedDate)) || []}
                    pendingForDay={pendingCompletionsByDate.get(toYMD(selectedDate)) || []}
                />
            )}
        </>
    );
};

export default WeekView;
