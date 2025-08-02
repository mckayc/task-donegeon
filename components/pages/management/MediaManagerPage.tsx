import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import AiImagePromptHelper from '../../sharing/AiImagePromptHelper';
import UploadWithCategoryDialog from '../../admin/UploadWithCategoryDialog';
import ImagePackImporterDialog from '../../admin/ImagePackImporterDialog';

interface LocalGalleryImage {
    url: string;
    category: string;
    name: string;
}

const AssetManagerPage: React.FC = () => {
    const { addNotification, uploadFile } = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    
    const [assetToCreateData, setAssetToCreateData] = useState<{ url: string; name: string; category: string; } | null>(null);
    const [fileToCategorize, setFileToCategorize] = useState<File | null>(null);
    const [isImporterOpen, setIsImporterOpen] = useState(false);

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
    
    const galleryCategories = useMemo(() => Object.keys(categorizedGallery), [categorizedGallery]);


    const handleFileProcess = useCallback(async (file: File) => {
        setFileToCategorize(file);
    }, []);
    
    const handleUploadWithCategory = async (file: File, category: string) => {
        setIsUploading(true);
        try {
            const uploadedAsset = await uploadFile(file, category);
            if (uploadedAsset?.url) {
                addNotification({ type: 'success', message: 'Image uploaded successfully!' });
                fetchLocalGallery(); // Refresh gallery
            } else {
                throw new Error('Upload failed to return a URL.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
            setFileToCategorize(null);
        }
    };

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
            <Card>
                <CardHeader><CardTitle>Upload New Asset</CardTitle></CardHeader>
                <CardContent>
                    <div
                        onDrop={handleDrop}
                        onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                        className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                            isDragging ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                    >
                        <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isUploading} />
                        <p className="text-muted-foreground mb-4">Drag & drop files here, or click to select.</p>
                        <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}>
                            {isUploading ? 'Processing...' : 'Upload Image'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Import Image Packs from Library</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Quickly add curated sets of images to your library from the project's GitHub repository. This is great for getting started or adding new themes.
                    </p>
                    <Button onClick={() => setIsImporterOpen(true)}>
                        Import from Library
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>AI Image Generation Helper</CardTitle></CardHeader>
                <CardContent>
                    <AiImagePromptHelper />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Local Image Gallery</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Images from your <code>/uploads</code> folder are shown here. Use sub-folders for automatic categorization. Clicking an image will open the 'Create Asset' dialog.
                    </p>
                    {isGalleryLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading gallery...</div>
                    ) : Object.keys(categorizedGallery).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(categorizedGallery).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, images]) => (
                                <div key={category}>
                                    <h4 className="font-bold text-lg text-foreground mb-2">{category}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {images.map((image, index) => (
                                            <button key={index} onClick={() => handleCreateFromGallery(image)} className="bg-background/50 rounded-lg p-2 group relative text-left">
                                                <div className="aspect-square w-full bg-card rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                                    <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                                                </div>
                                                <p className="text-xs text-foreground truncate" title={image.name}>{image.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No images found in the gallery. Upload some!</p>
                    )}
                </CardContent>
            </Card>
            
            {fileToCategorize && (
                <UploadWithCategoryDialog
                    file={fileToCategorize}
                    onClose={() => setFileToCategorize(null)}
                    onUpload={handleUploadWithCategory}
                    existingCategories={galleryCategories}
                />
            )}

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