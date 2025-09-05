
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Role, ScheduledEvent, Quest, QuestType, ChronicleEvent, User, RewardTypeDefinition, RewardItem, ConditionSet } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { ScheduleEventDialog } from '../admin/ScheduleEventDialog';
import EventDetailDialog from '../calendar/EventDetailDialog';
import { useAuthState } from '../../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import { EventClickArg, EventSourceInput, EventDropArg, MoreLinkArg, EventInput, EventContentArg } from '@fullcalendar/core';
import { useChronicles } from '../chronicles/hooks/useChronicles';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { toYMD, isQuestAvailableForUser, isQuestVisibleToUserInMode, getQuestLockStatus } from '../../utils/quests';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import ChroniclesDetailDialog from '../calendar/ChroniclesDetailDialog';
import { useSystemState } from '../../context/SystemContext';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { AppMode } from '../../types/app';
import QuestConditionStatusDialog from '../quests/QuestConditionStatusDialog';
import { useProgressionState } from '../../context/ProgressionContext';
import { useCommunityState } from '../../context/CommunityContext';

type CalendarMode = 'events' | 'chronicles';

const rruleStringToObject = (rruleString: string) => {
    const obj: any = {};
    rruleString.split(';').forEach(part => {
        const [key, value] = part.split('=');
        if (!key || !value) return;
        switch (key.toUpperCase()) {
            case 'FREQ':
                obj.freq = value.toLowerCase();
                break;
            case 'BYDAY':
                obj.byweekday = value.split(',').map(d => d.toLowerCase());
                break;
            case 'BYMONTHDAY':
                obj.bymonthday = value.split(',').map(Number);
                break;
        }
    });
    return obj;
};


