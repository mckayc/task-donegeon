import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSystemDispatch, useSystemState } from '../../../context/SystemContext';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { EditGameAssetDialog } from '../../admin/EditGameAssetDialog';
import AiImagePromptHelper from '../../sharing/AiImagePromptHelper';
import UploadWithCategoryDialog from '../../admin/UploadWithCategoryDialog';
import ImagePackImporterDialog from '../../admin/ImagePackImporterDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';

interface LocalGalleryImage {
    url: string;
    category: string;
    name: string;
}

const AssetManagerPage: React.FC = () => {
    const { addNotification } = useNotificationsDispatch();
    const { settings, isAiConfigured } = useSystemState();
    const { uploadFile } = useSystemDispatch();
    
    const [assetToCreateData, setAssetToCreateData] = useState<{ url: string; name: string; category: string; } | null>(null);
    const [isImporterOpen, setIsImporterOpen] = useState(false);

    const [localGallery, setLocalGallery] = useState<LocalGalleryImage[]>([]);
    const [isGalleryLoading, setIsGalleryLoading] = useState(true);

    const fetchLocalGallery = useCallback(async () => {
        setIsGalleryLoading(true);
        try {
            const response = await fetch('/api/media/local-gallery');
            if (response.ok) {
                const data = await response.json();
                setLocalGallery(data);
            }
        } catch (error) {
            console.error("Failed to fetch local gallery", error);
        } finally {
            setIsGalleryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocalGallery();
    }, [fetchLocalGallery]);
    
    const categorizedGallery = useMemo(() => {
        return localGallery.reduce((acc, image) => {
            const category = image.category || 'Miscellaneous';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(image);
            return acc;
        }, {} as Record<string, LocalGalleryImage[]>);
    }, [localGallery]);

    const handleCreateFromGallery = (image: LocalGalleryImage) => {
        const assetName = image.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        setAssetToCreateData({
            url: image.url,
            name: assetName.charAt(0).toUpperCase() + assetName.slice(1),
            category: image.category,
        });
    };
    
    const handleCloseDialog = () => {
        setAssetToCreateData(null);
    }

    return (
        <div className="space-y-6">
            <Card title="Import Image Packs from Library">
                <p className="text-stone-400 text-sm mb-4">
                    Quickly add curated sets of images to your library from the project's GitHub repository. This is great for getting started or adding new themes.
                </p>
                <Button onClick={() => setIsImporterOpen(true)}>
                    Import from Library
                </Button>
            </Card>
            
            <Card title="AI Image Generation Helper">
                <AiImagePromptHelper />
            </Card>

            <Card title="Local Image Gallery">
                <p className="text-stone-400 text-sm mb-4">
                    Images from your <code>/uploads</code> folder are shown here. Use sub-folders for automatic categorization. Clicking an image will open the 'Create Asset' dialog.
                </p>
                {isGalleryLoading ? (
                    <div className="text-center py-4 text-stone-400">Loading gallery...</div>
                ) : Object.keys(categorizedGallery).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(categorizedGallery).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, images]) => (
                            <div key={category}>
                                <h4 className="font-bold text-lg text-stone-200 mb-2">{category}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {images.map((image, index) => (
                                        <button key={index} onClick={() => handleCreateFromGallery(image)} className="bg-stone-800/50 rounded-lg p-2 group relative text-left">
                                            <div className="aspect-square w-full bg-stone-700/50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                                <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-xs text-stone-300 truncate" title={image.name}>{image.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-4">No images found in the gallery. Upload some!</p>
                )}
            </Card>
            
            {assetToCreateData && (
                <EditGameAssetDialog
                    assetToEdit={null}
                    initialData={assetToCreateData}
                    onClose={handleCloseDialog}
                />
            )}

            {isImporterOpen && (
                <ImagePackImporterDialog
                    onClose={() => setIsImporterOpen(false)}
                    onImportSuccess={() => {
                        fetchLocalGallery();
                        addNotification({ type: 'success', message: 'Image packs imported! Gallery updated.' });
                    }}
                />
            )}
        </div>
    );
};

export default AssetManagerPage;
