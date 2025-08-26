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
import { useAuthState } from '../../../context/AuthContext';

const ManageTrophiesPage: React.FC = () => {
    const { trophies } = useProgressionState();
    const { settings, isAiConfigured } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { currentUser } = useAuthState();
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
        // FIX: Pass currentUser.id as the second argument to deleteSelectedAssets.
        if (deletingIds.length > 0 && currentUser) {
            deleteSelectedAssets({ trophies: deletingIds }, currentUser.id, () => {
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