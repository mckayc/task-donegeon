import React, { useState, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem, RewardCategory } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import RewardInputGroup from '../forms/RewardInputGroup';
import ToggleSwitch from '../ui/ToggleSwitch';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import { Info } from 'lucide-react';

interface EditGameAssetDialogProps {
  assetToEdit: GameAsset | null;
  initialData: { url: string; name: string; category: string; description?: string; } | null;
  onClose: () => void;
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
}

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
        costGroups: d.costGroups ? [...d.costGroups.map(group => [...group])] : [[]],
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
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              {mode === 'ai-creation' && <p className="text-muted-foreground mt-1">Review and adjust the AI-generated details below.</p>}
          </DialogHeader>
          <form id="asset-dialog-form" onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 overflow-y-auto pr-6">
            <div className="flex gap-6 items-start">
                <div className="relative w-48 h-48 bg-background rounded-md flex-shrink-0 flex items-center justify-center">
                    {isUploading ? (
                       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    ) : (
                       <img src={formData.url || 'https://placehold.co/150x150/1c1917/FFFFFF?text=?'} alt="Asset preview" className="w-full h-full object-contain" />
                    )}
                    {formData.url && (
                         <button type="button" onClick={() => setIsInfoVisible(true)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors" aria-label="Show image info">
                            <Info className="w-4 h-4"/>
                        </button>
                    )}
                </div>
                <div className="flex-grow space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset-name">Asset Name</Label>
                    <Input id="asset-name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asset-desc">Description</Label>
                    <Input id="asset-desc" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} />
                  </div>
                  <input id="image-upload-input" type="file" accept="image/*" onChange={handleManualUpload} className="hidden" />
                  <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload-input')?.click()} disabled={isUploading} className="flex-grow">
                          {isUploading ? 'Uploading...' : 'Upload New'}
                      </Button>
                       <Button type="button" variant="outline" onClick={() => setIsGalleryOpen(true)} className="flex-grow">
                          Select Existing
                      </Button>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="asset-category">Category</Label>
                    <Select onValueChange={(value) => setFormData(p => ({...p, category: value}))} defaultValue={formData.category}>
                        <SelectTrigger id="asset-category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {PREDEFINED_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                           <SelectItem value="Other">Other...</SelectItem>
                        </SelectContent>
                    </Select>
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
                  <div className="space-y-2">
                    <Label htmlFor="avatar-slot">Avatar Slot</Label>
                    <Input id="avatar-slot" placeholder="e.g., hat, shirt, hand-right" value={formData.avatarSlot} onChange={(e) => setFormData(p => ({...p, avatarSlot: e.target.value}))} required />
                  </div>
                )}
            </div>
            
            <div className="p-4 bg-background rounded-lg space-y-4 border">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-foreground">For Sale</h3>
                <ToggleSwitch enabled={formData.isForSale} setEnabled={(val) => setFormData(p => ({...p, isForSale: val}))} label="Make this asset purchasable" />
              </div>
              
              {formData.isForSale && (
                  <>
                      <ToggleSwitch enabled={formData.requiresApproval} setEnabled={(val) => setFormData(p => ({...p, requiresApproval: val}))} label="Requires Approval" />

                      <div className="space-y-2">
                          <Label>Purchase Limit</Label>
                          <div className="flex items-center gap-4">
                              <Label className="flex items-center gap-2 font-normal"><input type="radio" name="limit" checked={limitTypeOption === 'unlimited'} onChange={() => setLimitTypeOption('unlimited')} /> Unlimited</Label>
                              <Label className="flex items-center gap-2 font-normal"><input type="radio" name="limit" checked={limitTypeOption === 'total'} onChange={() => setLimitTypeOption('total')} /> Total</Label>
                              <Label className="flex items-center gap-2 font-normal"><input type="radio" name="limit" checked={limitTypeOption === 'perUser'} onChange={() => setLimitTypeOption('perUser')} /> Per User</Label>
                          </div>
                          {limitTypeOption !== 'unlimited' && (
                              <div className="mt-2 space-y-2">
                                <Label htmlFor="limit-amount">Limit Amount</Label>
                                <Input id="limit-amount" type="number" min="1" value={formData.purchaseLimit || 1} onChange={(e) => setFormData(p => ({...p, purchaseLimit: parseInt(e.target.value) || 1}))} />
                              </div>
                          )}
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Cost Options</h4>
                        {formData.costGroups.map((group, groupIndex) => (
                           <div key={groupIndex} className="p-3 border rounded-lg">
                               <RewardInputGroup category='cost' items={group} onChange={handleCostGroupChange(groupIndex)} onAdd={handleAddRewardToGroup(groupIndex)} onRemove={handleRemoveRewardFromGroup(groupIndex)} />
                               {formData.costGroups.length > 1 && <Button type="button" variant="destructive" size="sm" className="mt-2" onClick={() => removeCostGroup(groupIndex)}>Remove Cost Option</Button>}
                           </div>
                        ))}
                         <Button type="button" variant="outline" size="sm" onClick={addCostGroup}>+ Add Cost Option (OR)</Button>
                      </div>

                      <div className="space-y-2">
                          <ToggleSwitch enabled={formData.allowExchange} setEnabled={(val) => setFormData(p => ({...p, allowExchange: val}))} label="Allow Exchange (Item has Payouts)" />
                      </div>
                      {formData.allowExchange && (
                          <RewardInputGroup category='payout' items={formData.payouts} onChange={handlePayoutChange} onAdd={handleAddPayout} onRemove={handleRemovePayout} />
                      )}
                      <div>
                          <h4 className="font-semibold text-foreground mb-2">Available In</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                              {markets.map(market => {
                                  const isExchange = market.id === 'market-bank';
                                  return (
                                    <div key={market.id} className={`flex items-center ${isExchange ? 'opacity-50' : ''}`} title={isExchange ? 'Goods cannot be sold in the Exchange Post.' : ''}>
                                        <input
                                            type="checkbox"
                                            id={`market-${market.id}`}
                                            checked={formData.marketIds.includes(market.id)}
                                            onChange={() => handleMarketToggle(market.id)}
                                            className="h-4 w-4 rounded text-primary bg-background border-input focus:ring-ring disabled:cursor-not-allowed"
                                            disabled={isExchange}
                                        />
                                        <Label
                                            htmlFor={`market-${market.id}`}
                                            className={`ml-3 ${isExchange ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {market.title}
                                        </Label>
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
           <DialogFooter>
              {mode === 'ai-creation' ? (
                <div className="flex justify-between items-center w-full">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" onClick={onTryAgain} disabled={isGenerating}>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isInfoVisible && (
        <Dialog open={isInfoVisible} onOpenChange={setIsInfoVisible}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asset Information</DialogTitle>
                </DialogHeader>
                 <div className="space-y-2">
                    <Label htmlFor="asset-url-info">Image URL</Label>
                    <Input id="asset-url-info" readOnly value={formData.url} onFocus={e => (e.target as HTMLInputElement).select()} />
                 </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsInfoVisible(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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