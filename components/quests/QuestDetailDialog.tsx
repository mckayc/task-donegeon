import React from 'react';
import { Quest, RewardCategory, RewardItem, QuestType } from '../../types';
import { useAppState } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import ToggleSwitch from '../ui/toggle-switch';
import { isQuestAvailableForUser } from '../../utils/quests';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface QuestDetailDialogProps {
  quest: Quest;
  onClose: () => void;
  onComplete?: () => void;
  onToggleTodo?: () => void;
  isTodo?: boolean;
  dialogTitle?: string;
}

const QuestDetailDialog: React.FC<QuestDetailDialogProps> = ({ quest, onClose, onComplete, onToggleTodo, isTodo, dialogTitle }) => {
    const { rewardTypes, settings, currentUser, questCompletions, appMode, scheduledEvents } = useAppState();
    
    if (!currentUser) return null;

    const isAvailable = isQuestAvailableForUser(quest, questCompletions.filter(c => c.userId === currentUser.id), new Date(), scheduledEvents, appMode);

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
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-foreground flex items-center gap-1" title={name}>
                            {title.toLowerCase().includes(settings.terminology.negativePoint.toLowerCase()) ? '- ' : '+ '}{r.amount} <span className="text-base">{icon}</span>
                        </span>
                    })}
                </div>
            </div>
        );
    }
    
    const todoClass = isTodo ? '!border-purple-500 ring-2 ring-purple-500/50' : '';
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className={`sm:max-w-lg ${todoClass}`}>
                <DialogHeader>
                     {dialogTitle && (
                        <DialogDescription className="text-sm font-bold uppercase tracking-wider !mb-2">{dialogTitle}</DialogDescription>
                    )}
                    <div className="flex items-start gap-4">
                        <div className="text-4xl mt-1">{quest.icon || '📝'}</div>
                        <div>
                            <DialogTitle className="text-2xl text-accent">{quest.title}</DialogTitle>
                            {quest.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {quest.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-background/50 text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide pr-2">
                    <p className="text-foreground whitespace-pre-wrap">{quest.description || 'No description provided.'}</p>
                    
                     { (quest.lateDateTime || quest.lateTime || quest.incompleteDateTime || quest.incompleteTime) && (
                        <div className="space-y-2 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadlines</p>
                            <div className="text-sm space-y-1 text-foreground">
                                {quest.lateDateTime && (
                                    <p><span className="font-semibold text-yellow-400">Becomes Late:</span> {new Date(quest.lateDateTime).toLocaleString()}</p>
                                )}
                                {quest.lateTime && (
                                    <p><span className="font-semibold text-yellow-400">Becomes Late:</span> Daily at {new Date(`1970-01-01T${quest.lateTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                                )}
                                {quest.incompleteDateTime && (
                                    <p><span className="font-semibold text-red-400">Becomes Incomplete:</span> {new Date(quest.incompleteDateTime).toLocaleString()}</p>
                                )}
                                {quest.incompleteTime && (
                                    <p><span className="font-semibold text-red-400">Becomes Incomplete:</span> Daily at {new Date(`1970-01-01T${quest.incompleteTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-border">
                        {renderRewardList(quest.rewards, settings.terminology.points, 'text-green-400')}
                        {renderRewardList(quest.lateSetbacks, `Late ${settings.terminology.negativePoints}`, 'text-yellow-400')}
                        {renderRewardList(quest.incompleteSetbacks, `Incomplete ${settings.terminology.negativePoints}`, 'text-red-400')}
                    </div>
                </div>

                <DialogFooter className="!justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-4">
                        {onToggleTodo && quest.type === QuestType.Venture && (
                            <ToggleSwitch
                                enabled={!!isTodo}
                                setEnabled={() => onToggleTodo()}
                                label="To-Do"
                            />
                        )}
                    </div>
                    {onComplete && (
                        <Button onClick={onComplete} disabled={!isAvailable}>
                            {isAvailable ? 'Complete' : 'Unavailable'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default QuestDetailDialog;