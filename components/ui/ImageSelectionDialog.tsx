
import React, { useMemo, useState } from 'react';
import { useGameDataState } from '../../context/AppContext';
import Input from './Input';
import Button from './Button';

interface ImageSelectionDialogProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const ImageSelectionDialog: React.FC<ImageSelectionDialogProps> = ({ onSelect, onClose }) => {
  const { gameAssets } = useGameDataState();
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueImages = useMemo(() => {
    const seenUrls = new Set<string>();
    return gameAssets
      .filter(asset => {
        if (!asset.url || seenUrls.has(asset.url)) {
          return false;
        }
        seenUrls.add(asset.url);
        return true;
      })
      .map(asset => ({ url: asset.url, name: asset.name }));
  }, [gameAssets]);

  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) {
      return uniqueImages;
    }
    return uniqueImages.filter(image =>
      image.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueImages, searchTerm]);

  const handleImageSelect = (url: string) => {
    onSelect(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
          <h2 className="text-2xl font-medieval text-accent">Select Existing Image</h2>
          <Input
            placeholder="Search by asset name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </div>

        <div className="flex-grow p-6 overflow-y-auto scrollbar-hide">
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(image.url)}
                  className="bg-stone-900/50 rounded-lg p-2 group text-left space-y-2 hover:bg-stone-700/50 hover:border-emerald-500 border-2 border-transparent transition-all"
                >
                  <div className="aspect-square w-full bg-stone-700/50 rounded-md flex items-center justify-center overflow-hidden">
                    <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-stone-300 truncate font-semibold" title={image.name}>
                    {image.name}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-stone-400">No matching images found.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-700/60 text-right flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionDialog;
