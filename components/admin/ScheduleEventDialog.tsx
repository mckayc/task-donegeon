import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ScheduledEvent, RewardCategory } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmojiPicker from '../ui/emoji-picker';

interface ScheduleEventDialogProps {
  event: ScheduledEvent | null;
  onClose: () => void;
}

const colorPalette = [
    'hsl(4 89% 51%)',   // Red
    'hsl(25 95% 53%)',  // Orange
    'hsl(43 84% 47%)',  // Amber
    'hsl(84 70% 53%)',  // Lime
    'hsl(142 71% 45%)', // Green
    'hsl(172 84% 39%)', // Teal
    'hsl(190 91% 54%)', // Cyan
    'hsl(217 91% 60%)', // Blue
    'hsl(262 83% 67%)', // Violet
    'hsl(286 85% 61%)', // Fuchsia
];

const getInitialFormData = (): Omit<ScheduledEvent, 'id'> => {
    const today = new Date().toISOString().split('T')[0];
    return {
        title: '',
        description: '',
        startDate: today,
        endDate: today,
        isAllDay: true,
        eventType: 'Announcement',
        guildId: '',
        icon: '🎉',
        color: colorPalette[7],
        modifiers: {
            xpMultiplier: 1.5,
            affectedRewardIds: [],
            marketId: '',
            assetIds: [],
            discountPercent: 10,
        }
    };
};

const ScheduleEventDialog: React.FC<ScheduleEventDialogProps> = ({ event, onClose }) => {
    console.log('--- ScheduleEventDialog Rendering ---', { event });
    const { addScheduledEvent, updateScheduledEvent, deleteScheduledEvent } = useAppDispatch();
    const { guilds, markets, rewardTypes } = useAppState();
    
    const [formData, setFormData] = useState<Omit<ScheduledEvent, 'id'>>(() => {
        if (event) {
            return {
                ...getInitialFormData(),
                ...event,
                guildId: event.guildId || '',
                modifiers: {
                    ...getInitialFormData().modifiers,
                    ...(event.modifiers || {}),
                },
            };
        }
        return getInitialFormData();
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleModifierChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            modifiers: { ...prev.modifiers, [field]: value }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPayload = { ...formData, guildId: formData.guildId || undefined };
        if (event) {
            updateScheduledEvent({ ...finalPayload, id: event.id });
        } else {
            addScheduledEvent(finalPayload);
        }
        onClose();
    };

    const xpRewardTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);
    const showModifiers = formData.eventType !== 'Announcement' && formData.eventType !== 'Vacation';

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{event ? 'Edit Event' : 'Schedule New Event'}</DialogTitle>
                </DialogHeader>
                <form id="event-form" onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 overflow-y-auto pr-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="relative">
                            <Label>Icon</Label>
                            <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-16 h-10 mt-1.5 text-2xl p-1 rounded-md bg-background border border-input flex items-center justify-center">
                                {formData.icon || '🎉'}
                            </button>
                            {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                        </div>
                        <div className="flex-grow space-y-2">
                          <Label htmlFor="scope">Scope</Label>
                          <Select name="guildId" value={formData.guildId} onValueChange={(value: string) => handleSelectChange('guildId', value)}>
                              <SelectTrigger id="scope"><SelectValue placeholder="Global" /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="">Global (All Users)</SelectItem>
                                  {guilds.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Banner Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {colorPalette.map(colorHsl => (
                                <button
                                    key={colorHsl}
                                    type="button"
                                    onClick={() => setFormData(p => ({...p, color: colorHsl}))}
                                    className={`w-10 h-10 rounded-full transition-all ${formData.color === colorHsl ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`}
                                    style={{ backgroundColor: colorHsl }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select name="eventType" value={formData.eventType} onValueChange={(value: string) => handleSelectChange('eventType', value)}>
                        <SelectTrigger id="eventType"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Announcement">Announcement</SelectItem>
                          <SelectItem value="BonusXP">Bonus XP</SelectItem>
                          <SelectItem value="MarketSale">Market Sale</SelectItem>
                          <SelectItem value="Vacation">Vacation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {showModifiers && (
                        <div className="p-4 bg-background/50 rounded-lg space-y-4 border">
                            {formData.eventType === 'BonusXP' && (
                                <>
                                    <h4 className="font-semibold text-foreground">Bonus XP Modifiers</h4>
                                    <div className="space-y-2">
                                      <Label htmlFor="xpMultiplier">XP Multiplier</Label>
                                      <Input id="xpMultiplier" type="number" step="0.1" value={formData.modifiers.xpMultiplier || 1.5} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleModifierChange('xpMultiplier', parseFloat(e.target.value))} />
                                    </div>
                                </>
                            )}
                            {formData.eventType === 'MarketSale' && (
                                <>
                                    <h4 className="font-semibold text-foreground">Market Sale Modifiers</h4>
                                     <div className="space-y-2">
                                      <Label htmlFor="marketId">Market</Label>
                                      <Select value={formData.modifiers.marketId || ''} onValueChange={(value: string) => handleModifierChange('marketId', value)}>
                                        <SelectTrigger id="marketId"><SelectValue placeholder="Select a market..."/></SelectTrigger>
                                        <SelectContent>
                                          {markets.filter(m => m.guildId === (formData.guildId || undefined)).map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                     </div>
                                     <div className="space-y-2">
                                      <Label htmlFor="discountPercent">Discount Percentage</Label>
                                      <Input id="discountPercent" type="number" min="1" max="100" value={formData.modifiers.discountPercent || 10} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleModifierChange('discountPercent', parseInt(e.target.value))} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </form>
                <DialogFooter className="flex justify-between items-center w-full">
                    <div>
                        {event && <Button type="button" variant="destructive" onClick={() => { deleteScheduledEvent(event.id); onClose(); }}>Delete</Button>}
                    </div>
                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="event-form">{event ? 'Save Changes' : 'Schedule Event'}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleEventDialog;
