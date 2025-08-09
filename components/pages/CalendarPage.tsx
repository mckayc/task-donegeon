import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Role, ScheduledEvent } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ScheduleEventDialog from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';
import { useAuthState } from '../../context/AuthContext';
import ChroniclesDayView from '../calendar/ChroniclesDayView';
import ChroniclesMonthView from '../calendar/ChroniclesMonthView';
import ChroniclesWeekView from '../calendar/ChroniclesWeekView';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { EventClickArg } from '@fullcalendar/core';

type CalendarView = 'month' | 'week' | 'day';
type CalendarMode = 'quests' | 'chronicles';

const ViewButton: React.FC<{ type: CalendarView, currentView: CalendarView, setView: (view: CalendarView) => void, children: React.ReactNode }> = ({ type, currentView, setView, children }) => (
    <button
        onClick={() => setView(type)}
        className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${currentView === type ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}
    >
        {children}
    </button>
);

const CalendarPage: React.FC = () => {
    const { settings, scheduledEvents } = useAppState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const { setActivePage } = useUIDispatch();
    const [view, setView] = useState<CalendarView>('month');
    const [mode, setMode] = useState<CalendarMode>('quests');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    
    if (!currentUser) return null;

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

        const appEventSource = scheduledEvents
            .filter(event => {
                const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
                return !event.guildId || event.guildId === currentGuildId;
            })
            .map(event => ({
                title: event.title,
                start: event.startDate,
                end: new Date(new Date(event.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Add one day to make it inclusive
                backgroundColor: `hsl(${event.color})`,
                borderColor: `hsl(${event.color})`,
                allDay: event.isAllDay,
                extendedProps: { appEvent: event }
            }));

        const eventSources: any[] = [appEventSource];
        
        if (settings.googleCalendar.enabled && settings.googleCalendar.apiKey && settings.googleCalendar.calendarId) {
            eventSources.push({
                googleCalendarId: settings.googleCalendar.calendarId,
                className: 'gcal-event',
                color: 'hsl(217 91% 60%)'
            });
        }
        
        const handleEventClick = (clickInfo: EventClickArg) => {
            if (clickInfo.event.extendedProps.appEvent) {
                handleEventSelect(clickInfo.event.extendedProps.appEvent);
            } else if (clickInfo.event.url) {
                window.open(clickInfo.event.url, '_blank');
            }
        };

        return (
            <>
                <style>{`
                    .fc-license-message { display: none !important; }
                    .fc { 
                      --fc-bg-event-color: hsl(var(--primary));
                      --fc-border-color: hsl(var(--border));
                      --fc-daygrid-event-dot-width: 8px;
                      --fc-list-event-dot-width: 10px;
                      --fc-list-event-hover-bg-color: hsl(var(--secondary));
                    }
                    .fc .fc-toolbar-title { font-family: var(--font-display); color: hsl(var(--accent)); }
                    .fc .fc-button-primary { background-color: hsl(var(--secondary)); border-color: hsl(var(--border)); color: hsl(var(--foreground)); }
                    .fc .fc-button-primary:hover { background-color: hsl(var(--accent) / 0.5); }
                    .fc .fc-button-primary:disabled { background-color: hsl(var(--muted)); }
                    .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
                    .fc-daygrid-day.fc-day-today { background-color: hsl(var(--accent) / 0.1); }
                    .fc-daygrid-day-number { color: hsl(var(--foreground)); }
                    .fc-day-past .fc-daygrid-day-number { color: hsl(var(--muted-foreground)); }
                    .fc-event { border: 1px solid hsl(var(--border)) !important; }
                    .fc-event.gcal-event { background-color: hsl(217 91% 60%) !important; border-color: hsl(217 91% 70%) !important; }
                `}</style>
                 <div className="p-4">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        initialView="dayGridMonth"
                        googleCalendarApiKey={settings.googleCalendar.apiKey || undefined}
                        eventSources={eventSources}
                        eventClick={handleEventClick}
                        height="auto"
                        contentHeight="auto"
                        aspectRatio={1.5}
                    />
                 </div>
            </>
        );
    };

    return (
        <div>
            <Card>
                <div className="flex items-center justify-between p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    {mode === 'chronicles' && (
                         <div className="flex items-center">
                            <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-stone-700 transition">&lt;</button>
                            <h2 className="text-2xl font-semibold text-emerald-300 mx-4 text-center w-auto min-w-[16rem] md:min-w-[24rem]">{getHeaderTitle()}</h2>
                            <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-stone-700 transition">&gt;</button>
                        </div>
                    )}
                    <div className="flex items-center gap-4 ml-auto">
                        {currentUser.role === Role.DonegeonMaster && (
                            <Button size="sm" onClick={() => setActivePage('Manage Events')}>Events</Button>
                        )}
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <button onClick={() => setMode('quests')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'quests' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>Events</button>
                            <button onClick={() => setMode('chronicles')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'chronicles' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>Chronicles</button>
                        </div>
                        {mode === 'chronicles' && (
                             <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                                <ViewButton type="day" currentView={view} setView={setView}>Day</ViewButton>
                                <ViewButton type="week" currentView={view} setView={setView}>Week</ViewButton>
                                <ViewButton type="month" currentView={view} setView={setView}>Month</ViewButton>
                            </div>
                        )}
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