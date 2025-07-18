
import React, { useState } from 'react';
import { useGameDataState, useSettingsState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import QuestIdeaGenerator from '../quests/QuestIdeaGenerator';
import { QuestsIcon } from '../ui/Icons';
import EmptyState from '../ui/EmptyState';

const ManageQuestsPage: React.FC = () => {
    const { quests } = useGameDataState();
    const { settings, isAiConfigured } = useSettingsState();
    const { deleteQuests, updateQuestsStatus } = useAppDispatch();
    
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'activate' | 'deactivate', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; type: QuestType } | null>(null);
    const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
    
    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

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

    const handleConfirmAction = () => {
        if (!confirmation) return;
        
        switch(confirmation.action) {
            case 'delete':
                deleteQuests(confirmation.ids);
                break;
            case 'activate':
                updateQuestsStatus(confirmation.ids, true);
                break;
            case 'deactivate':
                updateQuestsStatus(confirmation.ids, false);
                break;
        }

        setSelectedQuests([]);
        setConfirmation(null);
    };
    
    const handleCloseDialog = () => {
        setEditingQuest(null);
        setIsCreateDialogOpen(false);
        setInitialCreateData(null);
    }
    
    const handleUseIdea = (idea: { title: string; description: string; type: QuestType }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedQuests(quests.map(q => q.id));
        } else {
            setSelectedQuests([]);
        }
    };

    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedQuests(prev => [...prev, id]);
        } else {
            setSelectedQuests(prev => prev.filter(questId => questId !== id));
        }
    };
    
    const getConfirmationMessage = () => {
        if (!confirmation) return '';
        const count = confirmation.ids.length;
        const item = count > 1 ? settings.terminology.tasks.toLowerCase() : settings.terminology.task.toLowerCase();
        switch (confirmation.action) {
            case 'delete': return `Are you sure you want to permanently delete ${count} ${item}?`;
            case 'activate': return `Are you sure you want to mark ${count} ${item} as active?`;
            case 'deactivate': return `Are you sure you want to mark ${count} ${item} as inactive?`;
            default: return 'Are you sure?';
        }
    };


    return (
        <div>
             <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    {selectedQuests.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedQuests.length} selected</span>
                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'activate', ids: selectedQuests })}>Mark Active</Button>
                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'deactivate', ids: selectedQuests })}>Mark Inactive</Button>
                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedQuests })}>Delete</Button>
                        </div>
                    )}
                </div>
                 <div className="flex gap-2">
                    {isAiAvailable && (
                        <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                            Create with AI
                        </Button>
                    )}
                    <Button onClick={handleCreate}>Create New {settings.terminology.task}</Button>
                </div>
            </div>

            <Card title={`All Created ${settings.terminology.tasks}`} className="p-0 md:p-6 overflow-hidden">
                {quests.length > 0 ? (
                    <>
                        {/* Table for larger screens */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left">
                                <thead className="border-b border-stone-700/60">
                                    <tr>
                                        <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedQuests.length === quests.length && quests.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
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
                                            <td className="p-4"><input type="checkbox" checked={selectedQuests.includes(quest.id)} onChange={e => handleSelectOne(quest.id, e.target.checked)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
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
                                                <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: [quest.id] })}>Delete</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Card list for smaller screens */}
                        <div className="md:hidden p-4 space-y-4">
                             <div className="flex items-center p-2">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedQuests.length === quests.length && quests.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                <label className="ml-3 text-sm font-semibold">Select All</label>
                            </div>
                            {quests.map(quest => (
                                <div key={quest.id} className="bg-stone-800/60 rounded-lg p-3 flex gap-3">
                                    <input type="checkbox" checked={selectedQuests.includes(quest.id)} onChange={e => handleSelectOne(quest.id, e.target.checked)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 mt-1" />
                                    <div className="flex-grow">
                                        <p className="font-bold text-stone-100">{quest.title}</p>
                                        <p className="text-sm text-stone-400">{quest.type} - <span className={`${quest.isActive ? 'text-green-400' : 'text-stone-500'}`}>{quest.isActive ? 'Active' : 'Inactive'}</span></p>
                                         <div className="flex flex-wrap gap-1 mt-2">
                                            {quest.tags?.map(tag => ( <span key={tag} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full">{tag}</span> ))}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleEdit(quest)}>Edit</Button>
                                            <Button variant="secondary" className="text-xs py-1 px-2 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: [quest.id] })}>Delete</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-6">
                        <EmptyState 
                            Icon={QuestsIcon}
                            title={`No ${settings.terminology.tasks} Created Yet`}
                            message={`Create your first ${settings.terminology.task.toLowerCase()} to get your adventurers started.`}
                            actionButton={<Button onClick={handleCreate}>Create {settings.terminology.task}</Button>}
                        />
                    </div>
                )}
            </Card>
            
            {isCreateDialogOpen && <CreateQuestDialog questToEdit={editingQuest || undefined} initialData={initialCreateData || undefined} onClose={handleCloseDialog} />}
            
            {isGeneratorOpen && <QuestIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            <ConfirmDialog
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirmAction}
                title="Confirm Action"
                message={getConfirmationMessage()}
            />
        </div>
    );
};

export default ManageQuestsPage;
