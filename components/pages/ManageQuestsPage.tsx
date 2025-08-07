import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType, QuestGroup } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import QuestIdeaGenerator from '../quests/QuestIdeaGenerator';
import { QuestsIcon, EllipsisVerticalIcon } from '../ui/Icons';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import BulkEditQuestsDialog from '../quests/BulkEditQuestsDialog';
import { useDebounce } from '../../hooks/useDebounce';

const ManageQuestsPage: React.FC = () => {
    const { settings, isAiConfigured, questGroups } = useAppState();
    const { addNotification } = useAppDispatch();
    
    const [pageQuests, setPageQuests] = useState<Quest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'activate' | 'deactivate', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'status-asc' | 'status-desc'>('title-asc');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            if (response.status === 204) {
                 return null;
            }
            return await response.json();
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
            throw error;
        }
    }, [addNotification]);

    const fetchQuests = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const group = questGroups.find(g => g.name === activeTab);
            const groupId = activeTab === 'All' ? 'All' : (group ? group.id : 'Uncategorized');
            
            params.append('groupId', groupId);
            if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
            params.append('sortBy', sortBy);

            const data = await apiRequest('GET', `/api/quests?${params.toString()}`);
            setPageQuests(data);
        } catch (error) {
            console.error("Failed to fetch quests:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, debouncedSearchTerm, sortBy, questGroups, apiRequest]);

    useEffect(() => {
        fetchQuests();
    }, [fetchQuests]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tabs = useMemo(() => ['All', 'Uncategorized', ...questGroups.map(g => g.name)], [questGroups]);
    
    useEffect(() => {
        setSelectedQuests([]);
    }, [activeTab, searchTerm, sortBy]);

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
    
    const handleSaveQuest = async (questData: any) => {
        const isEditing = !!editingQuest;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/quests/${editingQuest!.id}` : '/api/quests';
        try {
            await apiRequest(method, url, questData);
            addNotification({ type: 'success', message: `Quest ${isEditing ? 'updated' : 'created'} successfully!` });
            fetchQuests();
        } catch (e) { /* error handled by apiRequest helper */ }
    };

    const handleClone = async (questId: string) => {
        try {
            await apiRequest('POST', `/api/quests/clone/${questId}`);
            addNotification({ type: 'success', message: 'Quest cloned successfully!' });
            fetchQuests();
        } catch (e) { /* error handled */ }
    };

    const handleConfirmAction = async () => {
        if (!confirmation) return;
        
        try {
            switch(confirmation.action) {
                case 'delete':
                    await apiRequest('DELETE', '/api/quests', { ids: confirmation.ids });
                    addNotification({ type: 'info', message: `${confirmation.ids.length} quest(s) deleted.` });
                    break;
                case 'activate':
                case 'deactivate':
                    await apiRequest('PUT', '/api/quests/bulk-status', { ids: confirmation.ids, isActive: confirmation.action === 'activate' });
                    addNotification({ type: 'success', message: `${confirmation.ids.length} quest(s) updated.` });
                    break;
            }
            setSelectedQuests([]);
            fetchQuests();
        } catch (e) { /* error handled */ }
        
        setConfirmation(null);
    };
    
    const handleCloseDialog = () => {
        setEditingQuest(null);
        setIsCreateDialogOpen(false);
        setInitialCreateData(null);
    }
    
    const handleUseIdea = (idea: any) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedQuests(pageQuests.map(q => q.id));
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
    
    const handleBulkSave = async (updates: any) => {
        try {
            await apiRequest('PUT', '/api/quests/bulk-update', { ids: selectedQuests, updates });
            addNotification({ type: 'success', message: `Bulk updated ${selectedQuests.length} quest(s).` });
            setSelectedQuests([]);
            fetchQuests();
        } catch(e) { /* error handled */ }
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

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
             {isAiAvailable && (
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                    Create with AI
                </Button>
            )}
            <Button size="sm" onClick={handleCreate}>Create New {settings.terminology.task}</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.tasks}`}
                headerAction={headerActions}
            >
                <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                 <div className="flex flex-wrap gap-4 mb-4">
                    <Input placeholder="Search quests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <Input as="select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="status-asc">Status (Inactive first)</option>
                        <option value="status-desc">Status (Active first)</option>
                    </Input>
                    {selectedQuests.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedQuests.length} selected</span>
                            <Button size="sm" variant="secondary" onClick={() => setIsBulkEditDialogOpen(true)}>Bulk Edit</Button>
                            <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'activate', ids: selectedQuests })}>Mark Active</Button>
                            <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'deactivate', ids: selectedQuests })}>Mark Inactive</Button>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedQuests })}>Delete</Button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : pageQuests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedQuests.length === pageQuests.length && pageQuests.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Tags</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageQuests.map(quest => (
                                    <tr key={quest.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4"><input type="checkbox" checked={selectedQuests.includes(quest.id)} onChange={e => handleSelectOne(quest.id, e.target.checked)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
                                        <td className="p-4 font-bold">
                                            <button onClick={() => handleEdit(quest)} className="hover:underline hover:text-accent transition-colors text-left">
                                                {quest.title}
                                            </button>
                                        </td>
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
                                        <td className="p-4 relative">
                                            <button onClick={() => setOpenDropdownId(openDropdownId === quest.id ? null : quest.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === quest.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(quest); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { handleClone(quest.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
                                                    <button onClick={() => { setConfirmation({ action: 'delete', ids: [quest.id] }); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                        Icon={QuestsIcon}
                        title={`No ${settings.terminology.tasks} Found`}
                        message={searchTerm ? "No quests match your search." : `Create your first ${settings.terminology.task.toLowerCase()} to get your adventurers started.`}
                        actionButton={<Button onClick={handleCreate}>Create {settings.terminology.task}</Button>}
                    />
                )}
            </Card>
            
            {isCreateDialogOpen && <CreateQuestDialog questToEdit={editingQuest || undefined} initialData={initialCreateData || undefined} onClose={handleCloseDialog} onSave={handleSaveQuest} />}
            
            {isGeneratorOpen && <QuestIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            {isBulkEditDialogOpen && <BulkEditQuestsDialog questIds={selectedQuests} onClose={() => setIsBulkEditDialogOpen(false)} onSave={handleBulkSave} />}

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