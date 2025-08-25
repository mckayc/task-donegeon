import React, { useMemo, useState } from 'react';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useAuthState } from '../../context/AuthContext';
import Card from '../user-interface/Card';
import { CollectionIcon } from '../user-interface/Icons';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import Button from '../user-interface/Button';
import { GameAsset } from '../../types';

const CollectionPage: React.FC = () => {
    const { gameAssets } = useEconomyState();
    const { currentUser } = useAuthState();
    const { useItem, craftItem } = useEconomyDispatch();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'collection' | 'crafting'>('collection');

    const { myCollection, craftableItems } = useMemo(() => {
        if (!currentUser) return { myCollection: [], craftableItems: [] };

        const itemCounts = currentUser.ownedAssetIds.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const uniqueAssets = Array.from(new Set(currentUser.ownedAssetIds))
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter(asset => asset && asset.category.toLowerCase() !== 'avatar');

        const collection = uniqueAssets.map(asset => asset ? { ...asset, count: itemCounts[asset.id] } : null);

        const craftable = gameAssets.filter(asset => asset.recipe && asset.recipe.ingredients.length > 0);

        return { myCollection: collection.filter((i): i is GameAsset & { count: number } => !!i), craftableItems: craftable };

    }, [currentUser, gameAssets]);

    if (!currentUser) {
        return <Card title="Error"><p>Could not load user data.</p></Card>;
    }

    const handleUseItem = (assetId: string) => {
        useItem(assetId);
    };

    const handleCraftItem = (assetId: string) => {
        craftItem(assetId);
    };

    const CollectionView = () => (
        <>
            {myCollection.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myCollection.map(asset => asset && (
                        <div key={asset.id} className="relative bg-stone-800/60 p-4 rounded-lg flex flex-col items-center text-center">
                            {asset.count > 1 && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-stone-800">
                                    {asset.count}
                                </div>
                            )}
                            <button
                                onClick={() => asset.iconType === 'image' && asset.imageUrl && setPreviewImageUrl(asset.imageUrl)}
                                disabled={asset.iconType !== 'image' || !asset.imageUrl}
                                className="w-24 h-24 mb-4 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-default"
                                aria-label={`View larger image of ${asset.name}`}
                            >
                                <DynamicIcon
                                    iconType={asset.iconType}
                                    icon={asset.icon}
                                    imageUrl={asset.imageUrl}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 text-5xl"
                                    altText={asset.name}
                                />
                            </button>
                            <h4 className="font-bold text-lg text-stone-100">{asset.name}</h4>
                            <p className="text-stone-400 text-sm mt-1 flex-grow">{asset.description}</p>
                            <span className="mt-2 text-xs font-semibold px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full capitalize">{asset.category}</span>
                            {asset.payouts && asset.payouts.length > 0 && (
                                <div className="mt-4 w-full">
                                    <Button size="sm" className="w-full" onClick={() => handleUseItem(asset.id)}>Use</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-stone-400 text-center py-8">
                    You haven't collected any items yet. Visit the Marketplace to purchase some!
                </p>
            )}
        </>
    );

    const CraftingView = () => {
        const itemCounts = currentUser.ownedAssetIds.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return (
            <>
                {craftableItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {craftableItems.map(asset => {
                            const canCraft = asset.recipe!.ingredients.every(ing => (itemCounts[ing.assetId] || 0) >= ing.quantity);
                            return (
                                <div key={asset.id} className={`relative bg-stone-800/60 p-4 rounded-lg flex flex-col text-center ${!canCraft ? 'opacity-60' : ''}`}>
                                    <button
                                        onClick={() => asset.iconType === 'image' && asset.imageUrl && setPreviewImageUrl(asset.imageUrl)}
                                        disabled={asset.iconType !== 'image' || !asset.imageUrl}
                                        className="w-24 h-24 mb-4 mx-auto bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-default"
                                    >
                                        <DynamicIcon iconType={asset.iconType} icon={asset.icon} imageUrl={asset.imageUrl} className="w-full h-full object-contain text-5xl" altText={asset.name} />
                                    </button>
                                    <h4 className="font-bold text-lg text-stone-100">{asset.name}</h4>
                                    <div className="flex-grow mt-4 pt-4 border-t border-stone-700/60 w-full">
                                        <h5 className="font-semibold text-stone-300 text-sm mb-2">Ingredients</h5>
                                        <ul className="space-y-1 text-xs text-left">
                                            {asset.recipe!.ingredients.map(ing => {
                                                const ingredientAsset = gameAssets.find(a => a.id === ing.assetId);
                                                const userHas = itemCounts[ing.assetId] || 0;
                                                const hasEnough = userHas >= ing.quantity;
                                                return (
                                                    <li key={ing.assetId} className={`flex justify-between items-center ${hasEnough ? 'text-stone-300' : 'text-red-400'}`}>
                                                        <span>{ingredientAsset?.icon} {ingredientAsset?.name || 'Unknown Item'}</span>
                                                        <span className="font-mono font-bold">{userHas} / {ing.quantity}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    <div className="mt-4 w-full">
                                        <Button size="sm" className="w-full" disabled={!canCraft} onClick={() => handleCraftItem(asset.id)}>Craft</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-8">There are no craftable items defined by the administrator yet.</p>
                )}
            </>
        );
    }

    return (
        <div>
            <Card titleIcon={<CollectionIcon />}>
                <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('collection')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collection' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>My Collection</button>
                        <button onClick={() => setActiveTab('crafting')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'crafting' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Crafting</button>
                    </nav>
                </div>
                {activeTab === 'collection' ? <CollectionView /> : <CraftingView />}
            </Card>

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Collection item preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default CollectionPage;
