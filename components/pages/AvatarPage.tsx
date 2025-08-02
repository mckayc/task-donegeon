import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Avatar from '../ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GameAsset } from '../../types';
import { Button } from '@/components/ui/button';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';

const AvatarPage: React.FC = () => {
    const { currentUser, gameAssets } = useAppState();
    const { updateUser, uploadFile } = useAppDispatch();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const { ownedAvatarAssets, availableSlots } = useMemo(() => {
        const assets = new Map<string, GameAsset[]>();
        
        currentUser?.ownedAssetIds.forEach(assetId => {
            const asset = gameAssets.find(ga => ga.id === assetId);
            if (asset && asset.category.toLowerCase() === 'avatar' && asset.avatarSlot) {
                const currentSlotAssets = assets.get(asset.avatarSlot) || [];
                assets.set(asset.avatarSlot, [...currentSlotAssets, asset]);
            }
        });
        
        const slotKeys = Array.from(assets.keys());
        return { 
            ownedAvatarAssets: assets, 
            availableSlots: slotKeys,
        };
    }, [currentUser?.ownedAssetIds, gameAssets]);

    const ownedItemsForProfilePic = useMemo(() => {
        if (!currentUser) return [];
        return currentUser.ownedAssetIds
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter((asset): asset is GameAsset => !!asset) // Filter out nulls
            .map(asset => ({
                url: asset.url,
                name: asset.name,
                category: asset.category,
            }));
    }, [currentUser, gameAssets]);
    
    const [activeSlot, setActiveSlot] = useState<string>(availableSlots[0] || '');

    if (!currentUser) {
        return <Card><CardContent><p>Could not load user data.</p></CardContent></Card>;
    }
    
    const handleEquipItem = (asset: GameAsset) => {
        if (!asset.avatarSlot) return;
        const newAvatarConfig = { ...currentUser.avatar, [asset.avatarSlot]: asset.id };
        updateUser(currentUser.id, { avatar: newAvatarConfig });
    };
    
    const handleProfilePictureSelect = (url: string) => {
        updateUser(currentUser.id, { profilePictureUrl: url });
        setIsGalleryOpen(false);
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const result = await uploadFile(file);
            if (result?.url) {
                handleProfilePictureSelect(result.url);
            }
            setIsUploading(false);
        }
    };

    const assetsForActiveSlot = ownedAvatarAssets.get(activeSlot) || [];

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col items-center justify-center">
                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden bg-card border-4 border-accent">
                         <Avatar user={currentUser} className="w-full h-full" />
                    </div>
                    <Card className="mt-6 w-full max-w-sm">
                        <CardHeader>
                            <CardTitle className="text-center">Profile Picture</CardTitle>
                        </CardHeader>
                        <CardContent>
                         <input id="profile-pic-upload" type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
                        <div className="space-y-2">
                            <Button onClick={() => document.getElementById('profile-pic-upload')?.click()} disabled={isUploading} className="w-full">
                                {isUploading ? "Uploading..." : "Upload New Image"}
                            </Button>
                            <Button variant="secondary" onClick={() => setIsGalleryOpen(true)} className="w-full">Select from My Collection</Button>
                             {currentUser.profilePictureUrl && (
                                <Button variant="destructive" onClick={() => updateUser(currentUser.id, { profilePictureUrl: undefined })} className="w-full">
                                    Remove Picture
                                </Button>
                            )}
                        </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="border-b mb-4">
                            <nav className="-mb-px flex space-x-6">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setActiveSlot(slot)}
                                        className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeSlot === slot
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide p-1">
                            {assetsForActiveSlot.map(asset => {
                                const isEquipped = asset.avatarSlot ? currentUser.avatar[asset.avatarSlot] === asset.id : false;

                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => handleEquipItem(asset)}
                                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                            isEquipped 
                                            ? 'bg-primary/20 border-2 border-primary ring-2 ring-primary/50 scale-105' 
                                            : 'bg-background/50 border-2 border-transparent hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="w-20 h-20 mx-auto bg-card rounded-lg flex items-center justify-center overflow-hidden mb-2">
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                        </div>
                                        <p className="font-semibold text-sm text-foreground truncate" title={asset.name}>
                                            {asset.name}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                         {assetsForActiveSlot.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">
                                No items owned for the '{activeSlot}' slot. Visit the Marketplace to get more!
                            </p>
                         )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {isGalleryOpen && (
                <ImageSelectionDialog
                    onSelect={handleProfilePictureSelect}
                    onClose={() => setIsGalleryOpen(false)}
                    imagePool={ownedItemsForProfilePic}
                />
            )}
        </div>
    );
};

export default AvatarPage;