import React, { useState, useEffect } from 'react';
import { QuestType, Terminology } from '../../types';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { useSystemState } from '../../context/SystemContext';
import NumberInput from '../user-interface/NumberInput';

interface QuestSchedulingProps {
    value: {
        type: QuestType;
        startDateTime: string | null;
        endDateTime: string | null;
        allDay: boolean;
        rrule: string | null;
        startTime: string | null;
        endTime: string | null;
        dailyCompletionsLimit?: number;
        totalCompletionsLimit?: number;
    };
    onChange: (newValue: Partial<QuestSchedulingProps['value']>) => void;
}

const WEEKDAYS = [{label: 'S', value: 'SU'}, {label: 'M', value: 'MO'}, {label: 'T', value: 'TU'}, {label: 'W', value: 'WE'}, {label: 'T', value: 'TH'}, {label: 'F', value: 'FR'}, {label: 'S', value: 'SA'}];

const TypeButton: React.FC<{
    type: QuestType;
    currentType: QuestType;
    onClick: (type: QuestType) => void;
    terminology: Terminology;
    tooltip: string;
}> = ({ type, currentType, onClick, terminology, tooltip }) => {
    const termKeyMap = {
        [QuestType.Duty]: 'recurringTask',
        [QuestType.Venture]: 'singleTask',
        [QuestType.Journey]: 'journey',
    } as const;
    const label = terminology[termKeyMap[type]];
    const isActive = type === currentType;

    return (
        <div className="relative group flex-grow">
            <button
                type="button"
                onClick={() => onClick(type)}
                className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${
                    !isActive ? 'text-stone-300 hover:bg-stone-700' : ''
                }`}
                style={isActive ? { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : {}}
            >
                {label}
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 text-xs bg-stone-900 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tooltip}
            </div>
        </div>
    );
};


export const QuestScheduling: React.FC<QuestSchedulingProps> = ({ value, onChange }) => {
    const { settings } = useSystemState();
    const [hasDueDate, setHasDueDate] = useState(!!(value.startDateTime || value.endDateTime));
    const [recurrenceType, setRecurrenceType] = useState('DAILY');
    const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
    const [monthlyDays, setMonthlyDays] = useState<string>('');
    const [interval, setInterval] = useState(1);


    useEffect(() => {
        if (value.rrule) {
            const parts = value.rrule.split(';');
            const freqPart = parts.find(p => p.startsWith('FREQ='));
            const intervalPart = parts.find(p => p.startsWith('INTERVAL='));

            if (freqPart) {
                const freq = freqPart.split('=')[1];
                setRecurrenceType(freq);
                if (freq === 'WEEKLY') {
                    const bydayPart = parts.find(p => p.startsWith('BYDAY='));
                    setWeeklyDays(bydayPart ? bydayPart.split('=')[1].split(',') : []);
                } else if (freq === 'MONTHLY') {
                    const bymonthdayPart = parts.find(p => p.startsWith('BYMONTHDAY='));
                    setMonthlyDays(bymonthdayPart ? bymonthdayPart.split('=')[1] : '');
                }
            }
            setInterval(intervalPart ? parseInt(intervalPart.split('=')[1]) || 1 : 1);
        } else {
            setRecurrenceType('DAILY');
            setWeeklyDays([]);
            setMonthlyDays('');
            setInterval(1);
        }
    }, [value.rrule]);
    
    useEffect(() => {
        setHasDueDate(!!(value.startDateTime || value.endDateTime));
    }, [value.startDateTime, value.endDateTime]);


    const handleTypeChange = (type: QuestType) => {
        if (type === QuestType.Duty) {
            onChange({
                type,
                startDateTime: null,
                endDateTime: null,
                totalCompletionsLimit: 0,
                dailyCompletionsLimit: 1,
                rrule: 'FREQ=DAILY', // Default to daily
            });
        } else { // Venture or Journey
            onChange({
                type,
                rrule: null,
                startTime: null,
                endTime: null,
            });
        }
    };
    
    const updateRrule = (freq: string, weekly: string[], monthly: string, currentInterval: number) => {
        let rrule = `FREQ=${freq}`;
        if (currentInterval > 1) {
            rrule += `;INTERVAL=${currentInterval}`;
        }
        if (freq === 'WEEKLY' && weekly.length > 0) {
            rrule += `;BYDAY=${weekly.join(',')}`;
        }
        if (freq === 'MONTHLY' && monthly.trim()) {
            rrule += `;BYMONTHDAY=${monthly.trim()}`;
        }
        onChange({ rrule });
    };

    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRecurrence = e.target.value;
        setRecurrenceType(newRecurrence);
        updateRrule(newRecurrence, weeklyDays, monthlyDays, interval);
    };

    const handleIntervalChange = (newInterval: number) => {
        setInterval(newInterval);
        updateRrule(recurrenceType, weeklyDays, monthlyDays, newInterval);
    };

    const handleWeeklyDayToggle = (day: string) => {
        const newWeeklyDays = weeklyDays.includes(day)
            ? weeklyDays.filter(d => d !== day)
            : [...weeklyDays, day].sort((a,b) => WEEKDAYS.findIndex(d => d.value === a) - WEEKDAYS.findIndex(d => d.value === b));
        setWeeklyDays(newWeeklyDays);
        updateRrule('WEEKLY', newWeeklyDays, monthlyDays, interval);
    };

    const handleMonthlyDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMonthlyDays = e.target.value.replace(/[^0-9,]/g, '');
        setMonthlyDays(newMonthlyDays);
        updateRrule('MONTHLY', weeklyDays, newMonthlyDays, interval);
    };
    
    const handleAllDayToggle = (allDay: boolean) => {
        if (value.type === QuestType.Duty) {
            onChange({ allDay, startTime: null, endTime: null });
        } else {
            onChange({ allDay });
        }
    };

    const intervalUnit = recurrenceType === 'DAILY' ? 'day(s)' : recurrenceType === 'WEEKLY' ? 'week(s)' : 'month(s)';

    return (
        <fieldset className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg text-stone-200">Scheduling</h3>
            <div className="flex space-x-2 p-1 bg-stone-700/50 rounded-lg">
                <TypeButton type={QuestType.Duty} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="A recurring task, like a daily chore." />
                <TypeButton type={QuestType.Venture} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="A one-time task or project with an optional deadline." />
                <TypeButton type={QuestType.Journey} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="A multi-step quest with checkpoints." />
            </div>
            
            {value.type === QuestType.Duty ? (
                // --- Duty Scheduling ---
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Daily Limit" min={0} value={value.dailyCompletionsLimit || 1} onChange={val => onChange({ dailyCompletionsLimit: val })} />
                        <div className="pt-7"><ToggleSwitch enabled={value.allDay} setEnabled={handleAllDayToggle} label="All Day" /></div>
                    </div>

                    {!value.allDay && (
                         <div className="grid grid-cols-2 gap-4">
                            <Input label="Due Time" type="time" value={value.startTime || ''} onChange={e => onChange({ startTime: e.target.value })} />
                            <Input label="Incomplete Time" type="time" value={value.endTime || ''} onChange={e => onChange({ endTime: e.target.value })} />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                         <Input as="select" label="Repeats" value={recurrenceType} onChange={handleRecurrenceChange}>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </Input>
                        <NumberInput label={`Every`} min={1} value={interval} onChange={handleIntervalChange} />
                    </div>
                     <p className="text-xs -mt-3 ml-2 text-stone-400">{intervalUnit}</p>


                    {recurrenceType === 'WEEKLY' && (
                        <div>
                             <label className="block text-sm font-medium text-stone-300 mb-1">On Days</label>
                             <div className="flex justify-center gap-1">
                                {WEEKDAYS.map(day => (
                                    <button key={day.value} type="button" onClick={() => handleWeeklyDayToggle(day.value)} className={`w-10 h-10 rounded-full font-bold transition-colors ${weeklyDays.includes(day.value) ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {recurrenceType === 'MONTHLY' && (
                        <Input label="On Days of Month (comma-separated)" value={monthlyDays} onChange={handleMonthlyDaysChange} placeholder="e.g., 1,15" />
                    )}
                </div>
            ) : (
                // --- Venture & Journey Scheduling ---
                <div className="space-y-4">
                     <ToggleSwitch enabled={hasDueDate} setEnabled={(val) => { setHasDueDate(val); if (!val) { onChange({ startDateTime: null, endDateTime: null }); } }} label="Has a Due Date" />
                     {hasDueDate && (
                         <div className="pl-6 border-l-2 border-stone-700/60 space-y-4">
                             <ToggleSwitch enabled={value.allDay} setEnabled={handleAllDayToggle} label="All Day Event" />
                             {value.allDay ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start Date" type="date" value={value.startDateTime?.split('T')[0] || ''} onChange={e => onChange({ startDateTime: `${e.target.value}T00:00:00` })} />
                                    <Input label="End Date" type="date" value={value.endDateTime?.split('T')[0] || ''} onChange={e => onChange({ endDateTime: `${e.target.value}T23:59:59` })} />
                                </div>
                             ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start" type="datetime-local" value={value.startDateTime || ''} onChange={e => onChange({ startDateTime: e.target.value })} />
                                    <Input label="End" type="datetime-local" value={value.endDateTime || ''} onChange={e => onChange({ endDateTime: e.target.value })} />
                                </div>
                             )}
                         </div>
                     )}
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Daily Limit" min={0} value={value.dailyCompletionsLimit || 1} onChange={val => onChange({ dailyCompletionsLimit: val })} />
                        <NumberInput label="Total Limit" min={0} value={value.totalCompletionsLimit || 0} onChange={val => onChange({ totalCompletionsLimit: val })} />
                    </div>
                </div>
            )}
        </fieldset>
    )
};
