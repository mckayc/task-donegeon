import React, { useMemo } from 'react';
import { QuestGroup, Quest } from '../../types';

interface RotationQuestGroupCardProps {
    group: QuestGroup;
    selectedQuestIds: string[];
    questsInGroup: Quest[];
    onToggle: (groupId: string) => void;
}

const RotationQuestGroupCard: React.FC<RotationQuestGroupCardProps> = ({ group, selectedQuestIds, questsInGroup, onToggle }) => {
    const selectionStatus = useMemo(() => {
        const questIdsInGroup = questsInGroup.map(q => q.id);
        if (questIdsInGroup.length === 0) return 'none';

        const selectedCount = questIdsInGroup.filter(id => selectedQuestIds.includes(id)).length;
        
        if (selectedCount === 0) return 'none';
        if (selectedCount === questIdsInGroup.length) return 'all';
        return 'some';
    }, [selectedQuestIds, questsInGroup]);

    const borderClass = {
        'all': 'border-emerald-600 bg-emerald-900/40',
        'some': 'border-emerald-600 border-dashed bg-emerald-900/20',
        'none': 'border-stone-700 hover:border-stone-500'
    }[selectionStatus];

    return (
        <button
            type="button"
            onClick={() => onToggle(group.id)}
            className={`p-3 rounded-lg border-2 flex items-center gap-3 cursor-pointer transition-colors w-full text-left ${borderClass}`}
        >
            <span className="text-2xl">{group.icon}</span>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-stone-200 truncate" title={group.name}>{group.name}</p>
                <p className="text-xs text-stone-400">{questsInGroup.length} quest(s)</p>
            </div>
            {selectionStatus === 'some' && <span className="text-xs font-semibold text-emerald-400">Partial</span>}
        </button>
    );
};

export default RotationQuestGroupCard;