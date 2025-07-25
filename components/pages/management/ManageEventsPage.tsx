import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { ScheduledEvent } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
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
            <div className="bg-stone-800/60 p-4 rounded-lg flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `hsl(${event.color})` }}>
                        {event.icon || '🎉'}
                    </div>
                    <div>
                        <p className="font-bold text-stone-100">{event.title}</p>
                        <p className="text-sm text-stone-400">
                            {new Date(event.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(event.endDate + 'T00:00:00').toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(event)}>Edit</Button>
                    <Button variant="secondary" size="sm" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setDeletingEvent(event)}>Delete</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card
                title="Manage Calendar Events"
                headerAction={<Button onClick={handleCreate}>Schedule New Event</Button>}
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-stone-200 mb-3">Upcoming & Active Events</h3>
                        {upcoming.length > 0 ? (
                            <div className="space-y-3">
                                {upcoming.map(event => <EventRow key={event.id} event={event} />)}
                            </div>
                        ) : (
                            <p className="text-stone-400">No upcoming events are scheduled.</p>
                        )}
                    </div>
                    <div className="pt-6 border-t border-stone-700/60">
                        <h3 className="text-xl font-semibold text-stone-200 mb-3">Past Events</h3>
                        {past.length > 0 ? (
                            <div className="space-y-3">
                                {past.map(event => <EventRow key={event.id} event={event} />)}
                            </div>
                        ) : (
                            <p className="text-stone-400">There are no past events.</p>
                        )}
                    </div>
                </div>
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