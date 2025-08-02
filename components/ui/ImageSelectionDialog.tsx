import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { Input } from './input';
import { Button } from './button';

interface ImageSelectionDialogProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  imagePool?: LocalGalleryImage[];
}

interface LocalGalleryImage {
    url: string;
    category: string;
    name: string;
}

const ImageSelectionDialog: React.FC<ImageSelectionDialogProps> = ({ onSelect, onClose, imagePool }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localGallery, setLocalGallery] = useState<LocalGalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocalGallery = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/media/local-gallery');
            if (response.ok) {
                const data = await response.json();
                setLocalGallery(data);
            }
        } catch (error) {
            console.error("Failed to fetch local gallery for selection", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (imagePool) {
            setLocalGallery(imagePool);
            setIsLoading(false);
        } else {
            fetchLocalGallery();
        }
    }, [imagePool, fetchLocalGallery]);

  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) {
      return localGallery;
    }
    return localGallery.filter(image =>
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localGallery, searchTerm]);

  const handleImageSelect = (url: string) => {
    onSelect(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-card border rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-display text-accent">Select Existing Image</h2>
          <Input
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </div>

        <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
          {isLoading ? (
             <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(image.url)}
                  className="bg-background/50 rounded-lg p-2 group text-left space-y-2 hover:bg-accent/10 hover:border-primary border-2 border-transparent transition-all"
                >
                  <div className="aspect-square w-full bg-card rounded-md flex items-center justify-center overflow-hidden">
                    <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-foreground truncate font-semibold" title={image.name}>
                    {image.name}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No matching images found.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t text-right flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionDialog;