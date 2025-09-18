import React, { useState, useEffect, useCallback } from 'react';
import { useSystemState } from '../../context/SystemContext';
import { Market, MarketStatus, Condition, ConditionType } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useQuestsState } from '../../context/QuestsContext';
// FIX: Corrected import for useEconomyDispatch hook.
import { useEconomyDispatch } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useProgressionState } from '../../context/ProgressionContext';

interface EditMarketDialogProps {
  market: Market | null;
  initialData?: { title: string; description: string; icon: string; };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
}

const EditMarketDialog: React.FC<EditMarketDialogProps> = ({ market, initialData, onClose, mode = (market ? 'edit' : 'create'), onTryAgain, isGenerating, onSave }) => {
  const { guilds } = useCommunityState();
  const { addMarket, updateMarket } = useEconomyDispatch();
  const { settings } = useSystemState();
  const allConditionSets = settings.conditionSets || [];
  
  const getInitialFormData = useCallback(() => {
    const data = market || initialData;
    if (mode !== 'create' && data) {
        const d = data as Partial<Market> & { title: string; description: string; icon: string; };
        const status = d.status || { type: 'open' };
        if (status.type === 'conditional' && !Array.isArray((status as any).conditionSetIds)) {
            (status as any).conditionSetIds = [];
        }
        return { 
            title: d.title, 
            description: d.description, 
            guildId: d.guildId || '',
            iconType: d.iconType || 'emoji' as 'emoji' | 'image',
            icon: d.icon || '🛒',
            imageUrl: d.imageUrl || '',
            status: status as MarketStatus,
        };
    }
    // For create or ai-creation
    return { 
        title: initialData?.title || '', 
        description: initialData?.description || '', 
        guildId: '', 
        iconType: 'emoji' as 'emoji' | 'image',
        icon: initialData?.icon || '🛒',
        imageUrl: '', 
        status: { type: 'open' } as MarketStatus,
    };
  }, [market, initialData, mode]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [initialData, getInitialFormData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleStatusChange = (newStatus: MarketStatus) => {
      setFormData(p => ({...p, status: newStatus }));
  };
  
  const handleConditionSetToggle = (setId: string) => {
    const currentStatus = formData.status;
    if (currentStatus.type === 'conditional') {
        const currentIds = currentStatus.conditionSetIds || [];
        const newSetIds = currentIds.includes(setId)
            ? currentIds.filter(id => id !== setId)
            : [...currentIds, setId];
        
        handleStatusChange({
            type: 'conditional',
            conditionSetIds: newSetIds
        });
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
        title: formData.title,
        description: formData.description,
        iconType: formData.iconType,
        icon: formData.icon,
        imageUrl: formData.imageUrl,
        guildId: formData.guildId || undefined, 
        status: formData.status
    };
    
    if (onSave) {
        onSave(payload);
    } else if (market && mode === 'edit') {
      updateMarket({ ...market, ...payload });
    } else {
      addMarket(payload);
    }
    onClose();
  };
  
  const dialogTitle = mode === 'edit' ? 'Edit Market' : 'Create New Market';
  
  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-accent">{dialogTitle}</h2>
          </div>
          <form id="market-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
            <Input label="Market Title" name="title" value={formData.title} onChange={handleChange} required />
            <Input as="textarea" label="Description" name="description" value={formData.description} onChange={handleChange} />
             <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Icon Type</label>
                <div className="flex gap-4 p-2 bg-stone-700/50 rounded-md">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500"/> <span>Emoji</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" /> <span>Image</span></label>
                </div>
            </div>
            {formData.iconType === 'emoji' ? (
                 <div>
                  <label className="block text-sm font-medium text-stone-300 mb-1">Icon (Emoji)</label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2">
                      <span className="text-2xl">{formData.icon}</span> <span className="text-stone-300">Click to change</span>
                    </button>
                    {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormData(p => ({ ...p, icon: emoji })); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                  </div>
                </div>
            ) : (
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-1">Image Icon</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <DynamicIcon iconType={formData.iconType} icon={formData.icon} imageUrl={formData.imageUrl} className="w-full h-full text-4xl" altText="Selected icon" />
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setIsGalleryOpen(true)}>Select Image</Button>
                  </div>
                </div>
            )}
            <Input as="select" label="Scope" name="guildId" value={formData.guildId} onChange={handleChange}>
              <option value="">Personal</option>
              {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Input>
            <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg text-stone-200">Market Status</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center"><input type="radio" name="status" checked={formData.status.type === 'open'} onChange={() => handleStatusChange({type: 'open'})} /> <span className="ml-2">Open</span></label>
                <label className="flex items-center"><input type="radio" name="status" checked={formData.status.type === 'closed'} onChange={() => handleStatusChange({type: 'closed'})} /> <span className="ml-2">Closed</span></label>
                <label className="flex items-center"><input type="radio" name="status" checked={formData.status.type === 'conditional'} onChange={() => handleStatusChange({type: 'conditional', conditionSetIds: formData.status.type === 'conditional' ? formData.status.conditionSetIds : []})} /> <span className="ml-2">Conditionally Open</span></label>
              </div>
               {formData.status.type === 'conditional' && (
                  <div className="space-y-4 pt-4 border-t border-stone-700/60">
                      <h4 className="font-semibold text-stone-300">Conditions for Opening</h4>
                      <p className="text-xs text-stone-400">Select one or more Condition Sets. The market will only be open if ALL selected sets are met.</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {allConditionSets.map(set => (
                              <label key={set.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                                  <input 
                                      type="checkbox"
                                      checked={formData.status.type === 'conditional' && !!formData.status.conditionSetIds?.includes(set.id)}
                                      onChange={() => handleConditionSetToggle(set.id)}
                                      className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                                  <div>
                                      <span className="text-sm font-semibold text-stone-200">{set.name}</span>
                                      <p className="text-xs text-stone-400">{set.description}</p>
                                  </div>
                              </label>
                          ))}
                          {allConditionSets.length === 0 && (
                              <p className="text-xs text-stone-500 text-center">No Condition Sets have been created yet. You can create them in Settings.</p>
                          )}
                      </div>
                  </div>
                )}
            </div>
          </form>
          <div className="p-6 border-t border-stone-700/60">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" form="market-form">{market ? 'Save Changes' : 'Create Market'}</Button>
            </div>
          </div>
        </div>
      </div>
       {isGalleryOpen && <ImageSelectionDialog onSelect={(url: string) => { setFormData(p => ({...p, imageUrl: url})); setIsGalleryOpen(false); }} onClose={() => setIsGalleryOpen(false)} />}
    </>
  );
};

export default EditMarketDialog;
