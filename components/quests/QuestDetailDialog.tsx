
import React from 'react';
import { Quest, RewardCategory, RewardItem, QuestType } from '../../types';
import { useGameDataState, useSettingsState } from '../../context/AppContext';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface QuestDetailDialogProps {
  quest: Quest;
  onClose: () => void;
  onComplete?: () => void;
  onToggleTodo?: () => void;
  isTodo?: boolean;
  dialogTitle?: string;
}

const QuestDetailDialog: React.FC<QuestDetailDialogProps> = ({ quest, onClose, onComplete, onToggleTodo, isTodo, dialogTitle }) => {
    const { rewardTypes } = useGameDataState();
    const { settings } = useSettingsState();

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const renderRewardList = (rewards: RewardItem[], title: string, colorClass: string) => {
        if (!rewards || rewards.length === 0) return null;
        return (
            <div>
                <p className={`text-xs font-semibold ${colorClass} uppercase tracking-wider`}>{title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                    {rewards.map(r => {
                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-stone-300 flex items-center gap-1" title={name}>
                            {title.toLowerCase().includes(settings.terminology.negativePoint.toLowerCase()) ? '- ' : '+ '}{r.amount} <span className="text-base">{icon}</span>
                        </span>
                    })}
                </div>
            </div>
        );
    }

    const themeClasses = quest.type === QuestType.Duty
      ? 'bg-sky-950 border-sky-800'
      : 'bg-amber-950 border-amber-800';
    
    const todoClass = isTodo ? '!border-purple-500 ring-2 ring-purple-500/50' : '';
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={onClose}>
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
                    
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        {renderRewardList(quest.rewards, settings.terminology.points, 'text-green-400')}
                        {renderRewardList(quest.lateSetbacks, `Late ${settings.terminology.negativePoints}`, 'text-yellow-400')}
                        {renderRewardList(quest.incompleteSetbacks, `Incomplete ${settings.terminology.negativePoints}`, 'text-red-400')}
                    </div>
                </div>

                <div className="p-4 bg-black/20 rounded-b-xl flex justify-between items-center gap-2 flex-wrap">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <div className="flex items-center gap-4">
                        {onToggleTodo && quest.type === QuestType.Venture && (
                            <ToggleSwitch
                                enabled={!!isTodo}
                                setEnabled={() => onToggleTodo()}
                                label="To-Do"
                            />
                        )}
                        {onComplete && (
                            <Button onClick={onComplete}>Complete</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestDetailDialog;
