import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataProvider';
import { useActionsDispatch } from '../../context/ActionsContext';
import { SetbackDefinition, SetbackEffect, SetbackEffectType, RewardCategory, RewardItem } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import RewardInputGroup from '../forms/RewardInputGroup';

interface EditSetbackDialogProps {
    setbackToEdit: SetbackDefinition | null;
    onClose: () => void;
}

const EditSetbackDialog: React.FC<EditSetbackDialogProps> = ({ setbackToEdit, onClose }) => {
    const { addSetbackDefinition, updateSetbackDefinition } = useActionsDispatch();
    const { markets, rewardTypes } = useData();
    const [formData, setFormData] = useState<Omit<SetbackDefinition, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: '',
        icon: '⚖️',
        effects: [],
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        if (setbackToEdit) {
            setFormData({
                name: setbackToEdit.name,
                description: setbackToEdit.description,
                icon: setbackToEdit.icon,
                effects: setbackToEdit.effects,
            });
        }
    }, [setbackToEdit]);

    const handleAddEffect = () => {
        setFormData(prev => ({
            ...prev,
            effects: [...prev.effects, { type: SetbackEffectType.DeductRewards, rewards: [] }]
        }));
    };

    const handleRemoveEffect = (index: number) => {
        setFormData(prev => ({ ...prev, effects: prev.effects.filter((_, i) => i !== index) }));
    };

    const handleEffectChange = (index: number, newEffect: SetbackEffect) => {
        setFormData(prev => {
            const newEffects = [...prev.effects];
            newEffects[index] = newEffect;
            return { ...prev, effects: newEffects };
        });
    };
    
    const handleRewardChange = (effectIndex: number) => (itemIndex: number, field: keyof RewardItem, value: string | number) => {
        const effect = formData.effects[effectIndex];
        if (effect.type === SetbackEffectType.DeductRewards) {
            const newRewards = [...effect.rewards];
            newRewards[itemIndex] = { ...newRewards[itemIndex], [field]: field === 'amount' ? Math.max(0.01, parseFloat(String(value)) || 0) : value };
            handleEffectChange(effectIndex, { ...effect, rewards: newRewards });
        }
    };
    
    const handleAddRewardToEffect = (effectIndex: number) => (rewardCat: RewardCategory) => {
        const effect = formData.effects[effectIndex];
        if (effect.type === SetbackEffectType.DeductRewards) {
            const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
            if (!defaultReward) return;
            const newRewards = [...effect.rewards, { rewardTypeId: defaultReward.id, amount: 1 }];
            handleEffectChange(effectIndex, { ...effect, rewards: newRewards });
        }
    };

    const handleRemoveRewardFromEffect = (effectIndex: number) => (itemIndex: number) => {
        const effect = formData.effects[effectIndex];
        if (effect.type === SetbackEffectType.DeductRewards) {
            const newRewards = effect.rewards.filter((_, i) => i !== itemIndex);
            handleEffectChange(effectIndex, { ...effect, rewards: newRewards });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (setbackToEdit) {
            updateSetbackDefinition({ ...setbackToEdit, ...formData });
        } else {
            addSetbackDefinition(formData);
        }
        onClose();
    };

    const dialogTitle = setbackToEdit ? 'Edit Setback' : 'Create New Setback';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="setback-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <Input label="Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <Input as="textarea" label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                        <div className="relative">
                            <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2">
                                <span className="text-2xl">{formData.icon}</span>
                                <span className="text-stone-300">Click to change</span>
                            </button>
                            {isEmojiPickerOpen && <EmojiPicker onSelect={emoji => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-stone-700/60">
                        <h3 className="font-semibold text-stone-200">Effects</h3>
                        {formData.effects.map((effect, index) => (
                            <div key={index} className="p-3 bg-stone-900/50 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <Input as="select" label="" value={effect.type} onChange={e => {
                                        const newType = e.target.value as SetbackEffectType;
                                        if (newType === SetbackEffectType.DeductRewards) handleEffectChange(index, { type: newType, rewards: [] });
                                        else handleEffectChange(index, { type: newType, marketIds: [], durationHours: 24 });
                                    }}>
                                        <option value={SetbackEffectType.DeductRewards}>Deduct Rewards</option>
                                        <option value={SetbackEffectType.CloseMarket}>Close Market</option>
                                    </Input>
                                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveEffect(index)}>Remove</Button>
                                </div>
                                
                                {effect.type === SetbackEffectType.DeductRewards && (
                                    <RewardInputGroup 
                                        category="setbacks" 
                                        items={effect.rewards} 
                                        onChange={handleRewardChange(index)} 
                                        onAdd={handleAddRewardToEffect(index)} 
                                        onRemove={handleRemoveRewardFromEffect(index)}
                                    />
                                )}

                                {effect.type === SetbackEffectType.CloseMarket && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-300 mb-1">Markets to Close</label>
                                             <select multiple value={effect.marketIds}
                                                className="w-full h-32 px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                                handleEffectChange(index, { ...effect, marketIds: selectedValues });
                                            }}>
                                                {markets.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                            </select>
                                        </div>
                                        <Input label="Duration (Hours)" type="number" min="1" value={effect.durationHours} onChange={e => handleEffectChange(index, { ...effect, durationHours: parseInt(e.target.value) || 1 })} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={handleAddEffect}>+ Add Effect</Button>
                    </div>
                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-auto">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="setback-form">{setbackToEdit ? 'Save Changes' : 'Create Setback'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditSetbackDialog;