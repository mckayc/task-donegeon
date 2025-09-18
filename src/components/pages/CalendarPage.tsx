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
import { isQuestAvailableForUser } from '../../utils/quests';
import { toYMD, isQuestVisibleToUserInMode, getQuestLockStatus } from '../../utils/conditions';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import ChroniclesDetailDialog from '../calendar/ChroniclesDetailDialog';
import { useSystemState } from '../../context/SystemContext';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
// FIX: Corrected import for useEconomyState hook.
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
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null | undefined>(undefined);
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingQuestId, setViewingQuestId] = useState<string | null>(null);
    const [viewingQuestDate, setViewingQuestDate] = useState<Date | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createInitialData, setCreateInitialData] = useState<Partial<Quest> & { hasDeadlines?: boolean } | null>(null);
    const [chronicleDetail, setChronicleDetail] = useState<{ date: Date; events: ChronicleEvent[] } | null>(null);
    const [viewingConditionsForQuest, setViewingConditionsForQuest] = useState<Quest | null>(null);
    
    const calendarRef = useRef<FullCalendar>(null);

    const viewingQuest = useMemo(() => viewingQuestId ? quests.find(q => q.id === viewingQuestId) : null, [viewingQuestId, quests]);

    const chronicles = useChronicles({
        startDate: viewRange?.start || new Date(),
        endDate: viewRange?.end || new Date(),
    });
    
    if (!currentUser) return null;
    
    const conditionDependencies = useMemo(() => ({
        ...progressionState, ...economyState, ...communityState, quests, questGroups, questCompletions, allConditionSets: systemState.settings.conditionSets, appMode
    }), [progressionState, economyState, communityState, quests, questGroups, questCompletions, systemState.settings.conditionSets, appMode]);

    const handleDatesSet = (arg: any) => {
        setViewRange({ start: arg.start, end: arg.end });
    };

    const eventSources = useMemo<EventSourceInput[]>(() => {
        if (!currentUser) return [];

        const questEvents: EventInput[] = quests
            .filter(q => isQuestVisibleToUserInMode(q, currentUser.id, appMode))
            .flatMap(quest => {
                if (quest.type === QuestType.Duty && quest.rrule) {
                    return [{
                        id: quest.id,
                        title: quest.title,
                        rrule: {
                            ...rruleStringToObject(quest.rrule),
                            dtstart: '2020-01-01' // A start date in the past
                        },
                        allDay: quest.allDay,
                        startTime: quest.startTime || undefined,
                        endTime: quest.endTime || undefined,
                        extendedProps: { type: 'quest', quest },
                        backgroundColor: quest.isOptional ? '#3f3f46' : '#047857',
                        borderColor: quest.isOptional ? '#52525b' : '#059669',
                    }];
                }
                if ((quest.type === QuestType.Venture || quest.type === QuestType.Journey) && quest.startDateTime) {
                    return [{
                        id: quest.id,
                        title: quest.title,
                        start: quest.startDateTime,
                        end: quest.endDateTime || undefined,
                        allDay: quest.allDay,
                        extendedProps: { type: 'quest', quest },
                         backgroundColor: quest.isOptional ? '#3f3f46' : '#d97706',
                        borderColor: quest.isOptional ? '#52525b' : '#f59e0b',
                    }];
                }
                return [];
            });
            
        const scheduledSystemEvents: EventInput[] = scheduledEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startDate,
            end: new Date(new Date(event.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Add one day to make it inclusive
            allDay: event.isAllDay,
            extendedProps: { type: 'scheduledEvent', event },
            color: `hsl(${event.color})`
        }));
        
        const chronicleEvents: EventInput[] = Array.from(chronicles.entries()).map(([date, eventsOnDay]) => ({
            id: `chronicle-${date}`,
            start: date,
            display: 'background',
            extendedProps: { type: 'chronicle', date: new Date(date + 'T00:00:00'), events: eventsOnDay }
        }));
        
        const googleCalEvents: EventSourceInput = {
            googleCalendarId: settings.googleCalendar.calendarId,
            color: '#7c3aed',
        };

        const sources: EventSourceInput[] = [{ events: questEvents }, { events: scheduledSystemEvents }];
        if (mode === 'chronicles') sources.push({ events: chronicleEvents });
        if (settings.googleCalendar.enabled && settings.googleCalendar.calendarId && settings.googleCalendar.apiKey) {
            sources.push(googleCalEvents);
        }

        return sources;
    }, [quests, scheduledEvents, chronicles, currentUser, appMode, settings.googleCalendar, mode]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'quest') {
            setViewingQuestId(props.quest.id);
            setViewingQuestDate(clickInfo.event.start);
        } else if (props.type === 'scheduledEvent') {
            setViewingEvent(props.event);
        } else if (props.type === 'chronicle') {
            setChronicleDetail({ date: props.date, events: props.events });
        }
    };

    const handleDateClick = (arg: DateClickArg) => {
        if (!currentUser) return;

        if (currentUser.role === Role.DonegeonMaster) {
            setCreateInitialData({
                startDateTime: arg.allDay ? `${arg.dateStr}T09:00:00` : arg.date.toISOString(),
                endDateTime: arg.allDay ? `${arg.dateStr}T17:00:00` : new Date(arg.date.getTime() + 60 * 60 * 1000).toISOString(),
                allDay: arg.allDay,
                hasDeadlines: true,
            });
            setIsCreateDialogOpen(true);
        }
    };
    
    const handleEventDrop = async (dropInfo: EventDropArg) => {
        const { event } = dropInfo;
        const quest = quests.find(q => q.id === event.id);
        if (quest && currentUser) {
            const updatedQuest: Quest = {
                ...quest,
                startDateTime: event.startStr || null,
                endDateTime: event.endStr || null,
                allDay: event.allDay,
            };
            await updateQuest(updatedQuest);
            addNotification({ type: 'success', message: `Quest "${quest.title}" rescheduled.` });
        }
    };
    
    const handleCompleteFromDialog = () => {
        if(viewingQuest && viewingQuestDate) {
            setCompletingQuest({ quest: viewingQuest, date: viewingQuestDate });
        }
        setViewingQuestId(null);
    };

    const handleToggleTodo = () => {
        if (!viewingQuest || !currentUser) return;
        const isCurrentlyTodo = viewingQuest.todoUserIds?.includes(currentUser.id);
        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(viewingQuest.id, currentUser.id);
        } else {
            markQuestAsTodo(viewingQuest.id, currentUser.id);
        }
    };
    
    const renderEventContent = (eventInfo: EventContentArg) => {
        const props = eventInfo.event.extendedProps;
        if (props.type === 'quest' && currentUser) {
            const isAvailable = isQuestAvailableForUser(props.quest, questCompletions.filter(c => c.userId === currentUser.id), eventInfo.event.start || new Date(), scheduledEvents, appMode);
            const lockStatus = getQuestLockStatus(props.quest, currentUser, conditionDependencies);
            const isCompleted = questCompletions.some(c => c.questId === props.quest.id && c.userId === currentUser.id && c.status === QuestCompletionStatus.Approved && toYMD(new Date(c.completedAt)) === toYMD(eventInfo.event.start || new Date()));
            
            const isDimmed = !isAvailable || isCompleted || lockStatus.isLocked;

            return (
                <div className={`p-1 text-xs truncate ${isDimmed ? 'opacity-50' : ''}`}>
                    <span className="font-bold">{props.quest.icon} {eventInfo.timeText} {props.quest.title}</span>
                </div>
            );
        }
        return (
            <div className="p-1 text-xs truncate">
                <span className="font-bold">{eventInfo.timeText} {eventInfo.event.title}</span>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-medieval text-stone-100">{settings.terminology.link_calendar}</h1>
                    <div className="flex space-x-1 p-1 bg-stone-900/50 rounded-lg">
                        <Button variant={mode === 'events' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('events')}>Events</Button>
                        <Button variant={mode === 'chronicles' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('chronicles')}>History</Button>
                    </div>
                </div>
                {currentUser.role === Role.DonegeonMaster && (
                    <Button onClick={() => setEditingEvent(null)}>Schedule Event</Button>
                )}
            </div>

            <Card className="p-0 overflow-hidden">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin, rrulePlugin, listPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    initialView="dayGridMonth"
                    editable={currentUser.role === Role.DonegeonMaster}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    eventSources={eventSources}
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    eventDrop={handleEventDrop}
                    eventContent={renderEventContent}
                    googleCalendarApiKey={settings.googleCalendar.apiKey}
                    eventBackgroundColor='hsl(var(--color-bg-tertiary))'
                    eventBorderColor='hsl(var(--color-border))'
                    eventTextColor='hsl(var(--color-text-primary))'
                />
            </Card>

            {editingEvent !== undefined && <ScheduleEventDialog event={editingEvent} onClose={() => setEditingEvent(undefined)} />}
            {viewingEvent && <EventDetailDialog event={viewingEvent} onClose={() => setViewingEvent(null)} />}
            {viewingQuest && currentUser && (
                <QuestDetailDialog
                    quest={viewingQuest}
                    userForView={currentUser}
                    onClose={() => setViewingQuestId(null)}
                    onComplete={handleCompleteFromDialog}
                    onToggleTodo={handleToggleTodo}
                    isTodo={viewingQuest.type === QuestType.Venture && viewingQuest.todoUserIds?.includes(currentUser.id)}
                />
            )}
            {completingQuest && currentUser && (
                <CompleteQuestDialog
                    quest={completingQuest.quest}
                    user={currentUser}
                    completionDate={completingQuest.date}
                    onClose={() => setCompletingQuest(null)}
                />
            )}
            {isCreateDialogOpen && (
                <CreateQuestDialog initialData={createInitialData} onClose={() => setIsCreateDialogOpen(false)} />
            )}
            {chronicleDetail && <ChroniclesDetailDialog date={chronicleDetail.date} events={chronicleDetail.events} onClose={() => setChronicleDetail(null)} />}
            {viewingConditionsForQuest && currentUser && (
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
