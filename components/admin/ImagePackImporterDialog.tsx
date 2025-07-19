import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { useAppDispatch } from '../../context/AppContext';

interface ImagePack {
    name: string;
    sampleImageUrl: string;
}

interface ImagePackImporterDialogProps {
    onClose: () => void;
    onImportSuccess: () => void;
}

const ImagePackImporterDialog: React.FC<ImagePackImporterDialogProps> = ({ onClose, onImportSuccess }) => {
    const [packs, setPacks] = useState<ImagePack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState('');
    const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
    const { addNotification } = useAppDispatch();

    useEffect(() => {
        const fetchPacks = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch('/api/image-packs/list');
                if (!response.ok) throw new Error('Failed to fetch image packs from the server.');
                const data = await response.json();
                setPacks(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(message);
                addNotification({ type: 'error', message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacks();
    }, [addNotification]);
    
    const handleToggleSelection = (packName: string) => {
        setSelectedPacks(prev => 
            prev.includes(packName)
                ? prev.filter(name => name !== packName)
                : [...prev, packName]
        );
    };

    const handleImport = async () => {
        if (selectedPacks.length === 0) {
            addNotification({type: 'info', message: 'Please select at least one pack to import.'});
            return;
        }
        setIsImporting(true);
        setError('');
        try {
            const response = await fetch('/api/image-packs/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packs: selectedPacks })
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

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-accent">Import Image Packs</h2>
                    <p className="text-sm text-stone-400">Select the image packs you'd like to download and add to your local library.</p>
                </div>

                <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 text-center">{error}</div>
                    ) : packs.length > 0 ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {packs.map(pack => {
                                const isSelected = selectedPacks.includes(pack.name);
                                return (
                                <button
                                    key={pack.name}
                                    onClick={() => handleToggleSelection(pack.name)}
                                    className={`relative p-2 rounded-lg text-left space-y-2 border-2 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-900/40' : 'border-transparent bg-stone-900/50 hover:bg-stone-700/50'}`}
                                >
                                    {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">&#x2713;</div>}
                                    <div className="aspect-square w-full bg-stone-700/50 rounded-md flex items-center justify-center overflow-hidden">
                                        <img src={pack.sampleImageUrl} alt={`Sample for ${pack.name}`} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-sm text-stone-300 font-semibold truncate">{pack.name}</p>
                                </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-stone-400">No image packs found in the repository.</div>
                    )}
                </div>
                
                {error && !isImporting && <p className="text-red-400 text-center text-sm px-6 pb-2">{error}</p>}
                
                <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0 flex justify-end items-center gap-4">
                    {selectedPacks.length > 0 && <span className="text-sm text-stone-300">{selectedPacks.length} pack(s) selected</span>}
                    <Button variant="secondary" onClick={onClose} disabled={isImporting}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isImporting || selectedPacks.length === 0}>
                        {isImporting ? `Importing...` : `Import ${selectedPacks.length} Pack(s)`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ImagePackImporterDialog;
