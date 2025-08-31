
import React, { useState } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { User, RewardItem, RewardCategory, AdminAdjustmentType, Trophy } from '../../types';
import Button from '../user-interface/Button';
import RewardInputGroup from '../forms/RewardInputGroup';
import { useCommunityState } from '../../context/CommunityState';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import Input from '../user-interface/Input';

interface ManualAdjustmentDialogProps {
  user: User;
  onClose: () => void;
}

export const ManualAdjustmentDialog: React.FC<ManualAdjustmentDialogProps> = ({ user, onClose }) => {
  const { guilds } = useCommunityState();
  const { trophies, userTrophies } = useProgressionState();
  const { rewardTypes } = useEconomyState();
  const { applyManualAdjustment } = useSystemDispatch();
  const { currentUser } = useAuthState();
  const [reason, setReason] = useState('');
  const [guildId, setGuildId] = useState('');
  
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [setbacks, setSetbacks] = useState<RewardItem[]>([]);
  const [trophyId, setTrophyId] = useState<string>('');
  
  const [error, setError] = useState('');
  
  const availableTrophies = trophies.filter(t => t.isManual && !userTrophies.some(ut => ut.userId === user.id && ut.trophyId === t.id && ut.guildId === (guildId || undefined)));

  const handleRewardChange = (items: RewardItem[], setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'amount') {
      const parsedAmount = parseInt(String(value), 10);
      newItems[index] = { ...newItems[index], amount: isNaN(parsedAmount) ? 0 : parsedAmount };
    } else {
      newItems[index] = { ...newItems[index], [field]: value as string };
    }
    setter(newItems);
  };
  
  const handleAddRewardForCategory = (setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    setter(prev => [...prev, { rewardTypeId: defaultReward.id, amount: 1 }]);
  };
  
  const handleRemoveReward = (items: RewardItem[], setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (indexToRemove: number) => {
    setter(items.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!currentUser) {
        setError('Could not identify the current admin user.');
        return;
    }

    if (!reason.trim()) {
        setError('A reason for the adjustment is required.');
        return;
    }
    
    const finalRewards = rewards.filter(r => r.rewardTypeId && r.amount > 0);
    const finalSetbacks = setbacks.filter(s => s.rewardTypeId && s.amount > 0);

    if (finalRewards.length === 0 && finalSetbacks.length === 0 && !trophyId) {
        setError('You must specify at least one reward, setback, or trophy to apply.');
        return;
    }

    const adjustmentPayload = {
        userId: user.id,
        adjusterId: currentUser.id,
        reason,
        type: AdminAdjustmentType.Compound,
        rewards: finalRewards,
        setbacks: finalSetbacks,
        trophyId: trophyId || undefined,
        guildId: guildId || undefined,
    };
    
    const success = await applyManualAdjustment(adjustmentPayload);

    if (success) {
        onClose();
    }
  };
  
  const userGuilds = guilds.filter(g => g.memberIds.includes(user.id));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Manual Adjustment</h2>
        <p className="text-stone-300 mb-6">For <span className="font-bold text-emerald-300">{user.gameName}</span></p>
        
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2" id="manual-adjustment-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input as="select" label="Scope" value={guildId} onChange={e => setGuildId(e.target.value)}>
                    <option value="">Personal</option>
                    {userGuilds.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </Input>
                 <Input
                    as="textarea"
                    rows={3}
                    label="Reason"
                    value={reason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                    placeholder="e.g., Birthday gift, excellent report card"
                    required
                />
            </div>
             
            <div className="pt-4 border-t border-stone-700/60 space-y-4">
                <RewardInputGroup 
                    title="Rewards to Grant"
                    category="rewards" 
                    items={rewards} 
                    onChange={handleRewardChange(rewards, setRewards)} 
                    onAdd={handleAddRewardForCategory(setRewards)} 
                    onRemove={handleRemoveReward(rewards, setRewards)}
                />
                <RewardInputGroup 
                    title="Setbacks to Apply"
                    category="setbacks" 
                    items={setbacks} 
                    onChange={handleRewardChange(setbacks, setSetbacks)} 
                    onAdd={handleAddRewardForCategory(setSetbacks)} 
                    onRemove={handleRemoveReward(setbacks, setSetbacks)}
                />
                 <div className="p-4 bg-stone-900/50 rounded-lg">
                    <h4 className="font-semibold text-stone-200 capitalize mb-3">Award Trophy</h4>
                    <Input as="select" value={trophyId} onChange={e => setTrophyId(e.target.value)}>
                        <option value="">-- No Trophy --</option>
                        {availableTrophies.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </Input>
                </div>
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}
        </form>
        <div className="flex justify-end space-x-4 pt-4 mt-auto">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="manual-adjustment-form">Apply Adjustment</Button>
        </div>
      </div>
    </div>
  );
};
