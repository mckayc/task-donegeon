

import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User, RewardItem, RewardCategory, AdminAdjustmentType, Trophy } from '../../types';
import Button from '../ui/Button';
import RewardInputGroup from '../forms/RewardInputGroup';

interface ManualAdjustmentDialogProps {
  user: User;
  onClose: () => void;
}

const ManualAdjustmentDialog: React.FC<ManualAdjustmentDialogProps> = ({ user, onClose }) => {
  const { guilds, trophies, userTrophies } = useAppState();
  const { applyManualAdjustment } = useAppDispatch();
  const [reason, setReason] = useState('');
  const [guildId, setGuildId] = useState('');
  const [actionType, setActionType] = useState<AdminAdjustmentType>(AdminAdjustmentType.Reward);
  
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [setbacks, setSetbacks] = useState<RewardItem[]>([]);
  const [trophyId, setTrophyId] = useState<string>('');
  
  const [error, setError] = useState('');
  
  const availableTrophies = trophies.filter(t => t.isManual && !userTrophies.some(ut => ut.userId === user.id && ut.trophyId === t.id && ut.guildId === (guildId || undefined)));

  const handleRewardChange = (items: RewardItem[], setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Math.max(1, Number(value)) : value };
    setter(newItems);
  };
  
  const handleAddRewardForCategory = (setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (rewardCat: RewardCategory) => {
    setter(prev => [...prev, { rewardTypeId: '', amount: 1 }]);
  };
  
  const handleRemoveReward = (items: RewardItem[], setter: React.Dispatch<React.SetStateAction<RewardItem[]>>) => (indexToRemove: number) => {
    setter(items.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!reason.trim()) {
        setError('A reason for the adjustment is required.');
        return;
    }
    
    const adjustmentPayload = {
        userId: user.id,
        reason,
        type: actionType,
        rewards: actionType === AdminAdjustmentType.Reward ? rewards.filter(r => r.rewardTypeId && r.amount > 0) : [],
        setbacks: actionType === AdminAdjustmentType.Setback ? setbacks.filter(s => s.rewardTypeId && s.amount > 0) : [],
        trophyId: actionType === AdminAdjustmentType.Trophy ? trophyId : undefined,
        guildId: guildId || undefined,
    };
    
    if (actionType === AdminAdjustmentType.Trophy && !trophyId) {
        setError('Please select a trophy to award.');
        return;
    }
    
    const success = applyManualAdjustment(adjustmentPayload);

    if (success) {
        onClose();
    }
  };
  
  const userGuilds = guilds.filter(g => g.memberIds.includes(user.id));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-emerald-400">Manual Adjustment for {user.gameName}</h2>
        </div>
        
        <form id="adjustment-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-stone-300 mb-1">Reason / Note for User</label>
              <textarea id="reason" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" required />
            </div>

            <div>
                <label htmlFor="guildId" className="block text-sm font-medium text-stone-300 mb-1">Scope</label>
                <select id="guildId" name="guildId" value={guildId} onChange={(e) => setGuildId(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                    <option value="">Personal</option>
                    {userGuilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Action Type</label>
                <div className="flex space-x-4">
                    {Object.values(AdminAdjustmentType).map(type => (
                        <button type="button" key={type} onClick={() => setActionType(type)} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${actionType === type ? 'bg-emerald-600 text-white' : 'bg-stone-700 hover:bg-stone-600'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {actionType === AdminAdjustmentType.Reward && (
                <RewardInputGroup category='rewards' items={rewards} onChange={handleRewardChange(rewards, setRewards)} onAdd={handleAddRewardForCategory(setRewards)} onRemove={handleRemoveReward(rewards, setRewards)} />
            )}
            {actionType === AdminAdjustmentType.Setback && (
                <RewardInputGroup category='setbacks' items={setbacks} onChange={handleRewardChange(setbacks, setSetbacks)} onAdd={handleAddRewardForCategory(setSetbacks)} onRemove={handleRemoveReward(setbacks, setSetbacks)} />
            )}
            {actionType === AdminAdjustmentType.Trophy && (
                <div>
                     <label htmlFor="trophy" className="block text-sm font-medium text-stone-300 mb-1">Trophy to Award</label>
                    <select id="trophy" value={trophyId} onChange={(e) => setTrophyId(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" required>
                        <option value="" disabled>Select a trophy...</option>
                        {availableTrophies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {availableTrophies.length === 0 && <p className="text-xs text-stone-400 mt-1">No more manual trophies available for this user in this scope.</p>}
                </div>
            )}
        </form>
        
        <div className="p-6 border-t border-stone-700/60">
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <div className="flex justify-end space-x-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" form="adjustment-form">Apply Adjustment</Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAdjustmentDialog;
