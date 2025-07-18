

import React, { useState } from 'react';
import { useGameDataState, useAppDispatch } from '../../context/AppContext';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditRewardTypeDialog from '../rewards/EditRewardTypeDialog';
import ConfirmDialog from '../ui/ConfirmDialog';

const RewardList: React.FC<{ title: string; rewards: RewardTypeDefinition[]; onEdit: (reward: RewardTypeDefinition) => void; onDelete: (id: string) => void; }> = ({ title, rewards, onEdit, onDelete }) => (
    <Card title={title}>
        {rewards.length > 0 ? (
            <ul className="space-y-3">
                {rewards.map(reward => (
                    <li key={reward.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h4 className="font-bold text-lg text-stone-100 flex items-center gap-3">
                                <span className="text-2xl">{reward.icon || (reward.category === RewardCategory.Currency ? '💰' : '⭐')}</span>
                                <span>{reward.name}</span>
                                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300">{reward.category}</span>
                            </h4>
                            <p className="text-stone-400 text-sm mt-1">{reward.description}</p>
                        </div>
                        <div className="flex space-x-2 self-end md:self-center flex-shrink-0">
                            <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => onEdit(reward)}>Edit</Button>
                            {!reward.isCore && (
                                <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => onDelete(reward.id)}>Delete</Button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-stone-400">No custom rewards of this type exist yet.</p>
        )}
    </Card>
);

const RewardsPage: React.FC = () => {
    const { rewardTypes } = useGameDataState();
    const { deleteRewardType } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<RewardTypeDefinition | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const coreCurrencies = rewardTypes.filter(rt => rt.isCore && rt.category === RewardCategory.Currency);
    const customCurrencies = rewardTypes.filter(rt => !rt.isCore && rt.category === RewardCategory.Currency);
    const coreXPs = rewardTypes.filter(rt => rt.isCore && rt.category === RewardCategory.XP);
    const customXPs = rewardTypes.filter(rt => !rt.isCore && rt.category === RewardCategory.XP);
    
    const handleEdit = (reward: RewardTypeDefinition) => {
        setEditingReward(reward);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingReward(null);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (id: string) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    }
    
    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteRewardType(deletingId);
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };


    return (
        <div>
            <div className="flex justify-end items-center mb-8">
                <Button onClick={handleCreate}>Create New Reward</Button>
            </div>

            <div className="space-y-8">
                <h2 className="text-3xl font-medieval text-emerald-400 border-b-2 border-emerald-800/50 pb-2">Currencies</h2>
                <RewardList title="Core Currencies" rewards={coreCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                <RewardList title="Custom Currencies" rewards={customCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                
                <h2 className="text-3xl font-medieval text-emerald-400 border-b-2 border-emerald-800/50 pb-2 mt-12">Experience Points (XP)</h2>
                <RewardList title="Core XP Types" rewards={coreXPs} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                <RewardList title="Custom XP Types" rewards={customXPs} onEdit={handleEdit} onDelete={handleDeleteRequest} />
            </div>

            {isDialogOpen && (
                <EditRewardTypeDialog
                    rewardType={editingReward}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Reward Type"
                message="Are you sure you want to delete this reward type? This action cannot be undone."
            />
        </div>
    );
};

export default RewardsPage;
