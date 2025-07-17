import React, { useState, useMemo } from 'react';
import { Quest, QuestCompletion, QuestAvailability, QuestType, QuestCompletionStatus, ChronicleEvent, UserTrophy, AdminAdjustment, PurchaseRequest, AdminAdjustmentType, SystemLog } from '../../types';
import { toYMD } from '../../utils/quests';
import DailyDetailDialog from './DailyDetailDialog';
import { useAppState } from '../../context/AppContext';
import ChronicleDetailDialog from './ChronicleDetailDialog';

interface MonthViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
    mode: 'quests' | 'chronicles';
}

const getChronicleIcon = (type: ChronicleEvent['type']): string => {
    switch (type) {
        case 'Quest': return '✅';
        case 'Purchase': return '💰';
        case 'Trophy': return '🏆';
        case 'Adjustment': return '🛠️';
        case 'System': return '⚙️';
        default: return '📜';
    }
};

const MonthView: React.FC<MonthViewProps> = ({ currentDate, quests, questCompletions, mode }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { currentUser, appMode, purchaseRequests, userTrophies, adminAdjustments, systemLogs, trophies, rewardTypes } = useAppState();

    const chroniclesByDate = useMemo(() => {
        if (!currentUser || mode !== 'chronicles') return new Map<string, ChronicleEvent[]>();
    
        const map = new Map<string, ChronicleEvent[]>();
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
    
        const addEvent = (event: ChronicleEvent) => {
            const dateKey = toYMD(new Date(event.date));
            const collection = map.get(dateKey) || [];
            collection.push(event);
            map.set(dateKey, collection);
        };
    
        questCompletions.forEach(c => {
            if (c.userId === currentUser.id && c.guildId === currentGuildId) {
                addEvent({ id: c.id, date: c.completedAt, type: 'Quest', title: '', status: '', icon: '✅', color: '' });
            }
        });
    
        purchaseRequests.forEach(p => {
            if (p.userId === currentUser.id && p.guildId === currentGuildId) {
                addEvent({ id: p.id, date: p.requestedAt, type: 'Purchase', title: '', status: '', icon: '💰', color: '' });
            }
        });
    
        userTrophies.forEach(ut => {
            if (ut.userId === currentUser.id && ut.guildId === currentGuildId) {
                const trophy = trophies.find(t => t.id === ut.trophyId);
                addEvent({ id: ut.id, date: ut.awardedAt, type: 'Trophy', title: '', status: '', icon: trophy?.icon || '🏆', color: '' });
            }
        });
    
        adminAdjustments.forEach(adj => {
            if (adj.userId === currentUser.id && adj.guildId === currentGuildId) {
                addEvent({ id: adj.id, date: adj.adjustedAt, type: 'Adjustment', title: '', status: '', icon: '🛠️', color: '' });
            }
        });
    
        systemLogs.forEach(log => {
            const quest = quests.find(q => q.id === log.questId);
            if (quest && quest.guildId === currentGuildId && log.userIds.includes(currentUser.id)) {
                addEvent({ id: log.id, date: log.timestamp, type: 'System', title: '', status: '', icon: '⚙️', color: '' });
            }
        });
    
        return map;
    }, [currentUser, mode, appMode, questCompletions, purchaseRequests, userTrophies, adminAdjustments, systemLogs, quests, trophies, rewardTypes]);

    const questsByDate = useMemo(() => {
        if (mode !== 'quests') return new Map();

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
    }, [quests, currentDate, mode]);
    
    const completionsByDate = useMemo(() => {
        if (!currentUser || mode !== 'quests') return new Map();
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
    }, [questCompletions, currentUser, appMode, mode]);

    const pendingCompletionsByDate = useMemo(() => {
        if (!currentUser || mode !== 'quests') return new Map();
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
    }, [questCompletions, currentUser, appMode, mode]);

    const visibleQuestsByDate = useMemo(() => {
        if (mode !== 'quests') return new Map();
        const map = new Map<string, Quest[]>();
        for (const [dateKey, questsOnDate] of questsByDate.entries()) {
            const completionsOnDate = completionsByDate.get(dateKey) || [];
            const pendingOnDate = pendingCompletionsByDate.get(dateKey) || [];
            const completedQuestIds = new Set([...completionsOnDate, ...pendingOnDate].map(c => c.questId));
            
            const incompleteQuests = questsOnDate.filter((q: Quest) => !completedQuestIds.has(q.id));

            if (incompleteQuests.length > 0) {
                map.set(dateKey, incompleteQuests);
            }
        }
        return map;
    }, [questsByDate, completionsByDate, pendingCompletionsByDate, mode]);

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
                    
                    const dailyChronicles = mode === 'chronicles' ? (chroniclesByDate.get(dateKey) || []) : [];
                    const dailyQuestsToShow = mode === 'quests' ? (visibleQuestsByDate.get(dateKey) || []) : [];
                    const dailyCompletions = mode === 'quests' ? (completionsByDate.get(dateKey) || []) : [];
                    const dailyPending = mode === 'quests' ? (pendingCompletionsByDate.get(dateKey) || []) : [];
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
                            {mode === 'quests' ? (
                                <>
                                    <div className="mt-1 space-y-1">
                                        {dailyQuestsToShow.slice(0, 4).map((quest: Quest) => (
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
                                </>
                            ) : (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {dailyChronicles.slice(0, 15).map(event => (
                                        <span key={event.id} title={event.type}>{getChronicleIcon(event.type)}</span>
                                    ))}
                                    {dailyChronicles.length > 15 && <span className="text-xs text-stone-500">+...</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDate && mode === 'quests' && (
                <DailyDetailDialog
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    scheduledQuests={questsByDate.get(toYMD(selectedDate)) || []}
                    completedForDay={completionsByDate.get(toYMD(selectedDate)) || []}
                    pendingForDay={pendingCompletionsByDate.get(toYMD(selectedDate)) || []}
                    questCompletions={questCompletions}
                />
            )}
             {selectedDate && mode === 'chronicles' && (
                <ChronicleDetailDialog
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </>
    );
};

export default MonthView;