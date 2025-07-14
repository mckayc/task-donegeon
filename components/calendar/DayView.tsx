
import React from 'react';
import { Quest, QuestCompletion, QuestType } from '../../types';
import QuestList from './QuestList';

interface DayViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const DayView: React.FC<DayViewProps> = ({ currentDate, quests, questCompletions }) => {
    return (
         <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-stone-700/60 bg-stone-900/20">
            <div className="flex-1 p-4 space-y-4 h-[70vh] overflow-y-auto scrollbar-hide">
                <h3 className="text-xl font-bold text-sky-400">Duties</h3>
                <QuestList
                    date={currentDate}
                    quests={quests.filter(q => q.type === QuestType.Duty)}
                    questCompletions={questCompletions}
                />
            </div>
            <div className="flex-1 p-4 space-y-4 h-[70vh] overflow-y-auto scrollbar-hide">
                <h3 className="text-xl font-bold text-amber-400">Ventures</h3>
                <QuestList
                    date={currentDate}
                    quests={quests.filter(q => q.type === QuestType.Venture)}
                    questCompletions={questCompletions}
                />
            </div>
        </div>
    );
};

export default DayView;
