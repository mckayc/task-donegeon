
import React from 'react';
import { Quest, QuestType } from '../../types';
import { getDueDateString } from '../../utils/quests';

interface RotationQuestCardProps {
    quest: Quest;
    isSelected: boolean;
    onToggle: () => void;
}

const RotationQuestCard: React.FC<RotationQuestCardProps> = ({ quest, isSelected, onToggle }) => {

    const typeColorClass = quest.type === QuestType.Duty
        ? 'bg-sky-500/20 text-sky-300'
        : quest.type === QuestType.Journey
        ? 'bg-purple-500/20 text-purple-300'
        : 'bg-amber-500/20 text-amber-300';
        
    return (
        <label className={`p-3 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-900/40 border-emerald-600' : 'bg-stone-800/50 border-transparent hover:border-stone-600'}`}>
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="mt-1 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
            />
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-stone-200 flex items-center gap-2">
                    <span>{quest.icon}</span>
                    <span className="whitespace-normal break-words">{quest.title}</span>
                </p>
                <p className="text-xs text-stone-400 whitespace-normal break-words mt-1">
                    {quest.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColorClass}`}>
                        {quest.type}
                    </span>
                    <span className="text-xs text-stone-500">{getDueDateString(quest)}</span>
                </div>
            </div>
        </label>
    );
};

export default RotationQuestCard;