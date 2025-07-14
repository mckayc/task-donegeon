
import React, { useState, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';

const AssetManagerPage: React.FC = () => {
    const { gameAssets } = useAppState();
    const { deleteGameAsset, addNotification } = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [assetToCreateUrl, setAssetToCreateUrl] = useState<string | null>(null);
    const [deletingAsset, setDeletingAsset] = useState<GameAsset | null>(null);

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
            setAssetToCreateUrl(uploadedAsset.url);
            addNotification({type: 'success', message: 'Image uploaded! Now add its details.'});

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsUploading(false);
        }
    }, [addNotification]);

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
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addNotification({ type: 'success', message: 'URL copied to clipboard!'});
        }, () => {
            addNotification({ type: 'error', message: 'Failed to copy URL.'});
        });
    };

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
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                </div>
            </Card>

            <Card title="Upload Guide">
                 <ul className="text-sm text-stone-400 space-y-2 list-disc list-inside">
                    <li>
                        <strong>Step 1: Upload an Image.</strong> Drag a file or click the button above.
                    </li>
                    <li>
                        <strong>Step 2: Define Properties.</strong> A dialog will appear where you set the asset's name, category, and sale details.
                    </li>
                     <li>
                        <strong>Recommended Formats:</strong> Use vector formats like <strong className="text-stone-300">SVG</strong> for sharp, scalable icons. Use <strong className="text-stone-300">PNG</strong> with a transparent background for more complex images. A square aspect ratio is recommended for consistency.
                    </li>
                </ul>
            </Card>

            <div>
                <h2 className="text-2xl font-bold text-stone-100 mb-4">Asset Gallery</h2>
                {gameAssets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    <p className="text-stone-400 text-center py-8">No assets have been created yet.</p>
                )}
            </div>

            {(editingAsset || assetToCreateUrl) && (
                <EditGameAssetDialog
                    assetToEdit={editingAsset}
                    newAssetUrl={assetToCreateUrl}
                    onClose={() => {
                        setEditingAsset(null);
                        setAssetToCreateUrl(null);
                    }}
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
