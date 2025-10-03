
import React, { useState, useEffect } from 'react';
import { ScheduledEvent, RewardCategory } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import { useCommunityState } from '../../context/CommunityContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useSystemDispatch } from '../../context/SystemContext';
import { RRule } from 'rrule';

interface ScheduleEventDialogProps {
  event: ScheduledEvent | null;
  onClose: () => void;
}

const WEEKDAYS = [{label: 'S', value: 'SU'}, {label: 'M', value: 'MO'}, {label: 'T', value: 'TU'}, {label: 'W', value: 'WE'}, {label: 'T', value: 'TH'}, {label: 'F', value: 'FR'}, {label: 'S', value: 'SA'}];


const colorPalette = [
    '4 89% 51%',   // Red
    '25 95% 53%',  // Orange
    '43 84% 47%',  // Amber
    '84 70% 53%',  // Lime
    '142 71% 45%', // Green
    '172 84% 39%', // Teal
    '190 91% 54%', // Cyan
    '217 91% 60%', // Blue
    '262 83% 67%', // Violet
    '286 85% 61%', // Fuchsia
];

export const ScheduleEventDialog: React.FC<ScheduleEventDialogProps> = ({ event, onClose }) => {
    const { addScheduledEvent, updateScheduledEvent, deleteScheduledEvent } = useSystemDispatch();
    const { guilds } = useCommunityState();
    const { markets, rewardTypes } = useEconomyState();
    
    const [formData, setFormData] = useState<Omit<ScheduledEvent, 'id'>>({
        title: '', description: '', startDate: '', endDate: '', isAllDay: true, eventType: 'Announcement', guildId: '',
        icon: '🎉', color: colorPalette[7], // Default to blue
        modifiers: {}, rrule: null
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState('NONE');
    const [weeklyDays, setWeeklyDays] = useState<string[]>([]);

    useEffect(() => {
        if (event) {
            const { id, ...eventData } = event; // Exclude ID when setting form data
            setFormData({ ...eventData });
            if (event.rrule) {
                const rule = RRule.fromString(event.rrule);
                const options = rule.options;
                if (options.freq === RRule.WEEKLY) {
                    setRecurrenceType('WEEKLY');
                    setWeeklyDays(options.byweekday.map(day => WEEKDAYS[day].value));
                }
            } else {
                setRecurrenceType('NONE');
                setWeeklyDays([]);
            }
        } else {
            // Default new event to today
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, startDate: today, endDate: today }));
        }
    }, [event]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleModifierChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            modifiers: { ...prev.modifiers, [field]: value }
        }));
    };
    
    const handleRecurrenceChange = (newType: string) => {
        setRecurrenceType(newType);
        if (newType === 'NONE') {
            setFormData(p => ({ ...p, rrule: null }));
        } else if (newType === 'WEEKLY') {
            const rule = new RRule({ freq: RRule.WEEKLY, byweekday: [] });
            setFormData(p => ({ ...p, rrule: rule.toString() }));
        }
    };
    
    const handleWeeklyDayToggle = (dayValue: string) => {
        const newWeeklyDays = weeklyDays.includes(dayValue)
            ? weeklyDays.filter(d => d !== dayValue)
            : [...weeklyDays, dayValue];
        
        setWeeklyDays(newWeeklyDays);
        const dayIndices = newWeeklyDays.map(d => WEEKDAYS.findIndex(wd => wd.value === d));
        const rule = new RRule({ freq: RRule.WEEKLY, byweekday: dayIndices });
        setFormData(p => ({...p, rrule: rule.toString()}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (event && event.id) {
            updateScheduledEvent({ ...formData, id: event.id });
        } else {
            addScheduledEvent(formData);
        }
        onClose();
    };

    const xpRewardTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);
    
    const showModifiers = formData.eventType !== 'Announcement' && formData.eventType !== 'Grace Period' && formData.eventType !== 'Vacation';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-accent p-8">{event && event.id ? 'Edit Event' : 'Schedule New Event'}</h2>
                <form id="event-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <Input label="Title" name="title" value={formData.title} onChange={handleChange} required />
                    <Input as="textarea" label="Description" name="description" value={formData.description} onChange={handleChange} />
                    
                    <div className="flex gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                            <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-16 h-11 text-2xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                {formData.icon || '🎉'}
                            </button>
                            {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                        </div>
                        <Input as="select" label="Scope" name="guildId" value={formData.guildId} onChange={handleChange} className="flex-grow">
                            <option value="">Personal</option>
                            {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Input>
                    </div>
                     <Input as="select" label="Event Type" name="eventType" value={formData.eventType} onChange={handleChange}>
                        <option value="Announcement">Announcement</option>
                        <option value="Grace Period">Grace Period</option>
                        {/* FIX: Add 'Vacation' as an option for event types. */}
                        <option value="Vacation">Vacation</option>
                        <option value="BonusXP">Bonus XP</option>
                        <option value="MarketSale">Market Sale</option>
                    </Input>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                        <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>
                    
                    {(formData.eventType === 'Grace Period' || formData.eventType === 'Vacation') && (
                        <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h4 className="font-semibold text-stone-200 mb-2">Recurrence</h4>
                             <Input as="select" label="Repeats" value={recurrenceType} onChange={e => handleRecurrenceChange(e.target.value)}>
                                <option value="NONE">Does not repeat</option>
                                <option value="WEEKLY">Weekly</option>
                            </Input>
                            {recurrenceType === 'WEEKLY' && (
                                <div className="mt-2">
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
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Banner Color</label>
                        <div className="flex flex-wrap gap-2">
                            {colorPalette.map(colorHsl => (
                                <button
                                    key={colorHsl}
                                    type="button"
                                    onClick={() => setFormData(p => ({...p, color: colorHsl}))}
                                    className={`w-10 h-10 rounded-full transition-all ${formData.color === colorHsl ? 'ring-2 ring-offset-2 ring-offset-stone-800 ring-white' : ''}`}
                                    style={{ backgroundColor: `hsl(${colorHsl})` }}
                                />
                            ))}
                        </div>
                    </div>
                    
                     {showModifiers && (
                        <div className="pt-4 border-t border-stone-700/60 space-y-4">
                            <h3 className="font-semibold text-stone-200">Modifiers</h3>
                            {formData.eventType === 'BonusXP' && (
                                <>
                                    <Input label="XP Multiplier" name="xpMultiplier" type="number" step="0.1" min="1" value={formData.modifiers.xpMultiplier || 1} onChange={e => handleModifierChange('xpMultiplier', parseFloat(e.target.value))} />
                                    <div>
                                        <label className="block text-sm font-medium text-stone-300 mb-1">Affected XP Types (optional)</label>
                                        <select multiple value={formData.modifiers.affectedRewardIds || []} 
                                            className="w-full h-32 px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                                            onChange={(e) => {
                                                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                                handleModifierChange('affectedRewardIds', selectedValues);
                                            }}>
                                            {xpRewardTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                        </select>
                                        <p className="text-xs text-stone-400 mt-1">If none are selected, the bonus applies to all XP types.</p>
                                    </div>
                                </>
                            )}
                            {formData.eventType === 'MarketSale' && (
                                <>
                                    <Input as="select" label="Market" name="marketId" value={formData.modifiers.marketId || ''} onChange={e => handleModifierChange('marketId', e.target.value)} required>
                                        <option value="" disabled>Select a market...</option>
                                        {markets.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </Input>
                                    <Input label="Discount Percentage" name="discountPercent" type="number" min="1" max="100" value={formData.modifiers.discountPercent || 1} onChange={e => handleModifierChange('discountPercent', parseInt(e.target.value))} />
                                </>
                            )}
                        </div>
                    )}
                </form>
                <div className="p-6 border-t border-stone-700/60 flex justify-between items-center">
                    <div>
                        {event && event.id && (
                             <Button variant="destructive" onClick={() => { if(event) deleteScheduledEvent(event.id); onClose(); }}>Delete</Button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="event-form">{event && event.id ? 'Save Changes' : 'Schedule Event'}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
