import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset } from '../../frontendTypes';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import { EditGameAssetDialog } from '../admin/EditGameAssetDialog';
import EmptyState from '../ui/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '../ui/Icons';
import ItemIdeaGenerator from '../quests/ItemIdeaGenerator';
import Input from '../ui/Input';
import ImagePreviewDialog from '../ui/ImagePreviewDialog';

const ManageItemsPage: React.FC = () => {
    const { gameAssets, settings, isAiConfigured } = useAppState();
    const { deleteGameAssets, cloneGameAsset } = useAppDispatch();
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; category: string; icon: string; } | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);


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

    const categories = useMemo(() => ['All', ...Array.from(new Set(gameAssets.map(a => a.category)))], [gameAssets]);

    const filteredAndSortedAssets = useMemo(() => {
        let assets = [...gameAssets];
        if (activeTab !== 'All') {
            assets = assets.filter(a => a.category === activeTab);
        }
        if (searchTerm) {
            assets = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        assets.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'createdAt-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'createdAt-desc':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
        return assets;
    }, [gameAssets, activeTab, searchTerm, sortBy]);

    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleDeleteRequest = (assetIds: string[]) => {
        setDeletingIds(assetIds);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteGameAssets(deletingIds);
            setSelectedAssets([]);
        }
        setDeletingIds([]);
    };
    
    const handleCloseDialog = () => {
        setEditingAsset(null);
        setIsCreateDialogOpen(false);
        setInitialCreateData(null);
    }
    
    const handleUseIdea = (idea: { name: string; description: string; category: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingAsset(null);
        setIsCreateDialogOpen(true);
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedAssets(filteredAndSortedAssets.map(a => a.id));
        } else {
            setSelectedAssets([]);
        }
    };
    
    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedAssets(prev => [...prev, id]);
        } else {
            setSelectedAssets(prev => prev.filter(assetId => assetId !== id));
        }
    };
    

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
            {isAiAvailable && (
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                    Create with AI
                </Button>
            )}
            <Button size="sm" onClick={handleCreate}>Create New Asset</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card
                title="All Created Items & Assets"
                headerAction={headerActions}
            >
                <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveTab(category)}
                                className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === category
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                }`}
                            >
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
                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(selectedAssets)}>Delete</Button>
                        </div>
                    )}
                </div>

                {filteredAndSortedAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredAndSortedAssets.map(asset => (
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
                                            <button onClick={() => { cloneGameAsset(asset.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Clone</button>
                                            <button onClick={() => { handleDeleteRequest([asset.id]); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                initialData={initialCreateData ? { 
                    url: `https://placehold.co/150/FFFFFF/000000?text=${encodeURIComponent(initialCreateData.icon)}`, 
                    name: initialCreateData.name, 
                    category: initialCreateData.category, 
                    description: initialCreateData.description 
                } : null} 
                onClose={handleCloseDialog} 
            />}
            {isGeneratorOpen && <ItemIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}


            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title="Delete Asset(s)"
                message={`Are you sure you want to delete ${deletingIds.length} asset(s)? This action is permanent.`}
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