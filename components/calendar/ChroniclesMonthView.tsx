import React, { useState, useEffect } from 'react';
import { toYMD } from '../../utils/quests';
import { useChronicles } from '../../hooks/useChronicles';
import ChroniclesDetailDialog from './ChroniclesDetailDialog';

interface ChroniclesMonthViewProps {
    currentDate: Date;
}

const ChroniclesMonthView: React.FC<ChroniclesMonthViewProps> = ({ currentDate }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    
    useEffect(() => {
        setSelectedDate(null);
    }, [currentDate]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const chroniclesByDate = useChronicles({ startDate: startOfMonth, endDate: endOfMonth });

    const startDayOfWeek = startOfMonth.getDay();
    const numDays = endOfMonth.getDate();
    const days: (Date | null)[] = Array.from({ length: startDayOfWeek }, () => null);
    for (let i = 1; i <= numDays; i++) { days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i)); }
    const today = new Date();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <>
            <div className="grid grid-cols-7 gap-px bg-stone-700/60 border-t border-l border-stone-700/60">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold py-2 bg-stone-800/50 text-stone-300 text-sm">{day}</div>
                ))}
                {days.map((day, index) => {
                    const isToday = day && toYMD(day) === toYMD(today);
                    const dateKey = day ? toYMD(day) : '';
                    const dailyChronicles = chroniclesByDate.get(dateKey) || [];
                    
                    return (
                        <div
                            key={index}
                            role={day ? 'button' : 'presentation'}
                            tabIndex={day ? 0 : -1}
                            onClick={day ? () => setSelectedDate(day) : undefined}
                            className={`relative h-32 md:h-40 p-2 text-left align-top bg-stone-800 text-stone-300 overflow-hidden focus:z-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 ring-inset ${day ? 'hover:bg-stone-700/50 transition-colors duration-150 cursor-pointer' : 'bg-stone-900/50 cursor-default'} ${isToday ? 'border-2 border-emerald-500' : 'border-b border-r border-stone-700/60'}`}
                        >
                            {day && <span className="font-bold">{day.getDate()}</span>}
                             {dailyChronicles.length > 0 && (
                                <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1">
                                    <span className="text-xs font-bold mr-1 bg-black/30 px-1 rounded">{dailyChronicles.length}</span>
                                    {dailyChronicles.slice(0,8).map(event => (
                                        <div key={event.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} title={event.title}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <ChroniclesDetailDialog
                    date={selectedDate}
                    events={chroniclesByDate.get(toYMD(selectedDate)) || []}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </>
    );
};

export default ChroniclesMonthView;