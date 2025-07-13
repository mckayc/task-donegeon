
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { DigitalAsset } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditDigitalAssetDialog from '../admin/EditDigitalAssetDialog';

const DigitalAssetsPage: React.FC = () => {
    const { digitalAssets, settings } = useAppState();
    const { deleteDigitalAsset, setActivePage } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<DigitalAsset | null>(null);

    const handleCreate = () => {
        setEditingAsset(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (asset: DigitalAsset) => {
        setEditingAsset(asset);
        setIsDialogOpen(true);
    };

    const handleDelete = (assetId: string) => {
        if (window.confirm('Are you sure you want to delete this digital asset? This is permanent.')) {
            deleteDigitalAsset(assetId);
        }
    };

    return (
        <div className="space-y-6">
            <Card title="How to Use Digital Assets">
                <p className="text-sm text-stone-400">
                    Digital Assets are the cosmetic items players can equip on their avatars. Follow these steps to make them available in-game:
                </p>
                <ol className="list-decimal list-inside text-sm text-stone-300 mt-2 space-y-1">
                    <li>Go to the <strong className="text-emerald-400">Media Manager</strong> and upload your image file. Copy its URL.</li>
                    <li>Create a new asset here, giving it a unique <strong className="text-stone-100">Slot</strong> (e.g., "hair") and <strong className="text-stone-100">Asset ID</strong> (e.g., "hair-spiky-red"). Paste the copied URL into the Image URL field.</li>
                    <li>Go to <strong className="text-emerald-400 cursor-pointer" onClick={() => setActivePage('Manage Markets')}>Manage {settings.terminology.stores}</strong>.</li>
                    <li>Create or edit a {settings.terminology.store.toLowerCase()} and add a new item. In the "Avatar Item Payout" section, enter the <strong className="text-stone-100">exact same Slot and Asset ID</strong>.</li>
                    <li>Set a price. Now players can buy this asset in the {settings.terminology.store.toLowerCase()}!</li>
                </ol>
            </Card>
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-100">Manage Digital Assets</h2>
                <Button onClick={handleCreate}>Create New Asset</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60">
                            <tr>
                                <th className="p-4 font-semibold">Preview</th>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Slot</th>
                                <th className="p-4 font-semibold">Asset ID</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {digitalAssets.map(asset => (
                                <tr key={asset.id} className="border-b border-stone-700/40 last:border-b-0">
                                    <td className="p-4">
                                        <div className="w-12 h-12 bg-stone-700 rounded-md flex items-center justify-center">
                                            {asset.imageUrl ? (
                                                <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs text-stone-500">No Img</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold">{asset.name}</td>
                                    <td className="p-4 text-stone-400 capitalize">{asset.slot}</td>
                                    <td className="p-4 text-stone-400 font-mono">{asset.assetId}</td>
                                    <td className="p-4 space-x-2">
                                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(asset)}>Edit</Button>
                                        <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDelete(asset.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {digitalAssets.length === 0 && <p className="text-stone-400 p-4 text-center">No digital assets have been created yet.</p>}
            </Card>

            {isDialogOpen && (
                <EditDigitalAssetDialog
                    asset={editingAsset}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default DigitalAssetsPage;