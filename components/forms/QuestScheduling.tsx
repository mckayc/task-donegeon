import React, { useState, useEffect } from 'react';
import { QuestType, Terminology } from '../../types';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { useSystemState } from '../../context/SystemContext';

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


const QuestScheduling: React.FC<QuestSchedulingProps> = ({ value, onChange }) => {
    const { settings } = useSystemState();
    const [hasDueDate, setHasDueDate] = useState(!!(value.startDateTime || value.endDateTime));
    const [recurrenceType, setRecurrenceType] = useState('DAILY');
    const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
    const [monthlyDays, setMonthlyDays] = useState<string>('');

    useEffect(() => {
        if (value.rrule) {
            const parts = value.rrule.split(';');
            const freqPart = parts.find(p => p.startsWith('FREQ='));
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
        } else {
            setRecurrenceType('DAILY');
            setWeeklyDays([]);
            setMonthlyDays('');
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
    
    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRecurrence = e.target.value;
        setRecurrenceType(newRecurrence);
        updateRrule(newRecurrence, weeklyDays, monthlyDays);
    };

    const handleWeeklyDayToggle = (day: string) => {
        const newWeeklyDays = weeklyDays.includes(day)
            ? weeklyDays.filter(d => d !== day)
            : [...weeklyDays, day].sort((a,b) => WEEKDAYS.findIndex(d => d.value === a) - WEEKDAYS.findIndex(d => d.value === b));
        setWeeklyDays(newWeeklyDays);
        updateRrule('WEEKLY', newWeeklyDays, monthlyDays);
    };

    const handleMonthlyDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMonthlyDays = e.target.value.replace(/[^0-9,]/g, '');
        setMonthlyDays(newMonthlyDays);
        updateRrule('MONTHLY', weeklyDays, newMonthlyDays);
    };

    const updateRrule = (freq: string, weekly: string[], monthly: string) => {
        let rrule = `FREQ=${freq}`;
        if (freq === 'WEEKLY' && weekly.length > 0) {
            rrule += `;BYDAY=${weekly.join(',')}`;
        }
        if (freq === 'MONTHLY' && monthly.trim()) {
            rrule += `;BYMONTHDAY=${monthly.trim()}`;
        }
        onChange({ rrule });
    };
    
    const handleAllDayToggle = (allDay: boolean) => {
        if (value.type === QuestType.Duty) {
            onChange({ allDay, startTime: null, endTime: null });
        } else {
            onChange({ allDay });
        }
    };

    return (
        <fieldset className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <legend className="text-lg font-semibold text-stone-200 mb-2">Scheduling & Type</legend>
            <div className="flex gap-2 p-1 bg-stone-700/50 rounded-lg">
                <TypeButton type={QuestType.Duty} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="For recurring tasks, like daily or weekly chores." />
                <TypeButton type={QuestType.Venture} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="For one-time tasks or projects with a specific deadline." />
                <TypeButton type={QuestType.Journey} currentType={value.type} onClick={handleTypeChange} terminology={settings.terminology} tooltip="A multi-step adventure with checkpoints and staged rewards." />
            </div>

            {(value.type === QuestType.Venture || value.type === QuestType.Journey) ? (
                <div className="space-y-4">
                    {value.type === QuestType.Venture && (
                       <div className="grid grid-cols-2 gap-4">
                           <Input label="Daily Completions Limit (0 for unlimited)" type="number" min="0" value={value.dailyCompletionsLimit ?? 1} onChange={e => onChange({ dailyCompletionsLimit: parseInt(e.target.value) || 0 })} />
                           <Input label="Total Completions Limit (0 for unlimited)" type="number" min="0" value={value.totalCompletionsLimit ?? 0} onChange={e => onChange({ totalCompletionsLimit: parseInt(e.target.value) || 0 })} />
                       </div>
                    )}
                    <ToggleSwitch label="Specific Due Date" enabled={hasDueDate} setEnabled={val => {
                        setHasDueDate(val);
                        if (!val) {
                            onChange({ startDateTime: null, endDateTime: null });
                        }
                    }} />
                    {hasDueDate && (
                        <div className="pl-4 border-l-2 border-stone-700 space-y-4">
                            <ToggleSwitch label="All Day" enabled={value.allDay} setEnabled={handleAllDayToggle} />
                            {value.allDay ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start Date" type="date" value={value.startDateTime ? value.startDateTime.split('T')[0] : ''} onChange={e => onChange({ startDateTime: e.target.value ? `${e.target.value}T00:00:00` : null })} />
                                    <Input label="End Date" type="date" value={value.endDateTime ? value.endDateTime.split('T')[0] : ''} onChange={e => onChange({ endDateTime: e.target.value ? `${e.target.value}T23:59:59` : null })} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Start" type="datetime-local" value={value.startDateTime || ''} onChange={e => onChange({ startDateTime: e.target.value })} />
                                    <Input label="End" type="datetime-local" value={value.endDateTime || ''} onChange={e => onChange({ endDateTime: e.target.value })} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : ( // Duty
                <div className="space-y-4">
                    <Input as="select" label="Repeats" value={recurrenceType} onChange={handleRecurrenceChange}>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                    </Input>
                    {recurrenceType === 'WEEKLY' && (
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">On</label>
                            <div className="flex justify-center gap-1">
                                {WEEKDAYS.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => handleWeeklyDayToggle(day.value)}
                                        className={`w-10 h-10 rounded-full font-bold transition-colors ${!weeklyDays.includes(day.value) ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : ''}`}
                                        style={weeklyDays.includes(day.value) ? { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : {}}
                                    >{day.label}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {recurrenceType === 'MONTHLY' && (
                        <Input label="On Days (comma-separated)" placeholder="e.g. 1, 15, 31" value={monthlyDays} onChange={handleMonthlyDaysChange} />
                    )}
                    <ToggleSwitch label="All Day" enabled={value.allDay} setEnabled={handleAllDayToggle} />
                    {!value.allDay && (
                         <div className="pl-4 border-l-2 border-stone-700 grid grid-cols-2 gap-4">
                            <Input label="Start Time" type="time" value={value.startTime || ''} onChange={e => onChange({ startTime: e.target.value })} />
                            <Input label="End Time" type="time" value={value.endTime || ''} onChange={e => onChange({ endTime: e.target.value })} />
                        </div>
                    )}
                </div>
            )}
        </fieldset>
    );
};

export default QuestScheduling;