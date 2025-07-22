import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem, RewardCategory } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RewardInputGroup from '../forms/RewardInputGroup';
import ToggleSwitch from '../ui/ToggleSwitch';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';

interface EditGameAssetDialogProps {
  assetToEdit: GameAsset | null;
  initialData: { url: string; name: string; category: string; description?: string; } | null;
  onClose: () => void;
}

const InfoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);


const PREDEFINED_CATEGORIES = [
    'Avatar', 'Theme', 'Pet', 'Tool', 'Weapon (Cosmetic)', 
    'Armor (Cosmetic)', 'Consumable', 'Real-World Reward', 'Trophy Display', 'Miscellaneous'
];

const EditGameAssetDialog: React.FC<EditGameAssetDialogProps> = ({ assetToEdit, initialData, onClose }) => {
  const { addGameAsset, updateGameAsset, uploadFile, addNotification } = useAppDispatch();
  const { markets, rewardTypes } = useAppState();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: 'Avatar',
    avatarSlot: '',
    isForSale: false,
    costGroups: [[]] as RewardItem[][],
    payouts: [] as RewardItem[],
    marketIds: [] as string[],
    purchaseLimit: null as number | null,
    purchaseCount: 0,
    allowExchange: false,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        name: assetToEdit.name,
        description: assetToEdit.description,
        url: assetToEdit.url,
        category: PREDEFINED_CATEGORIES.includes(assetToEdit.category) ? assetToEdit.category : 'Other',
        avatarSlot: assetToEdit.avatarSlot || '',
        isForSale: assetToEdit.isForSale,
        costGroups: assetToEdit.costGroups.length > 0 ? [...assetToEdit.costGroups.map(group => [...group])] : [[]],
        payouts: assetToEdit.payouts ? [...assetToEdit.payouts] : [],
        marketIds: [...assetToEdit.marketIds],
        purchaseLimit: assetToEdit.purchaseLimit,
        purchaseCount: assetToEdit.purchaseCount,
        allowExchange: !!(assetToEdit.payouts && assetToEdit.payouts.length > 0),
      });
      if (!PREDEFINED_CATEGORIES.includes(assetToEdit.category)) {
          setCustomCategory(assetToEdit.category);
      }
    } else if (initialData) {
        const { url, name, category: rawCategory, description } = initialData;
        let finalCategory = rawCategory;
        let finalAvatarSlot = '';

        if (rawCategory.toLowerCase().startsWith('avatar-')) {
            const parts = rawCategory.split('-');
            finalCategory = 'Avatar';
            finalAvatarSlot = parts.slice(1).join('-').toLowerCase();
        }

        const isPredefined = PREDEFINED_CATEGORIES.includes(finalCategory);

        setFormData(prev => ({
            ...prev,
            url,
            name,
            description: description || '',
            category: isPredefined ? finalCategory : 'Other',
            avatarSlot: finalAvatarSlot,
        }));

        if (!isPredefined) {
            setCustomCategory(finalCategory);
        }
    }
  }, [assetToEdit, initialData]);

  const handleCostGroupChange = (groupIndex: number) => (itemIndex: number, field: keyof RewardItem, value: string | number) => {
    const newCostGroups = [...formData.costGroups.map(group => [...group])];
    const newGroup = newCostGroups[groupIndex];
    newGroup[itemIndex] = { ...newGroup[itemIndex], [field]: field === 'amount' ? Math.max(1, Number(value)) : value };
    setFormData(p => ({ ...p, costGroups: newCostGroups }));
  };
  
  const handleAddRewardToGroup = (groupIndex: number) => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    const newCostGroups = [...formData.costGroups.map(group => [...group])];
    newCostGroups[groupIndex].push({ rewardTypeId: defaultReward.id, amount: 1 });
    setFormData(p => ({ ...p, costGroups: newCostGroups }));
  };
  
  const handleRemoveRewardFromGroup = (groupIndex: number) => (itemIndex: number) => {
    const newCostGroups = [...formData.costGroups.map(group => [...group])];
    newCostGroups[groupIndex].splice(itemIndex, 1);
    setFormData(p => ({ ...p, costGroups: newCostGroups }));
  };

  const addCostGroup = () => setFormData(p => ({ ...p, costGroups: [...p.costGroups, []] }));
  const removeCostGroup = (groupIndex: number) => setFormData(p => ({ ...p, costGroups: p.costGroups.filter((_, i) => i !== groupIndex) }));

  const handlePayoutChange = (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...formData.payouts];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Math.max(1, Number(value)) : value };
    setFormData(prev => ({ ...prev, payouts: newItems }));
  };
  
  const handleAddPayout = (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    setFormData(prev => ({ ...prev, payouts: [...prev.payouts, { rewardTypeId: defaultReward.id, amount: 1 }] }));
  };
  
  const handleRemovePayout = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, payouts: prev.payouts.filter((_, i) => i !== indexToRemove) }));
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
      payouts: formData.isForSale && formData.allowExchange ? formData.payouts.filter(p => p.amount > 0 && p.rewardTypeId) : undefined,
      costGroups: formData.costGroups.map(g => g.filter(c => c.amount > 0 && c.rewardTypeId)).filter(g => g.length > 0),
    };
    
    const { allowExchange, ...finalPayload } = payload;

    if (assetToEdit) {
      updateGameAsset({ ...assetToEdit, ...finalPayload });
    } else {
      addGameAsset(finalPayload);
    }
    onClose();
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
        setIsUploading(true);
        const uploaded = await uploadFile(file);
        if(uploaded?.url) {
            setFormData(p => ({...p, url: uploaded.url}));
            addNotification({type: 'success', message: 'Image uploaded!'}) 
        }
        setIsUploading(false);
    }
  }
  
  const dialogTitle = assetToEdit ? `Edit ${assetToEdit.name}` : 'Create New Asset';

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="p-8 border-b border-stone-700/60">
              <h2 className="text-3xl font-medieval text-accent">{dialogTitle}</h2>
          </div>
          <form id="asset-dialog-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
            <div className="flex gap-6 items-start">
                <div className="relative w-48 h-48 bg-stone-700 rounded-md flex-shrink-0 flex items-center justify-center">
                    {isUploading ? (
                       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                    ) : (
                       <img src={formData.url || 'https://placehold.co/150x150/1c1917/FFFFFF?text=?'} alt="Asset preview" className="w-full h-full object-contain" />
                    )}
                    {formData.url && (
                         <button type="button" onClick={() => setIsInfoVisible(true)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors" aria-label="Show image info">
                            <InfoIcon />
                        </button>
                    )}
                </div>
                <div className="flex-grow space-y-4">
                  <Input label="Asset Name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                  <Input label="Description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
                  <input id="image-upload-input" type="file" accept="image/*" onChange={handleManualUpload} className="hidden" />
                  <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => document.getElementById('image-upload-input')?.click()} disabled={isUploading} className="flex-grow">
                          {isUploading ? 'Uploading...' : 'Upload New'}
                      </Button>
                       <Button type="button" variant="secondary" onClick={() => setIsGalleryOpen(true)} className="flex-grow">
                          Select Existing
                      </Button>
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
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-stone-200">Cost Options</h4>
                        {formData.costGroups.map((group, groupIndex) => (
                           <div key={groupIndex} className="p-3 border border-stone-700/60 rounded-lg">
                               <RewardInputGroup category='cost' items={group} onChange={handleCostGroupChange(groupIndex)} onAdd={handleAddRewardToGroup(groupIndex)} onRemove={handleRemoveRewardFromGroup(groupIndex)} />
                               {formData.costGroups.length > 1 && <Button type="button" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300 text-xs py-1 px-2 mt-2" onClick={() => removeCostGroup(groupIndex)}>Remove Cost Option</Button>}
                           </div>
                        ))}
                         <Button type="button" variant="secondary" onClick={addCostGroup} className="text-sm py-1 px-3">+ Add Cost Option (OR)</Button>
                      </div>

                      <div>
                          <ToggleSwitch enabled={formData.allowExchange} setEnabled={(val) => setFormData(p => ({...p, allowExchange: val}))} label="Allow Exchange (Item has Payouts)" />
                      </div>
                      {formData.allowExchange && (
                          <RewardInputGroup category='payout' items={formData.payouts} onChange={handlePayoutChange} onAdd={handleAddPayout} onRemove={handleRemovePayout} />
                      )}
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
      
      {isInfoVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={() => setIsInfoVisible(false)}>
            <div className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg text-stone-200 mb-4">Asset Information</h3>
                <Input label="Image URL" readOnly value={formData.url} onFocus={e => (e.target as HTMLInputElement).select()} />
                <div className="text-right mt-4">
                    <Button variant="secondary" onClick={() => setIsInfoVisible(false)}>Close</Button>
                </div>
            </div>
        </div>
      )}

      {isGalleryOpen && (
          <ImageSelectionDialog 
              onSelect={(url) => {
                  setFormData(p => ({...p, url}));
                  setIsGalleryOpen(false);
              }}
              onClose={() => setIsGalleryOpen(false)}
          />
      )}
    </>
  );
};

export default EditGameAssetDialog;
