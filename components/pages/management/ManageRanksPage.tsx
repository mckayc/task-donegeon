

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rank } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRankDialog from '../../settings/EditRankDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import EmptyState from '../../user-interface/EmptyState';
import { RankIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const ManageRanksPage: React.FC = () => {
    const { ranks, settings } = useAppState();
    const { deleteSelectedAssets } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const sortedRanks = useMemo(() => {
        return [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
    }, [ranks]);

    const rankIds = useMemo(() => sortedRanks.map(r => r.id), [sortedRanks]);
    const handleCheckboxClick = useShiftSelect(rankIds, selectedRanks, setSelectedRanks);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div className="flex items-center gap-2 flex-wrap">
            {selectedRanks.length > 0 && (
                 <>
                    <span className="text-sm font-semibold text-stone-300 px-2">{selectedRanks.length} selected</span>
                    <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(selectedRanks)}>Delete</Button>
                    <div className="border-l h-6 border-stone-600 mx-2"></div>
                </>
            )}
            <Button onClick={handleCreate} size="sm">
                Create New {settings.terminology.level}
            </Button>
        </div>
    );


    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.levels}`}
                headerAction={headerActions}
            >
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
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRanks.map((rank: Rank) => (
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
                                        <td className="p-4 font-bold">{rank.name}</td>
                                        <td className="p-4 text-stone-300">{rank.xpThreshold}</td>
                                        <td className="p-4 relative">
                                            <button onClick={() => setOpenDropdownId(openDropdownId === rank.id ? null : rank.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === rank.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(rank); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button 
                                                        onClick={() => { handleDeleteRequest([rank.id]); setOpenDropdownId(null); }} 
                                                        className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50 disabled:opacity-50 disabled:text-stone-500"
                                                        disabled={rank.xpThreshold === 0}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
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
