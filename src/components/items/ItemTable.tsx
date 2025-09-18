import React from 'react';
// FIX: Corrected type import to use the main types barrel file.
import { GameAsset, RewardTypeDefinition, Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { ItemManagerIcon, PencilIcon, CopyIcon, TrashIcon } from '../user-interface/Icons';
import DynamicIcon from '../user-interface/DynamicIcon';

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
    rewardTypes: RewardTypeDefinition[];
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
    onCreate,
    rewardTypes,
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
                        <th className="p-4 font-semibold">Cost</th>
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
                                <td className="p-4">
                                    <button onClick={() => onPreviewImage(asset.imageUrl || null)} className="w-12 h-12 bg-transparent rounded-md flex items-center justify-center overflow-hidden">
                                        <DynamicIcon
                                            iconType={asset.iconType}
                                            icon={asset.icon}
                                            imageUrl={asset.imageUrl}
                                            className={asset.iconType === 'image' ? "w-full h-full object-contain" : "text-3xl"}
                                        />
                                    </button>
                                </td>
                                <td className="p-4 font-bold">
                                    <button onClick={() => onEdit(asset)} className="hover:underline hover:text-accent transition-colors text-left">
                                        {asset.name}
                                    </button>
                                </td>
                                <td className="p-4 text-stone-400">{asset.category}</td>
                                <td className="p-4">
                                    {(() => {
                                        const costGroup = asset.costGroups?.[0];
                                        if (!asset.isForSale) {
                                            return <span className="text-sm text-stone-500">N/A</span>;
                                        }
                                        if (!costGroup || costGroup.length === 0) {
                                            return <span className="text-sm font-semibold text-green-400">Free</span>;
                                        }

                                        const costString = costGroup.map(c => {
                                            const rewardType = rewardTypes.find(rt => rt.id === c.rewardTypeId);
                                            return `${c.amount} ${rewardType ? rewardType.icon : '?'}`;
                                        }).join(', ');

                                        return (
                                            <div className="flex items-center gap-1 font-semibold text-amber-300 text-sm">
                                                <span title={costString}>{costString}</span>
                                                {asset.costGroups.length > 1 && (
                                                    <span className="text-xs text-stone-400 font-normal" title={`${asset.costGroups.length - 1} more cost options`}>
                                                        ...
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${asset.isForSale ? 'bg-green-500/20 text-green-300' : 'bg-stone-500/20 text-stone-300'}`}>
                                        {asset.isForSale ? 'Yes' : 'No'}
                                    </span>
                                    {isOrphaned && <p className="text-xs text-amber-400 mt-1">Orphaned</p>}
                                </td>
                                <td className="p-4">
                                     <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(asset)} className="h-8 w-8 text-stone-400 hover:text-white">
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Clone" onClick={() => onClone(asset.id)} className="h-8 w-8 text-stone-400 hover:text-white">
                                            <CopyIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([asset.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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