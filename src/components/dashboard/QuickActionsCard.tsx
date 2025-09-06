import React from 'react';
import Card from '../user-interface/Card';
import QuestWidget from './QuestWidget';
import { Quest, QuestType } from '../../../types';
import { useSystemState } from '../../context/SystemContext';

interface QuickActionsCardProps {
    quests: Quest[];
    onQuestSelect: (quest: Quest) => void;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ quests, onQuestSelect, ...cardProps }) => {
    const { settings } = useSystemState();
    const duties = quests.filter(q => q.type === QuestType.Duty);
    const venturesAndJourneys = quests.filter(q => q.type === QuestType.Venture || q.type === QuestType.Journey);

    return (
        <Card title="Quick Actions" {...cardProps}>
            {quests.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {duties.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-lg text-stone-300 border-b border-stone-700 pb-1 capitalize">{settings.terminology.recurringTasks}</h4>
                            {duties.map(quest => (
                                <QuestWidget key={quest.id} quest={quest} handleQuestSelect={onQuestSelect} />
                            ))}
                        </div>
                    )}
                    {venturesAndJourneys.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-lg text-stone-300 border-b border-stone-700 pb-1 capitalize">{settings.terminology.singleTasks} & {settings.terminology.journeys}</h4>
                             {venturesAndJourneys.map(quest => (
                                <QuestWidget key={quest.id} quest={quest} handleQuestSelect={onQuestSelect} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-stone-400 text-center">No available quests right now. Great job!</p>
            )}
        </Card>
    );
};

export default QuickActionsCard;