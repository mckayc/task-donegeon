import React from 'react';
import { toYMD } from '../../utils/quests';
import { useChronicles } from '../../hooks/useChronicles';
import { ChronicleEvent } from '../../frontendTypes';

const ChronicleItem: React.FC<{ event: ChronicleEvent }> = ({ event }) => (
    <div className={`p-2 rounded-md border-l-4`} style={{borderColor: event.color}}>
        <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{event.icon}</span>
            <div>
                <p className="font-semibold text-stone-200 text-sm leading-tight">{event.title}</p>
                <p className="text-xs text-stone-400">{event.status}</p>
            </div>
        </div>
    </div>
);

const DayColumn: React.FC<{ day: Date, events: ChronicleEvent[] }> = ({ day, events }) => {
    const isToday = toYMD(day) === toYMD(new Date());
    return (
        <div className={`flex-1 min-w-[200px] flex flex-col ${isToday ? 'bg-emerald-900/20' : ''}`}>
            <div className={`text-center font-semibold py-2 ${isToday ? 'bg-emerald-800/30' : 'bg-stone-800/50'} text-stone-300 border-b border-stone-700/60 flex-shrink-0`}>
                <p>{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                <p className="text-2xl">{day.getDate()}</p>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto scrollbar-hide flex-grow h-[65vh]">
                {events.length > 0 ? (
                    events.map(event => <ChronicleItem key={event.id} event={event} />)
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-stone-500 text-xs p-2">No activity recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ChroniclesWeekViewProps {
    currentDate: Date;
}

const ChroniclesWeekView: React.FC<ChroniclesWeekViewProps> = ({ currentDate }) => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const chroniclesByDate = useChronicles({ startDate: startOfWeek, endDate: endOfWeek });

    return (
        <div className="flex flex-row divide-x divide-stone-700/60 bg-stone-900/20">
            {days.map(day => (
                <DayColumn
                    key={day.toISOString()}
                    day={day}
                    events={chroniclesByDate.get(toYMD(day)) || []}
                />
            ))}
        </div>
    );
};

export default ChroniclesWeekView;