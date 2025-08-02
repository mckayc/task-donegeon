import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CollectionIcon } from '../ui/icons';
import ImagePreviewDialog from '../ui/ImagePreviewDialog';

const CollectionPage: React.FC = () => {
    const { currentUser, gameAssets } = useAppState();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const myCollection = useMemo(() => {
        if (!currentUser) return [];
        return currentUser.ownedAssetIds
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter(asset => asset && asset.category.toLowerCase() !== 'avatar');
    }, [currentUser, gameAssets]);

    if (!currentUser) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>Could not load user data.</p></CardContent></Card>;
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CollectionIcon />
                        Purchased Items
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {myCollection.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {myCollection.map(asset => asset && (
                                <div key={asset.id} className="bg-card p-4 rounded-lg flex flex-col items-center text-center">
                                    <button
                                        onClick={() => setPreviewImageUrl(asset.url)}
                                        className="w-24 h-24 mb-4 bg-background rounded-lg flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
                                        aria-label={`View larger image of ${asset.name}`}
                                    >
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                                    </button>
                                    <h4 className="font-bold text-lg text-foreground">{asset.name}</h4>
                                    <p className="text-muted-foreground text-sm mt-1 flex-grow">{asset.description}</p>
                                    <span className="mt-2 text-xs font-semibold px-2 py-0.5 bg-primary/20 text-primary rounded-full capitalize">{asset.category}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            You haven't collected any items yet. Visit the Marketplace to purchase some!
                        </p>
                    )}
                </CardContent>
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