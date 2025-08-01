import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../ui/Button';
import { useAppDispatch } from '../../context/AppContext';
import { LibraryPack } from '../../types';

interface PackFile {
    name: string;
    category: string;
    url: string;
    exists: boolean;
}

interface ImagePackImporterDialogProps {
    onClose: () => void;
    onImportSuccess: () => void;
}

const ImagePackImporterDialog: React.FC<ImagePackImporterDialogProps> = ({ onClose, onImportSuccess }) => {
    const [remotePacks, setRemotePacks] = useState<LibraryPack[]>([]);
    const [isLoadingPacks, setIsLoadingPacks] = useState(true);
    const [packError, setPackError] = useState('');

    const [packDetails, setPackDetails] = useState<PackFile[]>([]);
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);
    
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<PackFile[]>([]);
    
    const { addNotification } = useAppDispatch();

    useEffect(() => {
        const fetchPacks = async () => {
            setIsLoadingPacks(true);
            setPackError('');
            try {
                const repoUrl = 'https://api.github.com/repos/mckayc/task-donegeon/contents/image-packs';
                const response = await fetch(repoUrl);
                if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
                
                const files = await response.json();
                if (!Array.isArray(files)) throw new Error('Unexpected response from GitHub API.');

                const packPromises = files
                    .filter((file: any) => file.name.endsWith('.json'))
                    .map(async (file: any) => {
                        const packRes = await fetch(file.download_url);
                        if (!packRes.ok) throw new Error(`Failed to download ${file.name}`);
                        return packRes.json();
                    });
                
                const packs = await Promise.all(packPromises);
                setRemotePacks(packs);

            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setPackError(`Could not load asset packs: ${message}`);
            } finally {
                setIsLoadingPacks(false);
            }
        };
        fetchPacks();
    }, []);

    const handleSelectPack = useCallback(async (pack: LibraryPack) => {
        setSelectedPack(pack);
        setIsLoadingDetails(true);
        setError('');
        try {
            const localGalleryRes = await fetch('/api/media/local-gallery');
            if (!localGalleryRes.ok) throw new Error('Could not fetch local gallery to check for duplicates.');
            const localGallery: {url: string}[] = await localGalleryRes.json();
            const localUrls = new Set(localGallery.map(img => img.url));

            const details = (pack.assets.gameAssets || []).map(asset => {
                 const url = asset.url;
                 const name = url.substring(url.lastIndexOf('/') + 1);
                 const category = asset.avatarSlot ? `Avatar-${asset.avatarSlot}` : asset.category || 'Miscellaneous';
                 const localPath = `/uploads/${category}/${name}`;
                 
                 return {
                    name: name,
                    category: category,
                    url: url,
                    exists: localUrls.has(localPath),
                 }
            });
            setPackDetails(details);
            setSelectedFiles(details.filter(file => !file.exists));

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(message);
        } finally {
            setIsLoadingDetails(false);
        }
    }, []);
    
    const handleToggleFile = (file: PackFile) => {
        if (file.exists) return;
        setSelectedFiles(prev => 
            prev.some(f => f.url === file.url)
                ? prev.filter(f => f.url !== file.url)
                : [...prev, file]
        );
    };

    const handleSelectAllNew = () => {
        const newFiles = packDetails.filter(f => !f.exists);
        if (selectedFiles.length === newFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(newFiles);
        }
    };

    const handleImport = async () => {
        if (selectedFiles.length === 0) return;
        setIsImporting(true);
        setError('');
        try {
            const response = await fetch('/api/media/import-pack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: selectedFiles })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Import failed on the server.');
            }
            onImportSuccess();
            onClose();
        } catch (err) {
             const message = err instanceof Error ? err.message : 'An unknown error occurred.';
             setError(message);
             addNotification({ type: 'error', message });
        } finally {
            setIsImporting(false);
        }
    };
    
    const categorizedFiles = useMemo(() => {
        return packDetails.reduce((acc, file) => {
            const category = file.category || 'Miscellaneous';
            if (!acc[category]) acc[category] = [];
            acc[category].push(file);
            return acc;
        }, {} as Record<string, PackFile[]>);
    }, [packDetails]);

    const renderPackSelection = () => (
        <>
            <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                <h2 className="text-2xl font-medieval text-accent">Import Image Packs</h2>
                <p className="text-sm text-stone-400">Select an image pack to view its contents and import new files.</p>
            </div>
            <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
                {isLoadingPacks ? (
                     <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                ) : error ? (
                    <div className="text-red-400 text-center">{error}</div>
                ) : remotePacks.filter(p => p.type === 'Items').length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {remotePacks.filter(p => p.type === 'Items').map(pack => (
                            <button key={pack.id} onClick={() => handleSelectPack(pack)} className="p-2 rounded-lg text-left space-y-2 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all">
                                <div className="aspect-square w-full bg-stone-700/50 rounded-md flex items-center justify-center overflow-hidden">
                                    <span className="text-5xl">{pack.emoji}</span>
                                </div>
                                <p className="text-sm text-stone-300 font-semibold truncate">{pack.title}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-stone-400">No image packs found in the remote library.</div>
                )}
            </div>
             <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </>
    );

    const renderFileSelection = () => (
        <>
            <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => setSelectedPack(null)} className="mb-4">&larr; Back to Packs</Button>
                <h2 className="text-2xl font-medieval text-accent">Import from "{selectedPack?.title}"</h2>
                <p className="text-sm text-stone-400">Select the files you want to import. Duplicates are disabled.</p>
            </div>
            <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
                {isLoadingDetails ? (
                     <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                ) : packDetails.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button onClick={handleSelectAllNew} size="sm" variant="secondary">{selectedFiles.length === packDetails.filter(f => !f.exists).length ? 'Deselect All' : 'Select All New'}</Button>
                            <p className="text-sm text-stone-400">{selectedFiles.length} of {packDetails.filter(f => !f.exists).length} new files selected.</p>
                        </div>
                         {Object.entries(categorizedFiles).map(([category, files]) => (
                            <div key={category}>
                                <h4 className="font-bold text-lg text-stone-200 mb-2">{category}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {files.map(file => {
                                        const isSelected = selectedFiles.some(f => f.url === file.url);
                                        return (
                                        <label key={file.name} className={`relative p-2 rounded-lg text-left space-y-1 border-2 transition-all cursor-pointer ${
                                            file.exists ? 'border-red-700/60 bg-red-900/30 opacity-60' :
                                            isSelected ? 'border-emerald-500 bg-emerald-900/40' :
                                            'border-transparent bg-stone-900/50 hover:bg-stone-700/50'
                                        }`}>
                                            <input type="checkbox" checked={isSelected} onChange={() => handleToggleFile(file)} disabled={file.exists} className="absolute top-2 right-2 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 disabled:opacity-50" />
                                            <div className="aspect-square w-full bg-black/20 rounded-md flex items-center justify-center overflow-hidden">
                                                <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
                                            </div>
                                            <p className={`text-xs font-semibold truncate ${file.exists ? 'text-red-300' : 'text-green-300'}`} title={file.name}>{file.name}</p>
                                        </label>
                                        )
                                    })}
                                </div>
                            </div>
                         ))}
                    </div>
                ) : <p className="text-stone-400">No files found in this pack.</p>}
            </div>
            {error && !isImporting && <p className="text-red-400 text-center text-sm px-6 pb-2">{error}</p>}
            <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0">
                <Button variant="secondary" onClick={onClose} disabled={isImporting}>Cancel</Button>
                <Button onClick={handleImport} disabled={isImporting || selectedFiles.length === 0} className="ml-4">
                    {isImporting ? `Importing...` : `Import ${selectedFiles.length} File(s)`}
                </Button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {selectedPack ? renderFileSelection() : renderPackSelection()}
            </div>
        </div>
    );
};

export default ImagePackImporterDialog;