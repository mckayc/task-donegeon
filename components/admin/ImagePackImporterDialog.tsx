import React, { useState, useEffect, useMemo } from 'react';
import Button from '../user-interface/Button';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface AvailablePack {
    name: string;
    sampleImageUrl: string;
}

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
    const [availablePacks, setAvailablePacks] = useState<AvailablePack[]>([]);
    const [packDetails, setPackDetails] = useState<PackFile[]>([]);
    const [selectedPackName, setSelectedPackName] = useState<string | null>(null);
    
    const [isLoadingPacks, setIsLoadingPacks] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [selectedFileUrls, setSelectedFileUrls] = useState<string[]>([]);
    
    const { addNotification } = useNotificationsDispatch();

    useEffect(() => {
        const fetchPacks = async () => {
            setIsLoadingPacks(true);
            setError('');
            try {
                const response = await fetch('/api/image-packs');
                if (!response.ok) throw new Error('Failed to fetch image packs from the server.');
                const data = await response.json();
                setAvailablePacks(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(message);
            } finally {
                setIsLoadingPacks(false);
            }
        };
        fetchPacks();
    }, []);

    useEffect(() => {
        if (!selectedPackName) return;

        const fetchPackDetails = async () => {
            setIsLoadingDetails(true);
            setError('');
            try {
                const response = await fetch(`/api/image-packs/${encodeURIComponent(selectedPackName)}`);
                if (!response.ok) throw new Error(`Failed to fetch details for pack: ${selectedPackName}`);
                const data: PackFile[] = await response.json();
                setPackDetails(data);
                setSelectedFileUrls(data.filter(file => !file.exists).map(f => f.url));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(message);
            } finally {
                setIsLoadingDetails(false);
            }
        };
        fetchPackDetails();
    }, [selectedPackName]);
    
    const allFileUrls = useMemo(() => packDetails.map(f => f.url), [packDetails]);
    const handleCheckboxClick = useShiftSelect(allFileUrls, selectedFileUrls, setSelectedFileUrls);

    const handleSelectAllNew = () => {
        const newFiles = packDetails.filter(f => !f.exists);
        if (selectedFileUrls.length === newFiles.length) {
            setSelectedFileUrls([]);
        } else {
            setSelectedFileUrls(newFiles.map(f => f.url));
        }
    };

    const handleImport = async () => {
        const selectedFiles = packDetails.filter(f => selectedFileUrls.includes(f.url));
        if (selectedFiles.length === 0) return;
        setIsImporting(true);
        setError('');
        try {
            const response = await fetch('/api/image-packs/import', {
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
    
    const newFilesCount = useMemo(() => packDetails.filter(f => !f.exists).length, [packDetails]);

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
                ) : availablePacks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {availablePacks.map(pack => (
                            <button key={pack.name} onClick={() => setSelectedPackName(pack.name)} className="p-2 rounded-lg text-left space-y-2 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all">
                                <div className="aspect-square w-full bg-stone-700/50 rounded-md flex items-center justify-center overflow-hidden">
                                    <img src={pack.sampleImageUrl} alt={`Sample for ${pack.name}`} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-sm text-stone-300 font-semibold truncate">{pack.name}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-stone-400">No image packs found in the repository.</div>
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
                <Button variant="secondary" size="sm" onClick={() => setSelectedPackName(null)} className="mb-4">&larr; Back to Packs</Button>
                <h2 className="text-2xl font-medieval text-accent">Import from "{selectedPackName}"</h2>
                <p className="text-sm text-stone-400">Select the files you want to import. Duplicates are disabled.</p>
            </div>
            <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
                {isLoadingDetails ? (
                     <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                ) : packDetails.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button onClick={handleSelectAllNew} size="sm" variant="secondary">{selectedFileUrls.length === newFilesCount ? 'Deselect All' : 'Select All New'}</Button>
                            <p className="text-sm text-stone-400">{selectedFileUrls.length} of {newFilesCount} new files selected.</p>
                        </div>
                         {Object.entries(categorizedFiles).map(([category, files]) => (
                            <div key={category}>
                                <h4 className="font-bold text-lg text-stone-200 mb-2">{category}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {files.map(file => {
                                        const isSelected = selectedFileUrls.includes(file.url);
                                        return (
                                        <label key={file.name} className={`relative p-2 rounded-lg text-left space-y-1 border-2 transition-all cursor-pointer ${
                                            file.exists ? 'border-red-700/60 bg-red-900/30 opacity-60' :
                                            isSelected ? 'border-emerald-500 bg-emerald-900/40' :
                                            'border-transparent bg-stone-900/50 hover:bg-stone-700/50'
                                        }`}>
                                            <input type="checkbox" checked={isSelected} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxClick(e, file.url)} disabled={file.exists} className="absolute top-2 right-2 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 disabled:opacity-50" />
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
                <Button onClick={handleImport} disabled={isImporting || selectedFileUrls.length === 0} className="ml-4">
                    {isImporting ? `Importing...` : `Import ${selectedFileUrls.length} File(s)`}
                </Button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                {selectedPackName ? renderFileSelection() : renderPackSelection()}
            </div>
        </div>
    );
};

export default ImagePackImporterDialog;