import React, { useState, useEffect } from 'react';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppDispatch } from '../../context/AppContext';
import EmojiPicker from '../ui/EmojiPicker';

interface EditRewardTypeDialogProps {
  rewardType: RewardTypeDefinition | null;
  onClose: () => void;
}

const EditRewardTypeDialog: React.FC<EditRewardTypeDialogProps> = ({ rewardType, onClose }) => {
  const { addRewardType, updateRewardType } = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: RewardCategory.Currency,
    icon: '💰',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (rewardType) {
      setFormData({
        name: rewardType.name,
        description: rewardType.description,
        category: rewardType.category,
        icon: rewardType.icon || '💰',
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
      icon: formData.icon,
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
                  onSelect={(emoji) => setFormData(p => ({ ...p, icon: emoji }))}
                  onClose={() => setIsEmojiPickerOpen(false)}
                />
              )}
            </div>
          </div>
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
  );
};

export default EditRewardTypeDialog;
