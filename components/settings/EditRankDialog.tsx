import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Rank } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';

interface EditRankDialogProps {
  rank: Rank | null;
  onClose: () => void;
}

const EditRankDialog: React.FC<EditRankDialogProps> = ({ rank, onClose }) => {
  const { ranks } = useAppState();
  const { setRanks } = useAppDispatch();
  const [formData, setFormData] = useState({ 
      name: '', 
      xpThreshold: 0,
      iconType: 'emoji' as 'emoji' | 'image',
      icon: '🔰',
      imageUrl: '',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);


  useEffect(() => {
    if (rank) {
      setFormData({ 
          name: rank.name, 
          xpThreshold: rank.xpThreshold,
          iconType: rank.iconType || 'emoji',
          icon: rank.icon || '🔰',
          imageUrl: rank.imageUrl || '',
      });
    }
  }, [rank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rank) {
      const updatedRanks = ranks.map(r => r.id === rank.id ? { ...r, ...formData } : r);
      setRanks(updatedRanks);
    } else {
      const newRank: Rank = { id: `rank-${Date.now()}`, ...formData };
      setRanks([...ranks, newRank]);
    }
    onClose();
  };

  const dialogTitle = rank ? 'Edit Rank' : 'Create New Rank';

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Rank Name" 
            value={formData.name} 
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
            required 
          />
           <Input 
            label="XP Threshold" 
            type="number"
            min="0"
            value={formData.xpThreshold} 
            onChange={(e) => setFormData(p => ({ ...p, xpThreshold: parseInt(e.target.value) || 0 }))} 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Icon Type</label>
            <div className="flex gap-4 p-2 bg-stone-700/50 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500"/>
                    <span>Emoji</span>
                </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" />
                    <span>Image</span>
                </label>
            </div>
          </div>
          {formData.iconType === 'emoji' ? (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                  className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2"
                >
                  <span className="text-2xl">{formData.icon}</span>
                  <span className="text-stone-300">Click to change</span>
                </button>
                {isEmojiPickerOpen && (
                  <EmojiPicker
                    onSelect={(emoji) => {
                        setFormData(p => ({ ...p, icon: emoji }));
                        setIsEmojiPickerOpen(false);
                    }}
                    onClose={() => setIsEmojiPickerOpen(false)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Image Icon</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <DynamicIcon 
                    iconType={formData.iconType} 
                    icon={formData.icon} 
                    imageUrl={formData.imageUrl}
                    className="w-full h-full text-4xl"
                    altText="Selected icon"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => setIsGalleryOpen(true)}>Select Image</Button>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{rank ? 'Save Changes' : 'Create Rank'}</Button>
          </div>
        </form>
      </div>
    </div>
    {isGalleryOpen && (
      <ImageSelectionDialog 
        onSelect={(url) => {
          setFormData(p => ({...p, imageUrl: url}));
          setIsGalleryOpen(false);
        }}
        onClose={() => setIsGalleryOpen(false)}
      />
    )}
    </>
  );
};

export default EditRankDialog;