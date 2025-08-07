import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { User, RewardItem, RewardCategory, AdminAdjustmentType, Trophy } from '../../types';
import Button from '../ui/Button';
import RewardInputGroup from '../forms/RewardInputGroup';

interface ManualAdjustmentDialogProps {
  user: User;
  onClose: () => void;
}

const ManualAdjustmentDialog: React.FC<ManualAdjustmentDialogProps> = ({ user, onClose }) => {
  const { guilds, trophies, userTrophies } = useAppState();
  const { currentUser } = useAuthState();
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
    
    if (!currentUser) {
        setError('Could not identify the current admin user.');
        return;
    }

    if (!reason.trim()) {
        setError('A reason for the adjustment is required.');
        return;
    }
    
    const adjustmentPayload = {
        userId: user.id,
        adjusterId: currentUser.id,
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
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[80vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Manual Adjustment</h2>
        <p className="text-stone-300 mb-6">For <span className="font-bold text-emerald-300">{user.gameName}</span></p>
        
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Scope</label>
                <select value={guildId} onChange={e => setGuildId(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                    <option value="">Personal</option>
                    {userGuilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Action Type</label>
                <select value={actionType} onChange={e => setActionType(e.target.value as AdminAdjustmentType)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                    <option value={AdminAdjustmentType.Reward}>Reward</option>
                    <option value={AdminAdjustmentType.Setback}>Setback</option>
                    <option value={AdminAdjustmentType.Trophy}>Trophy</option>
                </select>
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
                     <select id="trophy" value={trophyId} onChange={(e) => setTrophyId(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                        <option value="" disabled>Select a trophy...</option>
                        {availableTrophies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            )}
            
            <div>
                <label htmlFor="reason" className="block text-sm font-medium text-stone-300 mb-1">Reason</label>
                <textarea id="reason" rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" required />
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

export default ManualAdjustmentDialog;