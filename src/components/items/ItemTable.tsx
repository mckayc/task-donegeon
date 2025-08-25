
import React from 'react';
import { GameAsset } from './types';
import { Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { ItemManagerIcon, PencilIcon, CopyIcon, TrashIcon } from '../user-interface/Icons';

interface ItemTableProps {
    assets: GameAsset[];
    selectedAssets: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onEdit: (asset: GameAsset) => void;
    onClone: (assetId: string) => void;
    onDeleteRequest: (ids: string[]) => void;
    onPreviewImage: (url: string | null) => void;
    isLoading: boolean;
    searchTerm: string;
    terminology: Terminology;
    onCreate: () => void;
}

const ItemTable: React.FC<ItemTableProps> = ({
    assets,
    selectedAssets,
    onSelectAll,
    onSelectOne,
    onEdit,
    onClone,
    onDeleteRequest,
    onPreviewImage,
    isLoading,
    searchTerm,
    terminology,
    onCreate
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <EmptyState
                Icon={ItemManagerIcon}
                title={`No ${terminology.link_manage_items} Found`}
                message={searchTerm ? "No assets match your search." : `Create your first asset to be used as a reward or marketplace item.`}
                actionButton={<Button onClick={onCreate} data-log-id="manage-items-create-empty-state">Create Asset</Button>}
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12">
                            <input
                                type="checkbox"
                                onChange={onSelectAll}
                                checked={selectedAssets.length === assets.length && assets.length > 0}
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                            />
                        </th>
                        <th className="p-4 font-semibold w-20">Image</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold">For Sale</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map(asset => {
                        const isOrphaned = asset.isForSale && (!asset.marketIds || asset.marketIds.length === 0);
                        return (
                            <tr key={asset.id} className="border-b border-stone-700/40 last:border-b-0">
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedAssets.includes(asset.id)}
                                        onChange={(e) => onSelectOne(e, asset.id)}
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                    />
                                </td>
                                <td className="p-2">
                                    <button onClick={() => onPreviewImage(asset.imageUrl || null)} className="w-12 h-12 bg-stone-700 rounded-md overflow-hidden hover:ring-2 ring-accent">
                                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                                    </button>
                                </td>
                                <td className="p-4 font-bold">
                                    <button onClick={() => onEdit(asset)} data-log-id={`manage-items-edit-title-${asset.id}`} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-1.5">
                                        {isOrphaned && <span title="This item is for sale but not in any market." className="text-yellow-400">⚠️</span>}
                                        {asset.name}
                                    </button>
                                </td>
                                <td className="p-4 text-stone-400">{asset.category}</td>
                                <td className="p-4 text-stone-300">{asset.isForSale ? 'Yes' : 'No'}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(asset)} data-log-id={`manage-items-action-edit-${asset.id}`} className="h-8 w-8 text-stone-400 hover:text-white">
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Clone" onClick={() => onClone(asset.id)} data-log-id={`manage-items-action-clone-${asset.id}`} className="h-8 w-8 text-stone-400 hover:text-white">
                                            <CopyIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([asset.id])} data-log-id={`manage-items-action-delete-${asset.id}`} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ItemTable;
