
import React, { useMemo } from 'react';
import { useAuthState, useGameDataState } from '../../context/AppContext';
import Card from '../ui/Card';
import { CollectionIcon } from '../ui/Icons';

const CollectionPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { gameAssets } = useGameDataState();

    const myCollection = useMemo(() => {
        if (!currentUser) return [];
        return currentUser.ownedAssetIds
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter(asset => asset && asset.category.toLowerCase() !== 'avatar');
    }, [currentUser, gameAssets]);

    if (!currentUser) {
        return <Card title="Error"><p>Could not load user data.</p></Card>;
    }

    return (
        <div>
            <Card title="Purchased Items" titleIcon={<CollectionIcon />}>
                {myCollection.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {myCollection.map(asset => asset && (
                            <div key={asset.id} className="bg-stone-800/60 p-4 rounded-lg flex flex-col items-center text-center">
                                <div className="w-24 h-24 mb-4 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                </div>
                                <h4 className="font-bold text-lg text-stone-100">{asset.name}</h4>
                                <p className="text-stone-400 text-sm mt-1 flex-grow">{asset.description}</p>
                                <span className="mt-2 text-xs font-semibold px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full capitalize">{asset.category}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-8">
                        You haven't collected any items yet. Visit the Marketplace to purchase some!
                    </p>
                )}
            </Card>
        </div>
    );
};

export default CollectionPage;
