
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { Role, ScheduledEvent, Quest, QuestType, User, QuestCompletionStatus } from '../../types';
import Card from '../user-interface/Card';
import { useAuthState } from '../../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { EventClickArg, EventSourceInput, EventDropArg } from '@fullcalendar/core';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { toYMD } from '../../utils/quests';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import EventDetailDialog from '../calendar/EventDetailDialog';

const CalendarPage: React.FC = () => {
    const { settings } = useAppState();
    const { quests, questCompletions } = useQuestState();
    const { currentUser, users } = useAuthState();
    const { appMode } = useUIState();
    const { markQuestAsTodo, unmarkQuestAsTodo, updateQuest } = useQuestDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [viewingEvent, setViewingEvent] = useState<ScheduledEvent | null>(null);
    const [viewingQuest, setViewingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [completingQuest, setCompletingQuest] = useState<{ quest: Quest; date: Date } | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createInitialData, setCreateInitialData] = useState<any | null>(null);
    
    const calendarRef = useRef<FullCalendar>(null);
    
    if (!currentUser) return null;

    const eventSources = useMemo((): EventSourceInput[] => {
        const sources: EventSourceInput[] = [];
        const guildId = appMode.mode === 'guild' ? appMode.guildId : 'personal';

        sources.push({
            events: (fetchInfo, successCallback, failureCallback) => {
                fetch(`/api/calendar-events?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}&guildId=${guildId}`)
                    .then(res => res.json())
                    .then(data => successCallback(data))
                    .catch(error => failureCallback(error));
            }
        });

        if (settings.googleCalendar.enabled && settings.googleCalendar.apiKey && settings.googleCalendar.calendarId) {
            sources.push({
                googleCalendarId: settings.googleCalendar.calendarId,
                className: 'gcal-event'
            });
        }
        
        return sources;
    }, [settings.googleCalendar, appMode]);

    const handleEventContent = (eventInfo: any) => {
        const { event } = eventInfo;
        const { extendedProps } = event;

        if (extendedProps.type === 'quest') {
            const quest: Quest = extendedProps.quest;
            const eventDate = toYMD(event.start);

            const isCompleted = questCompletions.some(c => 
                c.questId === quest.id &&
                c.userId === currentUser?.id &&
                toYMD(new Date(c.completedAt)) === eventDate &&
                (c.status === QuestCompletionStatus.Approved || c.status === QuestCompletionStatus.Pending)
            );
            
            if (isCompleted) {
                // FullCalendar manages classes, so we add it to the event object itself
                event.setProp('classNames', [...(event.classNames || []), 'event-completed']);
            }

            return (
                <div className="fc-event-main-frame">
                    <div className="fc-event-title-container">
                        <div className="fc-event-title fc-sticky">
                            <span className="fc-event-icon">{quest.icon}</span> {event.title}
                        </div>
                    </div>
                </div>
            );
        }
        return null; // Use default rendering for other event types
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'scheduled' && props.appEvent) {
            setViewingEvent(props.appEvent);
        } else if (props.type === 'quest' && props.quest) {
            setViewingQuest({ quest: props.quest, date: clickInfo.event.start || new Date() });
        } else if (props.type === 'birthday' && props.user) {
            addNotification({type: 'info', message: `It's ${props.user.gameName}'s birthday today!`});
        } else if (clickInfo.event.url) {
            window.open(clickInfo.event.url, '_blank');
        }
    };

    const handleDateClick = useCallback((arg: DateClickArg) => {
        if (currentUser?.role !== Role.DonegeonMaster) return;
        const initialQuestData = {
            type: QuestType.Venture,
            lateDateTime: `${arg.dateStr}T12:00`,
            hasDeadlines: true,
            assignedUserIds: users.map(u => u.id),
            isActive: settings.questDefaults.isActive,
            isOptional: settings.questDefaults.isOptional,
            requiresApproval: settings.questDefaults.requiresApproval,
        };
        setCreateInitialData(initialQuestData);
        setIsCreateDialogOpen(true);
    }, [currentUser, users, settings.questDefaults]);

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
            <style>{`
                .fc-license-message { display: none !important; }
                .fc { 
                  --fc-bg-event-color: hsl(var(--primary));
                  --fc-border-color: hsl(var(--border));
                  --fc-daygrid-event-dot-width: 8px;
                  --fc-list-event-dot-width: 10px;
                  --fc-list-event-hover-bg-color: hsl(var(--secondary));
                  --fc-event-text-color: hsl(var(--primary-foreground));
                  --fc-today-bg-color: hsl(var(--accent) / 0.1);
                }
                .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 1.5rem; }
                .fc .fc-toolbar-title { font-family: var(--font-display); color: hsl(var(--accent-light)); }
                .fc .fc-button-primary { background-color: hsl(var(--secondary)); border-color: hsl(var(--border)); color: hsl(var(--foreground)); font-weight: 500; }
                .fc .fc-button-primary:hover { background-color: hsl(var(--accent) / 0.5); }
                .fc .fc-button-primary:disabled { background-color: hsl(var(--muted)); }
                .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
                .fc .fc-daygrid-day-number { color: hsl(var(--foreground)); padding: 4px; }
                .fc .fc-day-past .fc-daygrid-day-number { color: hsl(var(--muted-foreground)); }
                .fc .fc-event { border-width: 2px !important; font-size: 0.8rem; padding: 3px 5px; cursor: pointer; }
                .fc-event.gcal-event { background-color: hsl(217 91% 60%) !important; border-color: hsl(217 91% 70%) !important; }
                .event-completed {
                    opacity: 0.6;
                    text-decoration: line-through;
                    background-color: hsl(var(--muted)) !important;
                    border-color: hsl(var(--border)) !important;
                }
                .fc-event-icon {
                    margin-right: 4px;
                }
                .fc-daygrid-day-events {
                  min-height: 4em;
                }
                .fc-daygrid-event {
                  padding-top: 2px;
                  padding-bottom: 2px;
                  margin-top: 2px;
                }
            `}</style>
            <Card>
                 <div className="p-4">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, googleCalendarPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridDay,timeGridWeek,dayGridMonth'
                        }}
                        buttonText={{ day: 'Day', week: 'Week', month: 'Month' }}
                        initialView="dayGridMonth"
                        googleCalendarApiKey={settings.googleCalendar.apiKey || undefined}
                        eventSources={eventSources}
                        eventClick={handleEventClick}
                        editable={currentUser.role === Role.DonegeonMaster}
                        eventDrop={handleEventDrop}
                        dateClick={handleDateClick}
                        height="auto"
                        contentHeight="auto"
                        aspectRatio={1.8}
                        dayMaxEvents={3}
                        eventContent={handleEventContent}
                    />
                 </div>
            </Card>

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
