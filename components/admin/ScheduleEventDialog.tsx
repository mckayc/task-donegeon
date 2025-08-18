import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import { useActionsDispatch } from '../../context/ActionsContext';
import { ScheduledEvent, RewardCategory } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';

interface ScheduleEventDialogProps {
  event: ScheduledEvent | null;
  onClose: () => void;
}

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
    const { addScheduledEvent, updateScheduledEvent } = useActionsDispatch();
    const { guilds, markets, rewardTypes } = useData();
    
    const [formData, setFormData] = useState<Omit<ScheduledEvent, 'id'>>({
        title: '', description: '', startDate: '', endDate: '', isAllDay: true, eventType: 'Announcement', guildId: '',
        icon: '🎉', color: colorPalette[7], // Default to blue
        modifiers: {}
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({ ...event });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalModifiers = {};
        switch(formData.eventType) {
            case 'BonusXP':
                finalModifiers = {
                    xpMultiplier: formData.modifiers.xpMultiplier || 1,
                    affectedRewardIds: formData.modifiers.affectedRewardIds || []
                };
                break;
            case 'MarketSale':
                 finalModifiers = {
                    marketId: formData.modifiers.marketId || '',
                    discountPercent: formData.modifiers.discountPercent || 0,
                    assetIds: [] // Future-proofing: Not implemented in UI yet
                };
                break;
        }

        const payload = { ...formData, guildId: formData.guildId || undefined, modifiers: finalModifiers };

        if (event) {
            updateScheduledEvent({ ...payload, id: event.id });
        } else {
            addScheduledEvent(payload);
        }
        onClose();
    };

    const xpRewardTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);
    const showModifiers = formData.eventType !== 'Announcement' && formData.eventType !== 'Vacation';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-accent p-8">{event ? 'Edit Event' : 'Schedule New Event'}</h2>
                <form id="event-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <Input label="Title" name="title" value={formData.title} onChange={handleChange} required />
                    <Input as="textarea" label="Description" name="description" value={formData.description} onChange={handleChange} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                        <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                            <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-16 h-11 text-2xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                {formData.icon || '🎉'}
                            </button>
                            {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                        </div>
                        <Input as="select" label="Event Type" name="eventType" value={formData.eventType} onChange={handleChange} className="flex-grow">
                            <option value="Announcement">Announcement</option>
                            <option value="Vacation">Vacation</option>
                            <option value="BonusXP">Bonus XP</option>
                            <option value="MarketSale">Market Sale</option>
                        </Input>
                    </div>

                    <Input as="select" label="Scope" name="guildId" value={formData.guildId} onChange={handleChange}>
                        <option value="">Personal (All Users)</option>
                        {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Input>

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
                                <Input
                                    label="XP Multiplier"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={formData.modifiers.xpMultiplier || 1}
                                    onChange={e => handleModifierChange('xpMultiplier', parseFloat(e.target.value) || 1)}
                                />
                            )}
                            {formData.eventType === 'MarketSale' && (
                                <>
                                    <Input as="select" label="Market" value={formData.modifiers.marketId || ''} onChange={e => handleModifierChange('marketId', e.target.value)} required>
                                        <option value="" disabled>Select a market...</option>
                                        {markets.filter(m => m.id !== 'market-bank').map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </Input>
                                    <Input
                                        label="Discount Percent"
                                        type="number"
                                        min="1" max="100"
                                        value={formData.modifiers.discountPercent || 10}
                                        onChange={e => handleModifierChange('discountPercent', parseInt(e.target.value) || 0)}
                                    />
                                </>
                            )}
                        </div>
                    )}

                </form>
                <div className="p-6 border-t border-stone-700/60 flex justify-end items-center">
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="event-form">{event ? 'Save Changes' : 'Schedule Event'}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
