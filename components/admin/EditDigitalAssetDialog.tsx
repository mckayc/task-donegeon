


import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { DigitalAsset, RewardItem, RewardCategory } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';

interface EditDigitalAssetDialogProps {
  asset: DigitalAsset | null;
  onClose: () => void;
}

const EditDigitalAssetDialog: React.FC<EditDigitalAssetDialogProps> = ({ asset, onClose }) => {
  const { rewardTypes } = useAppState();
  const { addDigitalAsset, updateDigitalAsset } = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slot: 'hair',
    assetId: '',
    cost: [] as RewardItem[],
    dataUrl: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        description: asset.description,
        slot: asset.slot,
        assetId: asset.assetId,
        cost: [...asset.cost],
        dataUrl: asset.dataUrl,
      });
    }
  }, [asset]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({...prev, dataUrl: reader.result as string}));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRewardChange = (category: 'cost') => (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...formData[category]];
    if (field === 'amount') {
        newItems[index][field] = Math.max(1, Number(value));
    } else {
        newItems[index][field] = value as string;
    }
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleAddRewardForCategory = (category: 'cost') => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    const newItems = [...formData[category], { rewardTypeId: defaultReward?.id || '', amount: 1 }];
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleRemoveReward = (category: 'cost') => (indexToRemove: number) => {
    const newItems = formData[category].filter((_, i) => i !== indexToRemove);
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.assetId.trim()) {
      setError('Name and Asset ID are required.');
      return;
    }
    if (!formData.dataUrl) {
      setError('An image file must be uploaded for this asset.');
      return;
    }
    setError('');

    if (asset) {
      updateDigitalAsset({ ...asset, ...formData });
    } else {
      addDigitalAsset(formData);
    }
    onClose();
  };
  
  const dialogTitle = asset ? 'Edit Digital Asset' : 'Create New Digital Asset';
  const submitButtonText = asset ? 'Save Changes' : 'Create Asset';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-8">
          <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Asset Name" id="name" name="name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
              <textarea id="description" name="description" rows={3} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Avatar Slot" placeholder="e.g. hair, shirt" value={formData.slot} onChange={(e) => setFormData(p => ({...p, slot: e.target.value.toLowerCase()}))} required />
              <Input label="Asset ID (must be unique for this slot)" placeholder="e.g. hair-style-1" value={formData.assetId} onChange={(e) => setFormData(p => ({...p, assetId: e.target.value}))} required />
            </div>

            <div>
              <label htmlFor="asset-image" className="block text-sm font-medium text-stone-300 mb-1">Asset Image</label>
              <Input id="asset-image" type="file" accept="image/png, image/svg+xml, image/jpeg" onChange={handleFileChange} />
              {formData.dataUrl && (
                  <div className="mt-4 p-2 bg-stone-900/50 rounded-md inline-block">
                    <img src={formData.dataUrl} alt="Asset preview" className="w-24 h-24 object-contain" />
                  </div>
              )}
            </div>

            <RewardInputGroup category='cost' items={formData.cost} onChange={handleRewardChange('cost')} onAdd={handleAddRewardForCategory('cost')} onRemove={handleRemoveReward('cost')} />

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

export default EditDigitalAssetDialog;