

import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestCompletion, QuestType } from '../../types';
import Button from '../ui/Button';
import { getQuestUserStatus, toYMD } from '../../utils/quests';

interface DailyDetailDialogProps {
  date: Date;
  onClose: () => void;
  dueQuests: Quest[];
  completedForDay: QuestCompletion[];
  pendingForDay: QuestCompletion[];
}

const QuestListItem: React.FC<{
    quest: Quest;
    status: 'todo' | 'pending' | 'completed';
    onAction: (quest: Quest, action: 'complete' | 'claim' | 'release') => void;
    isFuture: boolean;
    date: Date;
}> = ({ quest, status, onAction, isFuture, date }) => {
    const { currentUser, questCompletions } = useAppState();
    if (!currentUser) return null;

    const userStatus = getQuestUserStatus(quest, currentUser, questCompletions, date);

    const renderButtons = () => {
        const disabled = isFuture;
        switch (userStatus.status) {
            case 'CLAIMABLE':
                return <Button variant="primary" className="text-sm py-1 px-3 !bg-sky-600 hover:!bg-sky-500" onClick={() => onAction(quest, 'claim')} disabled={disabled}>{userStatus.buttonText}</Button>;
            case 'RELEASEABLE':
                return <>
                    <Button variant="secondary" className="text-sm py-1 px-3 !bg-orange-800/60 hover:!bg-orange-700/70 text-orange-200" onClick={() => onAction(quest, 'release')} disabled={disabled}>Release</Button>
                    <Button variant="primary" className="text-sm py-1 px-3" onClick={() => onAction(quest, 'complete')} disabled={disabled}>{userStatus.buttonText}</Button>
                </>;
            default: // AVAILABLE
                return <Button variant="primary" className="text-sm py-1 px-3" onClick={() => onAction(quest, 'complete')} disabled={disabled || userStatus.isActionDisabled}>{userStatus.buttonText}</Button>;
        }
    };

    if (status === 'todo') {
        return (
            <div className="bg-stone-900/50 p-3 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${quest.type === QuestType.Duty ? 'bg-sky-900/50' : 'bg-amber-900/50'}`}>
                        <span className="font-bold text-xl">{quest.icon || '📝'}</span>
                    </div>
                    <p className="font-semibold text-stone-200 truncate" title={quest.title}>{quest.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {renderButtons()}
                </div>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="bg-stone-900/50 p-3 rounded-lg flex items-center justify-between gap-3 opacity-80">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-900/50 text-yellow-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 7.586V6z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="font-semibold text-stone-300 truncate" title={quest.title}>{quest.title}</p>
                </div>
                <Button variant="secondary" className="text-sm py-1 px-3" disabled>Pending</Button>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="bg-stone-900/50 p-3 rounded-lg flex items-center justify-between gap-3 opacity-60">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-900/50 text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <p className="font-semibold text-stone-300 line-through truncate" title={quest.title}>{quest.title}</p>
                </div>
                <Button variant="secondary" className="text-sm py-1 px-3" disabled>Completed</Button>
            </div>
        );
    }

    return null;
};


const DailyDetailDialog: React.FC<DailyDetailDialogProps> = ({ date, onClose, dueQuests, completedForDay, pendingForDay }) => {
  const { quests, currentUser } = useAppState();
  const { completeQuest, claimQuest, releaseQuest } = useAppDispatch();

  const isFutureDate = toYMD(date) > toYMD(new Date());

  const handleAction = (quest: Quest, action: 'complete' | 'claim' | 'release') => {
    if (!currentUser) return;
    if (action === 'complete') {
        const needsNote = quest.requiresApproval;
        if (needsNote) {
            const note = window.prompt("Add an optional note for this quest completion:");
            completeQuest(quest.id, currentUser.id, quest.rewards, quest.requiresApproval, quest.guildId, { note: note || undefined, completionDate: date });
        } else {
            completeQuest(quest.id, currentUser.id, quest.rewards, quest.requiresApproval, quest.guildId, { completionDate: date });
        }
    } else if (action === 'claim') {
        claimQuest(quest.id, currentUser.id);
    } else if (action === 'release') {
        releaseQuest(quest.id, currentUser.id);
    }
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-700/60">
            <h2 className="text-2xl font-medieval text-emerald-400">{date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
            {isFutureDate && <p className="text-center text-yellow-400 bg-yellow-900/50 p-2 rounded-md">You cannot complete quests for a future date.</p>}
            
            {todoQuests.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-stone-200 mb-3">To-Do</h3>
                    <div className="space-y-3">
                        {todoQuests.map(quest => <QuestListItem key={quest.id} quest={quest} status="todo" onAction={handleAction} isFuture={isFutureDate} date={date} />)}
                    </div>
                </div>
            )}

            {pendingQuestDetails.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold text-stone-200 mb-3">Pending Approval</h3>
                    <div className="space-y-3">
                        {pendingQuestDetails.map(quest => <QuestListItem key={quest.id} quest={quest} status="pending" onAction={handleAction} isFuture={isFutureDate} date={date}/>)}
                    </div>
                </div>
            )}
            
            {completedQuestDetails.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold text-stone-200 mb-3">Completed</h3>
                    <div className="space-y-3">
                        {completedQuestDetails.map(quest => <QuestListItem key={quest.id} quest={quest} status="completed" onAction={handleAction} isFuture={isFutureDate} date={date}/>)}
                    </div>
                </div>
            )}
            
            {todoQuests.length === 0 && completedQuestDetails.length === 0 && pendingQuestDetails.length === 0 && (
                <p className="text-stone-400 text-center py-8">No quests scheduled for this day.</p>
            )}
        </div>
        <div className="p-4 border-t border-stone-700/60 text-right">
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default DailyDetailDialog;
