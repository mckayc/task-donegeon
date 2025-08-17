import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rank } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRankDialog from '../../settings/EditRankDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import EmptyState from '../../user-interface/EmptyState';
import { RankIcon } from '../../user-interface/Icons';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';

const ManageRanksPage: React.FC = () => {
    const { ranks, settings } = useData();
    const { deleteSelectedAssets } = useActionsDispatch();
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
        if (deletingIds.length > 0) {
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
                {sortedRanks.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAll} 
                                            checked={selectedRanks.length === sortedRanks.length && sortedRanks.length > 0} 
                                            className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th className="p-4 font-semibold">Icon</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">XP Threshold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRanks.map(rank => (
                                    <tr key={rank.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedRanks.includes(rank.id)} 
                                                onChange={e => handleCheckboxClick(e, rank.id)} 
                                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                            />
                                        </td>
                                        <td className="p-4 text-2xl">{rank.icon}</td>
                                        <td className="p-4 font-bold">
                                            <button onClick={() => handleEdit(rank)} className="hover:underline hover:text-accent transition-colors text-left">
                                                {rank.name}
                                            </button>
                                        </td>
                                        <td className="p-4 text-stone-300">{rank.xpThreshold}</td>
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
