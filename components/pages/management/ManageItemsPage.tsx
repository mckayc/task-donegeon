import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { GameAsset } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import EmptyState from '../../user-interface/EmptyState';
import { ItemManagerIcon } from '../../user-interface/Icons';
import ItemIdeaGenerator from '../../quests/ItemIdeaGenerator';
import Input from '../../user-interface/Input';
import ImagePreviewDialog from '../../user-interface/ImagePreviewDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import UploadWithCategoryDialog from '../../admin/UploadWithCategoryDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const ManageItemsPage: React.FC = () => {
    const { settings, isAiConfigured, gameAssets: allGameAssets } = useData();
    const { uploadFile, cloneGameAsset, deleteSelectedAssets } = useActionsDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageAssets, setPageAssets] = useState<GameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete', ids: string[] } | null>(null);
    const [initialCreateData, setInitialCreateData] = useState<any | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isDragging, setIsDragging] = useState(false);
    const [fileToCategorize, setFileToCategorize] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
    
    const categories = useMemo(() => ['All', ...Array.from(new Set(allGameAssets.map(a => a.category)))], [allGameAssets]);

    const pageAssetIds = useMemo(() => pageAssets.map(a => a.id), [pageAssets]);
    const handleCheckboxClick = useShiftSelect(pageAssetIds, selectedAssets, setSelectedAssets);

    const fetchAssets = useCallback(async () => {
        setIsLoading(true);
        const filtered = allGameAssets.filter(asset => {
            const categoryMatch = activeTab === 'All' || asset.category === activeTab;
            const searchMatch = !debouncedSearchTerm || 
                asset.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                asset.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'createdAt-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'createdAt-desc':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
        
        setPageAssets(filtered);
        setIsLoading(false);
    }, [activeTab, debouncedSearchTerm, sortBy, allGameAssets]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    useEffect(() => {
        setSelectedAssets([]);
    }, [activeTab, searchTerm, sortBy]);
    
    const handleFileProcess = useCallback((file: File) => {
        setFileToCategorize(file);
    }, []);

    const handleUploadWithCategory = async (file: File, category: string) => {
        setIsUploading(true);
        try {
            const uploadedAsset = await uploadFile(file, category);
            if (uploadedAsset?.url) {
                addNotification({ type: 'success', message: 'Image uploaded! Now add asset details.' });
                const assetName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
                setInitialCreateData({
                    url: uploadedAsset.url,
                    name: assetName.charAt(0).toUpperCase() + assetName.slice(1),
                    category,
                });
                setIsCreateDialogOpen(true);
            } else {
                throw new Error('Upload failed to return a URL.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
            setFileToCategorize(null);
        }
    };
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) Array.from(event.target.files).forEach(handleFileProcess);
        event.target.value = '';
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files?.length > 0) {
            Array.from(event.dataTransfer.files).forEach(handleFileProcess);
            event.dataTransfer.clearData();
        }
    }, [handleFileProcess]);

    const handleDragEvents = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') setIsDragging(true);
        else if (event.type === 'dragleave') setIsDragging(false);
    };


    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!confirmation || confirmation.action !== 'delete') return;
        try {
            await deleteSelectedAssets({ gameAssets: confirmation.ids });
            addNotification({ type: 'info', message: `${confirmation.ids.length} asset(s) deleted.` });
            setSelectedAssets([]);
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

    return (
        <div className="space-y-6">
             <Card title="Quick Add Asset">
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                    className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                        isDragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-stone-600'
                    }`}
                >
                    <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isUploading} />
                    <p className="text-stone-400 mb-4">Drag & drop files here, or click to select.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading} data-log-id="manage-items-upload-image">
                            {isUploading ? 'Processing...' : 'Upload Image'}
                        </Button>
                         {isAiAvailable && (
                            <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary" data-log-id="manage-items-create-with-ai">Create with AI</Button>
                        )}
                        <Button onClick={handleCreate} variant="secondary" data-log-id="manage-items-create-manually">Create Manually</Button>
                    </div>
                </div>
            </Card>
            <Card title={`All Created ${settings.terminology.link_manage_items}`}>
                <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {categories.map(category => (
                            <button key={category} onClick={() => setActiveTab(category)}
                                data-log-id={`manage-items-tab-${category.toLowerCase()}`}
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
                    <Input placeholder="Search assets..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <Input as="select" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as typeof sortBy)}>
                        <option value="createdAt-desc">Date (Newest)</option>
                        <option value="createdAt-asc">Date (Oldest)</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </Input>
                    {selectedAssets.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedAssets.length} selected</span>
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(pageAssets.find(a => a.id === selectedAssets[0])!)} disabled={selectedAssets.length !== 1}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => cloneGameAsset(selectedAssets[0])} disabled={selectedAssets.length !== 1}>Clone</Button>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedAssets })} data-log-id="manage-items-bulk-delete">Delete</Button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : pageAssets.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedAssets.length === pageAssets.length && pageAssets.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold w-20">Image</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">For Sale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageAssets.map(asset => {
                                    const isOrphaned = asset.isForSale && (!asset.marketIds || asset.marketIds.length === 0);
                                    return (
                                        <tr key={asset.id} className="border-b border-stone-700/40 last:border-b-0">
                                            <td className="p-4">
                                                <input type="checkbox" checked={selectedAssets.includes(asset.id)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxClick(e, asset.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                            </td>
                                            <td className="p-2">
                                                <button onClick={() => setPreviewImageUrl(asset.imageUrl || null)} className="w-12 h-12 bg-stone-700 rounded-md overflow-hidden hover:ring-2 ring-accent">
                                                    <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                                                </button>
                                            </td>
                                            <td className="p-4 font-bold">
                                                <button onClick={() => handleEdit(asset)} data-log-id={`manage-items-edit-title-${asset.id}`} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-1.5">
                                                    {isOrphaned && <span title="This item is for sale but not in any market." className="text-yellow-400">⚠️</span>}
                                                    {asset.name}
                                                </button>
                                            </td>
                                            <td className="p-4 text-stone-400">{asset.category}</td>
                                            <td className="p-4 text-stone-300">{asset.isForSale ? 'Yes' : 'No'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={ItemManagerIcon}
                        title="No Assets Found"
                        message={searchTerm ? "No assets match your search." : "Create your first asset to be used as a reward or marketplace item."}
                        actionButton={<Button onClick={handleCreate} data-log-id="manage-items-create-empty-state">Create Asset</Button>}
                    />
                )}
            </Card>
            
            {fileToCategorize && (
                <UploadWithCategoryDialog
                    file={fileToCategorize}
                    onClose={() => setFileToCategorize(null)}
                    onUpload={handleUploadWithCategory}
                    existingCategories={categories.filter(c => c !== 'All')}
                />
            )}
            
            {isCreateDialogOpen && <EditGameAssetDialog 
                assetToEdit={editingAsset} 
                initialData={initialCreateData} 
                onClose={() => { setEditingAsset(null); setIsCreateDialogOpen(false); setInitialCreateData(null); }}
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
