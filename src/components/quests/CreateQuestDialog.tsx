
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Quest, RewardItem } from '../../types';
import { LoaderCircle } from 'lucide-react';

interface CreateQuestDialogProps {
  initialData?: Partial<Quest>;
  onClose: () => void;
}

const CreateQuestDialog: React.FC<CreateQuestDialogProps> = ({ initialData, onClose }) => {
    const [formData, setFormData] = useState<Partial<Quest>>({
        title: '',
        description: '',
        type: 'Venture',
        emoji: '📝',
        rewards: [],
        optional: false,
        approvalRequired: true,
        ...initialData,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleRewardChange = (index: number, field: keyof RewardItem, value: string | number) => {
        setFormData(prev => {
            if (!prev.rewards) return prev;
            const newRewards = [...prev.rewards];
            const rewardToUpdate: RewardItem = { ...newRewards[index] };

            if (field === 'type') {
                rewardToUpdate.type = value as 'currency' | 'xp';
            } else if (field === 'name') {
                rewardToUpdate.name = value as string;
            } else if (field === 'amount') {
                rewardToUpdate.amount = Number(value);
            }
            
            newRewards[index] = rewardToUpdate;
            return { ...prev, rewards: newRewards };
        });
    };
    
    const addReward = () => {
        const newReward: RewardItem = { type: 'xp', name: 'XP', amount: 10 };
        const newRewards = [...(formData.rewards || []), newReward];
        setFormData(prev => ({...prev, rewards: newRewards}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create quest.');
            }
            onClose(); // Success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
             <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
                <CardHeader>
                    <CardTitle>Create New Quest</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    <form id="create-quest-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title || ''} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="flex w-full rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="emoji">Emoji</Label>
                                <Input id="emoji" name="emoji" value={formData.emoji || ''} onChange={handleChange} />
                            </div>
                            <div className="flex flex-col">
                                <Label htmlFor="type">Type</Label>
                                <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full items-center justify-between rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text">
                                    <option value="Venture" className="bg-donegeon-brown-dark">Venture (One-time)</option>
                                    <option value="Duty" className="bg-donegeon-brown-dark">Duty (Recurring)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="flex items-center space-x-2">
                                <Switch id="optional" name="optional" checked={formData.optional} onCheckedChange={(c) => setFormData(p => ({...p, optional: c}))} />
                                <Label htmlFor="optional">Optional Quest</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="approvalRequired" name="approvalRequired" checked={formData.approvalRequired} onCheckedChange={(c) => setFormData(p => ({...p, approvalRequired: c}))} />
                                <Label htmlFor="approvalRequired">Requires Approval</Label>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-donegeon-text mb-2">Rewards</h4>
                            <div className="space-y-2">
                            {(formData.rewards || []).map((reward, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                     <select value={reward.type} onChange={(e) => handleRewardChange(index, 'type', e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text">
                                         <option value="xp" className="bg-donegeon-brown-dark">XP</option>
                                         <option value="currency" className="bg-donegeon-brown-dark">Currency</option>
                                     </select>
                                     <Input placeholder="Name" value={reward.name} onChange={(e) => handleRewardChange(index, 'name', e.target.value)} />
                                     <Input type="number" placeholder="Amount" value={reward.amount} onChange={(e) => handleRewardChange(index, 'amount', parseInt(e.target.value) || 0)} />
                                </div>
                            ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addReward} className="mt-2">Add Reward</Button>
                        </div>
                        
                         {error && <p className="text-sm text-donegeon-red text-center">{error}</p>}

                    </form>
                </CardContent>
                 <div className="p-6 border-t border-donegeon-gray flex justify-end gap-4 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="create-quest-form" disabled={isLoading}>
                        {isLoading ? <LoaderCircle className="animate-spin" /> : 'Create Quest'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default CreateQuestDialog;
