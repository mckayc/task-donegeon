
import React, { useState } from 'react';
import { Minigame, User, RewardCategory, RewardItem, PrizeThreshold } from '../../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import NumberInput from '../user-interface/NumberInput';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { useSystemDispatch } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import RewardInputGroup from '../forms/RewardInputGroup';
import { PlusIcon, TrashIcon } from '../user-interface/Icons';
import { useEconomyState } from '../../context/EconomyContext';

interface EditMinigameDialogProps {
  game: Minigame;
  onClose: () => void;
}

const EditMinigameDialog: React.FC<EditMinigameDialogProps> = ({ game, onClose }) => {
    const { users } = useAuthState();
    const { rewardTypes } = useEconomyState();
    const { updateMinigame, resetAllScoresForGame, resetScoresForUsers } = useSystemDispatch();
    const [formData, setFormData] = useState({
        name: game.name,
        description: game.description,
        icon: game.icon,
        cost: game.cost,
        playsPerToken: game.playsPerToken || 1,
        isActive: game.isActive !== false, // Default to true if undefined
        prizesEnabled: game.prizesEnabled || false,
        prizeThresholds: game.prizeThresholds || [],
        rewardSettings: game.rewardSettings || { rewardTypeId: '', amount: 10, levelFrequency: 1 },
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'resetAll' | 'resetSelected' | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        const payload = {
            ...formData,
            rewardSettings: formData.rewardSettings?.rewardTypeId ? formData.rewardSettings : undefined,
            prizeThresholds: formData.prizesEnabled ? formData.prizeThresholds : [],
        };
        updateMinigame(game.id, payload);
        onClose();
    };

    const handleConfirm = () => {
        if (confirmAction === 'resetAll') {
            resetAllScoresForGame(game.id);
        } else if (confirmAction === 'resetSelected' && selectedUserIds.length > 0) {
            resetScoresForUsers(game.id, selectedUserIds);
        }
        setConfirmAction(null);
    };

    const handleAddThreshold = () => {
        setFormData(p => ({ ...p, prizeThresholds: [...p.prizeThresholds, { score: 0, rewards: [] }] }));
    };

    const handleRemoveThreshold = (index: number) => {
        setFormData(p => ({ ...p, prizeThresholds: p.prizeThresholds.filter((_, i) => i !== index) }));
    };

    const handleThresholdChange = (index: number, field: keyof PrizeThreshold, value: any) => {
        setFormData(p => {
            const newThresholds = [...p.prizeThresholds];
            (newThresholds[index] as any)[field] = value;
            return { ...p, prizeThresholds: newThresholds };
        });
    };

    const handleRewardChange = (thresholdIndex: number) => (itemIndex: number, field: keyof RewardItem, value: string | number) => {
        setFormData(p => {
            const newThresholds = [...p.prizeThresholds];
            const newRewards = [...newThresholds[thresholdIndex].rewards];
            newRewards[itemIndex] = { ...newRewards[itemIndex], [field]: value };
            newThresholds[thresholdIndex] = { ...newThresholds[thresholdIndex], rewards: newRewards };
            return { ...p, prizeThresholds: newThresholds };
        });
    };

    const handleAddReward = (thresholdIndex: number) => (category: RewardCategory) => {
        const defaultReward = rewardTypes.find(rt => rt.category === category);
        if (!defaultReward) return;
        setFormData(p => {
            const newThresholds = [...p.prizeThresholds];
            const newRewards = [...newThresholds[thresholdIndex].rewards, { rewardTypeId: defaultReward.id, amount: 1 }];
            newThresholds[thresholdIndex] = { ...newThresholds[thresholdIndex], rewards: newRewards };
            return { ...p, prizeThresholds: newThresholds };
        });
    };

    const handleRemoveReward = (thresholdIndex: number) => (itemIndex: number) => {
        setFormData(p => {
            const newThresholds = [...p.prizeThresholds];
            const newRewards = newThresholds[thresholdIndex].rewards.filter((_: any, i: number) => i !== itemIndex);
            newThresholds[thresholdIndex] = { ...newThresholds[thresholdIndex], rewards: newRewards };
            return { ...p, prizeThresholds: newThresholds };
        });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Edit "{game.name}"</h2>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                        <Input label="Name" name="name" value={formData.name} onChange={handleChange} />
                        <Input as="textarea" label="Description" name="description" value={formData.description} onChange={handleChange} />
                        <div className="flex items-end gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                                <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-16 h-11 text-2xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                    {formData.icon}
                                </button>
                                {isEmojiPickerOpen && <EmojiPicker onSelect={emoji => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                            </div>
                            <NumberInput label="Cost (Game Tokens)" value={formData.cost} onChange={val => setFormData(p => ({...p, cost: val}))} min={0} />
                            <NumberInput label="Plays per Token" value={formData.playsPerToken} onChange={val => setFormData(p => ({...p, playsPerToken: val}))} min={1} />
                        </div>
                         <ToggleSwitch enabled={formData.isActive} setEnabled={val => setFormData(p => ({...p, isActive: val}))} label="Game is Active" />

                        <div className="pt-4 mt-4 border-t border-stone-700/60 space-y-4">
                            <h3 className="font-bold text-lg text-stone-200">Level Completion Rewards</h3>
                             <ToggleSwitch 
                                enabled={!!formData.rewardSettings?.rewardTypeId} 
                                setEnabled={val => setFormData(p => ({...p, rewardSettings: val ? { rewardTypeId: 'core-diligence', amount: 10, levelFrequency: 3 } : { rewardTypeId: '', amount: 0, levelFrequency: 0 }}))}
                                label="Enable Rewards for Completing Levels"
                            />
                            {formData.rewardSettings?.rewardTypeId && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-stone-700/60 pt-2">
                                    <Input as="select" label="Reward Type" value={formData.rewardSettings.rewardTypeId} onChange={e => setFormData(p => ({...p, rewardSettings: {...p.rewardSettings!, rewardTypeId: e.target.value}}))}>
                                        <optgroup label="XP">
                                            {rewardTypes.filter(rt => rt.category === RewardCategory.XP).map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Currency">
                                            {rewardTypes.filter(rt => rt.category === RewardCategory.Currency).map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                        </optgroup>
                                    </Input>
                                    <NumberInput label="Amount" value={formData.rewardSettings.amount} onChange={val => setFormData(p => ({...p, rewardSettings: {...p.rewardSettings!, amount: val}}))} min={1} />
                                    <NumberInput label="Every X Levels" value={formData.rewardSettings.levelFrequency} onChange={val => setFormData(p => ({...p, rewardSettings: {...p.rewardSettings!, levelFrequency: val}}))} min={1} />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-stone-700/60 space-y-4">
                            <h3 className="font-bold text-lg text-stone-200">Prizes</h3>
                            <ToggleSwitch enabled={formData.prizesEnabled} setEnabled={val => setFormData(p => ({...p, prizesEnabled: val}))} label="Enable Prize Thresholds" />
                            {formData.prizesEnabled && (
                                <div className="space-y-3">
                                    {formData.prizeThresholds.map((threshold: PrizeThreshold, index: number) => (
                                        <div key={index} className="p-3 bg-stone-900/50 rounded-lg space-y-3">
                                            <div className="flex justify-between items-end gap-2">
                                                <NumberInput label={`Threshold ${index + 1} Score`} value={threshold.score} onChange={val => handleThresholdChange(index, 'score', val)} min={1} />
                                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemoveThreshold(index)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <RewardInputGroup category="rewards" items={threshold.rewards} onChange={handleRewardChange(index)} onAdd={handleAddReward(index)} onRemove={handleRemoveReward(index)} />
                                        </div>
                                    ))}
                                    <Button variant="secondary" onClick={handleAddThreshold} className="w-full flex items-center justify-center gap-2">
                                        <PlusIcon className="w-5 h-5" /> Add Prize Threshold
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-red-700/40 space-y-4">
                             <h3 className="font-bold text-lg text-red-400">Danger Zone</h3>
                             <div className="p-4 bg-red-900/20 rounded-lg space-y-4">
                                <div>
                                    <h4 className="font-semibold text-red-300">Reset All Scores</h4>
                                    <p className="text-xs text-stone-400 mb-2">Permanently delete all high scores for this game for every user.</p>
                                    <Button variant="destructive" size="sm" onClick={() => setConfirmAction('resetAll')}>Reset All</Button>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-red-300">Reset Scores for Specific Users</h4>
                                    <p className="text-xs text-stone-400 mb-2">Select users to reset their scores for this game.</p>
                                    <UserMultiSelect allUsers={users} selectedUserIds={selectedUserIds} onSelectionChange={setSelectedUserIds} label="" />
                                    <Button variant="destructive" size="sm" onClick={() => setConfirmAction('resetSelected')} disabled={selectedUserIds.length === 0} className="mt-2">Reset for Selected</Button>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="flex justify-end space-x-4 pt-4 mt-auto">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleSave}>Save Changes</Button>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title="Confirm Score Reset"
                message={confirmAction === 'resetAll' 
                    ? `Are you sure you want to delete ALL scores for "${game.name}"? This is permanent.`
                    : `Are you sure you want to delete scores for ${selectedUserIds.length} user(s) in "${game.name}"? This is permanent.`}
            />
        </>
    );
};

export default EditMinigameDialog;
