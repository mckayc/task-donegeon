import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import Card from '../user-interface/Card';
import { CollectionIcon } from '../user-interface/Icons';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';

const CollectionPage: React.FC = () => {
    const { gameAssets } = useAppState();
    const { currentUser } = useAuthState();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
                                <button
                                    onClick={() => setPreviewImageUrl(asset.url)}
                                    className="w-24 h-24 mb-4 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    aria-label={`View larger image of ${asset.name}`}
                                >
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                                </button>
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
