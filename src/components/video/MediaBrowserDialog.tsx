import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useDebounce } from '../../hooks/useDebounce';
import { Folder, Video, ArrowUp, UploadCloud, FolderPlus, BookOpen, TrashIcon as Trash, FileText } from 'lucide-react';
import ConfirmDialog from '../user-interface/ConfirmDialog';

interface MediaBrowserDialogProps {
    onSelect: (path: string) => void;
    onClose: () => void;
}

const MediaBrowserDialog: React.FC<MediaBrowserDialogProps> = ({ onSelect, onClose }) => {
    const [currentPath, setCurrentPath] = useState(() => localStorage.getItem('mediaBrowserLastPath') || '/');
    const [contents, setContents] = useState<{ directories: string[], files: string[] }>({ directories: [], files: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { addNotification } = useNotificationsDispatch();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [dragOverDir, setDragOverDir] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ name: string; type: 'folder' | 'file' } | null>(null);

    useEffect(() => {
        localStorage.setItem('mediaBrowserLastPath', currentPath);
    }, [currentPath]);

    const fetchMedia = useCallback(async () => {
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
    }, [currentPath, addNotification]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('mediaFile', file);

        try {
            const response = await fetch(`/api/media/upload/library?path=${encodeURIComponent(currentPath)}`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Upload failed.');
            }
            addNotification({ type: 'success', message: `Successfully uploaded "${file.name}".` });
            fetchMedia(); // Refresh the directory
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred during upload.';
            addNotification({ type: 'error', message });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            addNotification({ type: 'error', message: 'Folder name cannot be empty.' });
            return;
        }

        setIsUploading(true);
        try {
            const response = await fetch('/api/media/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: currentPath, folderName: newFolderName.trim() }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create folder.');
            }
            addNotification({ type: 'success', message: `Folder "${newFolderName.trim()}" created.` });
            await fetchMedia();
            setIsCreatingFolder(false);
            setNewFolderName('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification({ type: 'error', message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteRequest = (name: string, type: 'folder' | 'file') => {
        setItemToDelete({ name, type });
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch('/api/media/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourcePath: currentPath,
                    sourceName: itemToDelete.name,
                    sourceType: itemToDelete.type,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to delete item.');
            }

            addNotification({ type: 'success', message: `Successfully deleted "${itemToDelete.name}".` });
            fetchMedia(); // Refresh the view
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification({ type: 'error', message });
        } finally {
            setItemToDelete(null);
        }
    };

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

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, name: string, type: 'folder' | 'file') => {
        e.dataTransfer.setData('application/json', JSON.stringify({ name, type, sourcePath: currentPath }));
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDragEnter = (e: React.DragEvent, dirName: string) => {
        e.preventDefault();
        setDragOverDir(dirName);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverDir(null);
    };

    const handleDrop = async (e: React.DragEvent, destinationDirName: string) => {
        e.preventDefault();
        setDragOverDir(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { name: sourceName, type: sourceType, sourcePath } = data;

            let destinationPath;
            if (destinationDirName === '..') {
                if (currentPath === '/') return;
                const parts = currentPath.split('/').filter(p => p);
                parts.pop();
                destinationPath = '/' + parts.join('/');
            } else {
                destinationPath = (currentPath + (currentPath.endsWith('/') ? '' : '/') + destinationDirName).replace(/\/+/g, '/');
            }

            if (sourcePath === destinationPath) return;

            const response = await fetch('/api/media/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceType, sourceName, sourcePath, destinationPath })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Move operation failed.');
            }
            addNotification({ type: 'success', message: `Moved "${sourceName}" successfully.` });
            fetchMedia();

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification({ type: 'error', message });
        }
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
                         <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="video/*,.pdf,.epub"
                            disabled={isUploading}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            <UploadCloud className="w-5 h-5 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                        <Button variant="secondary" onClick={() => setIsCreatingFolder(true)} disabled={isUploading || isCreatingFolder}>
                            <FolderPlus className="w-5 h-5 mr-2" />
                            New Folder
                        </Button>
                    </div>
                     {isCreatingFolder && (
                        <div className="mt-2 flex gap-2 p-2 bg-stone-900/50 rounded-md">
                            <Input
                                placeholder="New folder name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
                                className="flex-grow !h-9"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleCreateFolder} disabled={isUploading}>Create</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} disabled={isUploading}>Cancel</Button>
                        </div>
                    )}
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
                                <button 
                                    onClick={navigateUp} 
                                    onDragOver={handleDragOver}
                                    onDragEnter={(e) => handleDragEnter(e, '..')}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, '..')}
                                    className={`relative group p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${dragOverDir === '..' ? 'border-emerald-500' : 'border-transparent'}`}
                                >
                                    <div className="aspect-video w-full bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                        <ArrowUp className="w-10 h-10 text-stone-400" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all">.. (Up a folder)</p>
                                </button>
                            )}
                            {filteredDirs.map((dir) => (
                                <button 
                                    key={dir} 
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, dir, 'folder')}
                                    onClick={() => navigateTo(dir)} 
                                    onDragOver={handleDragOver}
                                    onDragEnter={(e) => handleDragEnter(e, dir)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, dir)}
                                    className={`relative group p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${dragOverDir === dir ? 'border-emerald-500' : 'border-transparent'}`}
                                >
                                     <div className="absolute top-1 right-1 z-10">
                                        <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(dir, 'folder'); }}>
                                            <Trash className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="aspect-video w-full bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                        <Folder className="w-12 h-12 text-amber-400" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold break-all" title={dir}>{dir}</p>
                                </button>
                            ))}
                            {filteredFiles.map((file) => {
                                const fullPath = (`/media` + currentPath + (currentPath.endsWith('/') ? '' : '/') + file).replace(/\/+/g, '/');
                                const ext = file.split('.').pop()?.toLowerCase() || '';
                                const isEpub = ext === 'epub';
                                const isPdf = ext === 'pdf';
                                const Icon = isEpub ? BookOpen : isPdf ? FileText : Video;
                                const iconColor = isEpub ? 'text-purple-400' : isPdf ? 'text-red-400' : 'text-sky-400';
                                return (
                                <button 
                                    key={file} 
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, file, 'file')}
                                    onClick={() => onSelect(fullPath)} 
                                    className="relative group p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <div className="absolute top-1 right-1 z-10">
                                        <Button variant="destructive" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(file, 'file'); }}>
                                            <Trash className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="aspect-video w-full bg-black rounded-md flex items-center justify-center overflow-hidden">
                                        <Icon className={`w-12 h-12 ${iconColor}`} />
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

            <ConfirmDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${itemToDelete?.type}`}
                message={`Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default MediaBrowserDialog;