const CalendarPage: React.FC = () => {
    const systemState = useSystemState();
    const { settings, scheduledEvents } = systemState;
    const { rewardTypes } = useEconomyState();
    const { quests, questCompletions, questGroups } = useQuestsState();
    const { appMode } = useUIState();
    const { currentUser, users } = useAuthState();
    const { setActivePage } = useUIDispatch();
    const { markQuestAsTodo, unmarkQuestAsTodo, updateQuest } = useQuestsDispatch();
    const { addNotification } = useNotificationsDispatch();
    const progressionState = useProgressionState();
    const economyState = useEconomyState();
    const communityState = useCommunityState();
    
    const [mode, setMode] = useState<CalendarMode>('events');
    const [viewRange, setViewRange] = useState<{ start: Date; end: Date } | null>(null);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingQuest, setViewingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createInitialData, setCreateInitialData] = useState<Partial<Quest> & { hasDeadlines?: boolean } | null>(null);
    const [chronicleDetail, setChronicleDetail] = useState<{ date: Date; events: ChronicleEvent[] } | null>(null);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);
    
    const calendarRef = useRef<FullCalendar>(null);

    const chronicles = useChronicles({
        startDate: viewRange?.start || new Date(),
        endDate: viewRange?.end || new Date(),
    });
    
    if (!currentUser) return null;

    // Safely syncs the dialog's quest data with the main quests list from the provider.
    useEffect(() => {
        if (viewingQuest) {
            const updatedQuestInList = quests.find(q => q.id === viewingQuest.quest.id);
            if (updatedQuestInList && JSON.stringify(updatedQuestInList) !== JSON.stringify(viewingQuest.quest)) {
                setViewingQuest(prev => prev ? { ...prev, quest: updatedQuestInList } : null);
            }
        }
    }, [quests, viewingQuest]);
    
    // FIX: Add appMode to conditionDependencies to satisfy the type requirements of getQuestLockStatus.
    const conditionDependencies = useMemo(() => ({
        ...progressionState, ...economyState, ...communityState, quests, questGroups, questCompletions, allConditionSets: systemState.settings.conditionSets, appMode
    }), [progressionState, economyState, communityState, quests, questGroups, questCompletions, systemState.settings.conditionSets, appMode]);

    const renderEventContent = (eventInfo: EventContentArg) => {
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
    
        const isListView = eventInfo.view.type.startsWith('list');
        
        let displayTime = '';
        if (!event.allDay && event.start) {
            const startTime = event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            if (event.end) {
                const endTime = event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                if (startTime !== endTime) {
                    displayTime = `${startTime} - ${endTime}`;
                } else {
                    displayTime = startTime;
                }
            } else {
                displayTime = startTime;
            }
        }

        return (
            <div className="flex items-center gap-2 overflow-hidden w-full font-sans">
                {displayTime && <span className="fc-event-time font-semibold">{displayTime}</span>}
                {!isListView && <span className="text-lg">{icon}</span>}
                <span className="truncate flex-grow fc-event-title">{event.title}</span>
                {rewards.length > 0 && (
                    <div className="hidden sm:flex items-center gap-x-2 ml-auto flex-shrink-0">
                        {rewards.map(r => {
                            const { icon: rewardIcon, name } = getRewardInfo(r.rewardTypeId);
                            return <span key={r.rewardTypeId} className="text-xs font-semibold flex items-center gap-1" title={`${r.amount} ${name}`}>{r.amount}{rewardIcon}</span>
                        })}
                    </div>
                )}
            </div>
        );
    };

    const visibleQuests = useMemo(() => {
        const questsForMode = quests.filter(q => isQuestVisibleToUserInMode(q, currentUser.id, appMode));
        return Array.from(new Map(questsForMode.map(q => [q.id, q])).values());
    }, [quests, currentUser.id, appMode]);

    const eventSources = useMemo((): EventSourceInput[] => {
        const sources: EventSourceInput[] = [];
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        if (mode === 'events') {
            const todayYMD = toYMD(new Date());
            const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);

            // Scheduled Events
            sources.push(scheduledEvents
                .filter(event => event.guildId === currentGuildId)
                .map(event => ({
                    title: event.title,
                    start: event.startDate,
                    end: new Date(new Date(event.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    backgroundColor: event.color ? `hsl(${event.color})` : 'hsl(var(--primary))',
                    borderColor: event.color ? `hsl(${event.color})` : 'hsl(var(--primary))',
                    allDay: event.isAllDay,
                    extendedProps: { appEvent: event, type: 'scheduled' }
                })));
            
            // Quests
            const questEvents: EventInput[] = [];
            visibleQuests.forEach(quest => {
                const lockStatus = getQuestLockStatus(quest, currentUser, conditionDependencies);
                
                const baseProps: EventInput = {
                    title: quest.title,
                    backgroundColor: quest.type === QuestType.Duty ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                    borderColor: quest.type === QuestType.Duty ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                    extendedProps: { quest, type: 'quest' }
                };

                if (lockStatus.isLocked) {
                    baseProps.title = `🔒 ${quest.title}`;
                    baseProps.classNames = ['opacity-70'];
                }

                if (quest.type === QuestType.Venture || quest.type === QuestType.Journey) {
                    if (quest.startDateTime) {
                        questEvents.push({
                            ...baseProps,
                            start: quest.startDateTime,
                            end: quest.endDateTime || undefined,
                            allDay: quest.allDay
                        });
                    } else {
                        // Show available dateless ventures on the current day if marked as To-Do.
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
                            allDay: quest.allDay,
                        };

                        const rruleObj = rruleStringToObject(quest.rrule);
                        
                        if (!quest.allDay && quest.startTime) {
                            rruleObj.dtstart = `1970-01-01T${quest.startTime}`;
                        } else {
                             rruleObj.dtstart = `1970-01-01`;
                        }
                        
                        dutyEvent.rrule = rruleObj;

                        if (!quest.allDay && quest.startTime && quest.endTime) {
                            const start = new Date(`1970-01-01T${quest.startTime}`);
                            const end = new Date(`1970-01-01T${quest.endTime}`);
                            const diffMs = end.getTime() - start.getTime();

                            if (diffMs > 0) {
                                dutyEvent.duration = { milliseconds: diffMs };
                            }
                        }
                        
                        questEvents.push(dutyEvent);
                    }
                }
            });
            sources.push(questEvents);
            
            // Birthdays
            const birthdayEvents: EventInput[] = [];
            if (viewRange) {
                const startYear = viewRange.start.getFullYear();
                const endYear = viewRange.end.getFullYear();
                for (let year = startYear; year <= endYear; year++) {
                    users.forEach(user => {
                        if (user.birthday) {
                            const [_, month, day] = user.birthday.split('-');
                            birthdayEvents.push({
                                id: `birthday-${user.id}-${year}`,
                                title: `🎂 ${user.gameName}'s Birthday`,
                                start: `${year}-${month}-${day}`,
                                allDay: true,
                                classNames: ['birthday-event']
                            });
                        }
                    });
                }
            }
            sources.push(birthdayEvents);

        } else { // Chronicles mode
            const chronicleEvents: EventInput[] = [];
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
    }, [mode, appMode, scheduledEvents, visibleQuests, chronicles, settings.googleCalendar, users, viewRange, currentUser, questCompletions, conditionDependencies]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'scheduled' && props.appEvent) {
            setViewingEvent(props.appEvent);
        } else if (props.type === 'quest' && props.quest) {
            // FIX: Pass the complete conditionDependencies object to getQuestLockStatus.
            const lockStatus = getQuestLockStatus(props.quest, currentUser, conditionDependencies);
            if (lockStatus.isLocked) {
                setViewingConditionsForQuest(props.quest);
            } else {
                setViewingQuest({ quest: props.quest, date: clickInfo.event.start || new Date() });
            }
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

        if (!quest || (quest.type !== QuestType.Venture && quest.type !== QuestType.Journey)) {
            addNotification({ type: 'info', message: 'Only one-time Ventures or Journeys can be rescheduled by dragging.' });
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
    
    const handleMoreLinkClick = (info: MoreLinkArg) => {
        if (mode === 'chronicles') {
            info.jsEvent.preventDefault(); // Prevent default popover
            const dateKey = toYMD(info.date);
            const events = chronicles.get(dateKey) || [];
            setChronicleDetail({ date: info.date, events });
        }
    };

    const handleStartCompletion = () => {
        if (!viewingQuest) return;
        const isAvailable = isQuestAvailableForUser(
            viewingQuest.quest,
            questCompletions.filter(c => c.userId === currentUser.id),
            new Date(),
            scheduledEvents,
            appMode
        );
        if (isAvailable) {
            setCompletingQuest(viewingQuest);
            setViewingQuest(null);
        } else {
             addNotification({ type: 'error', message: 'This quest cannot be completed at this time.' });
        }
    };

    const handleToggleTodo = () => {
        if (!viewingQuest || !currentUser) return;
        const { quest } = viewingQuest;
        const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);
        
        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(quest.id, currentUser.id);
        } else {
            markQuestAsTodo(quest.id, currentUser.id);
        }
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
                
                .fc .fc-day-today {
                    background-color: hsl(var(--color-primary-hue) var(--color-primary-saturation) var(--color-primary-lightness) / 0.15) !important;
                }
                .fc .fc-daygrid-day.fc-day-today {
                    border: 2px solid hsl(var(--color-primary-hue) var(--color-primary-saturation) var(--color-primary-lightness)) !important;
                }

                .fc .fc-daygrid-day-number { color: hsl(var(--foreground)); padding: 4px; }
                .fc .fc-day-past .fc-daygrid-day-number { color: hsl(var(--muted-foreground)); }
                .fc .fc-event { border: 1px solid hsl(var(--border)) !important; font-size: 0.75rem; padding: 2px 4px; color: hsl(var(--primary-foreground)); }
                .fc-event.gcal-event { background-color: hsl(217 91% 60%) !important; border-color: hsl(217 91% 70%) !important; }
                .fc-event.birthday-event { background-color: hsl(50 90% 60%) !important; border-color: hsl(50 90% 50%) !important; color: hsl(50 100% 10%) !important; font-weight: bold; }
                .fc-event.duty-late-period-event {
                    background-color: hsl(40 90% 50% / 0.7) !important;
                    border-color: hsl(40 90% 40%) !important;
                    color: hsl(40 100% 10%) !important;
                    font-weight: bold;
                }
                .fc-theme-standard .fc-list-day-cushion, .fc-theme-standard .fc-list-table th {
                    background-color: hsl(var(--color-bg-secondary-hsl));
                }
                .fc-list-event:hover td {
                    background-color: hsl(var(--color-bg-primary-hsl));
                }
                .fc-list-event-title > a {
                    color: hsl(var(--text-primary-hsl));
                    text-decoration: none;
                }
                .fc-list-event-title > a:hover {
                    text-decoration: underline;
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
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin, listPlugin, rrulePlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'listWeek,timeGridDay,timeGridWeek,dayGridMonth'
                        }}
                        timeZone='local'
                        buttonText={{ day: 'Day', week: 'Week', month: 'Month', list: 'Agenda' }}
                        initialView="listWeek"
                        googleCalendarApiKey={settings.googleCalendar.apiKey || undefined}
                        eventSources={eventSources}
                        eventClick={handleEventClick}
                        dayMaxEvents={5}
                        moreLinkClick={handleMoreLinkClick}
                        datesSet={handleDatesSet}
                        editable={currentUser.role === Role.DonegeonMaster}
                        eventDrop={handleEventDrop}
                        dateClick={handleDateClick}
                        eventContent={renderEventContent}
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
            {viewingConditionsForQuest && (
                <QuestConditionStatusDialog
                    quest={viewingConditionsForQuest}
                    user={currentUser}
                    onClose={() => setViewingConditionsForQuest(null)}
                />
            )}
        </div>
    );
};

export default CalendarPage;
