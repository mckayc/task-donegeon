



import React, { useState, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import Input from '../../ui/Input';
import { SparklesIcon } from '../../ui/Icons';
import { useSettings } from '../../../context/SettingsContext';

interface GeneratedImage {
    name: string;
    base64: string;
    url: string;
}

const AssetManagerPage: React.FC = () => {
    const { gameAssets } = useAppState();
    const { settings, isAiAvailable } = useSettings();
    const { deleteGameAsset, addNotification, uploadFile } = useAppDispatch();
    const [isDragging, setIsDragging] = useState(false);
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [assetToCreateUrl, setAssetToCreateUrl] = useState<string | null>(null);
    const [assetToCreateName, setAssetToCreateName] = useState<string | null>(null);
    const [deletingAsset, setDeletingAsset] = useState<GameAsset | null>(null);

    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [error, setError] = useState('');


    const handleFileProcess = useCallback(async (file: File) => {
        setIsGenerating(true); // Reuse loading state
        setError('');
        try {
            const uploadedAsset = await uploadFile(file);
            if (uploadedAsset?.url) {
                setAssetToCreateUrl(uploadedAsset.url);
                setAssetToCreateName(generationPrompt || file.name.replace(/\.[^/.]+$/, ""));
                addNotification({type: 'success', message: 'Image uploaded! Now add its details.'});
            } else {
                throw new Error('Upload failed to return a URL.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Upload failed: ${message}` });
        } finally {
            setIsGenerating(false);
        }
    }, [addNotification, uploadFile, generationPrompt]);

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

    const handleGenerate = async () => {
        if (!generationPrompt.trim()) return;
        setIsGenerating(true);
        setError('');
        setGeneratedImages([]);
        
        try {
            const imageStyleContext = localStorage.getItem('aiImageStyleContext') || 'Pixel art game icon, square, simple colorful background.';
            const fullPrompt = `${imageStyleContext}. Item: ${generationPrompt}`;
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'imagen-3.0-generate-002',
                    prompt: fullPrompt,
                    config: { numberOfImages: 4, outputMimeType: 'image/png', aspectRatio: '1:1' }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate images.');
            }

            const result = await response.json();
            const images = result.generatedImages.map((img: any, i: number) => ({
                name: `${generationPrompt} ${i + 1}`,
                base64: img.image.imageBytes,
                url: `data:image/png;base64,${img.image.imageBytes}`
            }));
            setGeneratedImages(images);

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Image generation failed: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateFromGenerated = (image: GeneratedImage) => {
        const byteCharacters = atob(image.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], `${image.name.replace(/ /g, '_')}.png`, { type: 'image/png' });
        
        // Use the existing upload and dialog flow
        handleFileProcess(file);
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
                    <input id="file-upload" type="file" multiple onChange={handleFileSelect} className="hidden" disabled={isGenerating} />
                    <p className="text-stone-400 mb-4">Drag & drop files here, or click to select.</p>
                    <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isGenerating}>
                        {isGenerating ? 'Processing...' : 'Upload Image'}
                    </Button>
                </div>
            </Card>

            {isAiAvailable && (
                <Card title="Generate Assets with AI">
                    <p className="text-stone-400 text-sm mb-4">Enter a prompt to generate a set of images, then click "Create Asset" on your favorite to save it.</p>
                    <div className="flex items-end gap-2">
                        <Input
                            label="Prompt"
                            placeholder="e.g., 'a glowing magic sword', 'a cute baby dragon'"
                            value={generationPrompt}
                            onChange={(e) => setGenerationPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                            className="flex-grow"
                            disabled={isGenerating}
                        />
                        <Button onClick={handleGenerate} disabled={isGenerating || !generationPrompt.trim()}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                     {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                </Card>
            )}

            {isGenerating && (<div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div><p className="mt-4 text-stone-300">The AI is conjuring your assets...</p></div>)}

            {generatedImages.length > 0 && (
                <Card title="Generated Images">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {generatedImages.map((image, index) => (
                             <div key={index} className="bg-stone-800/50 rounded-lg p-3 group relative">
                                <div className="aspect-square w-full bg-stone-700/50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                    <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                                </div>
                                <Button className="w-full text-xs py-1 px-2" onClick={() => handleCreateFromGenerated(image)}>Create Asset</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

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
