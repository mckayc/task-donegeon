import React, { useState, useEffect, useMemo } from 'react';
import { ModifierDefinition, ModifierEffect, ModifierEffectType, RewardCategory, RewardItem, QuestKind } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import RewardInputGroup from '../forms/RewardInputGroup';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useSystemDispatch } from '../../context/SystemContext';

interface EditModifierDialogProps {
    setbackToEdit: ModifierDefinition | null;
    onClose: () => void;
}

const EditSetbackDialog: React.FC<EditModifierDialogProps> = ({ setbackToEdit: modifierToEdit, onClose }) => {
    const { addModifierDefinition, updateModifierDefinition } = useSystemDispatch();
    const { markets, rewardTypes } = useEconomyState();
    const { quests } = useQuestsState();
    const [formData, setFormData] = useState<Omit<ModifierDefinition, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: '',
        icon: '⚖️',
        category: 'Trial',
        effects: [],
        defaultRedemptionQuestId: '',
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    
    const redemptionQuests = useMemo(() => {
        return quests.filter(q => q.kind === QuestKind.Redemption);
    }, [quests]);

    useEffect(() => {
        if (modifierToEdit) {
            setFormData({
                name: modifierToEdit.name,
                description: modifierToEdit.description,
                icon: modifierToEdit.icon,
                category: modifierToEdit.category,
                effects: JSON.parse(JSON.stringify(modifierToEdit.effects)), // Deep copy
                defaultRedemptionQuestId: modifierToEdit.defaultRedemptionQuestId || '',
            });
        }
    }, [modifierToEdit]);

    const handleAddEffect = () => {
        setFormData(prev => ({
            ...prev,
            effects: [...prev.effects, { type: ModifierEffectType.DeductRewards, rewards: [] }]
        }));
    };

    const handleRemoveEffect = (index: number) => {
        setFormData(prev => ({ ...prev, effects: prev.effects.filter((_, i) => i !== index) }));
    };
    
    const handleEffectTypeChange = (effectIndex: number, newType: ModifierEffectType) => {
        setFormData(prev => {
            const newEffects = [...prev.effects];
            let newEffect: ModifierEffect;
            switch(newType) {
                case ModifierEffectType.DeductRewards: newEffect = { type: newType, rewards: [] }; break;
                case ModifierEffectType.GrantRewards: newEffect = { type: newType, rewards: [] }; break;
                case ModifierEffectType.CloseMarket: newEffect = { type: newType, marketIds: [], durationHours: 24 }; break;
                case ModifierEffectType.OpenMarket: newEffect = { type: newType, marketIds: [], durationHours: 24 }; break;
                case ModifierEffectType.MarketDiscount: newEffect = { type: newType, marketId: '', discountPercent: 10, durationHours: 24 }; break;
            }
            newEffects[effectIndex] = newEffect;
            return { ...prev, effects: newEffects };
        });
    };

    const handleEffectPropChange = (effectIndex: number, prop: string, value: any) => {
        setFormData(prev => {
            const newEffects = JSON.parse(JSON.stringify(prev.effects));
            const effect = newEffects[effectIndex];
            if(effect) {
                (effect as any)[prop] = value;
            }
            return { ...prev, effects: newEffects };
        });
    };
    
    const handleRewardChange = (effectIndex: number) => (itemIndex: number, field: keyof RewardItem, value: string | number) => {
        setFormData(prev => {
            const newEffects = JSON.parse(JSON.stringify(prev.effects));
            const effect = newEffects[effectIndex];
            if (effect.type === ModifierEffectType.DeductRewards || effect.type === ModifierEffectType.GrantRewards) {
                const newRewards = effect.rewards;
                newRewards[itemIndex] = { ...newRewards[itemIndex], [field]: field === 'amount' ? Math.max(1, parseInt(String(value)) || 1) : value };
                effect.rewards = newRewards;
            }
            return { ...prev, effects: newEffects };
        });
    };
    
    const handleAddRewardToEffect = (effectIndex: number) => (rewardCat: RewardCategory) => {
        setFormData(prev => {
            const newEffects = JSON.parse(JSON.stringify(prev.effects));
            const effect = newEffects[effectIndex];
            if (effect.type === ModifierEffectType.DeductRewards || effect.type === ModifierEffectType.GrantRewards) {
                const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
                if (!defaultReward) return prev;
                effect.rewards.push({ rewardTypeId: defaultReward.id, amount: 1 });
            }
            return { ...prev, effects: newEffects };
        });
    };

    const handleRemoveRewardFromEffect = (effectIndex: number) => (itemIndexToRemove: number) => {
        setFormData(prev => {
            const newEffects = JSON.parse(JSON.stringify(prev.effects));
            const effect = newEffects[effectIndex];
            if (effect.type === ModifierEffectType.DeductRewards || effect.type === ModifierEffectType.GrantRewards) {
                effect.rewards = effect.rewards.filter((_: any, i: number) => i !== itemIndexToRemove);
            }
            return { ...prev, effects: newEffects };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modifierToEdit) {
            updateModifierDefinition({ ...modifierToEdit, ...formData });
        } else {
            addModifierDefinition(formData);
        }
        onClose();
    };

    const dialogTitle = modifierToEdit ? `Edit ${formData.category}` : 'Create New Triumph/Trial';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="setback-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <Input label="Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <Input as="textarea" label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                    <Input as="select" label="Category" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value as 'Triumph' | 'Trial' }))}>
                        <option value="Trial">Trial (Negative)</option>
                        <option value="Triumph">Triumph (Positive)</option>
                    </Input>
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
                                    <Input as="select" label="" value={effect.type} onChange={e => handleEffectTypeChange(index, e.target.value as ModifierEffectType)}>
                                        <option value={ModifierEffectType.DeductRewards}>Deduct Rewards</option>
                                        <option value={ModifierEffectType.GrantRewards}>Grant Rewards</option>
                                        <option value={ModifierEffectType.CloseMarket}>Close Market</option>
                                        <option value={ModifierEffectType.OpenMarket}>Open Market</option>
                                        <option value={ModifierEffectType.MarketDiscount}>Market Discount</option>
                                    </Input>
                                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveEffect(index)}>Remove</Button>
                                </div>
                                
                                {(effect.type === ModifierEffectType.DeductRewards || effect.type === ModifierEffectType.GrantRewards) && (
                                    <RewardInputGroup 
                                        category="rewards" 
                                        items={effect.rewards} 
                                        onChange={handleRewardChange(index)} 
                                        onAdd={handleAddRewardToEffect(index)} 
                                        onRemove={handleRemoveRewardFromEffect(index)}
                                    />
                                )}

                                {(effect.type === ModifierEffectType.CloseMarket || effect.type === ModifierEffectType.OpenMarket) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-300 mb-1">Markets to Affect</label>
                                             <select multiple value={effect.marketIds}
                                                className="w-full h-32 px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                                    handleEffectPropChange(index, 'marketIds', selectedValues);
                                                }}>
                                                {markets.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                            </select>
                                        </div>
                                        <Input label="Duration (Hours)" type="number" min="1" value={effect.durationHours} onChange={e => handleEffectPropChange(index, 'durationHours', parseInt(e.target.value) || 1)} />
                                    </div>
                                )}
                                 {effect.type === ModifierEffectType.MarketDiscount && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input as="select" label="Market" value={effect.marketId} onChange={e => handleEffectPropChange(index, 'marketId', e.target.value)}>
                                            <option value="" disabled>Select...</option>
                                            {markets.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </Input>
                                        <Input label="Discount (%)" type="number" min="1" max="100" value={effect.discountPercent} onChange={e => handleEffectPropChange(index, 'discountPercent', parseInt(e.target.value) || 1)} />
                                        <Input label="Duration (Hours)" type="number" min="1" value={effect.durationHours} onChange={e => handleEffectPropChange(index, 'durationHours', parseInt(e.target.value) || 1)} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="secondary" onClick={handleAddEffect}>+ Add Effect</Button>
                    </div>

                     <div className="pt-4 border-t border-stone-700/60">
                        <Input as="select" label="Default Redemption Quest (Optional)" name="defaultRedemptionQuestId" value={formData.defaultRedemptionQuestId || ''} onChange={e => setFormData(p => ({...p, defaultRedemptionQuestId: e.target.value}))}>
                            <option value="">None</option>
                            {redemptionQuests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                        </Input>
                        <p className="text-xs text-stone-400 mt-1">If set, this quest will be automatically assigned to a user when this is applied.</p>
                    </div>

                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-auto">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="setback-form">{modifierToEdit ? 'Save Changes' : 'Create'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditSetbackDialog;
