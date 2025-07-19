
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';
import EmptyState from '../ui/EmptyState';
import { ItemManagerIcon } from '../ui/Icons';
import ItemIdeaGenerator from '../quests/ItemIdeaGenerator';

const ManageItemsPage: React.FC = () => {
    const { gameAssets, settings, isAiConfigured } = useAppState();
    const { deleteGameAssets } = useAppDispatch();
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; category: string; icon: string; } | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

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
            setSelectedAssets(gameAssets.map(a => a.id));
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
            {selectedAssets.length > 0 && (
                 <>
                    <span className="text-sm font-semibold text-stone-300 px-2">{selectedAssets.length} selected</span>
                    <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(selectedAssets)}>Delete</Button>
                    <div className="border-l h-6 border-stone-600 mx-2"></div>
                </>
            )}
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedAssets.length === gameAssets.length && gameAssets.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold">Preview</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Category</th>
                                    <th className="p-4 font-semibold">For Sale</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameAssets.map(asset => (
                                    <tr key={asset.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4"><input type="checkbox" checked={selectedAssets.includes(asset.id)} onChange={e => handleSelectOne(asset.id, e.target.checked)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
                                        <td className="p-4">
                                            <div className="w-12 h-12 bg-stone-700 rounded-md overflow-hidden">
                                                <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold">{asset.name}</td>
                                        <td className="p-4 text-stone-300">{asset.category}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${asset.isForSale ? 'bg-green-500/20 text-green-300' : 'bg-stone-500/20 text-stone-300'}`}>
                                                {asset.isForSale ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="p-4 space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(asset)}>Edit</Button>
                                            <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest([asset.id])}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
