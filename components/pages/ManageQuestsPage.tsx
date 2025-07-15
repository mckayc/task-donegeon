


import React, { useState } from 'react';
import { useGameData, useGameDataDispatch } from '../../context/GameDataContext';
import { useSettings } from '../../context/SettingsContext';
import { Quest } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import QuestIdeaGenerator from '../quests/QuestIdeaGenerator';
import { QuestsIcon, SparklesIcon } from '../ui/Icons';
import EmptyState from '../ui/EmptyState';

const ManageQuestsPage: React.FC = () => {
    const { quests } = useGameData();
    const { settings, isAiAvailable } = useSettings();
    const { deleteQuest } = useGameDataDispatch();
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string } | null>(null);

    const handleEdit = (quest: Quest) => {
        setInitialCreateData(null);
        setEditingQuest(quest);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setInitialCreateData(null);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
    };

    const handleDeleteRequest = (questId: string) => {
        setDeletingId(questId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteQuest(deletingId);
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };
    
    const handleCloseDialog = () => {
        setEditingQuest(null);
        setIsCreateDialogOpen(false);
        setInitialCreateData(null);
    }
    
    const handleUseIdea = (idea: { title: string; description: string }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Manage {settings.terminology.tasks}</h1>
                 <div className="flex gap-2">
                    {isAiAvailable && (
                        <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Create with AI
                        </Button>
                    )}
                    <Button onClick={handleCreate}>Create New {settings.terminology.task}</Button>
                </div>
            </div>

            <Card title={`All Created ${settings.terminology.tasks}`}>
                {quests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Tags</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quests.map(quest => (
                                    <tr key={quest.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{quest.title}</td>
                                        <td className="p-4 text-stone-400">{quest.type}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${quest.isActive ? 'bg-green-500/20 text-green-300' : 'bg-stone-500/20 text-stone-300'}`}>
                                                {quest.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {quest.tags?.map(tag => (
                                                    <span key={tag} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 space-x-2">
                                            <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(quest)}>Edit</Button>
                                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(quest.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState 
                        Icon={QuestsIcon}
                        title={`No ${settings.terminology.tasks} Created Yet`}
                        message={`Create your first ${settings.terminology.task.toLowerCase()} to get your adventurers started.`}
                        actionButton={<Button onClick={handleCreate}>Create {settings.terminology.task}</Button>}
                    />
                )}
            </Card>
            
            {isCreateDialogOpen && <CreateQuestDialog questToEdit={editingQuest || undefined} initialData={initialCreateData || undefined} onClose={handleCloseDialog} />}
            
            {isGeneratorOpen && <QuestIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${settings.terminology.task}`}
                message={`Are you sure you want to delete this ${settings.terminology.task.toLowerCase()}? This action is permanent and cannot be undone.`}
            />
        </div>
    );
};

export default ManageQuestsPage;
