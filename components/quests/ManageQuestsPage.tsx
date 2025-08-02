import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType, QuestGroup } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import CreateQuestDialog from '../quests/CreateQuestDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import QuestIdeaGenerator from '../quests/QuestIdeaGenerator';
import { QuestsIcon } from '@/components/ui/icons';
import { EllipsisVertical } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { Input } from '@/components/ui/input';
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
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'status-asc' | 'status-desc'>('title-asc');

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

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
    
    const handleDeleteRequest = (questIds: string[]) => {
        setConfirmation({ action: 'delete', ids: questIds });
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

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked === true) {
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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Created {settings.terminology.tasks}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                         {isAiAvailable && (
                            <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="outline">
                                Create with AI
                            </Button>
                        )}
                        <Button size="sm" onClick={handleCreate}>Create New {settings.terminology.task}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border-b mb-4">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                     <div className="flex flex-wrap gap-4 mb-4">
                        <Input placeholder="Search quests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
                         <Select onValueChange={e => setSortBy(e as any)} defaultValue={sortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                                <SelectItem value="status-asc">Status (Inactive first)</SelectItem>
                                <SelectItem value="status-desc">Status (Active first)</SelectItem>
                            </SelectContent>
                        </Select>
                        {selectedQuests.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                                <span className="text-sm font-semibold px-2">{selectedQuests.length} selected</span>
                                <Button size="sm" variant="outline" onClick={() => setIsBulkEditDialogOpen(true)}>Bulk Edit</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmation({ action: 'activate', ids: selectedQuests })}>Mark Active</Button>
                                <Button size="sm" variant="outline" onClick={() => setConfirmation({ action: 'deactivate', ids: selectedQuests })}>Mark Inactive</Button>
                                <Button size="sm" variant="destructive" onClick={() => setConfirmation({ action: 'delete', ids: selectedQuests })}>Delete</Button>
                            </div>
                        )}
                    </div>

                    {filteredAndSortedQuests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-4 w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selectedQuests.length === filteredAndSortedQuests.length && filteredAndSortedQuests.length > 0} /></th>
                                        <th className="p-4 font-semibold">Title</th>
                                        <th className="p-4 font-semibold">Type</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold">Tags</th>
                                        <th className="p-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedQuests.map(quest => (
                                        <tr key={quest.id} className="border-b last:border-b-0">
                                            <td className="p-4"><Checkbox checked={selectedQuests.includes(quest.id)} onCheckedChange={checked => handleSelectOne(quest.id, checked === true)} /></td>
                                            <td className="p-4 font-bold">
                                                <button onClick={() => handleEdit(quest)} className="hover:underline hover:text-accent transition-colors text-left">
                                                    {quest.title}
                                                </button>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{quest.type}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${quest.isActive ? 'bg-green-500/20 text-green-300' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
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
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><EllipsisVertical className="w-4 h-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleEdit(quest)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => cloneQuest(quest.id)}>Clone</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleDeleteRequest([quest.id])} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                </CardContent>
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