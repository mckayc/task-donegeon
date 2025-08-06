import React, { useState, useRef, useEffect, useMemo } from 'react';
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

const ManageQuestsPage: React.FC = () => {
    const { quests, settings, isAiConfigured, questGroups } = useAppState();
    const { deleteQuests, updateQuestsStatus, cloneQuest } = useAppDispatch();
    
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'activate' | 'deactivate', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; type: QuestType, tags?: string[], rewards?: any[] } | null>(null);
    const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'status-asc' | 'status-desc'>('title-asc');

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

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
    
    const filteredAndSortedQuests = useMemo(() => {
        let filtered = [...quests];

        // Filter by tab
        if (activeTab === 'Uncategorized') {
            filtered = filtered.filter(q => !q.groupId);
        } else if (activeTab !== 'All') {
            const group = questGroups.find(g => g.name === activeTab);
            if (group) {
                filtered = filtered.filter(q => q.groupId === group.id);
            }
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(q => 
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                q.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title-asc': return a.title.localeCompare(b.title);
                case 'title-desc': return b.title.localeCompare(a.title);
                case 'status-asc': return (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                case 'status-desc': return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
                default: return 0;
            }
        });
        
        return filtered;
    }, [quests, questGroups, activeTab, searchTerm, sortBy]);
    

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
    
    const handleUseIdea = (idea: { title: string; description: string; type: QuestType, tags?: string[], rewards?: any[] }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedQuests(filteredAndSortedQuests.map(q => q.id));
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

                {filteredAndSortedQuests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedQuests.length === filteredAndSortedQuests.length && filteredAndSortedQuests.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Type</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Tags</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedQuests.map(quest => (
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
                                                    <button onClick={() => { cloneQuest(quest.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
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
            
            {isCreateDialogOpen && <CreateQuestDialog questToEdit={editingQuest || undefined} initialData={initialCreateData || undefined} onClose={handleCloseDialog} />}
            
            {isGeneratorOpen && <QuestIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            {isBulkEditDialogOpen && <BulkEditQuestsDialog questIds={selectedQuests} onClose={() => setIsBulkEditDialogOpen(false)} />}

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