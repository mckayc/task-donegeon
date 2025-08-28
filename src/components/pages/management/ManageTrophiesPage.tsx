import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Trophy } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditTrophyDialog from '../../settings/EditTrophyDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import TrophyIdeaGenerator from '../../quests/TrophyIdeaGenerator';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useProgressionState } from '../../../context/ProgressionContext';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import TrophyTable from '../../trophies/TrophyTable';
import { useUIState } from '../../../context/UIContext';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';

const TrophyCard: React.FC<{
    trophy: Trophy;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (trophy: Trophy) => void;
    onDeleteRequest: (trophyId: string) => void;
}> = ({ trophy, isSelected, onToggle, onEdit, onDeleteRequest }) => {
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
            <div className="text-2xl flex-shrink-0">{trophy.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{trophy.name}</p>
                <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${trophy.isManual ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {trophy.isManual ? 'Manual' : 'Automatic'}
                </span>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(trophy); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onDeleteRequest(trophy.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageTrophiesPage: React.FC = () => {
    const { trophies } = useProgressionState();
    const { settings, isAiConfigured } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { isMobileView } = useUIState();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; icon: string; } | null>(null);
    const [selectedTrophies, setSelectedTrophies] = useState<string[]>([]);
    
    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const trophyIds = useMemo(() => trophies.map(t => t.id), [trophies]);
    const handleCheckboxClick = useShiftSelect(trophyIds, selectedTrophies, setSelectedTrophies);

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
                {selectedTrophies.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedTrophies.length} selected</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(selectedTrophies)}>Delete</Button>
                    </div>
                )}
                {isMobileView ? (
                     <div className="space-y-3">
                        {trophies.map(trophy => (
                            <TrophyCard
                                key={trophy.id}
                                trophy={trophy}
                                isSelected={selectedTrophies.includes(trophy.id)}
                                onToggle={(e) => handleCheckboxClick(e, trophy.id)}
                                onEdit={handleEdit}
                                onDeleteRequest={(id) => handleDeleteRequest([id])}
                            />
                        ))}
                    </div>
                ) : (
                    <TrophyTable
                        trophies={trophies}
                        selectedTrophies={selectedTrophies}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleCheckboxClick}
                        onEdit={handleEdit}
                        onDeleteRequest={(ids: string[]) => setDeletingIds(ids)}
                        terminology={settings.terminology}
                        onCreate={handleCreate}
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
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? settings.terminology.awards.toLowerCase() : settings.terminology.award.toLowerCase()}? This is permanent.`}
            />
        </div>
    );
};

export default ManageTrophiesPage;