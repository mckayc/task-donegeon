

import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem, RewardCategory } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';
import ToggleSwitch from '../ui/ToggleSwitch';
import { SparklesIcon } from '../ui/Icons';

interface EditGameAssetDialogProps {
  assetToEdit: GameAsset | null;
  newAssetUrl: string | null;
  onClose: () => void;
}

const EditGameAssetDialog: React.FC<EditGameAssetDialogProps> = ({ assetToEdit, newAssetUrl, onClose }) => {
  const { addGameAsset, updateGameAsset, uploadFile, addNotification } = useAppDispatch();
  const { markets, rewardTypes, settings } = useAppState();

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
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      setImagePrompt(assetToEdit.name);
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

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGenerating(true);
    setError('');
    
    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'imagen-3.0-generate-002',
                prompt: `Pixel art icon for a video game, simple, clean background. Item: ${imagePrompt}`,
                generationConfig: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: '1:1',
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to generate image.');
        }

        const result = await response.json();
        const base64Bytes = result.generatedImages?.[0]?.image?.imageBytes;

        if (base64Bytes) {
            const byteCharacters = atob(base64Bytes);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: 'image/png'});
            const file = new File([blob], `${imagePrompt.replace(/ /g, '_')}.png`, { type: 'image/png' });
            
            const uploadedFile = await uploadFile(file);
            if (uploadedFile?.url) {
                setFormData(p => ({...p, url: uploadedFile.url }));
            } else {
                throw new Error("Failed to upload the generated image.");
            }
        } else {
            throw new Error("AI did not return a valid image.");
        }

    } catch(err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Image generation failed: ${message}`);
    } finally {
        setIsGenerating(false);
    }
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
              <div className="w-24 h-24 bg-stone-700 rounded-md flex-shrink-0 flex items-center justify-center">
                  {isGenerating ? (
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                  ) : (
                     <img src={formData.url || 'https://placehold.co/150x150/1c1917/FFFFFF?text=?'} alt="Asset preview" className="w-full h-full object-contain" />
                  )}
              </div>
              <div className="flex-grow space-y-4">
                <Input label="Asset Name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                <Input label="Description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
              </div>
          </div>
          
           {settings.enableAiFeatures && (
            <div className="p-3 bg-stone-900/40 rounded-lg space-y-2">
                <label className="text-sm font-medium text-stone-300 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-accent" /> Generate Image with AI</label>
                 <div className="flex items-center gap-2">
                    <Input
                        placeholder="e.g., 'golden key', 'blue potion'"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="flex-grow text-sm"
                        disabled={isGenerating}
                    />
                    <Button type="button" variant="secondary" onClick={handleGenerateImage} disabled={isGenerating || !imagePrompt.trim()} className="text-sm py-2 px-4">
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </div>
           )}

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
