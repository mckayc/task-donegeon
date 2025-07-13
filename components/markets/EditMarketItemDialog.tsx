
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { MarketItem, RewardItem, RewardCategory, AvatarAsset } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';

interface EditItemDialogProps {
  marketId: string;
  itemToEdit?: MarketItem;
  onClose: () => void;
}

const EditMarketItemDialog: React.FC<EditItemDialogProps> = ({ marketId, itemToEdit, onClose }) => {
  const { rewardTypes } = useAppState();
  const { addMarketItem, updateMarketItem } = useAppDispatch();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: [] as RewardItem[],
    payout: [] as RewardItem[],
    avatarAssetPayout: undefined as AvatarAsset | undefined,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        description: itemToEdit.description,
        cost: [...itemToEdit.cost],
        payout: [...itemToEdit.payout],
        avatarAssetPayout: itemToEdit.avatarAssetPayout ? { ...itemToEdit.avatarAssetPayout } : undefined,
      });
    }
  }, [itemToEdit]);
  
  const handleRewardChange = (category: 'cost' | 'payout') => (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...formData[category]];
    if (field === 'amount') {
        newItems[index][field] = Math.max(1, Number(value));
    } else {
        newItems[index][field] = value as string;
    }
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleAddRewardForCategory = (category: 'cost' | 'payout') => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    const newItems = [...formData[category], { rewardTypeId: defaultReward?.id || '', amount: 1 }];
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleRemoveReward = (category: 'cost' | 'payout') => (indexToRemove: number) => {
    const newItems = formData[category].filter((_, i) => i !== indexToRemove);
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };

  const handleAvatarChange = (field: keyof AvatarAsset, value: string) => {
      setFormData(prev => ({
          ...prev,
          avatarAssetPayout: {
              ...prev.avatarAssetPayout,
              slot: field === 'slot' ? value : prev.avatarAssetPayout?.slot || '',
              assetId: field === 'assetId' ? value : prev.avatarAssetPayout?.assetId || '',
          }
      }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required.');
        return;
    }
    setError('');

    const finalItemData = {
        title: formData.title,
        description: formData.description,
        cost: formData.cost.filter(r => r.rewardTypeId && r.amount > 0),
        payout: formData.payout.filter(s => s.rewardTypeId && s.amount > 0),
        avatarAssetPayout: (formData.avatarAssetPayout?.slot && formData.avatarAssetPayout?.assetId) ? formData.avatarAssetPayout : undefined,
    };

    if (itemToEdit) {
      updateMarketItem(marketId, { ...itemToEdit, ...finalItemData });
    } else {
      addMarketItem(marketId, finalItemData);
    }
    onClose();
  };
  
  const dialogTitle = itemToEdit ? 'Edit Item' : 'Create New Item';
  const submitButtonText = itemToEdit ? 'Save Changes' : 'Create Item';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-8">
            <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <Input label="Item Title" id="title" name="title" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required />
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
                <textarea id="description" name="description" rows={3} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"/>
              </div>
              
              <RewardInputGroup category='cost' items={formData.cost} onChange={handleRewardChange('cost')} onAdd={handleAddRewardForCategory('cost')} onRemove={handleRemoveReward('cost')} />
              <RewardInputGroup category='payout' items={formData.payout} onChange={handleRewardChange('payout')} onAdd={handleAddRewardForCategory('payout')} onRemove={handleRemoveReward('payout')} />
              
              <div className="p-4 bg-stone-900/50 rounded-lg">
                <h4 className="font-semibold text-stone-200 mb-2">Avatar Item Payout (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Slot" placeholder="e.g., hair, shirt" value={formData.avatarAssetPayout?.slot || ''} onChange={(e) => handleAvatarChange('slot', e.target.value)} />
                    <Input label="Asset ID" placeholder="e.g., hair-style-1" value={formData.avatarAssetPayout?.assetId || ''} onChange={(e) => handleAvatarChange('assetId', e.target.value)} />
                </div>
              </div>

              {error && <p className="text-red-400 text-center">{error}</p>}
              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">{submitButtonText}</Button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditMarketItemDialog;