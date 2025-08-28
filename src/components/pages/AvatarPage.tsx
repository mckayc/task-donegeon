import React, { useMemo, useState } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import Avatar from '../user-interface/Avatar';
import Card from '../user-interface/Card';
import { GameAsset } from '../../types';
import Button from '../user-interface/Button';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import { useEconomyState } from '../../context/EconomyContext';
import { useSystemDispatch } from '../../context/SystemContext';
import ImageCropperDialog from '../user-interface/ImageCropperDialog';

const AvatarPage: React.FC = () => {
    const { gameAssets } = useEconomyState();
    const { uploadFile } = useSystemDispatch();
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const ownedItemsForProfilePic = useMemo(() => {
        if (!currentUser) return [];
        return currentUser.ownedAssetIds
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter((asset): asset is GameAsset => !!asset && !!asset.imageUrl) // Filter out nulls and assets without images
            .map(asset => ({
                url: asset.imageUrl!,
                name: asset.name,
                category: asset.category,
            }));
    }, [currentUser, gameAssets]);
    
    if (!currentUser) {
        return <Card title="Error"><p>Could not load user data.</p></Card>;
    }
    
    const handleProfilePictureSelect = (url: string) => {
        updateUser(currentUser.id, { profilePictureUrl: url });
        setIsGalleryOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageToCrop(URL.createObjectURL(file));
        }
         // Reset input so the same file can be selected again
        e.target.value = '';
    };

    const handleCropComplete = async (croppedFile: File | null) => {
        setImageToCrop(null);
        if (croppedFile) {
            setIsUploading(true);
            const result = await uploadFile(croppedFile, 'profile-pictures');
            if (result?.url) {
                handleProfilePictureSelect(result.url);
            }
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col items-center justify-center gap-8">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-accent">
                     <Avatar user={currentUser} className="w-full h-full" />
                </div>
                <Card className="w-full max-w-sm">
                    <h4 className="font-bold text-lg text-stone-200 mb-3 text-center">Profile Picture</h4>
                     <input id="profile-pic-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <div className="space-y-2">
                        <Button onClick={() => document.getElementById('profile-pic-upload')?.click()} disabled={isUploading} className="w-full">
                            {isUploading ? "Uploading..." : "Upload New Image"}
                        </Button>
                        <Button variant="secondary" onClick={() => setIsGalleryOpen(true)} className="w-full">Select from My Collection</Button>
                         {currentUser.profilePictureUrl && (
                            <Button variant="secondary" onClick={() => updateUser(currentUser.id, { profilePictureUrl: null })} className="w-full !bg-red-900/50 hover:!bg-red-800/60 text-red-300">
                                Remove Picture
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
            {isGalleryOpen && (
                <ImageSelectionDialog
                    onSelect={handleProfilePictureSelect}
                    onClose={() => setIsGalleryOpen(false)}
                    imagePool={ownedItemsForProfilePic}
                />
            )}
            {imageToCrop && (
                <ImageCropperDialog
                    imageSrc={imageToCrop}
                    onComplete={handleCropComplete}
                />
            )}
        </div>
    );
};

export default AvatarPage;