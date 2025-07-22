import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';
import EmptyState from '../ui/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '../ui/Icons';
import ItemIdeaGenerator from '../quests/ItemIdeaGenerator';

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
                {gameAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {gameAssets.map(asset => (
                             <div key={asset.id} className="relative group">
                                <button
                                    onClick={() => handleEdit(asset)}
                                    className="w-full text-left bg-stone-900/40 rounded-lg border border-stone-700/60 flex flex-col hover:border-accent transition-all duration-200"
                                >
                                    <div className="aspect-square w-full bg-stone-700/50 rounded-t-md flex items-center justify-center overflow-hidden">
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="p-3">
                                        <p className="font-bold text-stone-200 truncate" title={asset.name}>{asset.name}</p>
                                        <p className="text-xs text-stone-400">{asset.category}</p>
                                    </div>
                                </button>
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
                        title="No Assets Created Yet"
                        message="Create your first asset to be used as a reward or marketplace item."
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
        </div>
    );
};

export default ManageItemsPage;