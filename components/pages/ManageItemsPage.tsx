import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { GameAsset } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';
import EmptyState from '../ui/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '../ui/Icons';
import ItemIdeaGenerator from '../quests/ItemIdeaGenerator';
import Input from '../ui/Input';
import ImagePreviewDialog from '../ui/ImagePreviewDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

const ManageItemsPage: React.FC = () => {
    const { settings, isAiConfigured, gameAssets: allGameAssets } = useAppState();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageAssets, setPageAssets] = useState<GameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const categories = useMemo(() => ['All', ...Array.from(new Set(allGameAssets.map(a => a.category)))], [allGameAssets]);

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) options.body = JSON.stringify(body);
            const response = await window.fetch(path, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown network error occurred.' });
            throw error;
        }
    }, [addNotification]);

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'All') params.append('category', activeTab);
            if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
            params.append('sortBy', sortBy);

            const data = await apiRequest('GET', `/api/assets?${params.toString()}`);
            setPageAssets(data);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, debouncedSearchTerm, sortBy, apiRequest]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    useEffect(() => {
        setSelectedAssets([]);
    }, [activeTab, searchTerm, sortBy]);

    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleSaveAsset = async (assetData: any) => {
        const isEditing = !!editingAsset;
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/assets/${editingAsset!.id}` : '/api/assets';
        try {
            await apiRequest(method, url, assetData);
            addNotification({ type: 'success', message: `Asset ${isEditing ? 'updated' : 'created'} successfully!` });
            fetchAssets(); // Refresh data
        } catch (e) { /* error handled by apiRequest */ }
    };

    const handleClone = async (assetId: string) => {
        try {
            await apiRequest('POST', `/api/assets/clone/${assetId}`);
            addNotification({ type: 'success', message: 'Asset cloned successfully!' });
            fetchAssets();
        } catch (e) { /* error handled */ }
    };

    const handleConfirmAction = async () => {
        if (!confirmation || confirmation.action !== 'delete') return;
        try {
            await apiRequest('DELETE', '/api/assets', { ids: confirmation.ids });
            addNotification({ type: 'info', message: `${confirmation.ids.length} asset(s) deleted.` });
            setSelectedAssets([]);
            fetchAssets();
        } catch (e) { /* error handled */ }
        setConfirmation(null);
    };

    const handleUseIdea = (idea: any) => {
        setIsGeneratorOpen(false);
        setInitialCreateData({
            ...idea,
            url: `https://placehold.co/150/FFFFFF/000000?text=${encodeURIComponent(idea.icon)}`
        });
        setEditingAsset(null);
        setIsCreateDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedAssets(e.target.checked ? pageAssets.map(a => a.id) : []);
    };
    
    const handleSelectOne = (id: string, isChecked: boolean) => {
        setSelectedAssets(prev => isChecked ? [...prev, id] : prev.filter(assetId => assetId !== id));
    };

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
            {isAiAvailable && (
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="secondary">Create with AI</Button>
            )}
            <Button size="sm" onClick={handleCreate}>Create New Asset</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card title="All Created Items & Assets" headerAction={headerActions}>
                <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {categories.map(category => (
                            <button key={category} onClick={() => setActiveTab(category)}
                                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === category
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                }`}>
                                {category}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                    <Input placeholder="Search assets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <Input as="select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                        <option value="createdAt-desc">Date (Newest)</option>
                        <option value="createdAt-asc">Date (Oldest)</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </Input>
                    {selectedAssets.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedAssets.length} selected</span>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedAssets })}>Delete</Button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : pageAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {pageAssets.map(asset => (
                             <div key={asset.id} className="relative group">
                                <label
                                    htmlFor={`select-asset-${asset.id}`}
                                    className="w-full text-left bg-stone-900/40 rounded-lg border-2 flex flex-col hover:border-accent transition-all duration-200 cursor-pointer has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent/50"
                                >
                                    <div className="absolute top-2 left-2 z-10">
                                        <input
                                            id={`select-asset-${asset.id}`}
                                            type="checkbox"
                                            checked={selectedAssets.includes(asset.id)}
                                            onChange={e => handleSelectOne(asset.id, e.target.checked)}
                                            className="h-5 w-5 rounded text-emerald-600 bg-stone-800 border-stone-600 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="aspect-square w-full bg-stone-700/50 rounded-t-md flex items-center justify-center overflow-hidden">
                                        <button
                                            onClick={() => setPreviewImageUrl(asset.url)}
                                            className="w-full h-full group focus:outline-none focus:ring-2 focus:ring-emerald-500 ring-offset-2 ring-offset-stone-900/40"
                                            aria-label={`View larger image of ${asset.name}`}
                                        >
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault(); 
                                                e.stopPropagation(); 
                                                handleEdit(asset);
                                            }} 
                                            className="w-full text-left"
                                        >
                                            <p className="font-bold text-stone-200 truncate hover:underline hover:text-accent transition-colors" title={asset.name}>{asset.name}</p>
                                        </button>
                                        <p className="text-xs text-stone-400">{asset.category}</p>
                                    </div>
                                </label>
                                <div className="absolute top-2 right-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(openDropdownId === asset.id ? null : asset.id);
                                        }}
                                        className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5 text-white" />
                                    </button>
                                    {openDropdownId === asset.id && (
                                        <div ref={dropdownRef} className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(asset); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                            <button onClick={() => { handleClone(asset.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
                                            <button onClick={() => { setConfirmation({action: 'delete', ids: [asset.id]}); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        Icon={ItemManagerIcon}
                        title="No Assets Found"
                        message={searchTerm ? "No assets match your search." : "Create your first asset to be used as a reward or marketplace item."}
                        actionButton={<Button onClick={handleCreate}>Create Asset</Button>}
                    />
                )}
            </Card>
            
            {isCreateDialogOpen && <EditGameAssetDialog 
                assetToEdit={editingAsset} 
                initialData={initialCreateData} 
                onClose={() => { setEditingAsset(null); setIsCreateDialogOpen(false); }}
                onSave={handleSaveAsset}
            />}
            {isGeneratorOpen && <ItemIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}

            <ConfirmDialog
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirmAction}
                title="Delete Asset(s)"
                message={`Are you sure you want to delete ${confirmation?.ids.length} asset(s)? This action is permanent.`}
            />

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Asset preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default ManageItemsPage;