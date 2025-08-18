import React from 'react';
import { Quest, QuestKind, QuestType, RewardTypeDefinition, RewardCategory } from '../../types';
import { useData } from '../../context/DataProvider';

interface QuestWidgetProps {
    quest: Quest;
    handleQuestSelect: (quest: Quest) => void;
}

const QuestWidget: React.FC<QuestWidgetProps> = ({ quest, handleQuestSelect }) => {
    const { rewardTypes } = useData();

    const getRewardInfo = (id: string): RewardTypeDefinition => {
        return rewardTypes.find(rt => rt.id === id) || { id: 'unknown', name: 'Unknown Reward', icon: '❓', category: RewardCategory.XP, description: '', isCore: false, iconType: 'emoji', baseValue: 0 };
    };

    const getDueDateString = (q: Quest): string | null => {
        if (q.type === QuestType.Venture && q.endDateTime) {
            return `Due: ${new Date(q.endDateTime).toLocaleDateString()}`;
        }
        if (q.type === QuestType.Duty && q.startTime) {
            return `Due Today at: ${new Date(`1970-01-01T${q.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}`;
        }
        return null;
    };

    const isRedemption = quest.kind === QuestKind.Redemption;

    const cardClass = quest.type === QuestType.Duty
        ? 'bg-blue-950/70 border-blue-800/80 hover:border-blue-600'
        : 'bg-purple-950/70 border-purple-800/80 hover:border-purple-600';
    
    const finalCardClass = isRedemption ? 'bg-slate-800/70 border-slate-600/80 hover:border-slate-400' : cardClass;

    const isCollaborative = quest.kind === QuestKind.GuildCollaborative;
    const progress = isCollaborative ? ((quest.contributions?.length || 0) / (quest.completionGoal || 1)) * 100 : 0;

    return (
        <div
            onClick={() => handleQuestSelect(quest)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors grid grid-cols-1 md:grid-cols-3 gap-2 items-center ${finalCardClass}`}
        >
            <div className="md:col-span-1 truncate">
                <p className="font-semibold text-stone-100 flex items-center gap-2 truncate" title={quest.title}>
                    {isRedemption && <span title="Redemption Quest">⚖️</span>}
                    {quest.icon} {quest.title}
                </p>
                {isCollaborative && (
                    <div className="w-full bg-stone-700 rounded-full h-2.5 mt-2">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                    </div>
                )}
            </div>
            <p className="text-xs text-stone-400 md:col-span-1 md:text-center truncate">{getDueDateString(quest)}</p>

            {quest.rewards.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold md:col-span-1 md:justify-end">
                    {quest.rewards.map(r => {
                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+ {r.amount} <span className="text-base">{icon}</span></span>
                    })}
                </div>
            )}
        </div>
    );
};

export default QuestWidget;