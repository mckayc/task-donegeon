import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trophy } from '../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditTrophyDialog from '../../settings/EditTrophyDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import EmptyState from '../../user-interface/EmptyState';
import TrophyIdeaGenerator from '../../quests/TrophyIdeaGenerator';
import { TrophyIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const ManageTrophiesPage: React.FC = () => {
    const { trophies, settings, isAiConfigured } = useAppState();
    const { deleteSelectedAssets } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; icon: string; } | null>(null);
    const [selectedTrophies, setSelectedTrophies] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const trophyIds = useMemo(() => trophies.map(t => t.id), [trophies]);
    const handleCheckboxClick = useShiftSelect(trophyIds, selectedTrophies, setSelectedTrophies);

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
        setEditingTrophy(null);
        setInitialCreateData(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (trophy: Trophy) => {
        setEditingTrophy(trophy);
        setInitialCreateData(null);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (trophyIds: string[]) => {
        setDeletingIds(trophyIds);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ trophies: deletingIds }, () => {
                setSelectedTrophies(prev => prev.filter(id => !deletingIds.includes(id)));
                setDeletingIds([]);
            });
        } else {
            setDeletingIds([]);
        }
    };
    
    const handleUseIdea = (idea: { name: string; description: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingTrophy(null);
        setIsDialogOpen(true);
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTrophies(trophies.map((t: Trophy) => t.id));
        } else {
            setSelectedTrophies([]);
        }
    };

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
            {selectedTrophies.length > 0 && (
                <>
                    <span className="text-sm font-semibold text-stone-300 px-2">{selectedTrophies.length} selected</span>
                    <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(selectedTrophies)}>Delete</Button>
                    <div className="border-l h-6 border-stone-600 mx-2"></div>
                </>
            )}
             {isAiAvailable && (
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                    Create with AI
                </Button>
            )}
            <Button size="sm" onClick={handleCreate}>Create New {settings.terminology.award}</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.awards}`}
                headerAction={headerActions}
            >
                {trophies.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedTrophies.length === trophies.length && trophies.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold">Icon</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trophies.map((trophy: Trophy) => (
                                    <tr key={trophy.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4"><input type="checkbox" checked={selectedTrophies.includes(trophy.id)} onChange={e => handleCheckboxClick(e, trophy.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
                                        <td className="p-4 text-2xl">{trophy.icon}</td>
                                        <td className="p-4 font-bold">{trophy.name}</td>
                                        <td className="p-4 text-stone-300 max-w-sm truncate">{trophy.description}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trophy.isManual ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                {trophy.isManual ? 'Manual' : 'Automatic'}
                                            </span>
                                        </td>
                                        <td className="p-4 relative">
                                            <button onClick={() => setOpenDropdownId(openDropdownId === trophy.id ? null : trophy.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === trophy.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(trophy); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { handleDeleteRequest([trophy.id]); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                        Icon={TrophyIcon}
                        title={`No ${settings.terminology.awards} Created`}
                        message={`Create ${settings.terminology.awards.toLowerCase()} for users to earn through milestones or manual grants.`}
                        actionButton={<Button onClick={handleCreate}>Create {settings.terminology.award}</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditTrophyDialog trophy={editingTrophy} initialData={initialCreateData || undefined} onClose={() => {
                setIsDialogOpen(false);
                setInitialCreateData(null);
            }} />}
            {isGeneratorOpen && <TrophyIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? settings.terminology.awards : settings.terminology.award}`}
                message={`Are you sure you want to delete ${deletingIds.length} ${deletingIds.length > 1 ? settings.terminology.awards.toLowerCase() : settings.terminology.award.toLowerCase()}? This is permanent.`}
            />
        </div>
    );
};

export default ManageTrophiesPage;
