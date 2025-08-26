import React, { useState, useMemo } from 'react';
import { Rank } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import EditRankDialog from '../settings/EditRankDialog';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { useShiftSelect } from '../../hooks/useShiftSelect';
import { useProgressionState } from '../../context/ProgressionContext';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import RankTable from '../ranks/RankTable';
import { useAuthState } from '../../context/AuthContext';

const ManageRanksPage: React.FC = () => {
    const { ranks } = useProgressionState();
    const { settings } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { currentUser } = useAuthState();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedRanks, setSelectedRanks] = useState<string[]>([]);

    const sortedRanks = useMemo(() => {
        return [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
    }, [ranks]);

    const rankIds = useMemo(() => sortedRanks.map(r => r.id), [sortedRanks]);
    const handleCheckboxClick = useShiftSelect(rankIds, selectedRanks, setSelectedRanks);

    const handleCreate = () => {
        setEditingRank(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rank: Rank) => {
        setEditingRank(rank);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (rankIds: string[]) => {
        const firstRank = ranks.find(r => r.xpThreshold === 0);
        if (firstRank && rankIds.includes(firstRank.id)) {
            alert(`The first ${settings.terminology.level.toLowerCase()} (0 XP Threshold) cannot be deleted.`);
            return;
        }
        setDeletingIds(rankIds);
    };

    const handleConfirmDelete = () => {
        // FIX: Pass currentUser.id as the second argument to deleteSelectedAssets.
        if (deletingIds.length > 0 && currentUser) {
            deleteSelectedAssets({ ranks: deletingIds }, currentUser.id, () => {
                setDeletingIds([]);
                setSelectedRanks(prev => prev.filter(id => !deletingIds.includes(id)));
            });
        }
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRanks(e.target.checked ? rankIds : []);
    };
    
    const headerActions = (
        <Button onClick={handleCreate} size="sm">
            Create New {settings.terminology.level}
        </Button>
    );

    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.levels}`}
                headerAction={headerActions}
            >
                 {selectedRanks.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedRanks.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(sortedRanks.find(r => r.id === selectedRanks[0])!)} disabled={selectedRanks.length !== 1}>Edit</Button>
                        <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(selectedRanks)}>Delete</Button>
                    </div>
                )}
                <RankTable
                    ranks={sortedRanks}
                    selectedRanks={selectedRanks}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleCheckboxClick}
                    onEdit={handleEdit}
                    onDeleteRequest={handleDeleteRequest}
                    terminology={settings.terminology}
                    onCreate={handleCreate}
                />
            </Card>

            {isDialogOpen && <EditRankDialog rank={editingRank} onClose={() => setIsDialogOpen(false)} />}

            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? settings.terminology.levels : settings.terminology.level}`}
                message={`Are you sure you want to delete ${deletingIds.length} ${deletingIds.length > 1 ? settings.terminology.levels.toLowerCase() : settings.terminology.level.toLowerCase()}? This is permanent.`}
            />
        </div>
    );
};

export default ManageRanksPage;