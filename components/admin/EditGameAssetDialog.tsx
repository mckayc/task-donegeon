

import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem, RewardCategory } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';
import ToggleSwitch from '../ui/ToggleSwitch';
import { SparklesIcon } from '../ui/Icons';
import { useSettings } from '../../context/SettingsContext';

interface EditGameAssetDialogProps {
  assetToEdit: GameAsset | null;
  newAssetUrl: string | null;
  onClose: () => void;
}

const PREDEFINED_CATEGORIES = [
    'Avatar', 'Theme', 'Pet', 'Tool', 'Weapon (Cosmetic)', 
    'Armor (Cosmetic)', 'Consumable', 'Real-World Reward', 'Trophy Display', 'Miscellaneous'
];

const EditGameAssetDialog: React.FC<EditGameAssetDialogProps> = ({ assetToEdit, newAssetUrl, onClose }) => {
  const { addGameAsset, updateGameAsset, uploadFile, addNotification } = useAppDispatch();
  const { markets, rewardTypes } = useAppState();
  const { isAiAvailable } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: 'Avatar',
    avatarSlot: '',
    isForSale: false,
    cost: [] as RewardItem[],
    marketIds: [] as string[],
    purchaseLimit: null as number | null,
    purchaseCount: 0,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name,
        description: assetToEdit.description,
        url: assetToEdit.url,
        category: PREDEFINED_CATEGORIES.includes(assetToEdit.category) ? assetToEdit.category : 'Other',
        avatarSlot: assetToEdit.avatarSlot || '',
        isForSale: assetToEdit.isForSale,
        cost: [...assetToEdit.cost],
        marketIds: [...assetToEdit.marketIds],
        purchaseLimit: assetToEdit.purchaseLimit,
        purchaseCount: assetToEdit.purchaseCount,
      });
      if (!PREDEFINED_CATEGORIES.includes(assetToEdit.category)) {
          setCustomCategory(assetToEdit.category);
      }
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
    const finalCategory = formData.category === 'Other' ? customCategory.trim() : formData.category;
    if (formData.category === 'Other' && !finalCategory) {
        setError('Please enter a name for the custom category.');
        return;
    }
    setError('');

    const payload = {
      ...formData,
      category: finalCategory,
      avatarSlot: formData.category.toLowerCase() === 'avatar' ? formData.avatarSlot : undefined,
      purchaseLimit: formData.isForSale ? formData.purchaseLimit : null,
    };

    if (assetToEdit) {
      updateGameAsset({ ...assetToEdit, ...payload });
    } else {
      addGameAsset(payload);
    }
    onClose();
  };

  const handleGenerateImage = async () => {
    if (!formData.name.trim()) {
        setError("Please enter an asset name before generating an image.");
        return;
    }
    setIsGenerating(true);
    setError('');
    
    try {
        const imageStyleContext = localStorage.getItem('aiImageStyleContext') || 'Pixel art game icon, square, simple colorful background.';
        const fullPrompt = `${imageStyleContext}. Item: ${formData.name}`;

        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'imagen-3.0-generate-002',
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' }
            })
        });

        if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to generate image.'); }

        const result = await response.json();
        const base64Bytes = result.generatedImages?.[0]?.image?.imageBytes;

        if (base64Bytes) {
            const byteCharacters = atob(base64Bytes);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: 'image/png'});
            const file = new File([blob], `${formData.name.replace(/ /g, '_')}.png`, { type: 'image/png' });
            
            const uploadedFile = await uploadFile(file);
            if (uploadedFile?.url) { setFormData(p => ({...p, url: uploadedFile.url }));
            } else { throw new Error("Failed to upload the generated image."); }
        } else { throw new Error("AI did not return a valid image."); }

    } catch(err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Image generation failed: ${message}`);
    } finally { setIsGenerating(false); }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
        uploadFile(file).then(uploaded => { if(uploaded?.url){ setFormData(p => ({...p, url: uploaded.url})); addNotification({type: 'success', message: 'Image uploaded!'}) }})
    }
  }
  
  const dialogTitle = assetToEdit ? `Edit ${assetToEdit.name}` : 'Create New Asset';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-emerald-400">{dialogTitle}</h2>
        </div>
        <form id="asset-dialog-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex gap-6 items-start">
              <div className="w-48 h-48 bg-stone-700 rounded-md flex-shrink-0 flex items-center justify-center">
                  {isGenerating ? (
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                  ) : (
                     <img src={formData.url || 'https://placehold.co/150x150/1c1917/FFFFFF?text=?'} alt="Asset preview" className="w-full h-full object-contain" />
                  )}
              </div>
              <div className="flex-grow space-y-4">
                <Input label="Asset Name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                <Input label="Description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
                <input id="image-upload-input" type="file" accept="image/*" onChange={handleManualUpload} className="hidden" />
                
                <div className="flex items-center gap-2">
                     <Button type="button" variant="secondary" onClick={() => document.getElementById('image-upload-input')?.click()} className="flex-1">Upload Image</Button>
                    {isAiAvailable && (
                        <Button type="button" variant="secondary" onClick={handleGenerateImage} disabled={isGenerating || !formData.name.trim()} className="flex-1">
                            <SparklesIcon className="w-4 h-4 mr-2"/>
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    )}
                </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input as="select" label="Category" value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))}>
                      {PREDEFINED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="Other">Other...</option>
                  </Input>
                  {formData.category === 'Other' && (
                      <Input 
                          className="mt-2"
                          placeholder="Enter custom category name"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                      />
                  )}
              </div>
              {formData.category.toLowerCase() === 'avatar' && (
                <Input label="Avatar Slot" placeholder="e.g., hat, shirt, hand-right" value={formData.avatarSlot} onChange={(e) => setFormData(p => ({...p, avatarSlot: e.target.value}))} required />
              )}
          </div>
          
          <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-stone-200">For Sale</h3>
              <ToggleSwitch enabled={formData.isForSale} setEnabled={(val) => setFormData(p => ({...p, isForSale: val}))} label="Make this asset purchasable" />
            </div>
            
            {formData.isForSale && (
                <>
                    <div>
                        <ToggleSwitch enabled={formData.purchaseLimit === null} setEnabled={(val) => setFormData(p => ({...p, purchaseLimit: val ? null : 1}))} label="Unlimited Purchases" />
                        {formData.purchaseLimit !== null && (
                            <div className="mt-2"><Input label="Purchase Limit" type="number" min="1" value={formData.purchaseLimit} onChange={(e) => setFormData(p => ({...p, purchaseLimit: parseInt(e.target.value) || 1}))} /></div>
                        )}
                    </div>
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
