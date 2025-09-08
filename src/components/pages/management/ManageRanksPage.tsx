import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { Rank } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRankDialog from '../../settings/EditRankDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useProgressionState, ProgressionDispatchContext } from '../../../context/ProgressionContext';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import RankTable from '../../ranks/RankTable';
import { useUIState } from '../../../context/UIContext';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';

const RankCard: React.FC<{
    rank: Rank;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (rank: Rank) => void;
    onDeleteRequest: (rankId: string) => void;
}> = ({ rank, isSelected, onToggle, onEdit, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4 border border-stone-700">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="text-2xl flex-shrink-0">{rank.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{rank.name}</p>
                <p className="text-sm text-stone-400">Requires: {rank.xpThreshold} XP</p>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(rank); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onDeleteRequest(rank.id); setDropdownOpen(false); }} disabled={rank.xpThreshold === 0} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700 disabled:opacity-50">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageRanksPage: React.FC = () => {
    const { ranks } = useProgressionState();
    const { settings } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { isMobileView } = useUIState();
    const progressionDispatch = useContext(ProgressionDispatchContext)!.dispatch;

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
                progressionDispatch({ type: 'REMOVE_PROGRESSION_DATA', payload: { ranks: deletingIds } });
                setDeletingIds([]);
                setSelectedRanks(prev => prev.filter(id => !deletingIds.includes(id)));
            });
        } else {
            setDeletingIds([]);
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
                {isMobileView ? (
                     <div className="space-y-3">
                        {sortedRanks.map(rank => (
                            <RankCard
                                key={rank.id}
                                rank={rank}
                                isSelected={selectedRanks.includes(rank.id)}
                                onToggle={(e) => handleCheckboxClick(e, rank.id)}
                                onEdit={handleEdit}
                                onDeleteRequest={(id) => handleDeleteRequest([id])}
                            />
                        ))}
                    </div>
                ) : (
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