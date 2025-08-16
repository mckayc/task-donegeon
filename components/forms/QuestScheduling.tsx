import React, { useState, useEffect } from 'react';
import { QuestType } from '../../types';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';

interface QuestSchedulingProps {
    value: {
        type: QuestType;
        startDateTime: string | null;
        endDateTime: string | null;
        allDay: boolean;
        rrule: string | null;
        startTime: string | null;
        endTime: string | null;
        availabilityCount: number | null;
    };
    onChange: (newValue: Partial<QuestSchedulingProps['value']>) => void;
}

const WEEKDAYS = [{label: 'S', value: 'SU'}, {label: 'M', value: 'MO'}, {label: 'T', value: 'TU'}, {label: 'W', value: 'WE'}, {label: 'T', value: 'TH'}, {label: 'F', value: 'FR'}, {label: 'S', value: 'SA'}];

const QuestScheduling: React.FC<QuestSchedulingProps> = ({ value, onChange }) => {
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
                availabilityCount: null,
                rrule: 'FREQ=DAILY', // Default to daily
            });
        } else { // Venture
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
                <button type="button" onClick={() => handleTypeChange(QuestType.Venture)} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${value.type === QuestType.Venture ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>
                    Venture (One-time)
                </button>
                 <button type="button" onClick={() => handleTypeChange(QuestType.Duty)} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${value.type === QuestType.Duty ? 'bg-primary text-primary-foreground' : 'text-stone-300 hover:bg-stone-700'}`}>
                    Duty (Recurring)
                </button>
            </div>

            {value.type === QuestType.Venture ? (
                <div className="space-y-4">
                    <Input label="Completions Allowed" type="number" min="1" value={value.availabilityCount ?? 1} onChange={e => onChange({ availabilityCount: parseInt(e.target.value) || 1 })} />
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
                                        className={`w-10 h-10 rounded-full font-bold transition-colors ${weeklyDays.includes(day.value) ? 'bg-primary text-primary-foreground' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}
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
