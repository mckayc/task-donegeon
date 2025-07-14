

import React from 'react';
import { Quest, QuestCompletion, QuestType, QuestAvailability } from '../../types';
import { isQuestAvailableForUser } from '../../utils/quests';
import CompleteQuestDialog from '../quests/CompleteQuestDialog';
import Button from '../ui/Button';
import { useAppDispatch, useAppState } from '../../context/AppContext';

interface QuestListProps {
    title?: string;
    date: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const QuestList: React.FC<QuestListProps> = ({ title, date, quests, questCompletions }) => {
    const [completingQuest, setCompletingQuest] = React.useState<Quest | null>(null);
    const { completeQuest } = useAppDispatch();
    const { currentUser } = useAppState();

    const isQuestScheduledForDay = (quest: Quest, day: Date): boolean => {
        if (quest.type === QuestType.Venture) {
            return !!quest.lateDateTime && new Date(quest.lateDateTime).toDateString() === day.toDateString();
        }
        // It's a Duty
        switch (quest.availabilityType) {
            case QuestAvailability.Daily: return true;
            case QuestAvailability.Weekly: return quest.weeklyRecurrenceDays.includes(day.getDay());
            case QuestAvailability.Monthly: return quest.monthlyRecurrenceDays.includes(day.getDate());
            default: return false;
        }
    }

    const scheduledQuests = quests.filter(q => isQuestScheduledForDay(q, date));

    if (scheduledQuests.length === 0) {
        return (
            <div>
                {title && <h3 className="text-xl font-bold text-stone-300 mb-2">{title}</h3>}
                <p className="text-sm text-stone-500">No {title?.toLowerCase()} scheduled for this day.</p>
            </div>
        );
    }

    const handleComplete = (quest: Quest) => {
        if (!currentUser) return;
        if (quest.requiresApproval) {
            setCompletingQuest(quest);
        } else {
            completeQuest(quest.id, currentUser.id, quest.rewards, quest.requiresApproval, quest.guildId, { completionDate: date });
        }
    };
    
    return (
        <div>
            {title && <h3 className="text-xl font-bold text-stone-300 mb-2">{title}</h3>}
            <div className="space-y-2">
                {scheduledQuests.map(quest => {
                    const isAvailable = isQuestAvailableForUser(quest, questCompletions, date);
                    return (
                        <div key={quest.id} className={`p-2 rounded-md flex items-center justify-between gap-2 ${isAvailable ? 'bg-stone-800' : 'bg-stone-800/50 opacity-50'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-lg">{quest.icon}</span>
                                <p className="text-sm font-semibold text-stone-200 truncate" title={quest.title}>{quest.title}</p>
                            </div>
                            <Button
                                onClick={() => handleComplete(quest)}
                                disabled={!isAvailable}
                                className="text-xs py-1 px-2 flex-shrink-0"
                            >
                                {isAvailable ? 'Complete' : 'Done'}
                            </Button>
                        </div>
                    );
                })}
            </div>
            {completingQuest && (
                <CompleteQuestDialog 
                    quest={completingQuest} 
                    onClose={() => setCompletingQuest(null)} 
                />
            )}
        </div>
    );
};

export default QuestList;
