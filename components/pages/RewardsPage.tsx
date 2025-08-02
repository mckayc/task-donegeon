import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import EditRewardTypeDialog from '../rewards/EditRewardTypeDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRewardValuePerUnit } from '../../hooks/useRewardValue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from 'lucide-react';

const RewardItem: React.FC<{
    reward: RewardTypeDefinition;
    onEdit: (reward: RewardTypeDefinition) => void;
    onDelete: (id: string) => void;
    onClone: (id: string) => void;
}> = ({ reward, onEdit, onDelete, onClone }) => {
    const realValue = useRewardValuePerUnit(reward.id);

    return (
        <li className="bg-card p-4 rounded-lg flex justify-between items-center">
            <div>
                <h4 className="font-bold text-lg text-foreground flex items-center gap-3">
                    <span className="text-2xl">{reward.icon || (reward.category === RewardCategory.Currency ? '💰' : '⭐')}</span>
                    <span>{reward.name}</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">{reward.category}</span>
                </h4>
                <p className="text-muted-foreground text-sm mt-1">{reward.description}</p>
                {realValue && <p className="text-xs font-semibold text-amber-300 mt-1">Value: ~ {realValue}</p>}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <EllipsisVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(reward)}>Edit</DropdownMenuItem>
                    {!reward.isCore && (
                        <>
                            <DropdownMenuItem onSelect={() => onClone(reward.id)}>Clone</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDelete(reward.id)} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
};

const RewardList: React.FC<{ title: string; rewards: RewardTypeDefinition[]; onEdit: (reward: RewardTypeDefinition) => void; onDelete: (id: string) => void; onClone: (id: string) => void; }> = ({ title, rewards, onEdit, onDelete, onClone }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {rewards.length > 0 ? (
                <ul className="space-y-3">
                    {rewards.map(reward => (
                       <RewardItem key={reward.id} reward={reward} onEdit={onEdit} onDelete={onDelete} onClone={onClone} />
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">No custom rewards of this type exist yet.</p>
            )}
        </CardContent>
    </Card>
);

const RewardsPage: React.FC = () => {
    const { rewardTypes } = useAppState();
    const { deleteRewardType, cloneRewardType } = useAppDispatch();
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

    const handleCloneRequest = (id: string) => {
        cloneRewardType(id);
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-display text-foreground">Reward Definitions</h1>
                <Button onClick={handleCreate}>
                    Create New Reward
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Currencies */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-display text-primary border-b-2 border-primary/20 pb-2">Currencies</h2>
                    <RewardList title="Core Currencies" rewards={coreCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                    <RewardList title="Custom Currencies" rewards={customCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                </div>

                {/* Column 2: XP */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-display text-primary border-b-2 border-primary/20 pb-2">Experience Points (XP)</h2>
                    <RewardList title="Core XP Types" rewards={coreXPs} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                    <RewardList title="Custom XP Types" rewards={customXPs} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                </div>
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