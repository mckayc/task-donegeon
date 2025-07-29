import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestCompletion, QuestType } from '../../frontendTypes';
import Button from '../ui/Button';
import { toYMD, questSorter } from '../../utils/quests';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';

interface DailyDetailDialogProps {
  date: Date;
  onClose: () => void;
  scheduledQuests: Quest[];
  completedForDay: QuestCompletion[];
  pendingForDay: QuestCompletion[];
  questCompletions: QuestCompletion[];
}

const QuestListItem: React.FC<{
    quest: Quest;
    status: 'todo' | 'pending' | 'completed';
    onSelect: (quest: Quest) => void;
    isFuture: boolean;
    isTodoVenture: boolean;
}> = ({ quest, status, onSelect, isFuture, isTodoVenture }) => {
    
    const statusConfig = {
        todo: {
            iconContainerClass: quest.type === QuestType.Duty ? 'bg-sky-900/50' : 'bg-amber-900/50',
            iconJsx: <span className="font-bold text-xl">{quest.icon || '📝'}</span>,
            textClass: 'font-semibold text-stone-200',
            isStrikethrough: false,
            containerOpacity: '',
        },
        pending: {
            iconContainerClass: 'bg-yellow-900/50 text-yellow-400',
            iconJsx: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 7.586V6z" clipRule="evenodd" /></svg>,
            textClass: 'font-semibold text-stone-300',
            isStrikethrough: false,
            containerOpacity: 'opacity-80',
        },
        completed: {
            iconContainerClass: 'bg-green-900/50 text-green-400',
            iconJsx: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
            textClass: 'font-semibold text-stone-300',
            isStrikethrough: true,
            containerOpacity: 'opacity-60',
        }
    };

    const currentConfig = statusConfig[status];
    if (!currentConfig) return null;

    const dueTime = useMemo(() => {
        if (quest.type === QuestType.Duty && quest.lateTime) {
            return new Date(`1970-01-01T${quest.lateTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
        }
        if (quest.type === QuestType.Venture && quest.lateDateTime) {
            return new Date(quest.lateDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return null;
    }, [quest]);


    const backgroundClass = quest.type === QuestType.Duty ? 'bg-sky-900/40 hover:bg-sky-900/60' : 'bg-amber-900/30 hover:bg-amber-900/60';
    const borderClass = isTodoVenture ? 'border-2 border-purple-500' : 'border-2 border-transparent';
    
    return (
        <button
            onClick={() => onSelect(quest)}
            disabled={isFuture || status === 'completed' || status === 'pending'}
            className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-4 transition-colors ${currentConfig.containerOpacity} ${backgroundClass} ${borderClass}`}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${currentConfig.iconContainerClass}`}>
                    {currentConfig.iconJsx}
                </div>
                <div className="overflow-hidden">
                    <p className={`truncate ${currentConfig.textClass} ${currentConfig.isStrikethrough ? 'line-through text-stone-400' : ''}`} title={quest.title}>{quest.title}</p>
                    {dueTime && <p className="text-xs text-stone-400">{dueTime}</p>}
                </div>
            </div>
        </button>
    )
};

const DailyDetailDialog: React.FC<DailyDetailDialogProps> = ({ date, onClose, scheduledQuests, completedForDay, pendingForDay, questCompletions }) => {
    const { currentUser, settings, scheduledEvents, appMode } = useAppState();
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
    const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
    const isFuture = toYMD(date) > toYMD(new Date());

    if (!currentUser) return null;

    const questsWithStatus = useMemo(() => {
        const completedIds = new Set(completedForDay.map(c => c.questId));
        const pendingIds = new Set(pendingForDay.map(c => c.questId));
        
        const completed = completedForDay.map(c => ({ quest: scheduledQuests.find(q => q.id === c.questId)!, status: 'completed' as const }));
        const pending = pendingForDay.map(c => ({ quest: scheduledQuests.find(q => q.id === c.questId)!, status: 'pending' as const }));
        const todo = scheduledQuests.filter(q => !completedIds.has(q.id) && !pendingIds.has(q.id)).map(q => ({ quest: q, status: 'todo' as const }));
        
        return [...todo, ...pending, ...completed].filter(item => item.quest); // Filter out any undefined quests
    }, [scheduledQuests, completedForDay, pendingForDay]);

    const handleStartCompletion = (quest: Quest) => {
        setCompletingQuest(quest);
        setSelectedQuest(null);
    };

    const handleToggleTodo = () => {
        if (!selectedQuest) return;
        const quest = selectedQuest;
        const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);
        
        if (isCurrentlyTodo) {
            unmarkQuestAsTodo(selectedQuest.id, currentUser.id);
        } else {
            markQuestAsTodo(selectedQuest.id, currentUser.id);
        }

        // Update the dialog's state immediately for better UX
        setSelectedQuest(prev => {
            if (!prev) return null;
            const newTodoUserIds = isCurrentlyTodo
                ? (prev.todoUserIds || []).filter(id => id !== currentUser.id)
                : [...(prev.todoUserIds || []), currentUser.id];
            return { ...prev, todoUserIds: newTodoUserIds };
        });
    };

    return (
        <>
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-2xl font-medieval text-emerald-400">{date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto scrollbar-hide">
                    {questsWithStatus.length > 0 ? questsWithStatus.map(({ quest, status }) => {
                         const isTodo = quest.type === QuestType.Venture && !!quest.todoUserIds?.includes(currentUser.id);
                         return <QuestListItem key={quest.id} quest={quest} status={status} onSelect={setSelectedQuest} isFuture={isFuture} isTodoVenture={isTodo} />;
                    }) : (
                        <p className="text-stone-400 text-center py-8">No quests scheduled for this day.</p>
                    )}
                </div>
                <div className="p-4 border-t border-stone-700/60 text-right">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
        {selectedQuest && (
            <QuestDetailDialog
                quest={selectedQuest}
                onClose={() => setSelectedQuest(null)}
                onComplete={() => handleStartCompletion(selectedQuest)}
                onToggleTodo={handleToggleTodo}
                isTodo={!!(currentUser && selectedQuest.type === QuestType.Venture && selectedQuest.todoUserIds?.includes(currentUser.id))}
            />
        )}
        {completingQuest && (
            <CompleteQuestDialog
                quest={completingQuest}
                onClose={() => setCompletingQuest(null)}
                completionDate={date}
            />
        )}
        </>
    );
};

export default DailyDetailDialog;