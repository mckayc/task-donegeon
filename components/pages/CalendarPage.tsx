
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { Quest, QuestType, QuestCompletion, QuestCompletionStatus, QuestAvailability } from '../../types';
import Card from '../ui/Card';
import { toYMD } from '../../utils/quests';
import MonthView from '../calendar/MonthView';
import WeekView from '../calendar/WeekView';
import DayView from '../calendar/DayView';

type CalendarView = 'month' | 'week' | 'day';

const CalendarPage: React.FC = () => {
    const { quests, currentUser, questCompletions, appMode } = useAppState();
    const [view, setView] = useState<CalendarView>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    
    if (!currentUser) return null;

    const filteredQuests = useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return quests.filter(q => {
            if (!q.isActive || q.guildId !== currentGuildId) return false;
            if (q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) return false;
            return true;
        });
    }, [quests, currentUser, appMode]);

    const changeDate = (offset: number) => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(currentDate.getMonth() + offset);
        else if (view === 'week') newDate.setDate(currentDate.getDate() + (offset * 7));
        else newDate.setDate(currentDate.getDate() + offset);
        setCurrentDate(newDate);
    };
    
    const getHeaderTitle = () => {
        switch (view) {
            case 'month':
                return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            case 'week':
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
            case 'day':
                return currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };
    
    const ViewButton: React.FC<{ type: CalendarView, children: React.ReactNode }> = ({ type, children }) => (
        <button
            onClick={() => setView(type)}
            className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${view === type ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <Card>
                <div className="flex items-center justify-between p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <div className="flex items-center">
                        <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-stone-700 transition">&lt;</button>
                        <h2 className="text-2xl font-semibold text-emerald-300 mx-4 text-center w-64">{getHeaderTitle()}</h2>
                        <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-stone-700 transition">&gt;</button>
                    </div>
                     <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                        <ViewButton type="day">Day</ViewButton>
                        <ViewButton type="week">Week</ViewButton>
                        <ViewButton type="month">Month</ViewButton>
                    </div>
                </div>

                {view === 'month' && <MonthView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} />}
                {view === 'week' && <WeekView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} />}
                {view === 'day' && <DayView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} />}

            </Card>
        </div>
    );
};

export default CalendarPage;