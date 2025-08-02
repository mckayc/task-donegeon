import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User, RewardItem, RewardCategory, AdminAdjustmentType, Trophy } from '../../types';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import RewardInputGroup from '../forms/RewardInputGroup';

interface ManualAdjustmentDialogProps {
  user: User;
  onClose: () => void;
}

const ManualAdjustmentDialog: React.FC<ManualAdjustmentDialogProps> = ({ user, onClose }) => {
  const { guilds, trophies, userTrophies, currentUser } = useAppState();
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
    
    const success = await applyManualAdjustment(adjustmentPayload);

    if (success) {
        onClose();
    }
  };
  
  const userGuilds = guilds.filter(g => g.memberIds.includes(user.id));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Manual Adjustment for {user.gameName}</DialogTitle>
        </DialogHeader>
        
        <form id="adjustment-form" onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 overflow-y-auto pr-6">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Note for User</Label>
              <Textarea id="reason" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="guildId">Scope</Label>
                 <Select onValueChange={setGuildId} defaultValue={guildId}>
                    <SelectTrigger id="guildId"><SelectValue placeholder="Personal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Personal</SelectItem>
                        {userGuilds.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Action Type</Label>
                <div className="flex space-x-2">
                    {Object.values(AdminAdjustmentType).map(type => (
                        <Button type="button" key={type} onClick={() => setActionType(type)} variant={actionType === type ? 'default' : 'secondary'}>
                            {type}
                        </Button>
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
                <div className="space-y-2">
                     <Label htmlFor="trophy">Trophy to Award</Label>
                     <Select onValueChange={setTrophyId} defaultValue={trophyId}>
                        <SelectTrigger id="trophy"><SelectValue placeholder="Select a trophy..." /></SelectTrigger>
                        <SelectContent>
                           {availableTrophies.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {availableTrophies.length === 0 && <p className="text-xs text-muted-foreground mt-1">No more manual trophies available for this user in this scope.</p>}
                </div>
            )}
             {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        </form>
        
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="adjustment-form">Apply Adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAdjustmentDialog;
