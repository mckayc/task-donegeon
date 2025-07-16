
import React, { useState } from 'react';
import { Trophy } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditTrophyDialog from '../settings/EditTrophyDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useGameData, useGameDataDispatch } from '../../context/GameDataContext';
import { useSettings } from '../../context/SettingsContext';
import EmptyState from '../ui/EmptyState';
import { SparklesIcon, TrophyIcon } from '../ui/Icons';
import TrophyIdeaGenerator from '../quests/TrophyIdeaGenerator';

const ManageTrophiesPage: React.FC = () => {
    const { trophies } = useGameData();
    const { settings, isAiAvailable } = useSettings();
    const { deleteTrophy } = useGameDataDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
    const [deletingTrophy, setDeletingTrophy] = useState<Trophy | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; icon: string; } | null>(null);


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

    const handleDeleteRequest = (trophy: Trophy) => {
        setDeletingTrophy(trophy);
    };

    const handleConfirmDelete = () => {
        if (deletingTrophy) {
            deleteTrophy(deletingTrophy.id);
        }
        setDeletingTrophy(null);
    };
    
    const handleUseIdea = (idea: { name: string; description: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingTrophy(null);
        setIsDialogOpen(true);
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-8 gap-2">
                 {isAiAvailable && (
                    <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                        Create with AI
                    </Button>
                )}
                <Button onClick={handleCreate}>Create New {settings.terminology.award}</Button>
            </div>

            <Card title={`All ${settings.terminology.awards}`}>
                {trophies.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Icon</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trophies.map(trophy => (
                                    <tr key={trophy.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 text-2xl">{trophy.icon}</td>
                                        <td className="p-4 font-bold">{trophy.name}</td>
                                        <td className="p-4 text-stone-300 max-w-sm truncate">{trophy.description}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trophy.isManual ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                {trophy.isManual ? 'Manual' : 'Automatic'}
                                            </span>
                                        </td>
                                        <td className="p-4 space-x-2">
                                            <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(trophy)}>Edit</Button>
                                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(trophy)}>Delete</Button>
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
            
            {deletingTrophy && (
                <ConfirmDialog
                    isOpen={!!deletingTrophy}
                    onClose={() => setDeletingTrophy(null)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${settings.terminology.award}`}
                    message={`Are you sure you want to delete the ${settings.terminology.award.toLowerCase()} "${deletingTrophy.name}"? This is permanent.`}
                />
            )}
        </div>
    );
};

export default ManageTrophiesPage;
