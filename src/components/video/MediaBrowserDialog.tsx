import React, { useState, useEffect, useMemo } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Folder, Video, ArrowUp } from 'lucide-react';

interface MediaBrowserDialogProps {
    onSelect: (path: string) => void;
    onClose: () => void;
}

const MediaBrowserDialog: React.FC<MediaBrowserDialogProps> = ({ onSelect, onClose }) => {
    const [currentPath, setCurrentPath] = useState('/');
    const [contents, setContents] = useState<{ directories: string[], files: string[] }>({ directories: [], files: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { addNotification } = useNotificationsDispatch();

    useEffect(() => {
        const fetchMedia = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/media/browse?path=${encodeURIComponent(currentPath)}`);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to browse media library on the server.');
                }
                const data = await response.json();
                setContents(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(message);
                addNotification({ type: 'error', message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMedia();
    }, [currentPath, addNotification]);

    const { filteredDirs, filteredFiles } = useMemo(() => {
        if (!debouncedSearchTerm) {
            return { filteredDirs: contents.directories, filteredFiles: contents.files };
        }
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return {
            filteredDirs: contents.directories.filter(dir => dir.toLowerCase().includes(lowerSearch)),
            filteredFiles: contents.files.filter(file => file.toLowerCase().includes(lowerSearch))
        };
    }, [contents, debouncedSearchTerm]);

    const navigateTo = (folder: string) => {
        const newPath = (currentPath + (currentPath.endsWith('/') ? '' : '/') + folder).replace(/\/+/g, '/');
        setCurrentPath(newPath);
    };

    const navigateUp = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(p => p);
        parts.pop();
        const newPath = '/' + parts.join('/');
        setCurrentPath(newPath);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-accent">Media Library</h2>
                    <div className="flex gap-4 mt-4">
                        <Input
                            placeholder="Search current folder..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="flex-grow"
                            autoFocus
                        />
                    </div>
                    <div className="mt-2 text-sm text-stone-400 font-mono bg-stone-900/50 p-2 rounded-md truncate">
                        Current Path: {`/media${currentPath}`}
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                    ) : error ? (
                        <p className="text-center text-red-400">{error}</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {currentPath !== '/' && (
                                <button onClick={navigateUp} className="p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <div className="aspect-video w-full bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                        <ArrowUp className="w-10 h-10 text-stone-400" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all">.. (Up a folder)</p>
                                </button>
                            )}
                            {filteredDirs.map((dir) => (
                                <button key={dir} onClick={() => navigateTo(dir)} className="p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <div className="aspect-video w-full bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                        <Folder className="w-12 h-12 text-amber-400" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all" title={dir}>{dir}</p>
                                </button>
                            ))}
                            {filteredFiles.map((file) => {
                                const fullPath = (`/media` + currentPath + (currentPath.endsWith('/') ? '' : '/') + file).replace(/\/+/g, '/');
                                return (
                                <button key={file} onClick={() => onSelect(fullPath)} className="p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <div className="aspect-video w-full bg-black rounded-md flex items-center justify-center overflow-hidden">
                                        <Video className="w-12 h-12 text-sky-400" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all" title={file}>{file}</p>
                                </button>
                                );
                            })}
                        </div>
                    )}
                     { !isLoading && !error && filteredDirs.length === 0 && filteredFiles.length === 0 && (
                        <p className="text-center text-stone-400">
                            {searchTerm ? 'No items match your search.' : 'This folder is empty.'}
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