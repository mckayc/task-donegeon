
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameDataState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import AiImagePromptHelper from '../../sharing/AiImagePromptHelper';

interface LocalGalleryImage {
    url: string;
    category: string;
    name: string;
}

const AssetManagerPage: React.FC = () => {
    const { gameAssets } = useGameDataState();
    const { addNotification, uploadFile, deleteGameAsset } = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [assetToCreateUrl, setAssetToCreateUrl] = useState<string | null>(null);
    const [assetToCreateName, setAssetToCreateName] = useState<string | null>(null);
    const [assetToCreateCategory, setAssetToCreateCategory] = useState<string | null>(null);
    const [deletingAsset, setDeletingAsset] = useState<GameAsset | null>(null);

    const [isUploading, setIsUploading] = useState(false);
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


    const handleFileProcess = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            const uploadedAsset = await uploadFile(file);
            if (uploadedAsset?.url) {
                setAssetToCreateUrl(uploadedAsset.url);
                setAssetToCreateName(file.name.replace(/\.[^/.]+$/, ""));
                setAssetToCreateCategory('Miscellaneous');
                addNotification({type: 'success', message: 'Image uploaded! Now add its details.'});
                fetchLocalGallery(); // Refresh gallery after upload
            } else {
                throw new Error('Upload failed to return a URL.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
        }
    }, [addNotification, uploadFile, fetchLocalGallery]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            Array.from(event.target.files).forEach(handleFileProcess);
        }
        event.target.value = ''; // Allow re-uploading the same file
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            Array.from(event.dataTransfer.files).forEach(handleFileProcess);
            event.dataTransfer.clearData();
        }
    }, [handleFileProcess]);

    const handleDragEvents = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') setIsDragging(true);
        else if (event.type === 'dragleave') setIsDragging(false);
    };

    const handleCreateFromGallery = (image: LocalGalleryImage) => {
        setAssetToCreateUrl(image.url);
        setAssetToCreateName(image.name);
        setAssetToCreateCategory(image.category);
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addNotification({ type: 'success', message: 'URL copied to clipboard!'});
        }, () => {
            addNotification({ type: 'error', message: 'Failed to copy URL.'});
        });
    };
    
    const handleCloseDialog = () => {
        setEditingAsset(null);
        setAssetToCreateUrl(null);
        setAssetToCreateName(null);
        setAssetToCreateCategory(null);
    }

    return (
        <div className="space-y-6">
            <Card title="Upload New Asset">
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                    className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                        isDragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-stone-600'
                    }`}
                >
                    <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isUploading} />
                    <p className="text-stone-400 mb-4">Drag & drop files here, or click to select.</p>
                    <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}>
                        {isUploading ? 'Processing...' : 'Upload Image'}
                    </Button>
                </div>
            </Card>
            
            <Card title="AI Image Generation Helper">
                <AiImagePromptHelper />
            </Card>

            <Card title="Local Image Gallery">
                <p className="text-stone-400 text-sm mb-4">
                    Images from your <code>/backend/uploads</code> folder are shown here. Name files as <code>Category-Name.png</code> (e.g. <code>Pet-BabyDragon.png</code>) for automatic categorization.
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


            <div>
                <h2 className="text-2xl font-bold text-stone-100 mb-4">Saved Asset Library</h2>
                {gameAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {gameAssets.map(asset => (
                            <div key={asset.id} className="bg-stone-800/50 rounded-lg p-3 group relative">
                                <div className="aspect-square w-full bg-stone-700/50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                </div>
                                <p className="text-xs text-stone-300 truncate" title={asset.name}>{asset.name}</p>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <Button variant="secondary" className="text-xs py-1 px-2 w-full" onClick={() => setEditingAsset(asset)}>Edit Details</Button>
                                    <Button variant="secondary" className="text-xs py-1 px-2 w-full !bg-blue-900/70 hover:!bg-blue-800/80 text-blue-200" onClick={() => copyToClipboard(asset.url)}>Copy URL</Button>
                                    <Button className="!bg-red-600 hover:!bg-red-500 text-xs py-1 px-2 w-full" onClick={() => setDeletingAsset(asset)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-8">No assets have been saved yet.</p>
                )}
            </div>

            {(editingAsset || assetToCreateUrl) && (
                <EditGameAssetDialog
                    assetToEdit={editingAsset}
                    newAssetUrl={assetToCreateUrl}
                    onClose={handleCloseDialog}
                />
            )}

            <ConfirmDialog
                isOpen={!!deletingAsset}
                onClose={() => setDeletingAsset(null)}
                onConfirm={() => {
                    if (deletingAsset) deleteGameAsset(deletingAsset.id);
                    setDeletingAsset(null);
                }}
                title="Delete Asset"
                message={`Are you sure you want to delete the asset "${deletingAsset?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default AssetManagerPage;
