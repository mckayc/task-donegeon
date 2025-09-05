import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScheduledEvent } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { toYMD } from '../../../utils/quests';
import { ScheduleEventDialog } from '../../admin/ScheduleEventDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import EventList from '../../events/EventList';
import { useUIState } from '../../../context/UIContext';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';

const EventCard: React.FC<{
    event: ScheduledEvent;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (event: ScheduledEvent) => void;
    onDeleteRequest: (event: ScheduledEvent) => void;
}> = ({ event, isSelected, onToggle, onEdit, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4 border border-stone-700">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `hsl(${event.color})` }}>
                {event.icon || '🎉'}
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{event.title}</p>
                <p className="text-sm text-stone-400">
                    {new Date(event.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(event.endDate + 'T00:00:00').toLocaleDateString()}
                </p>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(event); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onDeleteRequest(event); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};


const ManageEventsPage: React.FC = () => {
    const { settings, scheduledEvents } = useSystemState();
    const { deleteScheduledEvent } = useSystemDispatch();
    const { isMobileView } = useUIState();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<ScheduledEvent | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    
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

    const eventIds = useMemo(() => scheduledEvents.map(e => e.id), [scheduledEvents]);
    const handleCheckboxClick = useShiftSelect(eventIds, selectedEvents, setSelectedEvents);

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
                {isMobileView ? (
                    <div className="space-y-3">
                        {upcoming.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                isSelected={selectedEvents.includes(event.id)}
                                onToggle={(e) => handleCheckboxClick(e, event.id)}
                                onEdit={handleEdit}
                                onDeleteRequest={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <EventList 
                        upcomingEvents={upcoming}
                        pastEvents={past}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
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
