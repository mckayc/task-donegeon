import React, { useState } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { PlusIcon, TrashIcon } from '../user-interface/Icons';
import { ImageSlide } from './types';

interface EditSlideshowDialogProps {
  questTitle: string;
  initialImages: ImageSlide[];
  onSave: (images: ImageSlide[]) => void;
  onClose: () => void;
}

const EditSlideshowDialog: React.FC<EditSlideshowDialogProps> = ({ questTitle, initialImages, onSave, onClose }) => {
  const [images, setImages] = useState<ImageSlide[]>(initialImages);

  const handleAddImage = () => {
    setImages([...images, { url: '', caption: '' }]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, field: keyof ImageSlide, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
          <h2 className="text-3xl font-medieval text-accent">Edit Image Slideshow</h2>
          <p className="text-stone-300">For: <span className="font-bold">{questTitle}</span></p>
        </div>
        <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          {images.map((image, index) => (
            <div key={index} className="p-4 bg-stone-900/50 rounded-lg border border-stone-700/60 flex items-end gap-4">
              <img src={image.url || 'https://placehold.co/100x100/1c1917/a8a29e?text=?'} alt="Preview" className="w-24 h-24 object-contain rounded-md bg-black/20 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <Input label={`Image ${index + 1} URL`} value={image.url} onChange={(e) => handleImageChange(index, 'url', e.target.value)} />
                <Input label="Caption" value={image.caption} onChange={(e) => handleImageChange(index, 'caption', e.target.value)} />
              </div>
              <Button variant="destructive" size="icon" onClick={() => handleRemoveImage(index)} className="h-10 w-10 flex-shrink-0">
                <TrashIcon className="w-5 h-5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={handleAddImage} className="w-full justify-center">
            <PlusIcon className="w-5 h-5 mr-2" /> Add Image
          </Button>
        </div>
        <div className="p-6 border-t border-stone-700/60 mt-auto flex justify-end space-x-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave(images)}>Save Slideshow</Button>
        </div>
      </div>
    </div>
  );
};

export default EditSlideshowDialog;
