import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import Input from './Input';
import Button from './Button';

interface GalleryImage {
    url: string;
    category: string;
    name: string;
}

interface ImageSelectionDialogProps {
    onSelect: (url: string) => void;
    onClose: () => void;
    imagePool?: GalleryImage[]; // Optional pre-supplied pool of images
}

const ImageSelectionDialog: React.FC<ImageSelectionDialogProps> = ({ onSelect, onClose, imagePool }) => {
    const [gallery, setGallery] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { addNotification } = useNotificationsDispatch();

    const fetchGallery = useCallback(async () => {
        if (imagePool) {
            setGallery(imagePool);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('/api/media/local-gallery');
            if (!response.ok) throw new Error('Failed to fetch image gallery.');
            const data = await response.json();
            setGallery(data);
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error fetching gallery.' });
        } finally {
            setIsLoading(false);
        }
    }, [imagePool, addNotification]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    const categories = useMemo(() => {
        const cats = new Set(gallery.map(img => img.category));
        return ['All', ...Array.from(cats).sort()];
    }, [gallery]);

    const filteredImages = useMemo(() => {
        return gallery.filter(image => {
            const categoryMatch = selectedCategory === 'All' || image.category === selectedCategory;
            const searchMatch = image.name.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [gallery, selectedCategory, searchTerm]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-accent">Select an Image</h2>
                    <div className="flex gap-4 mt-4">
                        <Input as="select" value={selectedCategory} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)} className="w-48">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Input>
                        <Input placeholder="Search images..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="flex-grow" />
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div></div>
                    ) : filteredImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {filteredImages.map((image, index) => (
                                <button key={index} onClick={() => onSelect(image.url)} className="p-2 rounded-lg text-left space-y-1 bg-stone-900/50 hover:bg-stone-700/50 border-2 border-transparent hover:border-emerald-500 transition-all">
                                    <div className="aspect-square w-full bg-stone-700/50 rounded-md flex items-center justify-center overflow-hidden">
                                        <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-xs text-stone-300 font-semibold truncate" title={image.name}>{image.name}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-stone-400">No images found.</p>
                    )}
                </div>
                <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export default ImageSelectionDialog;
