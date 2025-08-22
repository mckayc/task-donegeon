import React, { useState, useMemo } from 'react';
import { Rank } from '../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRankDialog from '../../settings/EditRankDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useProgressionState } from '../../../context/ProgressionContext';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import RankTable from '../../ranks/RankTable';
import { logger } from '../../../utils/logger';

const ManageRanksPage: React.FC = () => {
    const { ranks } = useProgressionState();
    const { settings } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
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
        logger.log('[ManageRanks] Opening create dialog');
        setEditingRank(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rank: Rank) => {
        logger.log('[ManageRanks] Opening edit dialog for rank', { id: rank.id, name: rank.name });
        setEditingRank(rank);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (rankIds: string[]) => {
        logger.log(`[ManageRanks] Staging delete action for ${rankIds.length} ranks`, { ids: rankIds });
        const firstRank = ranks.find(r => r.xpThreshold === 0);
        if (firstRank && rankIds.includes(firstRank.id)) {
            alert(`The first ${settings.terminology.level.toLowerCase()} (0 XP Threshold) cannot be deleted.`);
            return;
        }
        setDeletingIds(rankIds);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            logger.log('[ManageRanks] Confirming delete action', { ids: deletingIds });
            deleteSelectedAssets({ ranks: deletingIds }, () => {
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