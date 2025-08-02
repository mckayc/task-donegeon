import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, Role, ScheduledEvent } from '../../types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { toYMD } from '../../utils/quests';
import MonthView from '../calendar/MonthView';
import WeekView from '../calendar/WeekView';
import DayView from '../calendar/DayView';
import ChroniclesDayView from '../calendar/ChroniclesDayView';
import ChroniclesMonthView from '../calendar/ChroniclesMonthView';
import ChroniclesWeekView from '../calendar/ChroniclesWeekView';
import { Button } from '@/components/ui/button';
import ScheduleEventDialog from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';

type CalendarView = 'month' | 'week' | 'day';
type CalendarMode = 'quests' | 'chronicles';

const ViewButton: React.FC<{ type: CalendarView, currentView: CalendarView, setView: (view: CalendarView) => void, children: React.ReactNode }> = ({ type, currentView, setView, children }) => (
    <Button
        onClick={() => setView(type)}
        variant={currentView === type ? 'default' : 'ghost'}
        size="sm"
    >
        {children}
    </Button>
);

const CalendarPage: React.FC = () => {
    const { quests, currentUser, questCompletions, appMode, scheduledEvents } = useAppState();
    const { setActivePage } = useAppDispatch();
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

    const dateDisplay = useMemo(() => {
        if (view === 'month') return currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - currentDate.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, [currentDate, view]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Button onClick={() => changeDate(-1)} variant="outline">&larr;</Button>
                    <Button onClick={() => setCurrentDate(new Date())} variant="outline">Today</Button>
                    <Button onClick={() => changeDate(1)} variant="outline">&rarr;</Button>
                    <h2 className="text-2xl font-bold text-foreground ml-4">{dateDisplay}</h2>
                </div>
                <div className="flex items-center gap-4">
                    {currentUser.role !== Role.Explorer && (
                        <Button onClick={() => setEditingEvent({} as ScheduledEvent)}>Schedule Event</Button>
                    )}
                    <div className="p-1 bg-background rounded-lg flex gap-1">
                         <Button onClick={() => setMode('quests')} variant={mode === 'quests' ? 'default' : 'ghost'} size="sm">Quests</Button>
                         <Button onClick={() => setMode('chronicles')} variant={mode === 'chronicles' ? 'default' : 'ghost'} size="sm">History</Button>
                    </div>
                    <div className="p-1 bg-background rounded-lg flex gap-1">
                        <ViewButton type="month" currentView={view} setView={setView}>Month</ViewButton>
                        <ViewButton type="week" currentView={view} setView={setView}>Week</ViewButton>
                        <ViewButton type="day" currentView={view} setView={setView}>Day</ViewButton>
                    </div>
                </div>
            </header>
            <div className="flex-grow bg-card rounded-lg overflow-hidden">
                {mode === 'quests' ? (
                    <>
                        {view === 'month' && <MonthView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={setViewingEvent} />}
                        {view === 'week' && <WeekView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={setViewingEvent} />}
                        {view === 'day' && <DayView currentDate={currentDate} quests={filteredQuests} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={setViewingEvent} />}
                    </>
                ) : (
                     <>
                        {view === 'month' && <ChroniclesMonthView currentDate={currentDate} />}
                        {view === 'week' && <ChroniclesWeekView currentDate={currentDate} />}
                        {view === 'day' && <ChroniclesDayView currentDate={currentDate} />}
                    </>
                )}
            </div>
            {editingEvent && <ScheduleEventDialog event={editingEvent === {} as ScheduledEvent ? null : editingEvent} onClose={() => setEditingEvent(null)} />}
            {viewingEvent && <EventDetailDialog event={viewingEvent} onClose={() => setViewingEvent(null)} />}
        </div>
    );
};

export default CalendarPage;