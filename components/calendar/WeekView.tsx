import React, { useState, useMemo } from 'react';
import { Quest, QuestCompletion, QuestAvailability, QuestType, QuestCompletionStatus } from '../../types';
import { toYMD } from '../../utils/quests';
import DailyDetailDialog from './DailyDetailDialog';
import { useAppState } from '../../context/AppContext';

interface WeekViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, quests, questCompletions }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { currentUser, appMode } = useAppState();

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

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-stone-700/60 bg-stone-900/20">
                {days.map(day => {
                    const dateKey = toYMD(day);
                    const dueQuests = questsByDate.get(dateKey) || [];
                    const completedQuests = completionsByDate.get(dateKey) || [];
                    const pendingQuests = pendingCompletionsByDate.get(dateKey) || [];
                    
                    const incompleteDuties = dueQuests.filter(q => q.type === QuestType.Duty && ![...completedQuests, ...pendingQuests].map(c => c.questId).includes(q.id)).length;
                    const incompleteVentures = dueQuests.filter(q => q.type === QuestType.Venture && ![...completedQuests, ...pendingQuests].map(c => c.questId).includes(q.id)).length;


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
                               {incompleteDuties > 0 && <div className="text-xs text-center p-1 rounded bg-sky-900/50 text-sky-300">{incompleteDuties} Duties</div>}
                               {incompleteVentures > 0 && <div className="text-xs text-center p-1 rounded bg-amber-900/50 text-amber-300">{incompleteVentures} Ventures</div>}
                               {pendingQuests.length > 0 && <div className="text-xs text-center p-1 rounded bg-yellow-900/50 text-yellow-300">{pendingQuests.length} Pending</div>}
                               {completedQuests.length > 0 && <div className="text-xs text-center p-1 rounded bg-green-900/50 text-green-300">{completedQuests.length} Done</div>}
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