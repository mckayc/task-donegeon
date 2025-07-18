

import React, { useState, useMemo } from 'react';
import { Rank } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditRankDialog from '../settings/EditRankDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import EmptyState from '../ui/EmptyState';
import { RankIcon } from '../ui/Icons';

const ManageRanksPage: React.FC = () => {
    const { ranks, settings } = useAppState();
    const { setRanks } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);
    const [deletingRank, setDeletingRank] = useState<Rank | null>(null);

    const sortedRanks = useMemo(() => {
        return [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
    }, [ranks]);

    const handleCreate = () => {
        setEditingRank(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rank: Rank) => {
        setEditingRank(rank);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (rank: Rank) => {
        if (rank.xpThreshold === 0) {
            alert(`The first ${settings.terminology.level.toLowerCase()} cannot be deleted.`);
            return;
        }
        setDeletingRank(rank);
    };

    const handleConfirmDelete = () => {
        if (deletingRank) {
            const updatedRanks = ranks.filter(r => r.id !== deletingRank.id);
            setRanks(updatedRanks);
        }
        setDeletingRank(null);
    };

    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.levels}`}
                headerAction={
                    <Button onClick={handleCreate} size="sm">
                        Create New {settings.terminology.level}
                    </Button>
                }
            >
                {sortedRanks.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Icon</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">XP Threshold</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRanks.map(rank => (
                                    <tr key={rank.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 text-2xl">{rank.icon}</td>
                                        <td className="p-4 font-bold">{rank.name}</td>
                                        <td className="p-4 text-stone-300">{rank.xpThreshold}</td>
                                        <td className="p-4 space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(rank)}>Edit</Button>
                                            <Button 
                                                size="sm"
                                                variant="secondary" 
                                                className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                                                onClick={() => handleDeleteRequest(rank)}
                                                disabled={rank.xpThreshold === 0}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={RankIcon}
                        title={`No ${settings.terminology.levels} Defined`}
                        message={`Create ${settings.terminology.levels.toLowerCase()} to give your users something to strive for.`}
                        actionButton={<Button onClick={handleCreate}>Create {settings.terminology.level}</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditRankDialog rank={editingRank} onClose={() => setIsDialogOpen(false)} />}

            {deletingRank && (
                <ConfirmDialog
                    isOpen={!!deletingRank}
                    onClose={() => setDeletingRank(null)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${settings.terminology.level}`}
                    message={`Are you sure you want to delete the ${settings.terminology.level.toLowerCase()} "${deletingRank.name}"? This is permanent.`}
                />
            )}
        </div>
    );
};

export default ManageRanksPage;