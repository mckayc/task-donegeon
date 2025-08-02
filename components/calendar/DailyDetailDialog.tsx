import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestCompletion, QuestType } from '../../types';
import { Button } from '@/components/ui/button';
import { toYMD, questSorter } from '../../utils/quests';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import { useCalendarVentures } from '../../hooks/useCalendarVentures';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
            textClass: 'font-semibold text-foreground',
            isStrikethrough: false,
            containerOpacity: '',
        },
        pending: {
            iconContainerClass: 'bg-yellow-900/50 text-yellow-400',
            iconJsx: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 7.586V6z" clipRule="evenodd" /></svg>,
            textClass: 'font-semibold text-foreground/80',
            isStrikethrough: false,
            containerOpacity: 'opacity-80',
        },
        completed: {
            iconContainerClass: 'bg-green-900/50 text-green-400',
            iconJsx: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
            textClass: 'font-semibold text-muted-foreground',
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


    const backgroundClass = quest.type === QuestType.Duty ? 'bg-sky-900/40 hover:bg-sky-900/60' : 'bg-amber-900/30 hover:bg-amber-900/50';
    const todoBorderClass = isTodoVenture ? 'border-2 border-purple-500' : 'border-2 border-transparent';
    const optionalClass = quest.isOptional ? "border-dashed" : "";
    const isDisabled = status === 'completed' || (status === 'todo' && isFuture);

    const containerClasses = [
        `${backgroundClass} p-3 rounded-lg flex items-center justify-between gap-3 transition-colors w-full`,
        isTodoVenture ? todoBorderClass : (quest.isOptional ? optionalClass : todoBorderClass),
        currentConfig.containerOpacity,
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
    ].join(" ");

    return (
        <button
            className={containerClasses}
            onClick={() => onSelect(quest)}
            disabled={isDisabled}
        >
            <div className="flex items-center gap-3 overflow-hidden text-left flex-grow" >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentConfig.iconContainerClass}`}>
                    {currentConfig.iconJsx}
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className={`${currentConfig.textClass} truncate ${currentConfig.isStrikethrough ? 'line-through' : ''}`} title={quest.title}>{quest.title}</p>
                    {(dueTime || quest.isOptional) && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {quest.isOptional && 'Optional'}
                            {quest.isOptional && dueTime && ' · '}
                            {dueTime && `Due at ${dueTime}`}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
};


const DailyDetailDialog: React.FC<DailyDetailDialogProps> = ({ date, onClose, scheduledQuests, completedForDay, pendingForDay, questCompletions }) => {
  const { quests, currentUser, scheduledEvents } = useAppState();
  const { markQuestAsTodo, unmarkQuestAsTodo } = useAppDispatch();
  const [selectedQuestForDetail, setSelectedQuestForDetail] = useState<Quest | null>(null);
  const [completingQuest, setCompletingQuest] = useState<Quest | null>(null);
  const availableVentures = useCalendarVentures(date);
  
  const isFutureDate = toYMD(date) > toYMD(new Date());

  const dueQuests = useMemo(() => {
    if(!currentUser) return [];
    const scheduledIds = new Set(scheduledQuests.map(q => q.id));
    const additionalVentures = availableVentures.filter(v => !scheduledIds.has(v.id));
    const combined = [...scheduledQuests, ...additionalVentures];
    const uniqueQuests = Array.from(new Set(combined.map(q => q.id))).map(id => combined.find(q => q.id === id)!);
    return uniqueQuests.sort(questSorter(currentUser, questCompletions, scheduledEvents, date));
  }, [scheduledQuests, availableVentures, currentUser, date, questCompletions, scheduledEvents]);

  const handleStartCompletion = (quest: Quest) => {
      if(isFutureDate) return;
      setCompletingQuest(quest);
      setSelectedQuestForDetail(null);
  };
  
  const handleToggleTodo = () => {
    if (!selectedQuestForDetail || !currentUser) return;
    const quest = selectedQuestForDetail;
    const isCurrentlyTodo = quest.todoUserIds?.includes(currentUser.id);

    if (isCurrentlyTodo) {
        unmarkQuestAsTodo(quest.id, currentUser.id);
    } else {
        markQuestAsTodo(quest.id, currentUser.id);
    }
    
    // Update the dialog's state immediately for better UX
    setSelectedQuestForDetail(prev => {
        if (!prev) return null;
        const newTodoUserIds = isCurrentlyTodo
            ? (prev.todoUserIds || []).filter(id => id !== currentUser.id)
            : [...(prev.todoUserIds || []), currentUser.id];
        return { ...prev, todoUserIds: newTodoUserIds };
    });
  };

  const completedQuestDetails = useMemo(() => {
    return completedForDay.map(comp => quests.find(q => q.id === comp.questId)).filter((q): q is Quest => !!q);
  }, [completedForDay, quests]);

  const pendingQuestDetails = useMemo(() => {
    return pendingForDay.map(comp => quests.find(q => q.id === comp.questId)).filter((q): q is Quest => !!q);
  }, [pendingForDay, quests]);

  const completedIds = new Set([...completedForDay, ...pendingForDay].map(c => c.questId));
  const todoQuests = dueQuests.filter(q => !completedIds.has(q.id));

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-accent">
              {date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
              {isFutureDate && <p className="text-center text-yellow-400 bg-yellow-900/50 p-2 rounded-md">You cannot complete quests for a future date.</p>}
              
              {todoQuests.length > 0 && (
                  <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">To-Do</h3>
                      <div className="space-y-3">
                          {todoQuests.map(quest => (
                              <QuestListItem 
                                  key={quest.id} 
                                  quest={quest} 
                                  status="todo" 
                                  onSelect={setSelectedQuestForDetail} 
                                  isFuture={isFutureDate}
                                  isTodoVenture={quest.type === QuestType.Venture && !!currentUser && !!quest.todoUserIds?.includes(currentUser.id)}
                              />
                          ))}
                      </div>
                  </div>
              )}

              {pendingQuestDetails.length > 0 && (
                   <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Pending Approval</h3>
                      <div className="space-y-3">
                          {pendingQuestDetails.map(quest => (
                            <QuestListItem 
                                key={quest.id} 
                                quest={quest} 
                                status="pending" 
                                onSelect={setSelectedQuestForDetail} 
                                isFuture={isFutureDate} 
                                isTodoVenture={false}
                            />
                          ))}
                      </div>
                  </div>
              )}
              
              {completedQuestDetails.length > 0 && (
                   <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Completed</h3>
                      <div className="space-y-3">
                          {completedQuestDetails.map(quest => (
                            <QuestListItem 
                                key={quest.id} 
                                quest={quest} 
                                status="completed" 
                                onSelect={setSelectedQuestForDetail} 
                                isFuture={isFutureDate} 
                                isTodoVenture={false}
                            />
                          ))}
                      </div>
                  </div>
              )}
              
              {todoQuests.length === 0 && completedQuestDetails.length === 0 && pendingQuestDetails.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No quests scheduled for this day.</p>
              )}
          </div>
          <DialogFooter>
              <Button variant="secondary" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedQuestForDetail && currentUser && (
          <QuestDetailDialog 
            quest={selectedQuestForDetail} 
            onClose={() => setSelectedQuestForDetail(null)}
            onComplete={() => handleStartCompletion(selectedQuestForDetail)}
            onToggleTodo={handleToggleTodo}
            isTodo={!!selectedQuestForDetail.todoUserIds?.includes(currentUser.id)}
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