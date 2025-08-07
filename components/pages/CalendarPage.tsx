import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Quest, Role, ScheduledEvent } from '../../types';
import Card from '../ui/Card';
import { toYMD } from '../../utils/quests';
import MonthView from '../calendar/MonthView';
import WeekView from '../calendar/WeekView';
import DayView from '../calendar/DayView';
import ChroniclesDayView from '../calendar/ChroniclesDayView';
import ChroniclesMonthView from '../calendar/ChroniclesMonthView';
import ChroniclesWeekView from '../calendar/ChroniclesWeekView';
import Button from '../ui/Button';
import ScheduleEventDialog from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';
import { useAuthState } from '../../context/AuthContext';

type CalendarView = 'month' | 'week' | 'day';
type CalendarMode = 'quests' | 'chronicles';

const ViewButton: React.FC<{ type: CalendarView, currentView: CalendarView, setView: (view: CalendarView) => void, children: React.ReactNode }> = ({ type, currentView, setView, children }) => (
    <button
        onClick={() => setView(type)}
        className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${currentView === type ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}
    >
        {children}
    </button>
);

const CalendarPage: React.FC = () => {
    const { scheduledEvents, quests, questCompletions } = useAppState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const { setActivePage } = useUIDispatch();
    const [view, setView] = useState<CalendarView>('month');
    const [mode, setMode] = useState<CalendarMode>('quests');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    
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

    const handleEventSelect = (event: ScheduledEvent) => {
        if (currentUser.role === Role.DonegeonMaster) {
            setEditingEvent(event);
        } else {
            setViewingEvent(event);
        }
    };

    const renderContent = () => {
        if (mode === 'chronicles') {
            switch (view) {
                case 'day': return <ChroniclesDayView currentDate={currentDate} />;
                case 'week': return <div className="overflow-x-auto scrollbar-hide"><ChroniclesWeekView currentDate={currentDate} /></div>;
                case 'month': return <ChroniclesMonthView currentDate={currentDate} />;
                default: return null;
            }
        }

        switch (view) {
            case 'month': return <MonthView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} />;
            case 'week': return <div className="overflow-x-auto scrollbar-hide"><WeekView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} /></div>;
            case 'day': return <DayView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} />;
            default: return null;
        }
    };

    return (
        <div>
            <Card>
                <div className="flex items-center justify-between p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <div className="flex items-center">
                        <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-stone-700 transition">&lt;</button>
                        <h2 className="text-2xl font-semibold text-emerald-300 mx-4 text-center w-auto min-w-[16rem] md:min-w-[24rem]">{getHeaderTitle()}</h2>
                        <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-stone-700 transition">&gt;</button>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentUser.role === Role.DonegeonMaster && (
                            <Button size="sm" onClick={() => setActivePage('Manage Events')}>Events</Button>
                        )}
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <button onClick={() => setMode('quests')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'quests' ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}>Quests</button>
                            <button onClick={() => setMode('chronicles')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'chronicles' ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'}`}>Chronicles</button>
                        </div>
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <ViewButton type="day" currentView={view} setView={setView}>Day</ViewButton>
                            <ViewButton type="week" currentView={view} setView={setView}>Week</ViewButton>
                            <ViewButton type="month" currentView={view} setView={setView}>Month</ViewButton>
                        </div>
                    </div>
                </div>
                {renderContent()}
            </Card>

            {editingEvent && (
                <ScheduleEventDialog event={editingEvent} onClose={() => setEditingEvent(null)} />
            )}
            {viewingEvent && (
                <EventDetailDialog event={viewingEvent} onClose={() => setViewingEvent(null)} />
            )}
        </div>
    );
};

export default CalendarPage;