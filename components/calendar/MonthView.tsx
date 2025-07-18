import React, { useState, useMemo, useEffect } from 'react';
import { Quest, QuestCompletion, QuestAvailability, QuestType, QuestCompletionStatus } from '../../types';
import { toYMD } from '../../utils/quests';
import DailyDetailDialog from './DailyDetailDialog';
import { useAppState } from '../../context/AppContext';

interface MonthViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, quests, questCompletions }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { currentUser, appMode } = useAppState();

    useEffect(() => {
        setSelectedDate(null);
    }, [currentDate]);

    const questsByDate = useMemo(() => {
        const map = new Map<string, Quest[]>();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        quests.forEach(quest => {
            if (quest.type === QuestType.Venture && quest.lateDateTime) {
                const dateKey = toYMD(new Date(quest.lateDateTime));
                const collection = map.get(dateKey) || [];
                if (!collection.includes(quest)) collection.push(quest);
                map.set(dateKey, collection);
            } else if (quest.type === QuestType.Duty) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    let isScheduled = false;
                    switch (quest.availabilityType) {
                        case QuestAvailability.Daily: isScheduled = true; break;
                        case QuestAvailability.Weekly: if (quest.weeklyRecurrenceDays.includes(date.getDay())) isScheduled = true; break;
                        case QuestAvailability.Monthly: if (quest.monthlyRecurrenceDays.includes(date.getDate())) isScheduled = true; break;
                    }

                    if (isScheduled) {
                        const dateKey = toYMD(date);
                        const collection = map.get(dateKey) || [];
                        if (!collection.includes(quest)) collection.push(quest);
                        map.set(dateKey, collection);
                    }
                }
            }
        });
        return map;
    }, [quests, currentDate]);
    
    const completionsByDate = useMemo(() => {
        if (!currentUser) return new Map();
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const relevantCompletions = questCompletions.filter(c =>
            c.status === QuestCompletionStatus.Approved && c.userId === currentUser.id && c.guildId === currentGuildId
        );

        const map = new Map<string, QuestCompletion[]>();
        relevantCompletions.forEach(completion => {
            const dateKey = toYMD(new Date(completion.completedAt));
            const collection = map.get(dateKey) || [];
            collection.push(completion);
            map.set(dateKey, collection);
        });
        return map;
    }, [questCompletions, currentUser, appMode]);

    const pendingCompletionsByDate = useMemo(() => {
        if (!currentUser) return new Map();
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        const relevantCompletions = questCompletions.filter(c =>
            c.status === QuestCompletionStatus.Pending && c.userId === currentUser.id && c.guildId === currentGuildId
        );

        const map = new Map<string, QuestCompletion[]>();
        relevantCompletions.forEach(completion => {
            const dateKey = toYMD(new Date(completion.completedAt));
            const collection = map.get(dateKey) || [];
            collection.push(completion);
            map.set(dateKey, collection);
        });
        return map;
    }, [questCompletions, currentUser, appMode]);

    const visibleQuestsByDate = useMemo(() => {
        const map = new Map<string, Quest[]>();
        for (const [dateKey, questsOnDate] of questsByDate.entries()) {
            const completionsOnDate = completionsByDate.get(dateKey) || [];
            const pendingOnDate = pendingCompletionsByDate.get(dateKey) || [];
            const completedQuestIds = new Set([...completionsOnDate, ...pendingOnDate].map(c => c.questId));
            
            const incompleteQuests = questsOnDate.filter(q => !completedQuestIds.has(q.id));

            if (incompleteQuests.length > 0) {
                map.set(dateKey, incompleteQuests);
            }
        }
        return map;
    }, [questsByDate, completionsByDate, pendingCompletionsByDate]);

    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const numDays = endDay.getDate();
    const startDayOfWeek = startDay.getDay();
    const days: (Date | null)[] = Array.from({ length: startDayOfWeek }, () => null);
    for (let i = 1; i <= numDays; i++) { days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i)); }
    const today = new Date();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <>
            <div className="grid grid-cols-7 gap-px bg-stone-700/60 border-t border-l border-stone-700/60">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold py-2 bg-stone-800/50 text-stone-300 text-sm">{day}</div>
                ))}
                {days.map((day, index) => {
                    const isToday = day && toYMD(day) === toYMD(today);
                    const dateKey = day ? toYMD(day) : '';
                    const dailyQuestsToShow = visibleQuestsByDate.get(dateKey) || [];
                    const dailyCompletions = completionsByDate.get(dateKey) || [];
                    const dailyPending = pendingCompletionsByDate.get(dateKey) || [];
                    const totalIndicators = dailyCompletions.length + dailyPending.length;
                    
                    return (
                        <div
                            key={index}
                            role={day ? 'button' : 'presentation'}
                            tabIndex={day ? 0 : -1}
                            onClick={day ? () => setSelectedDate(day) : undefined}
                            onKeyDown={day ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedDate(day);
                                }
                            } : undefined}
                            className={`relative h-32 md:h-40 p-2 text-left align-top bg-stone-800 text-stone-300 overflow-hidden focus:z-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 ring-inset ${day ? 'hover:bg-stone-700/50 transition-colors duration-150 cursor-pointer' : 'bg-stone-900/50 cursor-default'} ${isToday ? 'border-2 border-emerald-500' : 'border-b border-r border-stone-700/60'}`}
                        >
                            {day && <span className="font-bold">{day.getDate()}</span>}
                            <div className="mt-1 space-y-1">
                                {dailyQuestsToShow.slice(0, 4).map(quest => (
                                    <div
                                        key={quest.id}
                                        className={`w-full text-left text-xs px-1.5 py-1 rounded-md truncate flex items-center gap-1.5 ${quest.type === QuestType.Duty ? 'bg-sky-900/50 text-sky-300' : 'bg-amber-900/50 text-amber-300'} ${quest.isOptional ? 'opacity-70' : ''}`}
                                    >
                                        {quest.icon && <span className="flex-shrink-0">{quest.icon}</span>}
                                        <span title={quest.title} className="truncate">{quest.title}</span>
                                    </div>
                                ))}
                                {dailyQuestsToShow.length > 4 && <div className="text-xs text-stone-500 pl-1.5">...and more</div>}
                            </div>
                            {(dailyCompletions.length > 0 || dailyPending.length > 0) && (
                                <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1">
                                    {dailyCompletions.slice(0, 5).map((comp: QuestCompletion) => (<div key={comp.id} className="w-2 h-2 rounded-full bg-green-500" title="Quest Completed"></div>))}
                                    {dailyPending.slice(0, Math.max(0, 5 - dailyCompletions.length)).map((comp: QuestCompletion) => (<div key={comp.id} className="w-2 h-2 rounded-full bg-yellow-400" title="Pending Approval"></div>))}
                                    {totalIndicators > 5 && <div className="w-2 h-2 rounded-full bg-stone-500 flex items-center justify-center text-white text-[8px] font-bold" title={`${totalIndicators - 5} more`}>+</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <DailyDetailDialog
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    scheduledQuests={questsByDate.get(toYMD(selectedDate)) || []}
                    completedForDay={completionsByDate.get(toYMD(selectedDate)) || []}
                    pendingForDay={pendingCompletionsByDate.get(toYMD(selectedDate)) || []}
                    questCompletions={questCompletions}
                />
            )}
        </>
    );
};

export default MonthView;