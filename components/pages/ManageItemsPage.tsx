
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ConfirmDialog from '../ui/ConfirmDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';

const ManageItemsPage: React.FC = () => {
    const { gameAssets, settings } = useAppState();
    const { deleteGameAsset } = useAppDispatch();
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deletingAsset, setDeletingAsset] = useState<GameAsset | null>(null);

    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setIsCreateDialogOpen(true);
    };

    const handleDeleteRequest = (asset: GameAsset) => {
        setDeletingAsset(asset);
    };

    const handleConfirmDelete = () => {
        if (deletingAsset) {
            deleteGameAsset(deletingAsset.id);
        }
        setDeletingAsset(null);
    };
    
    const handleCloseDialog = () => {
        setEditingAsset(null);
        setIsCreateDialogOpen(false);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Manage Items & Assets</h1>
                <Button onClick={handleCreate}>Create New Asset</Button>
            </div>

            <Card title="All Created Assets">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60">
                            <tr>
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
                                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(asset)}>Edit</Button>
                                        <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(asset)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {gameAssets.length === 0 && <p className="text-stone-400 p-4 text-center">No assets have been created yet.</p>}
            </Card>
            
            {isCreateDialogOpen && <EditGameAssetDialog assetToEdit={editingAsset} newAssetUrl={null} onClose={handleCloseDialog} />}

            <ConfirmDialog
                isOpen={!!deletingAsset}
                onClose={() => setDeletingAsset(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Asset"
                message={`Are you sure you want to delete the asset "${deletingAsset?.name}"? This action is permanent and cannot be undone.`}
            />
        </div>
    );
};

export default ManageItemsPage;
