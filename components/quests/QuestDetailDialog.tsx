

import React, { useEffect, useMemo } from 'react';
import { Quest, RewardCategory, RewardItem, QuestType } from '../../types';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import { CheckCircleIcon } from '../user-interface/Icons';
import { useQuestsDispatch } from '../../context/QuestsContext';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState } from '../../context/EconomyContext';

interface QuestDetailDialogProps {
  quest: Quest;
  onClose: () => void;
  onComplete?: () => void;
  onToggleTodo?: () => void;
  isTodo?: boolean;
  dialogTitle?: string;
}

const QuestDetailDialog: React.FC<QuestDetailDialogProps> = ({ quest, onClose, onComplete, onToggleTodo, isTodo, dialogTitle }) => {
    const { settings } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { completeCheckpoint } = useQuestsDispatch();

    useEffect(() => {
        if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Opened Quest Detail dialog for "${quest.title}".` });
        }
    }, []); // Only on mount.

    const handleClose = () => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Closed Quest Detail dialog for "${quest.title}".` });
        }
        onClose();
    };

    const handleComplete = () => {
        if (quest.type === QuestType.Journey && currentUser) {
            completeCheckpoint(quest.id, currentUser.id);
            onClose(); // Close dialog immediately after action is dispatched
        } else if (onComplete) {
            if (bugLogger.isRecording()) {
                bugLogger.add({ type: 'ACTION', message: `Clicked 'Complete' in Quest Detail dialog for "${quest.title}".` });
            }
            onComplete();
        }
    };

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const renderRewardList = (rewards: RewardItem[], title: string, colorClass: string, isObfuscated: boolean = false) => {
        if (!rewards || rewards.length === 0) return null;
        return (
            <div>
                <p className={`text-xs font-semibold ${colorClass} uppercase tracking-wider`}>{title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                    {rewards.map(r => {
                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                        const prefix = title.toLowerCase().includes(settings.terminology.negativePoint.toLowerCase()) ? '- ' : '+ ';
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-stone-300 flex items-center gap-1" title={name}>
                            {isObfuscated ? `??` : `${prefix}${r.amount}`} <span className="text-base">{icon}</span>
                        </span>
                    })}
                </div>
            </div>
        );
    }
    
    const journeyProgress = useMemo(() => {
        if (quest.type !== QuestType.Journey || !currentUser) return { completed: 0, total: 0, currentIdx: 0 };
        const completed = quest.checkpointCompletions?.[currentUser.id] || 0;
        const total = quest.checkpoints?.length || 0;
        return { completed, total, currentIdx: completed };
    }, [quest, currentUser]);


    const themeClasses = quest.type === QuestType.Duty
      ? 'bg-sky-950 border-sky-800'
      : quest.type === QuestType.Journey
      ? 'bg-purple-950 border-purple-800'
      : 'bg-amber-950 border-amber-800';
    
    const todoClass = isTodo ? '!border-purple-500 ring-2 ring-purple-500/50' : '';
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={handleClose}>
            <div className={`backdrop-blur-sm border rounded-xl shadow-2xl max-w-lg w-full ${themeClasses} ${todoClass}`} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10">
                     {dialogTitle && (
                        <p className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">{dialogTitle}</p>
                    )}
                    <div className="flex items-start gap-4">
                        <div className="text-4xl mt-1">{quest.icon || '📝'}</div>
                        <div>
                            <h2 className="text-2xl font-medieval text-accent">{quest.title}</h2>
                            {quest.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {quest.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-black/20 text-stone-300 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                    <p className="text-stone-300 whitespace-pre-wrap">{quest.description || 'No description provided.'}</p>
                    
                     { (quest.startDateTime || quest.startTime || quest.endDateTime || quest.endTime) && (
                        <div className="space-y-2 pt-4 border-t border-white/10">
                            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Deadlines</p>
                            <div className="text-sm space-y-1 text-stone-200">
                                {quest.startDateTime && (
                                    <p><span className="font-semibold text-green-400">Starts:</span> {new Date(quest.startDateTime).toLocaleString()}</p>
                                )}
                                {quest.startTime && (
                                    <p><span className="font-semibold text-green-400">Starts:</span> Daily at {new Date(`1970-01-01T${quest.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                                )}
                                {quest.endDateTime && (
                                    <p><span className="font-semibold text-red-400">Due:</span> {new Date(quest.endDateTime).toLocaleString()}</p>
                                )}
                                {quest.endTime && (
                                    <p><span className="font-semibold text-red-400">Due:</span> Daily at {new Date(`1970-01-01T${quest.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {quest.type === QuestType.Journey && quest.checkpoints && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <h3 className="font-bold text-lg text-stone-200">Checkpoints</h3>
                            {quest.checkpoints.map((cp, idx) => {
                                const isCompleted = idx < journeyProgress.completed;
                                const isCurrent = idx === journeyProgress.currentIdx;
                                const isFuture = idx > journeyProgress.currentIdx;

                                return (
                                    <div key={cp.id} className={`p-3 rounded-lg border-l-4 ${isCompleted ? 'bg-green-950/50 border-green-600' : isCurrent ? 'bg-blue-950/50 border-blue-500' : 'bg-stone-800/50 border-stone-600'}`}>
                                        <div className="flex items-center gap-2">
                                            {isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                            <p className={`font-semibold ${isCompleted ? 'text-stone-400 line-through' : 'text-stone-200'}`}>Checkpoint {idx + 1}</p>
                                        </div>
                                        {!isFuture && <p className="text-sm text-stone-300 mt-1">{cp.description}</p>}
                                        <div className="mt-2">
                                            {renderRewardList(cp.rewards, `Checkpoint ${settings.terminology.points}`, 'text-sky-400', isFuture)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}


                    <div className="space-y-3 pt-4 border-t border-white/10">
                        {renderRewardList(quest.rewards, `Final ${settings.terminology.points}`, 'text-green-400')}
                        {renderRewardList(quest.lateSetbacks, `Late ${settings.terminology.negativePoints}`, 'text-yellow-400')}
                        {renderRewardList(quest.incompleteSetbacks, `Incomplete ${settings.terminology.negativePoints}`, 'text-red-400')}
                    </div>
                </div>

                <div className="p-4 bg-black/20 rounded-b-xl flex justify-between items-center gap-2 flex-wrap">
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <div className="flex items-center gap-4">
                        {onToggleTodo && quest.type === QuestType.Venture && (
                            <ToggleSwitch
                                enabled={!!isTodo}
                                setEnabled={() => onToggleTodo()}
                                label="To-Do"
                            />
                        )}
                        {onComplete && (
                            <Button onClick={handleComplete}>
                                {quest.type === QuestType.Journey ? 'Complete Checkpoint' : 'Complete'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestDetailDialog;
