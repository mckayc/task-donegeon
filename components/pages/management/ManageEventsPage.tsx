import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { ScheduledEvent } from '../../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toYMD } from '../../../utils/quests';
import ScheduleEventDialog from '../../admin/ScheduleEventDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

const ManageEventsPage: React.FC = () => {
    const { scheduledEvents, settings } = useAppState();
    const { deleteScheduledEvent } = useAppDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<ScheduledEvent | null>(null);

    const { upcoming, past } = useMemo(() => {
        const todayYMD = toYMD(new Date());
        const upcomingAndActive: ScheduledEvent[] = [];
        const pastEvents: ScheduledEvent[] = [];

        [...scheduledEvents]
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .forEach(event => {
                if (event.endDate < todayYMD) {
                    pastEvents.push(event);
                } else {
                    upcomingAndActive.push(event);
                }
            });
        
        return { upcoming: upcomingAndActive, past: pastEvents };
    }, [scheduledEvents]);

    const handleCreate = () => {
        setEditingEvent(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (event: ScheduledEvent) => {
        setEditingEvent(event);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingEvent) {
            deleteScheduledEvent(deletingEvent.id);
        }
        setDeletingEvent(null);
    };

    const EventRow: React.FC<{ event: ScheduledEvent }> = ({ event }) => {
        return (
            <div className="bg-background/50 p-4 rounded-lg flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `hsl(${event.color})` }}>
                        {event.icon || '🎉'}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(event.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(event.endDate + 'T00:00:00').toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(event)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingEvent(event)}>Delete</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Calendar Events</CardTitle>
                    <Button onClick={handleCreate}>Schedule New Event</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-foreground mb-3">Upcoming & Active Events</h3>
                            {upcoming.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming.map(event => <EventRow key={event.id} event={event} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No upcoming events are scheduled.</p>
                            )}
                        </div>
                        <div className="pt-6 border-t border-border">
                            <h3 className="text-xl font-semibold text-foreground mb-3">Past Events</h3>
                            {past.length > 0 ? (
                                <div className="space-y-3">
                                    {past.map(event => <EventRow key={event.id} event={event} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">There are no past events.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isDialogOpen && <ScheduleEventDialog event={editingEvent} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={!!deletingEvent}
                onClose={() => setDeletingEvent(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Event"
                message={`Are you sure you want to delete the event "${deletingEvent?.title}"? This is permanent.`}
            />
        </div>
    );
};

export default ManageEventsPage;