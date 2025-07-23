import React, { useState, useEffect, useCallback } from 'react';
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
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
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

const EditGameAssetDialog: React.FC<EditGameAssetDialogProps> = ({ assetToEdit, initialData, onClose, mode = (assetToEdit ? 'edit' : 'create'), onTryAgain, isGenerating, onSave }) => {
  const { addGameAsset, updateGameAsset, uploadFile, addNotification } = useAppDispatch();
  const { markets, rewardTypes } = useAppState();

  const getInitialFormData = useCallback(() => {
    const data = assetToEdit || initialData;
    if (mode !== 'create' && data) {
      const d = data as Partial<GameAsset> & { url: string; name: string; category: string; description?: string; };
      return {
        name: d.name,
        description: d.description || '',
        url: d.url,
        category: PREDEFINED_CATEGORIES.includes(d.category) ? d.category : 'Other',
        avatarSlot: d.avatarSlot || '',
        isForSale: typeof d.isForSale === 'boolean' ? d.isForSale : false,
        requiresApproval: typeof d.requiresApproval === 'boolean' ? d.requiresApproval : false,
        costGroups: d.costGroups?.length > 0 ? [...d.costGroups.map(group => [...group])] : [[]],
        payouts: d.payouts ? [...d.payouts] : [],
        marketIds: [...(d.marketIds || [])],
        purchaseLimit: typeof d.purchaseLimit === 'number' ? d.purchaseLimit : null,
        purchaseLimitType: d.purchaseLimitType || 'Total',
        purchaseCount: d.purchaseCount || 0,
        allowExchange: !!(d.payouts && d.payouts.length > 0),
      };
    }
    
    // Default for create or ai-creation
    let baseData = {
        name: '', description: '', url: '', category: 'Avatar', avatarSlot: '',
        isForSale: false, requiresApproval: false, costGroups: [[]] as RewardItem[][],
        payouts: [] as RewardItem[], marketIds: [] as string[], purchaseLimit: null as number | null,
        purchaseLimitType: 'Total' as 'Total' | 'PerUser', purchaseCount: 0, allowExchange: false,
    };

    if (initialData) {
        const { url, name, category: rawCategory, description } = initialData;
        let finalCategory = rawCategory;
        let finalAvatarSlot = '';

        if (rawCategory.toLowerCase().startsWith('avatar-')) {
            const parts = rawCategory.split('-');
            finalCategory = 'Avatar';
            finalAvatarSlot = parts.slice(1).join('-').toLowerCase();
        }
        const isPredefined = PREDEFINED_CATEGORIES.includes(finalCategory);

        baseData = {
            ...baseData,
            url, name,
            description: description || '',
            category: isPredefined ? finalCategory : 'Other',
            avatarSlot: finalAvatarSlot,
        };
    }
    return baseData;
  }, [assetToEdit, initialData, mode]);
  
  const [formData, setFormData] = useState(getInitialFormData);
  const [limitTypeOption, setLimitTypeOption] = useState<'unlimited' | 'total' | 'perUser'>('unlimited');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  
  useEffect(() => {
    const data = getInitialFormData();
    setFormData(data);
    
    if (data.purchaseLimit === null) setLimitTypeOption('unlimited');
    else if (data.purchaseLimitType === 'PerUser') setLimitTypeOption('perUser');
    else setLimitTypeOption('total');

    if (!PREDEFINED_CATEGORIES.includes(data.category)) {
        setCustomCategory(data.category);
    } else {
        setCustomCategory('');
    }
  }, [initialData, assetToEdit, getInitialFormData]);


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

    let finalLimit: number | null = 1;
    let finalLimitType: 'Total' | 'PerUser' = 'Total';

    if (limitTypeOption === 'unlimited') {
        finalLimit = null;
    } else {
        finalLimit = formData.purchaseLimit || 1;
        finalLimitType = limitTypeOption === 'perUser' ? 'PerUser' : 'Total';
    }


    const payload = {
      ...formData,
      category: finalCategory,
      avatarSlot: formData.category.toLowerCase() === 'avatar' ? formData.avatarSlot : undefined,
      purchaseLimit: finalLimit,
      purchaseLimitType: finalLimitType,
      payouts: formData.isForSale && formData.allowExchange ? formData.payouts.filter(p => p.amount > 0 && p.rewardTypeId) : undefined,
      costGroups: formData.costGroups.map(g => g.filter(c => c.amount > 0 && c.rewardTypeId)).filter(g => g.length > 0),
    };
    
    const { allowExchange, ...finalPayload } = payload;
    
    if (onSave) {
        onSave(finalPayload);
        onClose();
        return;
    }

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
              {mode === 'ai-creation' && <p className="text-stone-400 mt-1">Review and adjust the AI-generated details below.</p>}
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
                      <ToggleSwitch enabled={formData.requiresApproval} setEnabled={(val) => setFormData(p => ({...p, requiresApproval: val}))} label="Requires Approval" />

                      <div>
                          <h4 className="font-semibold text-stone-300 mb-2">Purchase Limit</h4>
                          <div className="flex items-center gap-4">
                              <label><input type="radio" name="limit" checked={limitTypeOption === 'unlimited'} onChange={() => setLimitTypeOption('unlimited')} /> Unlimited</label>
                              <label><input type="radio" name="limit" checked={limitTypeOption === 'total'} onChange={() => setLimitTypeOption('total')} /> Total</label>
                              <label><input type="radio" name="limit" checked={limitTypeOption === 'perUser'} onChange={() => setLimitTypeOption('perUser')} /> Per User</label>
                          </div>
                          {limitTypeOption !== 'unlimited' && (
                              <div className="mt-2"><Input label="Limit Amount" type="number" min="1" value={formData.purchaseLimit || 1} onChange={(e) => setFormData(p => ({...p, purchaseLimit: parseInt(e.target.value) || 1}))} /></div>
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
                              {markets.map(market => {
                                  const isExchange = market.id === 'market-bank';
                                  return (
                                    <div key={market.id} className={`flex items-center ${isExchange ? 'opacity-50' : ''}`} title={isExchange ? 'Goods cannot be sold in the Exchange Post.' : ''}>
                                        <input
                                            type="checkbox"
                                            id={`market-${market.id}`}
                                            checked={formData.marketIds.includes(market.id)}
                                            onChange={() => handleMarketToggle(market.id)}
                                            className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 disabled:cursor-not-allowed"
                                            disabled={isExchange}
                                        />
                                        <label
                                            htmlFor={`market-${market.id}`}
                                            className={`ml-3 text-stone-300 ${isExchange ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {market.title}
                                        </label>
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  </>
              )}
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}
          </form>
           <div className="p-6 border-t border-stone-700/60 mt-auto">
              {mode === 'ai-creation' ? (
                <div className="flex justify-between items-center">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit" form="asset-dialog-form">Create Asset</Button>
                    </div>
                </div>
              ) : (
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="asset-dialog-form">{onSave ? 'Save Changes' : (assetToEdit ? 'Save Changes' : 'Create Asset')}</Button>
                </div>
              )}
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