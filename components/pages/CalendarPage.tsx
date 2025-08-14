import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Role, ScheduledEvent, Quest, QuestType, ChronicleEvent, User, AppMode, RewardTypeDefinition, RewardItem } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import ScheduleEventDialog from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';
import { useAuthState } from '../../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import { EventClickArg, EventSourceInput, EventDropArg, MoreLinkArg, EventInput, EventContentArg, EventSourceFuncArg } from '@fullcalendar/core';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { toYMD, isQuestAvailableForUser, isQuestVisibleToUserInMode } from '../../utils/quests';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import ChroniclesDetailDialog from '../calendar/ChroniclesDetailDialog';
import { useEconomyState } from '../../context/EconomyContext';

type CalendarMode = 'events' | 'chronicles';

const renderEventContent = (eventInfo: EventContentArg, rewardTypes: RewardTypeDefinition[]) => {
    const { event } = eventInfo;
    const { extendedProps } = event;

    const getRewardInfo = (id: string) => {
        return rewardTypes.find(rt => rt.id === id) || { name: 'Unknown', icon: '❓' };
    };

    let icon = '';
    let rewards: RewardItem[] = [];
    
    if (extendedProps.type === 'quest' && extendedProps.quest) {
        icon = extendedProps.quest.icon;
        rewards = extendedProps.quest.rewards || [];
    } else if (extendedProps.type === 'scheduled' && extendedProps.appEvent) {
        icon = extendedProps.appEvent.icon || '🎉';
    } else if (extendedProps.type === 'chronicle' && extendedProps.chronicleEvent) {
        icon = extendedProps.chronicleEvent.icon;
    }

    // In list view, FullCalendar adds its own dot, so we don't need another one.
    const isListView = eventInfo.view.type.startsWith('list');
    
    return (
        <div className="flex items-center gap-2 overflow-hidden w-full">
            {!isListView && <span className="text-lg">{icon}</span>}
            <span className="truncate flex-grow">{event.title}</span>
            {rewards.length > 0 && (
                <div className="hidden sm:flex items-center gap-x-2 ml-auto flex-shrink-0">
                    {rewards.map(r => {
                        const { icon: rewardIcon } = getRewardInfo(r.rewardTypeId);
                        return <span key={r.rewardTypeId} className="text-xs font-semibold flex items-center gap-1" title={`${r.amount} ${getRewardInfo(r.rewardTypeId).name}`}>{r.amount}{rewardIcon}</span>
                    })}
                </div>
            )}
        </div>
    );
};

