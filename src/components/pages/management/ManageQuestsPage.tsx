import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { ArrowLeftIcon, ArrowRightIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import { useUIState } from '../../../context/UIContext';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useEconomyState } from '../../../context/EconomyContext';

const QuestCard: React.FC<{
    quest: Quest;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (quest: Quest) => void;
    onClone: (questId: string) => void;
    onDeleteRequest: (questId: string) => void;
}> = ({ quest, isSelected, onToggle, onEdit, onClone, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { rewardTypes } = useEconomyState();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const typeColorClass = quest.type === QuestType.Duty
        ? 'bg-sky-500/20 text-sky-300'
        : quest.type === QuestType.Journey
        ? 'bg-purple-500/20 text-purple-300'
        : 'bg-amber-500/20 text-amber-300';
        
    const getRewardInfo = (id: string) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-start gap-4 border border-stone-700">
             <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="mt-1 h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="text-2xl flex-shrink-0 mt-1">{quest.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{quest.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${quest.isActive ? 'bg-green-500/20 text-green-300' : 'bg-stone-500/20 text-stone-300'}`}>
                        {quest.isActive ? 'Active' : 'Inactive'}
                    </span>
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColorClass}`}>
                        {quest.type}
                    </span>
                </div>
                 {quest.rewards.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold mt-2 pt-2 border-t border-stone-700/60">
                        {quest.rewards.map(r => {
                            const { name, icon } = getRewardInfo(r.rewardTypeId);
                            return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+{r.amount} <span className="text-base">{icon}</span></span>
                        })}
                    </div>
                )}
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(quest); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onClone(quest.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Clone</button>
                        <button onClick={() => { onDeleteRequest(quest.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageQuestsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { quests, questGroups } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { deleteQuests, updateQuestsStatus, bulkUpdateQuests, cloneQuest } = useQuestsDispatch();
    const { isMobileView } = useUIState();
    
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

    const scrollContainerRef = useRef<HTMLElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const tabs = useMemo(() => ['All', 'Uncategorized', ...questGroups.map(g => g.name)], [questGroups]);

    const globalSets = useMemo(() => settings.conditionSets.filter(cs => cs.isGlobal), [settings.conditionSets]);

    const checkArrows = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            setShowLeftArrow(hasOverflow && el.scrollLeft > 5);
            setShowRightArrow(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            checkArrows();
            container.addEventListener('scroll', checkArrows, { passive: true });
            const resizeObserver = new ResizeObserver(checkArrows);
            resizeObserver.observe(container);

            return () => {
                container.removeEventListener('scroll', checkArrows);
                resizeObserver.disconnect();
            };
        }
    }, [tabs, checkArrows]);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.75;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };


    const pageQuests = useMemo(() => {
        const group = questGroups.find(g => g.name === activeTab);
        const groupId = activeTab === 'All' ? 'All' : (group ? group.id : 'Uncategorized');

        const filtered = quests.filter(quest => {
            // FIX: Property 'groupId' does not exist on type 'Quest'. Did you mean 'groupIds'?
            const groupMatch = groupId === 'All' || 
                               (groupId === 'Uncategorized' && (!quest.groupIds || quest.groupIds.length === 0)) ||
                               quest.groupIds?.includes(groupId);

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
    
    const pageQuestIds = useMemo(() => pageQuests.map(q => q.id), [pageQuests]);
    const handleCheckboxClick = useShiftSelect(pageQuestIds, selectedQuests, setSelectedQuests);

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
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedQuests(e.target.checked ? pageQuestIds : []);
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
            {globalSets.length > 0 && (
                <div className="bg-sky-900/50 border border-sky-700 text-sky-200 text-sm p-4 rounded-lg">
                    <p>
                        <span className="font-bold">Active Global Sets:</span> {globalSets.map(s => s.name).join(', ')}. These rules apply to all items on this page.
                    </p>
                </div>
            )}
            <Card
                title={`All Created ${settings.terminology.tasks}`}
                headerAction={headerActions}
            >
                <div className="border-b border-stone-700 mb-4 flex items-center gap-2">
                    {showLeftArrow && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={() => handleScroll('left')} aria-label="Scroll left">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Button>
                    )}
                    <div className="flex-grow overflow-hidden">
                        <nav ref={scrollContainerRef} className="-mb-px flex space-x-4 overflow-x-auto scrollbar-hide">
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
                    {showRightArrow && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={() => handleScroll('right')} aria-label="Scroll right">
                            <ArrowRightIcon className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                <div className="space-y-4 mb-4">
                    <div className="flex flex-wrap gap-4 items-end p-2 bg-stone-900/40 rounded-lg">
                        <div className="flex-grow" style={{ minWidth: '200px' }}>
                            <Input label="Search" placeholder="Search quests..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex-grow" style={{ minWidth: '180px' }}>
                            <Input as="select" label="Sort By" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}>
                                <option value="title-asc">Title (A-Z)</option>
                                <option value="title-desc">Title (Z-A)</option>
                                <option value="status-asc">Status (Inactive first)</option>
                                <option value="status-desc">Status (Active first)</option>
                                <option value="type-asc">Type (A-Z)</option>
                                <option value="type-desc">Type (Z-A)</option>
                            </Input>
                        </div>
                        <div className="flex-grow" style={{ minWidth: '150px' }}>
                            <Input as="select" label="Type" value={typeFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as any)}>
                                <option value="All">All Types</option>
                                <option value={QuestType.Duty}>{settings.terminology.recurringTask}</option>
                                <option value={QuestType.Venture}>{settings.terminology.singleTask}</option>
                                <option value={QuestType.Journey}>{settings.terminology.journey}</option>
                            </Input>
                        </div>
                        <div className="flex-grow" style={{ minWidth: '150px' }}>
                            <Input as="select" label="Status" value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}>
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </Input>
                        </div>
                    </div>
                    
                    {selectedQuests.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedQuests.length} selected</span>
                            <Button size="sm" variant="secondary" onClick={() => setIsBulkEditDialogOpen(true)} data-log-id="manage-quests-bulk-edit">Bulk Edit</Button>
                            <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'activate', ids: selectedQuests })} data-log-id="manage-quests-bulk-activate">Mark Active</Button>
                            <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'deactivate', ids: selectedQuests })} data-log-id="manage-quests-bulk-deactivate">Mark Inactive</Button>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedQuests })} data-log-id="manage-quests-bulk-delete">Delete</Button>
                        </div>
                    )}
                </div>
                
                {isMobileView ? (
                    <div className="space-y-3">
                         {pageQuests.length > 0 && (
                            <div className="flex items-center p-2 border-b border-stone-700/60">
                                <input
                                    type="checkbox"
                                    checked={selectedQuests.length === pageQuestIds.length && pageQuestIds.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                />
                                <label className="ml-3 text-sm font-semibold text-stone-300">Select All</label>
                            </div>
                        )}
                        {pageQuests.map(quest => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                isSelected={selectedQuests.includes(quest.id)}
                                onToggle={(e) => handleCheckboxClick(e, quest.id)}
                                onEdit={handleEdit}
                                onClone={cloneQuest}
                                onDeleteRequest={(id) => setConfirmation({ action: 'delete', ids: [id] })}
                            />
                        ))}
                    </div>
                ) : (
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
                        rewardTypes={rewardTypes}
                    />
                )}
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