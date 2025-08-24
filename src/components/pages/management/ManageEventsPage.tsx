import React, { useState, useMemo } from 'react';
import { ScheduledEvent } from 'types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { toYMD } from '../../../utils/quests';
import { ScheduleEventDialog } from '../../admin/ScheduleEventDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import EventList from '../../events/EventList';

const ManageEventsPage: React.FC = () => {
    const { settings, scheduledEvents } = useSystemState();
    const { deleteScheduledEvent } = useSystemDispatch();
    
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

    const handleDelete = (event: ScheduledEvent) => {
        setDeletingEvent(event);
    };

    const handleConfirmDelete = () => {
        if (deletingEvent) {
            deleteScheduledEvent(deletingEvent.id);
        }
        setDeletingEvent(null);
    };

    return (
        <div className="space-y-6">
            <Card
                title={settings.terminology.link_manage_events}
                headerAction={<Button onClick={handleCreate}>Schedule New Event</Button>}
            >
                <EventList 
                    upcomingEvents={upcoming}
                    pastEvents={past}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
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