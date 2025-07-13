
import React, { useState, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { MediaAsset } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';

const MediaManagerPage: React.FC = () => {
    const { mediaAssets } = useAppState();
    const { addMediaAsset, deleteMediaAsset, addNotification } = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingAsset, setDeletingAsset] = useState<MediaAsset | null>(null);

    const handleFileProcess = useCallback(async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Upload failed');
            }

            const uploadedAsset = await response.json();
            const newAsset: MediaAsset = {
                id: `media-${Date.now()}`,
                createdAt: new Date().toISOString(),
                name: uploadedAsset.name,
                type: uploadedAsset.type,
                size: uploadedAsset.size,
                url: uploadedAsset.url,
            };
            addMediaAsset(newAsset);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
        }
    }, [addMediaAsset, addNotification]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            Array.from(event.target.files).forEach(handleFileProcess);
        }
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
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addNotification({ type: 'success', message: 'URL copied to clipboard!'});
        }, () => {
            addNotification({ type: 'error', message: 'Failed to copy URL.'});
        });
    };

    return (
        <div className="space-y-6">
            <Card title="Upload New Media">
                <div
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents}
                    className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                        isDragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-stone-600'
                    }`}
                >
                    <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isUploading} />
                    <p className="text-stone-400 mb-4">Drag & drop files here, or</p>
                    <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Select Files'}
                    </Button>
                </div>
            </Card>

            <Card title="Upload Guide & Storage Info">
                <ul className="text-sm text-stone-400 space-y-3 list-disc list-inside">
                    <li>
                        <strong>Storage Method:</strong> Your application is configured to handle file storage in one of two ways based on its environment:
                        <ul className="list-disc list-inside pl-6 mt-2">
                            <li><strong>Local Docker:</strong> Files are saved to a local `/uploads` folder. This is great for development.</li>
                            <li><strong>Production (Vercel):</strong> Files are uploaded to a cloud provider (like Supabase Storage) for permanent, public access.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Recommended Formats:</strong> Use vector formats like <strong className="text-stone-300">SVG</strong> for sharp, scalable icons. Use <strong className="text-stone-300">PNG</strong> with a transparent background for more complex images.
                    </li>
                     <li>
                        <strong>Usage:</strong> Once uploaded, an asset's URL can be copied. Paste this URL into the "Image URL" field when creating or editing a "Digital Asset" to make it usable in avatars.
                    </li>
                </ul>
            </Card>

            <div>
                <h2 className="text-2xl font-bold text-stone-100 mb-4">Media Gallery</h2>
                {mediaAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {mediaAssets.map(asset => (
                            <div key={asset.id} className="bg-stone-800/50 rounded-lg p-3 group relative">
                                <div className="aspect-square w-full bg-stone-700/50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-contain" />
                                </div>
                                <p className="text-xs text-stone-300 truncate" title={asset.name}>{asset.name}</p>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <Button variant="secondary" className="text-xs py-1 px-2 w-full" onClick={() => copyToClipboard(asset.url)}>Copy URL</Button>
                                    <Button className="!bg-red-600 hover:!bg-red-500 text-xs py-1 px-2 w-full" onClick={() => setDeletingAsset(asset)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-8">No media has been uploaded yet.</p>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deletingAsset}
                onClose={() => setDeletingAsset(null)}
                onConfirm={() => {
                    if (deletingAsset) deleteMediaAsset(deletingAsset.id);
                    setDeletingAsset(null);
                }}
                title="Delete Asset"
                message={`Are you sure you want to delete the asset "${deletingAsset?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default MediaManagerPage;