import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Role, ScheduledEvent, Quest, QuestType, ChronicleEvent, User } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import ScheduleEventDialog from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';
import { useAuthState } from '../../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { EventClickArg, EventSourceInput, EventDropArg, EventInput } from '@fullcalendar/core';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';
import { useChronicles } from '../../hooks/useChronicles';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { toYMD } from '../../utils/quests';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

type CalendarMode = 'events' | 'chronicles';

const CalendarPage: React.FC = () => {
    const { settings, scheduledEvents } = useAppState();
    const { quests } = useQuestState();
    const { currentUser, users } = useAuthState();
    const { appMode } = useUIState();
    const { setActivePage } = useUIDispatch();
    const { markQuestAsTodo, unmarkQuestAsTodo, updateQuest } = useQuestDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [mode, setMode] = useState<CalendarMode>('events');
    const [viewRange, setViewRange] = useState<{ start: Date; end: Date } | null>(null);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingQuest, setViewingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createInitialData, setCreateInitialData] = useState<Partial<Quest> & { hasDeadlines?: boolean } | null>(null);
    
    const calendarRef = useRef<FullCalendar>(null);

    const chronicles = useChronicles({
        startDate: viewRange?.start || new Date(),
        endDate: viewRange?.end || new Date(),
    });
    
    if (!currentUser) return null;

    const eventSources = useMemo((): EventSourceInput[] => {
        const sources: EventSourceInput[] = [];
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        if (mode === 'events') {
            const appEventSource = scheduledEvents
                .filter(event => !event.guildId || event.guildId === currentGuildId)
                .map(event => ({
                    title: event.title,
                    start: event.startDate,
                    end: new Date(new Date(event.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    backgroundColor: `hsl(${event.color})`,
                    borderColor: `hsl(${event.color})`,
                    allDay: event.isAllDay,
                    extendedProps: { appEvent: event, type: 'scheduled' }
                }));
            sources.push(appEventSource);

            const questEventSource = quests
                .filter(q => q.isActive && (!q.guildId || q.guildId === currentGuildId))
                .map(quest => {
                    const eventDef = {
                        title: quest.title,
                        extendedProps: { quest, type: 'quest' },
                        allDay: quest.type === QuestType.Venture && !quest.lateDateTime?.includes('T'),
                        backgroundColor: quest.type === QuestType.Duty ? 'hsl(204 85% 54% / 0.7)' : 'hsl(36 90% 50% / 0.7)',
                        borderColor: quest.type === QuestType.Duty ? 'hsl(204 85% 44%)' : 'hsl(36 90% 40%)'
                    };

                    if (quest.type === QuestType.Venture) {
                        return {
                            ...eventDef,
                            start: quest.lateDateTime || undefined,
                            daysOfWeek: undefined,
                            startRecur: undefined,
                        };
                    } else { // Duty
                        return {
                            ...eventDef,
                            start: undefined,
                            daysOfWeek: quest.availabilityType === 'Weekly' ? quest.weeklyRecurrenceDays : undefined,
                            startRecur: quest.availabilityType === 'Daily' ? '1900-01-01' : undefined,
                        };
                    }
                }).filter(e => e.start || (e.daysOfWeek && e.daysOfWeek.length > 0) || e.startRecur);
            sources.push(questEventSource);
            
            const birthdayEvents: EventInput[] = [];
            if (viewRange) {
                const startYear = viewRange.start.getFullYear();
                const endYear = viewRange.end.getFullYear();
                for (let year = startYear; year <= endYear; year++) {
                    users.forEach(user => {
                        if (user.birthday) {
                            const [_, month, day] = user.birthday.split('-');
                            const eventDate = new Date(`${year}-${month}-${day}T00:00:00`);
                            if (eventDate >= viewRange.start && eventDate <= viewRange.end) {
                                birthdayEvents.push({
                                    id: `birthday-${user.id}-${year}`,
                                    title: `🎂 ${user.gameName}'s Birthday`,
                                    start: `${year}-${month}-${day}`,
                                    allDay: true,
                                    backgroundColor: 'hsl(50 90% 60%)',
                                    borderColor: 'hsl(50 90% 50%)',
                                    textColor: 'hsl(50 100% 10%)',
                                    extendedProps: { type: 'birthday', user },
                                    classNames: ['birthday-event']
                                });
                            }
                        }
                    });
                }
            }
            sources.push(birthdayEvents);

        } else {
            const chronicleEvents: any[] = [];
            chronicles.forEach((eventsOnDay) => {
                eventsOnDay.forEach(event => {
                    chronicleEvents.push({
                        id: event.id,
                        title: event.title,
                        start: event.date,
                        allDay: true,
                        backgroundColor: event.color,
                        borderColor: event.color,
                        extendedProps: { chronicleEvent: event, type: 'chronicle' }
                    });
                });
            });
            sources.push(chronicleEvents);
        }

        if (settings.googleCalendar.enabled && settings.googleCalendar.apiKey && settings.googleCalendar.calendarId) {
            sources.push({
                googleCalendarId: settings.googleCalendar.calendarId,
                className: 'gcal-event'
            });
        }
        
        return sources;
    }, [mode, appMode, scheduledEvents, quests, chronicles, settings.googleCalendar, users, viewRange]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'scheduled' && props.appEvent) {
            setViewingEvent(props.appEvent);
        } else if (props.type === 'quest' && props.quest) {
            setViewingQuest({ quest: props.quest, date: clickInfo.event.start || new Date() });
        } else if (props.type === 'birthday' && props.user) {
            addNotification({type: 'info', message: `It's ${props.user.gameName}'s birthday!`});
        } else if (clickInfo.event.url) {
            window.open(clickInfo.event.url, '_blank');
        }
    };

    const handleDatesSet = (dateInfo: { start: Date; end: Date }) => {
        setViewRange({ start: dateInfo.start, end: dateInfo.end });
    };

    const handleDateClick = useCallback((arg: DateClickArg) => {
        if (currentUser?.role !== Role.DonegeonMaster) return;
        setCreateInitialData({
            type: QuestType.Venture,
            lateDateTime: `${arg.dateStr}T12:00`,
            hasDeadlines: true,
        });
        setIsCreateDialogOpen(true);
    }, [currentUser]);

    const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
        const { event } = dropInfo;
        const { quest } = event.extendedProps;

        if (currentUser?.role !== Role.DonegeonMaster) {
            addNotification({ type: 'error', message: "You don't have permission to move quests." });
            dropInfo.revert();
            return;
        }

        if (!quest || quest.type !== QuestType.Venture) {
            addNotification({ type: 'info', message: 'Only one-time Ventures can be rescheduled by dragging.' });
            dropInfo.revert();
            return;
        }
        
        if (!event.start) {
            addNotification({ type: 'error', message: 'Could not determine the new date.' });
            dropInfo.revert();
            return;
        }

        const originalDate = quest.lateDateTime ? new Date(quest.lateDateTime) : new Date();
        const newDate = event.start;
        const newDateTime = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            originalDate.getHours(),
            originalDate.getMinutes()
        );
        
        await updateQuest({ ...quest, lateDateTime: newDateTime.toISOString() });
        addNotification({ type: 'success', message: `Rescheduled "${quest.title}" successfully.` });
    }, [currentUser, updateQuest, addNotification]);

    const handleStartCompletion = () => {
        if (!viewingQuest) return;
        setCompletingQuest(viewingQuest);
        setViewingQuest(null);
    };

    const handleToggleTodo = () => {
        if (!viewingQuest) return;
        const { quest } = viewingQuest;
        const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);

        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(quest.id, currentUser.id);
        } else {
            markQuestAsTodo(quest.id, currentUser.id);
        }
        
        setViewingQuest(prev => {
            if (!prev) return null;
            const newTodoUserIds = isCurrentlyTodo
                ? (prev.quest.todoUserIds || []).filter(id => id !== currentUser.id)
                : [...(prev.quest.todoUserIds || []), currentUser.id];
            return { ...prev, quest: { ...prev.quest, todoUserIds: newTodoUserIds } };
        });
    };

    return (
        <div>
            <Card>
                <div className="flex items-center justify-between p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <div></div> {/* Spacer */}
                    <div className="flex items-center gap-4 ml-auto">
                        {currentUser.role === Role.DonegeonMaster && (
                            <Button size="sm" onClick={() => setActivePage('Manage Events')}>Manage Events</Button>
                        )}
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <button onClick={() => setMode('events')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'events' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>Events</button>
                            <button onClick={() => setMode('chronicles')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'chronicles' ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>Chronicles</button>
                        </div>
                    </div>
                </div>
                 <div className="p-4">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, googleCalendarPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,listWeek'
                        }}
                        buttonText={{ day: 'Day', week: 'Week', month: 'Month', list: 'List' }}
                        initialView="listWeek"
                        googleCalendarApiKey={settings.googleCalendar.apiKey || undefined}
                        eventSources={eventSources}
                        eventClick={handleEventClick}
                        datesSet={handleDatesSet}
                        editable={currentUser.role === Role.DonegeonMaster}
                        selectable={false}
                        lazyFetching={true}
                        eventDrop={handleEventDrop}
                        dateClick={handleDateClick}
                        height="auto"
                        contentHeight="auto"
                        aspectRatio={1.8}
                        dayMaxEvents={3}
                    />
                 </div>
            </Card>

            {editingEvent && (
                <ScheduleEventDialog event={editingEvent} onClose={() => setEditingEvent(null)} />
            )}
            {viewingEvent && (
                <EventDetailDialog event={viewingEvent} onClose={() => setViewingEvent(null)} />
            )}
            {viewingQuest && (
                <QuestDetailDialog
                    quest={viewingQuest.quest}
                    onClose={() => setViewingQuest(null)}
                    onComplete={handleStartCompletion}
                    onToggleTodo={handleToggleTodo}
                    isTodo={!!(viewingQuest.quest.type === QuestType.Venture && viewingQuest.quest.todoUserIds?.includes(currentUser.id))}
                />
            )}
            {completingQuest && (
                <CompleteQuestDialog
                    quest={completingQuest.quest}
                    onClose={() => setCompletingQuest(null)}
                    completionDate={completingQuest.date}
                />
            )}
            {isCreateDialogOpen && (
                <CreateQuestDialog
                    initialData={createInitialData}
                    onClose={() => setIsCreateDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default CalendarPage;