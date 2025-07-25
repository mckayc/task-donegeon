import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditRewardTypeDialog from '../rewards/EditRewardTypeDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRewardValuePerUnit } from '../../hooks/useRewardValue';
import { EllipsisVerticalIcon } from '../ui/Icons';

const RewardItem: React.FC<{
    reward: RewardTypeDefinition;
    onEdit: (reward: RewardTypeDefinition) => void;
    onDelete: (id: string) => void;
    onClone: (id: string) => void;
}> = ({ reward, onEdit, onDelete, onClone }) => {
    const realValue = useRewardValuePerUnit(reward.id);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <li className="bg-stone-800/60 p-4 rounded-lg flex justify-between items-center">
            <div>
                <h4 className="font-bold text-lg text-stone-100 flex items-center gap-3">
                    <span className="text-2xl">{reward.icon || (reward.category === RewardCategory.Currency ? '💰' : '⭐')}</span>
                    <span>{reward.name}</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300">{reward.category}</span>
                </h4>
                <p className="text-stone-400 text-sm mt-1">{reward.description}</p>
                {realValue && <p className="text-xs font-semibold text-amber-300 mt-1">Value: ~ {realValue}</p>}
            </div>
            <div className="relative">
                <button onClick={() => setIsDropdownOpen(p => !p)} className="p-2 rounded-full hover:bg-stone-700/50">
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </button>
                {isDropdownOpen && (
                    <div ref={dropdownRef} className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <a href="#" onClick={(e) => { e.preventDefault(); onEdit(reward); setIsDropdownOpen(false); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                        {!reward.isCore && (
                            <>
                                <button onClick={() => { onClone(reward.id); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
                                <button onClick={() => { onDelete(reward.id); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};

const RewardList: React.FC<{ title: string; rewards: RewardTypeDefinition[]; onEdit: (reward: RewardTypeDefinition) => void; onDelete: (id: string) => void; onClone: (id: string) => void; }> = ({ title, rewards, onEdit, onDelete, onClone }) => (
    <Card title={title}>
        {rewards.length > 0 ? (
            <ul className="space-y-3">
                {rewards.map(reward => (
                   <RewardItem key={reward.id} reward={reward} onEdit={onEdit} onDelete={onDelete} onClone={onClone} />
                ))}
            </ul>
        ) : (
            <p className="text-stone-400">No custom rewards of this type exist yet.</p>
        )}
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
                <h1 className="text-4xl font-medieval text-stone-100">Reward Definitions</h1>
                <Button onClick={handleCreate}>
                    Create New Reward
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Currencies */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-medieval text-emerald-400 border-b-2 border-emerald-800/50 pb-2">Currencies</h2>
                    <RewardList title="Core Currencies" rewards={coreCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                    <RewardList title="Custom Currencies" rewards={customCurrencies} onEdit={handleEdit} onDelete={handleDeleteRequest} onClone={handleCloneRequest} />
                </div>

                {/* Column 2: XP */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-medieval text-emerald-400 border-b-2 border-emerald-800/50 pb-2">Experience Points (XP)</h2>
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