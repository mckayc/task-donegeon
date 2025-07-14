
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem, RewardCategory } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';
import ToggleSwitch from '../ui/ToggleSwitch';

interface EditGameAssetDialogProps {
  assetToEdit: GameAsset | null;
  newAssetUrl: string | null;
  onClose: () => void;
}

const EditGameAssetDialog: React.FC<EditGameAssetDialogProps> = ({ assetToEdit, newAssetUrl, onClose }) => {
  const { addGameAsset, updateGameAsset } = useAppDispatch();
  const { markets, rewardTypes } = useAppState();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: 'Misc',
    avatarSlot: '',
    isForSale: false,
    cost: [] as RewardItem[],
    marketIds: [] as string[],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name,
        description: assetToEdit.description,
        url: assetToEdit.url,
        category: assetToEdit.category,
        avatarSlot: assetToEdit.avatarSlot || '',
        isForSale: assetToEdit.isForSale,
        cost: [...assetToEdit.cost],
        marketIds: [...assetToEdit.marketIds],
      });
    } else if (newAssetUrl) {
      setFormData(prev => ({ ...prev, url: newAssetUrl }));
    }
  }, [assetToEdit, newAssetUrl]);

  const handleRewardChange = (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...formData.cost];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Math.max(1, Number(value)) : value };
    setFormData(prev => ({ ...prev, cost: newItems }));
  };
  
  const handleAddRewardForCategory = (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    setFormData(prev => ({ ...prev, cost: [...prev.cost, { rewardTypeId: defaultReward.id, amount: 1 }] }));
  };
  
  const handleRemoveReward = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, cost: prev.cost.filter((_, i) => i !== indexToRemove) }));
  };

  const handleMarketToggle = (marketId: string) => {
      setFormData(prev => ({
          ...prev,
          marketIds: prev.marketIds.includes(marketId)
            ? prev.marketIds.filter(id => id !== marketId)
            : [...prev.marketIds, marketId]
      }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('A name is required for the asset.');
      return;
    }
    setError('');

    const payload = {
      ...formData,
      avatarSlot: formData.category.toLowerCase() === 'avatar' ? formData.avatarSlot : undefined,
    };

    if (assetToEdit) {
      updateGameAsset({ ...assetToEdit, ...payload });
    } else {
      addGameAsset(payload);
    }
    onClose();
  };
  
  const dialogTitle = assetToEdit ? `Edit ${assetToEdit.name}` : 'Create New Asset';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-emerald-400">{dialogTitle}</h2>
        </div>
        <form id="asset-dialog-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex gap-6 items-start">
              <div className="w-24 h-24 bg-stone-700 rounded-md flex-shrink-0">
                  <img src={formData.url} alt="Asset preview" className="w-full h-full object-contain" />
              </div>
              <div className="flex-grow space-y-4">
                <Input label="Asset Name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                <Input label="Description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Input label="Category" placeholder="e.g. Avatar, Pet, Item" value={formData.category} onChange={(e) => setFormData(p => ({...p, category: e.target.value}))} required />
              {formData.category.toLowerCase() === 'avatar' && (
                <Input label="Avatar Slot" placeholder="e.g. hair, shirt" value={formData.avatarSlot} onChange={(e) => setFormData(p => ({...p, avatarSlot: e.target.value}))} required />
              )}
          </div>
          
          <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-stone-200">For Sale</h3>
              <ToggleSwitch enabled={formData.isForSale} setEnabled={(val) => setFormData(p => ({...p, isForSale: val}))} label="Make this asset purchasable" />
            </div>
            
            {formData.isForSale && (
                <>
                    <RewardInputGroup category='cost' items={formData.cost} onChange={handleRewardChange} onAdd={handleAddRewardForCategory} onRemove={handleRemoveReward} />
                    <div>
                        <h4 className="font-semibold text-stone-200 mb-2">Available In</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-stone-700 p-2 rounded-md">
                            {markets.map(market => (
                                <div key={market.id} className="flex items-center">
                                    <input type="checkbox" id={`market-${market.id}`} checked={formData.marketIds.includes(market.id)} onChange={() => handleMarketToggle(market.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                                    <label htmlFor={`market-${market.id}`} className="ml-3 text-stone-300">{market.title}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
          </div>

          {error && <p className="text-red-400 text-center">{error}</p>}
        </form>
         <div className="p-6 border-t border-stone-700/60 mt-auto">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" form="asset-dialog-form">{assetToEdit ? 'Save Changes' : 'Create Asset'}</Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditGameAssetDialog;
