import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GameAsset } from '../../items/types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { EditGameAssetDialog } from '../../admin/EditGameAssetDialog';
import ItemIdeaGenerator from '../../quests/ItemIdeaGenerator';
import Input from '../../user-interface/Input';
import ImagePreviewDialog from '../../user-interface/ImagePreviewDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import UploadWithCategoryDialog from '../../admin/UploadWithCategoryDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import ItemTable from '../../items/ItemTable';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import { useEconomyState, useEconomyDispatch, useEconomyReducerDispatch } from '../../../context/EconomyContext';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import Avatar from '../../user-interface/Avatar';
import ToggleSwitch from '../../user-interface/ToggleSwitch';

const ItemCard: React.FC<{
    asset: GameAsset;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (asset: GameAsset) => void;
    onClone: (assetId: string) => void;
    onDeleteRequest: (assetId: string) => void;
    onToggleForSale: (asset: GameAsset, isForSale: boolean) => void;
    onToggleAvailability: (asset: GameAsset, isAvailable: boolean) => void;
}> = ({ asset, isSelected, onToggle, onEdit, onClone, onDeleteRequest, onToggleForSale, onToggleAvailability }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-start gap-4 border border-stone-700">
             <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="mt-1 h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="text-2xl flex-shrink-0 mt-1">{asset.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{asset.name}</p>
                 <p className="text-sm text-stone-400 truncate">{asset.category}</p>
                 <div className="flex items-center gap-4 mt-2">
                     <ToggleSwitch enabled={asset.isForSale} setEnabled={(value) => onToggleForSale(asset, value)} label="For Sale" />
                     {asset.isForSale && (
                        <ToggleSwitch enabled={asset.isAvailable !== false} setEnabled={(value) => onToggleAvailability(asset, value)} label="Available" />
                    )}
                 </div>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(asset); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onClone(asset.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Clone</button>
                        <button onClick={() => { onDeleteRequest(asset.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};


const ManageItemsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { gameAssets: allGameAssets, rewardTypes } = useEconomyState();
    const { uploadFile, deleteSelectedAssets } = useSystemDispatch();
    const { cloneGameAsset, updateGameAsset, bulkUpdateAvailability } = useEconomyDispatch();
    const economyDispatch = useEconomyReducerDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageAssets, setPageAssets] = useState<GameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'markAvailable' | 'markUnavailable', ids: string[] } | null>(null);
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
                (asset.description && asset.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
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
        if (event.target) event.target.value = '';
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

    const handleToggleForSale = (asset: GameAsset, isForSale: boolean) => {
        updateGameAsset({ ...asset, isForSale });
    };

    const handleToggleAvailability = (asset: GameAsset, isAvailable: boolean) => {
        updateGameAsset({ ...asset, isAvailable });
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
        if (!confirmation) return;
        
        const { action, ids } = confirmation;
        setConfirmation(null);

        switch(action) {
            case 'delete':
                await deleteSelectedAssets({ gameAssets: ids }, () => {
                    economyDispatch({ type: 'REMOVE_ECONOMY_DATA', payload: { gameAssets: ids }});
                    setSelectedAssets([]);
                });
                break;
            case 'markAvailable':
                await bulkUpdateAvailability(ids, true);
                break;
            case 'markUnavailable':
                 await bulkUpdateAvailability(ids, false);
                break;
        }
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

    const isMobileView = window.innerWidth < 768;

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
                            <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'markAvailable', ids: selectedAssets })}>Mark Available</Button>
                            <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'markUnavailable', ids: selectedAssets })}>Mark Unavailable</Button>
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedAssets })} data-log-id="manage-items-bulk-delete">Delete</Button>
                        </div>
                    )}
                </div>

                {isMobileView ? (
                     <div className="space-y-3">
                        {pageAssets.map(asset => (
                            <ItemCard
                                key={asset.id}
                                asset={asset}
                                isSelected={selectedAssets.includes(asset.id)}
                                onToggle={(e) => handleCheckboxClick(e, asset.id)}
                                onEdit={handleEdit}
                                onClone={cloneGameAsset}
                                onDeleteRequest={(id) => setConfirmation({ action: 'delete', ids: [id] })}
                                onToggleForSale={handleToggleForSale}
                                onToggleAvailability={handleToggleAvailability}
                            />
                        ))}
                    </div>
                ) : (
                    <ItemTable
                        assets={pageAssets}
                        selectedAssets={selectedAssets}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleCheckboxClick}
                        onEdit={handleEdit}
                        onClone={cloneGameAsset}
                        onDeleteRequest={(ids: string[]) => setConfirmation({ action: 'delete', ids })}
                        onPreviewImage={setPreviewImageUrl}
                        isLoading={isLoading}
                        searchTerm={debouncedSearchTerm}
                        terminology={settings.terminology}
                        onCreate={handleCreate}
                        rewardTypes={rewardTypes}
                        onToggleForSale={handleToggleForSale}
                        onToggleAvailability={handleToggleAvailability}
                    />
                )}
            </Card>
            
            {fileToCategorize && (
                <UploadWithCategoryDialog
                    file={fileToCategorize}
                    onClose={() => setFileToCategorize(null)}
                    onUpload={handleUploadWithCategory}
                    existingCategories={categories.filter((c: string) => c !== 'All')}
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
                title="Confirm Action"
                message={confirmation?.action === 'delete' ? `Are you sure you want to delete ${confirmation?.ids.length} asset(s)? This action is permanent.` : `Are you sure you want to update the availability for ${confirmation?.ids.length} asset(s)?`}
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