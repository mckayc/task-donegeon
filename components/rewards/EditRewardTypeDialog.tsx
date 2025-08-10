import React, { useState, useEffect } from 'react';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useEconomyDispatch } from '../../context/EconomyContext';
import EmojiPicker from '../user-interface/EmojiPicker';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import DynamicIcon from '../user-interface/DynamicIcon';

interface EditRewardTypeDialogProps {
  rewardType: RewardTypeDefinition | null;
  onClose: () => void;
}

const EditRewardTypeDialog: React.FC<EditRewardTypeDialogProps> = ({ rewardType, onClose }) => {
  const { addRewardType, updateRewardType } = useEconomyDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: RewardCategory.Currency,
    iconType: 'emoji' as 'emoji' | 'image',
    icon: '💰',
    imageUrl: '',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (rewardType) {
      setFormData({
        name: rewardType.name,
        description: rewardType.description,
        category: rewardType.category,
        iconType: rewardType.iconType || 'emoji',
        icon: rewardType.icon || '💰',
        imageUrl: rewardType.imageUrl || '',
      });
    }
  }, [rewardType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      iconType: formData.iconType,
      icon: formData.icon,
      imageUrl: formData.imageUrl,
    };

    if (rewardType) {
      updateRewardType({ ...rewardType, ...finalData });
    } else {
      addRewardType(finalData);
    }
    onClose();
  };

  const isCore = rewardType?.isCore || false;
  const dialogTitle = rewardType ? `Edit ${isCore ? '' : 'Custom '}Reward` : 'Create New Reward';

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Name" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
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
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon (Emoji)</label>
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
                    onSelect={(emoji: string) => {
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
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
              placeholder="What is this reward for?"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-stone-300 mb-1">Category</label>
            <select 
              id="category" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              disabled={isCore}
              className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-50"
            >
              <option value={RewardCategory.Currency}>Currency</option>
              <option value={RewardCategory.XP}>Experience (XP)</option>
            </select>
            {isCore && <p className="text-xs text-stone-400 mt-1">Core reward types cannot change their category.</p>}
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{rewardType ? 'Save Changes' : 'Create Reward'}</Button>
          </div>
        </form>
      </div>
    </div>
    {isGalleryOpen && (
      <ImageSelectionDialog 
        onSelect={(url: string) => {
          setFormData(p => ({...p, imageUrl: url}));
          setIsGalleryOpen(false);
        }}
        onClose={() => setIsGalleryOpen(false)}
      />
    )}
    </>
  );
};

export default EditRewardTypeDialog;