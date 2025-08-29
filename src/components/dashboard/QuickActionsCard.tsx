
import React from 'react';
import Card from '../user-interface/Card';
import QuestWidget from './QuestWidget';
import { Quest } from '../../../types';

interface QuickActionsCardProps {
    quests: Quest[];
    onQuestSelect: (quest: Quest) => void;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ quests, onQuestSelect }) => {
    return (
        <Card title="Quick Actions">
            {quests.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {quests.map(quest => (
                        <QuestWidget key={quest.id} quest={quest} handleQuestSelect={onQuestSelect} />
                    ))}
                </div>
            ) : (
                <p className="text-stone-400 text-center">No available quests right now. Great job!</p>
            )}
        </Card>
    );
};

export default QuickActionsCard;