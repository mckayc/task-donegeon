import React, { useState, useMemo, useEffect } from 'react';
import { useSystemState } from '../../../context/SystemContext';
import { useQuestsState, useQuestsDispatch } from '../../../context/QuestsContext';
import { Quest, QuestType, QuestGroup } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import CreateQuestDialog from '../../quests/CreateQuestDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import QuestIdeaGenerator from '../../quests/QuestIdeaGenerator';
import Input from '../../user-interface/Input';
import BulkEditQuestsDialog from '../../quests/BulkEditQuestsDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { QuestTable } from '../../quests/QuestTable';

const ManageQuestsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { quests, questGroups } = useQuestsState();
    const { deleteQuests, updateQuestsStatus, bulkUpdateQuests, cloneQuest } = useQuestsDispatch();
    
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'activate' | 'deactivate', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'status-asc' | 'status-desc' | 'type-asc' | 'type-desc'>('title-asc');
    const [typeFilter, setTypeFilter] = useState<'All' | QuestType>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const pageQuests = useMemo(() => {
        const group = questGroups.find(g => g.name === activeTab);
        const groupId = activeTab === 'All' ? 'All' : (group ? group.id : 'Uncategorized');

        const filtered = quests.filter(quest => {
            const groupMatch = groupId === 'All' || 
                               (groupId === 'Uncategorized' && !quest.groupId) ||
                               quest.groupId === groupId;

            const searchMatch = !debouncedSearchTerm ||
                quest.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                quest.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            
            const typeMatch = typeFilter === 'All' || quest.type === typeFilter;

            const statusMatch = statusFilter === 'All' || 
                                (statusFilter === 'Active' && quest.isActive) ||
                                (statusFilter === 'Inactive' && !quest.isActive);
            
            return groupMatch && searchMatch && typeMatch && statusMatch;
        });

        filtered.sort((a, b) => {
             switch (sortBy) {
                case 'title-desc': return b.title.localeCompare(a.title);
                case 'status-asc': return (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
                case 'status-desc': return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
                case 'type-asc': return a.type.localeCompare(b.type);
                case 'type-desc': return b.type.localeCompare(a.type);
                case 'title-asc': 
                default: 
                    return a.title.localeCompare(b.title);
            }
        });
        
        return filtered;
    }, [activeTab, debouncedSearchTerm, sortBy, quests, questGroups, typeFilter, statusFilter]);

    const tabs = useMemo(() => ['All', 'Uncategorized', ...questGroups.map(g => g.name)], [questGroups]);
    
    useEffect(() => {
        setSelectedQuests([]);
    }, [activeTab, searchTerm, sortBy, typeFilter, statusFilter]);

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

    const handleConfirmAction = async () => {
        if (!confirmation) return;
        
        switch(confirmation.action) {
            case 'delete':
                await deleteQuests(confirmation.ids);
                break;
            case 'activate':
                await updateQuestsStatus(confirmation.ids, true);
                break;
            case 'deactivate':
                await updateQuestsStatus(confirmation.ids, false);
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
    
    const handleUseIdea = (idea: any) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingQuest(null);
        setIsCreateDialogOpen(true);
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
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="secondary" data-log-id="manage-quests-create-with-ai">
                    Create with AI
                </Button>
            )}
            <Button size="sm" onClick={handleCreate} data-log-id="manage-quests-create-new">Create New {settings.terminology.task}</Button>
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
                                data-log-id={`manage-quests-tab-${tab.toLowerCase().replace(' ', '-')}`}
                                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                }`}>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                 <div className="flex flex-wrap gap-4 mb-4">
                    <Input placeholder="Search quests..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="flex-grow sm:flex-grow-0 sm:max-w-xs" />
                    <Input as="select" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}>
                        <option value="title-asc">Sort by Title (A-Z)</option>
                        <option value="title-desc">Sort by Title (Z-A)</option>
                        <option value="status-asc">Sort by Status (Inactive first)</option>
                        <option value="status-desc">Sort by Status (Active first)</option>
                        <option value="type-asc">Sort by Type (A-Z)</option>
                        <option value="type-desc">Sort by Type (Z-A)</option>
                    </Input>
                    <Input as="select" value={typeFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as any)}>
                        <option value="All">All Types</option>
                        <option value={QuestType.Duty}>{settings.terminology.recurringTask}</option>
                        <option value={QuestType.Venture}>{settings.terminology.singleTask}</option>
                        <option value={QuestType.Journey}>{settings.terminology.journey}</option>
                    </Input>
                    <Input as="select" value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}>
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </Input>
                    
                    {selectedQuests.length > 0 && (
                        <div className="w-full flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedQuests.length} selected</span>
                            <Button size="sm" variant="secondary" onClick={() => setIsBulkEditDialogOpen(true)} data-log-id="manage-quests-bulk-edit">Bulk Edit</Button>
                            <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'activate', ids: selectedQuests })} data-log-id="manage-quests-bulk-activate">Mark Active</Button>
                            <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'deactivate', ids: selectedQuests })} data-log-id="manage-quests-bulk-deactivate">Mark Inactive</Button>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedQuests })} data-log-id="manage-quests-bulk-delete">Delete</Button>
                        </div>
                    )}
                </div>

                <QuestTable
                    quests={pageQuests}
                    selectedQuests={selectedQuests}
                    setSelectedQuests={setSelectedQuests}
                    onEdit={handleEdit}
                    onClone={cloneQuest}
                    onDeleteRequest={(ids) => setConfirmation({ action: 'delete', ids })}
                    terminology={settings.terminology}
                    isLoading={!quests}
                    searchTerm={debouncedSearchTerm}
                    onCreate={handleCreate}
                />
            </Card>
            
            {isCreateDialogOpen && <CreateQuestDialog questToEdit={editingQuest || undefined} initialData={initialCreateData || undefined} onClose={handleCloseDialog} />}
            
            {isGeneratorOpen && <QuestIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            {isBulkEditDialogOpen && <BulkEditQuestsDialog questIds={selectedQuests} onClose={() => setIsBulkEditDialogOpen(false)} onSave={(updates) => bulkUpdateQuests(selectedQuests, updates)} />}

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