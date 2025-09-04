import React, { useState, useEffect, useMemo } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';

interface MediaBrowserDialogProps {
    onSelect: (path: string) => void;
    onClose: () => void;
}

const MediaBrowserDialog: React.FC<MediaBrowserDialogProps> = ({ onSelect, onClose }) => {
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { addNotification } = useNotificationsDispatch();

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const response = await fetch('/api/media/browse');
                if (!response.ok) {
                    throw new Error('Failed to browse media library on the server.');
                }
                const data: string[] = await response.json();
                setFiles(data.sort());
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(message);
                addNotification({ type: 'error', message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMedia();
    }, [addNotification]);

    const filteredFiles = useMemo(() => {
        if (!debouncedSearchTerm) return files;
        return files.filter(file => file.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    }, [files, debouncedSearchTerm]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-accent">Media Library</h2>
                    <Input
                        placeholder="Search videos..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="mt-4"
                        autoFocus
                    />
                </div>
                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                    ) : error ? (
                        <p className="text-center text-red-400">{error}</p>
                    ) : filteredFiles.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredFiles.map((file) => (
                                <button key={file} onClick={() => onSelect(file)} className="p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <div className="aspect-video w-full bg-black rounded-md flex items-center justify-center overflow-hidden">
                                        <video src={file} className="w-full h-full object-cover" preload="metadata" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all" title={file}>{file.split('/').pop()}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-stone-400">
                            {searchTerm ? 'No videos match your search.' : 'No video files found in the media directory.'}
                        </p>
                    )}
                </div>
                <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export default MediaBrowserDialog;