const CalendarPage: React.FC = () => {
    const { settings, scheduledEvents } = useAppState();
    const { quests, questCompletions } = useQuestState();
    const { currentUser, users } = useAuthState();
    const { appMode } = useUIState();
    const { setActivePage } = useUIDispatch();
    const { markQuestAsTodo, unmarkQuestAsTodo, updateQuest } = useQuestDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { rewardTypes } = useEconomyState();
    
    const [mode, setMode] = useState<CalendarMode>('events');
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingQuest, setViewingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createInitialData, setCreateInitialData] = useState<Partial<Quest> & { hasDeadlines?: boolean } | null>(null);
    const [chronicleDetail, setChronicleDetail] = useState<{ date: Date; events: ChronicleEvent[] } | null>(null);
    
    const calendarRef = useRef<FullCalendar>(null);
    
    if (!currentUser) return null;

    const calendarEventsFunc = useCallback(async (fetchInfo: EventSourceFuncArg, successCallback: (events: EventInput[]) => void, failureCallback: (error: Error) => void) => {
        try {
            if (!currentUser) {
                successCallback([]);
                return;
            }
            
            const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
    
            if (mode === 'chronicles') {
                const start = toYMD(fetchInfo.start);
                const end = toYMD(fetchInfo.end);
                const guildIdParam = appMode.mode === 'guild' ? appMode.guildId : 'null';
                
                const response = await fetch(`/api/chronicles?startDate=${start}&endDate=${end}&userId=${currentUser.id}&guildId=${guildIdParam}&viewMode=all`);
                if (!response.ok) throw new Error('Failed to fetch chronicles data');

                const data: { events: ChronicleEvent[] } = await response.json();
                
                const chronicleEvents: EventInput[] = data.events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.date,
                    allDay: true,
                    backgroundColor: event.color,
                    borderColor: event.color,
                    extendedProps: { chronicleEvent: event, type: 'chronicle' }
                }));

                successCallback(chronicleEvents);

            } else { // 'events' mode
                let allEvents: EventInput[] = [];
                const todayYMD = toYMD(new Date());
                const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);
                const visibleQuests = quests.filter(q => isQuestVisibleToUserInMode(q, currentUser.id, appMode, quests, questCompletions));
    
                // Scheduled Events
                const scheduledEventInputs = scheduledEvents
                    .filter(event => event.guildId === currentGuildId)
                    .map(event => ({
                        title: event.title,
                        start: event.startDate,
                        end: new Date(new Date(event.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        backgroundColor: event.color ? `hsl(${event.color})` : 'hsl(var(--primary))',
                        borderColor: event.color ? `hsl(${event.color})` : 'hsl(var(--primary))',
                        allDay: event.isAllDay,
                        extendedProps: { appEvent: event, type: 'scheduled' }
                    }));
                allEvents.push(...scheduledEventInputs);
                
                // Quests
                const questEvents: EventInput[] = [];
                visibleQuests.forEach(quest => {
                    const baseProps = {
                        title: quest.title,
                        backgroundColor: quest.type === QuestType.Duty ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                        borderColor: quest.type === QuestType.Duty ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                        extendedProps: { quest, type: 'quest' }
                    };
    
                    if (quest.type === QuestType.Venture) {
                        if (quest.startDateTime) {
                            questEvents.push({
                                ...baseProps,
                                start: quest.startDateTime,
                                end: quest.endDateTime || undefined,
                                allDay: quest.allDay
                            });
                        } else {
                            const questAppMode: AppMode = quest.guildId ? { mode: 'guild', guildId: quest.guildId } : { mode: 'personal' };
                            if (isQuestAvailableForUser(quest, userCompletions, new Date(), scheduledEvents, questAppMode)) {
                                const isTodo = quest.todoUserIds?.includes(currentUser.id);
                                if (isTodo) {
                                     questEvents.push({
                                        ...baseProps,
                                        title: `📌 ${quest.title}`,
                                        start: todayYMD,
                                        allDay: true,
                                        backgroundColor: 'hsl(275 60% 50%)',
                                        borderColor: 'hsl(275 60% 40%)',
                                    });
                                }
                            }
                        }
                    } else { // Duty
                        if (quest.rrule) {
                            const dutyEvent: EventInput = {
                                ...baseProps,
                                rrule: quest.rrule,
                                allDay: quest.allDay,
                            };
                    
                            if (!quest.allDay && quest.startTime) {
                                dutyEvent.startTime = quest.startTime;
                                dutyEvent.endTime = quest.endTime || undefined;
                            }
                            
                            questEvents.push(dutyEvent);
                        }
                    }
                });
                allEvents.push(...questEvents);
                
                // Birthdays
                const birthdayEvents: EventInput[] = [];
                const start = fetchInfo.start;
                const end = fetchInfo.end;
                
                for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
                    users.forEach(user => {
                        if (user.birthday) {
                            const [bYear, month, day] = user.birthday.split('-');
                            const birthdayDate = new Date(year, parseInt(month) - 1, parseInt(day));
                            if (birthdayDate >= start && birthdayDate < end) {
                                birthdayEvents.push({
                                    id: `birthday-${user.id}-${year}`,
                                    title: `🎂 ${user.gameName}'s Birthday`,
                                    start: `${year}-${month}-${day}`,
                                    allDay: true,
                                    classNames: ['birthday-event']
                                });
                            }
                        }
                    });
                }
                allEvents.push(...birthdayEvents);

                const eventSources: EventSourceInput[] = [{ events: allEvents }];
                if (settings.googleCalendar.enabled && settings.googleCalendar.apiKey && settings.googleCalendar.calendarId) {
                    eventSources.push({
                        googleCalendarId: settings.googleCalendar.calendarId,
                        className: 'gcal-event'
                    });
                }
                successCallback(allEvents);
            }
        } catch (e) {
            console.error("Error fetching calendar events:", e);
            failureCallback(e instanceof Error ? e : new Error('Failed to load events'));
        }
    }, [
        currentUser, appMode, mode, questCompletions, scheduledEvents, quests, users, settings.googleCalendar
    ]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'scheduled' && props.appEvent) {
            setViewingEvent(props.appEvent);
        } else if (props.type === 'quest' && props.quest) {
            setViewingQuest({ quest: props.quest, date: clickInfo.event.start || new Date() });
        } else if (clickInfo.event.url) {
            window.open(clickInfo.event.url, '_blank');
        }
    };

    const handleDateClick = useCallback((arg: DateClickArg) => {
        if (currentUser?.role !== Role.DonegeonMaster) return;
        setCreateInitialData({
            type: QuestType.Venture,
            startDateTime: `${arg.dateStr}T12:00`,
            endDateTime: `${arg.dateStr}T13:00`,
            hasDeadlines: true,
            allDay: false,
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

        const originalStartDate = quest.startDateTime ? new Date(quest.startDateTime) : new Date();
        const newStartDate = event.start;

        const duration = quest.endDateTime ? new Date(quest.endDateTime).getTime() - originalStartDate.getTime() : 0;
        
        const newEndDate = new Date(newStartDate.getTime() + duration);

        updateQuest({ ...quest, startDateTime: newStartDate.toISOString(), endDateTime: newEndDate.toISOString() });
        addNotification({ type: 'success', message: `Rescheduled "${quest.title}" successfully.` });
    }, [currentUser, updateQuest, addNotification]);
    
    const handleMoreLinkClick = useCallback((info: MoreLinkArg) => {
        if (mode === 'chronicles') {
            info.jsEvent.preventDefault(); // Prevent default popover

            const fetchDetails = async () => {
                if (!currentUser) return;
                try {
                    const start = toYMD(info.date);
                    const end = toYMD(new Date(info.date.getTime() + 86400000));
                    const guildIdParam = appMode.mode === 'guild' ? appMode.guildId : 'null';
                    
                    const response = await fetch(`/api/chronicles?startDate=${start}&endDate=${end}&userId=${currentUser.id}&guildId=${guildIdParam}&viewMode=all`);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to fetch details for this day.');
                    }
                    const data = await response.json();
                    
                    setChronicleDetail({ date: info.date, events: data.events });
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Could not load details for this day.';
                    addNotification({ type: 'error', message });
                    console.error('Error fetching chronicle details for day view:', e);
                }
            };
            
            fetchDetails();
        }
    }, [mode, appMode, currentUser, addNotification]);

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
            <style>{`
                .fc-license-message { display: none !important; }
                .fc { 
                  --fc-border-color: hsl(var(--border));
                  --fc-daygrid-event-dot-width: 8px;
                  --fc-list-event-dot-width: 10px;
                  --fc-list-event-hover-bg-color: hsl(var(--color-bg-primary-hsl));
                }
                .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 1.5rem; }
                .fc .fc-toolbar-title { font-family: var(--font-display); color: hsl(var(--accent-light)); }
                .fc .fc-button-primary { background-color: hsl(var(--secondary)); border-color: hsl(var(--border)); color: hsl(var(--foreground)); font-weight: 500; }
                .fc .fc-button-primary:hover { background-color: hsl(var(--accent) / 0.8); }
                .fc .fc-button-primary:disabled { background-color: hsl(var(--muted)); }
                .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
                .fc .fc-daygrid-day.fc-day-today { background-color: hsl(var(--primary) / 0.15); }
                .fc .fc-daygrid-day-number { color: hsl(var(--foreground)); padding: 4px; }
                .fc .fc-day-past .fc-daygrid-day-number { color: hsl(var(--muted-foreground)); }
                .fc .fc-event { border: 1px solid hsl(var(--border)) !important; font-size: 0.875rem; padding: 3px 5px; color: hsl(var(--primary-foreground)); font-weight: 500; }
                .fc-event.gcal-event { background-color: hsl(217 91% 60%) !important; border-color: hsl(217 91% 70%) !important; }
                .fc-event.birthday-event { background-color: hsl(50 90% 60%) !important; border-color: hsl(50 90% 50%) !important; color: hsl(50 100% 10%) !important; font-weight: bold; }
                .fc-theme-standard .fc-list-day-cushion, .fc-theme-standard .fc-list-table th {
                    background-color: hsl(var(--color-bg-secondary-hsl));
                }
                .fc-list-event:hover td {
                    background-color: hsl(var(--color-bg-primary-hsl));
                }
                .fc-list-event-title > a {
                    color: hsl(var(--accent-light)) !important;
                    text-decoration: none !important;
                }
                .fc-list-event-title > a:hover {
                    text-decoration: underline !important;
                    color: hsl(var(--accent)) !important;
                }
            `}</style>
            <Card>
                <div className="flex items-center justify-between p-4 border-b border-stone-700/60 flex-wrap gap-4">
                    <div/>
                    <div className="flex items-center gap-4 ml-auto">
                        {currentUser.role === Role.DonegeonMaster && (
                            <Button size="sm" onClick={() => setActivePage('Manage Events')}>Manage Events</Button>
                        )}
                        <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                            <button onClick={() => setMode('events')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'events' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-stone-300 hover:bg-stone-700'}`}>Events</button>
                            <button onClick={() => setMode('chronicles')} className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'chronicles' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-stone-300 hover:bg-stone-700'}`}>Chronicles</button>
                        </div>
                    </div>
                </div>
                 <div className="p-4">
                    <FullCalendar
                        key={mode} 
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin, listPlugin, rrulePlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'listWeek,timeGridDay,timeGridWeek,dayGridMonth'
                        }}
                        buttonText={{ day: 'Day', week: 'Week', month: 'Month', list: 'Agenda' }}
                        initialView="listWeek"
                        googleCalendarApiKey={settings.googleCalendar.apiKey || undefined}
                        events={calendarEventsFunc}
                        eventClick={handleEventClick}
                        dayMaxEvents={5}
                        moreLinkClick={handleMoreLinkClick}
                        editable={currentUser.role === Role.DonegeonMaster}
                        eventDrop={handleEventDrop}
                        dateClick={handleDateClick}
                        eventContent={(arg) => renderEventContent(arg, rewardTypes)}
                        contentHeight="auto"
                        aspectRatio={1.5}
                        slotDuration="00:15:00"
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
            {chronicleDetail && (
                <ChroniclesDetailDialog
                    date={chronicleDetail.date}
                    events={chronicleDetail.events}
                    onClose={() => setChronicleDetail(null)}
                />
            )}
        </div>
    );
};

export default CalendarPage;
