
import React, { useMemo } from 'react';
import { Quest, QuestCompletion, QuestType, QuestAvailability } from '../../types';
import { isQuestAvailableForUser, toYMD } from '../../utils/quests';
import Button from '../ui/Button';
import { useAppDispatch, useAuthState } from '../../context/AppContext';
import QuestDetailDialog from '../quests/QuestDetailDialog';

interface QuestListProps {
    title?: string;
    date: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
    onQuestSelect: (quest: Quest) => void;
}

const QuestList: React.FC<QuestListProps> = ({ title, date, quests, questCompletions, onQuestSelect }) => {
    const { currentUser } = useAuthState();
    const isFuture = toYMD(date) > toYMD(new Date());

    if (quests.length === 0) {
        if (title) { // Only show message if a title was provided
             return (
                <div>
                    <h3 className="text-xl font-bold text-stone-300 mb-2">{title}</h3>
                    <p className="text-sm text-stone-500">No {title?.toLowerCase()} for this day.</p>
                </div>
            );
        }
        return null;
    }
    
    return (
        <>
            {title && <h3 className="text-xl font-bold text-stone-300 mb-2">{title}</h3>}
            <div className="space-y-2">
                {quests.map(quest => {
                    const isAvailable = isQuestAvailableForUser(quest, questCompletions, date);
                    const isTodo = quest.type === QuestType.Venture && currentUser && quest.todoUserIds?.includes(currentUser.id);
                    const bgClass = quest.type === QuestType.Duty ? 'bg-sky-900/40' : 'bg-amber-900/30';
                    const borderClass = isTodo ? 'border-2 border-purple-500' : 'border-2 border-transparent';

                    return (
                        <button
                            key={quest.id}
                            onClick={() => onQuestSelect(quest)}
                            disabled={!isAvailable || isFuture}
                            className={`w-full text-left p-2 rounded-md flex items-center justify-between gap-2 transition-colors ${borderClass} ${
                                isAvailable ? `${bgClass} hover:bg-white/10` : 'bg-stone-800/50 opacity-60 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden text-left flex-grow">
                                <span className="text-lg">{quest.icon}</span>
                                <p className={`text-sm font-semibold text-stone-200 truncate ${!isAvailable ? 'line-through text-stone-400' : ''}`} title={quest.title}>{quest.title}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default QuestList;
