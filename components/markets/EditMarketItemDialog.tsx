import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { MarketItem, RewardItem, RewardCategory, AvatarAsset, DigitalAsset } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';

interface EditItemDialogProps {
  marketId: string;
  itemToEdit?: MarketItem;
  onClose: () => void;
}

const EditMarketItemDialog: React.FC<EditItemDialogProps> = ({ marketId, itemToEdit, onClose }) => {
  const { rewardTypes, digitalAssets } = useAppState();
  const { addMarketItem, updateMarketItem } = useAppDispatch();
  const [itemType, setItemType] = useState<'standard' | 'digitalAsset'>(itemToEdit?.avatarAssetPayout ? 'digitalAsset' : 'standard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

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

      // Find the digital asset that corresponds to the item being edited
      if (itemToEdit.avatarAssetPayout) {
        const correspondingAsset = digitalAssets.find(da => 
            da.slot === itemToEdit.avatarAssetPayout?.slot &&
            da.assetId === itemToEdit.avatarAssetPayout?.assetId
        );
        if (correspondingAsset) {
            setSelectedAssetId(correspondingAsset.id);
        }
      }
    }
  }, [itemToEdit, digitalAssets]);

  const handleSelectDigitalAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = digitalAssets.find(da => da.id === assetId);
    if (asset) {
        setFormData({
            title: asset.name,
            description: asset.description,
            cost: [...asset.cost],
            payout: [],
            avatarAssetPayout: { slot: asset.slot, assetId: asset.assetId },
        });
    }
  }
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required.');
        return;
    }
     if (itemType === 'digitalAsset' && !formData.avatarAssetPayout) {
        setError('Please select a valid digital asset.');
        return;
    }
    setError('');

    const finalItemData = {
        title: formData.title,
        description: formData.description,
        cost: formData.cost.filter(r => r.rewardTypeId && r.amount > 0),
        payout: itemType === 'standard' ? formData.payout.filter(s => s.rewardTypeId && s.amount > 0) : [],
        avatarAssetPayout: itemType === 'digitalAsset' ? formData.avatarAssetPayout : undefined,
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

                <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg">
                    <button type="button" onClick={() => setItemType('standard')} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${itemType === 'standard' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
                        Standard Item
                    </button>
                    <button type="button" onClick={() => setItemType('digitalAsset')} className={`w-full p-2 rounded-md font-semibold text-sm transition-colors ${itemType === 'digitalAsset' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
                        Digital Asset
                    </button>
                </div>

                {itemType === 'digitalAsset' ? (
                     <div>
                        <label htmlFor="digital-asset-select" className="block text-sm font-medium text-stone-300 mb-1">Select Asset</label>
                        <select
                            id="digital-asset-select"
                            value={selectedAssetId}
                            onChange={(e) => handleSelectDigitalAsset(e.target.value)}
                            className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
                        >
                            <option value="" disabled>Choose a digital asset...</option>
                            {digitalAssets.map(asset => (
                                <option key={asset.id} value={asset.id}>{asset.name} ({asset.slot})</option>
                            ))}
                        </select>
                    </div>
                ) : null}

              <Input label="Item Title" id="title" name="title" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required disabled={itemType === 'digitalAsset'} />
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
                <textarea id="description" name="description" rows={3} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" disabled={itemType === 'digitalAsset'}/>
              </div>
              
              <RewardInputGroup category='cost' items={formData.cost} onChange={handleRewardChange('cost')} onAdd={handleAddRewardForCategory('cost')} onRemove={handleRemoveReward('cost')} />
              
              {itemType === 'standard' && (
                  <RewardInputGroup category='payout' items={formData.payout} onChange={handleRewardChange('payout')} onAdd={handleAddRewardForCategory('payout')} onRemove={handleRemoveReward('payout')} />
              )}
    
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
