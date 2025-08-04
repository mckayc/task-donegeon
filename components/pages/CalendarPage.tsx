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
import EventDetailDialog from '@/components/calendar/EventDetailDialog';
import ScheduleEventDialog from '@/components/admin/ScheduleEventDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';

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
    const { deleteScheduledEvent } = useAppDispatch();
    const [view, setView] = useState<CalendarView>('month');
    const [mode, setMode] = useState<CalendarMode>('quests');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);

    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<ScheduledEvent | null>(null);


    const handleDateChange = (offset: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (view === 'month') newDate.setMonth(prevDate.getMonth() + offset);
            else if (view === 'week') newDate.setDate(prevDate.getDate() + (offset * 7));
            else newDate.setDate(prevDate.getDate() + offset);
            return newDate;
        });
    };
    
    const handleEventSelect = (event: ScheduledEvent) => {
        setSelectedEvent(event);
    };

    const handleEditEvent = (event: ScheduledEvent) => {
        setSelectedEvent(null); // Close the detail dialog
        setEditingEvent(event);
        setIsScheduleDialogOpen(true);
    };

    const handleCreateEvent = () => {
        setEditingEvent(null);
        setIsScheduleDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingEvent) {
            deleteScheduledEvent(deletingEvent.id);
        }
        setDeletingEvent(null);
    };


    const questsForView = useMemo(() => {
        if (!currentUser) return [];
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return quests.filter(q => {
            if (!q.isActive) return false;
            if (q.guildId !== currentGuildId) return false;
            if (q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) return false;
            return true;
        });
    }, [quests, currentUser, appMode]);

    const title = useMemo(() => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric' };
        if (view === 'month') options.month = 'long';
        else if (view === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                return `${startOfWeek.toLocaleDateString('default', { month: 'long' })} ${startOfWeek.getFullYear()}`;
            } else {
                 return `${startOfWeek.toLocaleDateString('default', { month: 'short' })} - ${endOfWeek.toLocaleDateString('default', { month: 'short' })} ${endOfWeek.getFullYear()}`;
            }
        } else {
             options.month = 'long';
             options.day = 'numeric';
        }
        return currentDate.toLocaleDateString('default', options);
    }, [currentDate, view]);

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)}>&larr;</Button>
                        <h2 className="text-2xl font-bold text-center w-64">{title}</h2>
                        <Button variant="outline" size="sm" onClick={() => handleDateChange(1)}>&rarr;</Button>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex space-x-1 p-1 bg-background rounded-lg">
                            <Button onClick={() => setMode('quests')} variant={mode === 'quests' ? 'default' : 'ghost'} size="sm">Quests</Button>
                            <Button onClick={() => setMode('chronicles')} variant={mode === 'chronicles' ? 'default' : 'ghost'} size="sm">Chronicles</Button>
                        </div>
                        <div className="flex space-x-1 p-1 bg-background rounded-lg">
                            <ViewButton type="month" currentView={view} setView={setView}>Month</ViewButton>
                            <ViewButton type="week" currentView={view} setView={setView}>Week</ViewButton>
                            <ViewButton type="day" currentView={view} setView={setView}>Day</ViewButton>
                        </div>
                         {currentUser?.role === Role.DonegeonMaster && (
                            <Button onClick={handleCreateEvent}>Schedule New Event</Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {(() => {
                        if (mode === 'quests') {
                            switch (view) {
                                case 'month': return <MonthView currentDate={currentDate} quests={questsForView} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} />;
                                case 'week': return <WeekView currentDate={currentDate} quests={questsForView} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} />;
                                case 'day': return <DayView currentDate={currentDate} quests={questsForView} questCompletions={questCompletions} scheduledEvents={scheduledEvents} onEventSelect={handleEventSelect} />;
                            }
                        } else { // Chronicles mode
                             switch (view) {
                                case 'month': return <ChroniclesMonthView currentDate={currentDate} />;
                                case 'week': return <ChroniclesWeekView currentDate={currentDate} />;
                                case 'day': return <ChroniclesDayView currentDate={currentDate} />;
                            }
                        }
                    })()}
                </CardContent>
            </Card>

            {selectedEvent && (
                <EventDetailDialog
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={handleEditEvent}
                    onDelete={(event) => { setSelectedEvent(null); setDeletingEvent(event); }}
                />
            )}

            {isScheduleDialogOpen && (
                <ScheduleEventDialog
                    event={editingEvent}
                    onClose={() => setIsScheduleDialogOpen(false)}
                />
            )}

            {deletingEvent && (
                 <ConfirmDialog
                    isOpen={!!deletingEvent}
                    onClose={() => setDeletingEvent(null)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Event"
                    message={`Are you sure you want to delete the event "${deletingEvent.title}"?`}
                />
            )}
        </div>
    );
};

export default CalendarPage;