
import React from 'react';
import { Quest, QuestCompletion, QuestAvailability, QuestType } from '../../types';
import { toYMD } from '../../utils/quests';
import QuestList from './QuestList';

interface WeekViewProps {
    currentDate: Date;
    quests: Quest[];
    questCompletions: QuestCompletion[];
}

const WeekView: React.FC<WeekViewProps> = ({ currentDate, quests, questCompletions }) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    return (
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-stone-700/60 bg-stone-900/20">
            {days.map(day => (
                <div key={day.toISOString()} className="flex-1 min-w-[200px]">
                    <div className="text-center font-semibold py-2 bg-stone-800/50 text-stone-300">
                        <p>{day.toLocaleDateString('default', { weekday: 'long' })}</p>
                        <p className="text-sm">{day.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="p-2 space-y-4 h-[60vh] overflow-y-auto scrollbar-hide">
                        <QuestList
                            title="Duties"
                            date={day}
                            quests={quests.filter(q => q.type === QuestType.Duty)}
                            questCompletions={questCompletions}
                        />
                        <QuestList
                            title="Ventures"
                            date={day}
                            quests={quests.filter(q => q.type === QuestType.Venture)}
                            questCompletions={questCompletions}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WeekView;
