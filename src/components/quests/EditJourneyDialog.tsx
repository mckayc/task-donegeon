import React, { useState, useEffect } from 'react';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import { Checkpoint, RewardItem, RewardCategory, Trophy } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import RewardInputGroup from '../forms/RewardInputGroup';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { TrashIcon, PlusIcon } from '../user-interface/Icons';

interface EditJourneyDialogProps {
    questTitle: string;
    initialCheckpoints: Checkpoint[];
    onSave: (checkpoints: Checkpoint[]) => void;
    onClose: () => void;
}

const EditJourneyDialog: React.FC<EditJourneyDialogProps> = ({ questTitle, initialCheckpoints, onSave, onClose }) => {
    const { trophies } = useProgressionState();
    const { rewardTypes } = useEconomyState();

    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingCheckpointId, setDeletingCheckpointId] = useState<string | null>(null);

    useEffect(() => {
        setCheckpoints(JSON.parse(JSON.stringify(initialCheckpoints)));
    }, [initialCheckpoints]);

    const handleAddCheckpoint = () => {
        const newCheckpoint: Checkpoint = {
            id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            description: '',
            rewards: [],
        };
        setCheckpoints(prev => [...prev, newCheckpoint]);
    };

    const handleRemoveCheckpoint = (id: string) => {
        setCheckpoints(prev => prev.filter(cp => cp.id !== id));
        setDeletingCheckpointId(null);
    };

    const handleCheckpointChange = (id: string, field: 'description' | 'trophyId', value: string) => {
        setCheckpoints(prev => prev.map(cp => cp.id === id ? { ...cp, [field]: value } : cp));
    };

    const handleRewardChange = (cpId: string) => (itemIndex: number, field: keyof RewardItem, value: string | number) => {
        setCheckpoints(prev => prev.map(cp => {
            if (cp.id === cpId) {
                const newRewards = [...cp.rewards];
                newRewards[itemIndex] = { ...newRewards[itemIndex], [field]: field === 'amount' ? Math.max(0.01, parseFloat(String(value)) || 0) : value };
                return { ...cp, rewards: newRewards };
            }
            return cp;
        }));
    };

    const handleAddReward = (cpId: string) => (category: RewardCategory) => {
        const defaultReward = rewardTypes.find(rt => rt.category === category);
        if (!defaultReward) return;
        setCheckpoints(prev => prev.map(cp => {
            if (cp.id === cpId) {
                return { ...cp, rewards: [...cp.rewards, { rewardTypeId: defaultReward.id, amount: 1 }] };
            }
            return cp;
        }));
    };

    const handleRemoveReward = (cpId: string) => (itemIndex: number) => {
        setCheckpoints(prev => prev.map(cp => {
            if (cp.id === cpId) {
                return { ...cp, rewards: cp.rewards.filter((_, i) => i !== itemIndex) };
            }
            return cp;
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        onSave(checkpoints);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Edit Journey Checkpoints</h2>
                    <p className="text-stone-300">For: <span className="font-bold">{questTitle}</span></p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    {checkpoints.map((checkpoint, index) => (
                        <div key={checkpoint.id} className="p-4 bg-stone-900/50 rounded-lg border border-stone-700/60">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg text-stone-200">Checkpoint {index + 1}</h3>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setDeletingCheckpointId(checkpoint.id)}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    as="textarea"
                                    label="Description"
                                    value={checkpoint.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleCheckpointChange(checkpoint.id, 'description', e.target.value)}
                                    rows={2}
                                />
                                <RewardInputGroup
                                    category="rewards"
                                    items={checkpoint.rewards}
                                    onChange={handleRewardChange(checkpoint.id)}
                                    onAdd={handleAddReward(checkpoint.id)}
                                    onRemove={handleRemoveReward(checkpoint.id)}
                                />
                                <Input
                                    as="select"
                                    label="Trophy Award (Optional)"
                                    value={checkpoint.trophyId || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCheckpointChange(checkpoint.id, 'trophyId', e.target.value)}
                                >
                                    <option value="">No Trophy</option>
                                    {trophies.filter(t => t.isManual).map(trophy => (
                                        <option key={trophy.id} value={trophy.id}>{trophy.icon} {trophy.name}</option>
                                    ))}
                                </Input>
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddCheckpoint}
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" /> Add Checkpoint
                    </Button>
                </div>

                <div className="p-6 border-t border-stone-700/60 mt-auto flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Confirm Checkpoints'}
                    </Button>
                </div>
            </div>
            {deletingCheckpointId && (
                <ConfirmDialog
                    isOpen={!!deletingCheckpointId}
                    onClose={() => setDeletingCheckpointId(null)}
                    onConfirm={() => handleRemoveCheckpoint(deletingCheckpointId)}
                    title="Delete Checkpoint"
                    message="Are you sure you want to remove this checkpoint?"
                />
            )}
        </div>
    );
};

export default EditJourneyDialog;
