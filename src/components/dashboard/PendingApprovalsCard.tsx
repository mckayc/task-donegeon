import React from 'react';
import Card from '../user-interface/Card';
import { Quest } from '../../types';
import { useQuestsState } from '../../context/QuestsContext';

interface PendingApprovals {
    quests: { id: string; title: string; submittedAt: string; questId: string; }[];
    purchases: { id: string; title: string; submittedAt: string; }[];
}

interface PendingApprovalsCardProps {
    pendingData: PendingApprovals;
    onQuestSelect: (quest: Quest) => void;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const PendingApprovalsCard: React.FC<PendingApprovalsCardProps> = ({ pendingData, onQuestSelect, ...cardProps }) => {
    const { quests } = useQuestsState();

    const handleQuestClick = (questId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (quest) {
            onQuestSelect(quest);
        }
    };

    const hasPendingItems = pendingData.quests.length > 0 || pendingData.purchases.length > 0;

    return (
        <Card title="My Pending Items" {...cardProps}>
            {hasPendingItems ? (
                <div className="space-y-4">
                    {pendingData.quests.length > 0 && (
                        <div>
                            <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1">Quests</h4>
                            <ul className="space-y-2">
                                {pendingData.quests.map(item => (
                                    <li key={item.id} className="text-sm">
                                        <button 
                                            onClick={() => handleQuestClick(item.questId)} 
                                            className="text-stone-200 hover:text-accent hover:underline text-left"
                                        >
                                            {item.title}
                                        </button>
                                        <span className="text-xs text-stone-400 ml-2">
                                            (Submitted: {new Date(item.submittedAt).toLocaleDateString()})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {pendingData.purchases.length > 0 && (
                        <div>
                            <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1">Purchases</h4>
                            <ul className="space-y-2">
                                {pendingData.purchases.map(item => (
                                    <li key={item.id} className="text-sm text-stone-200">
                                        {item.title}
                                        <span className="text-xs text-stone-400 ml-2">
                                            (Requested: {new Date(item.submittedAt).toLocaleDateString()})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-stone-400 text-center text-sm">No items are currently pending your review.</p>
            )}
        </Card>
    );
};

export default PendingApprovalsCard;