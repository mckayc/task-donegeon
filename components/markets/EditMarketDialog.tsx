import React, { useState, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Market, MarketStatus, MarketCondition, MarketConditionType, Quest } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import DynamicIcon from '../user-interface/DynamicIcon';

interface EditMarketDialogProps {
  market: Market | null;
  initialData?: { title: string; description: string; icon: string; };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EditMarketDialog: React.FC<EditMarketDialogProps> = ({ market, initialData, onClose, mode = (market ? 'edit' : 'create'), onTryAgain, isGenerating, onSave }) => {
  const { guilds, ranks, quests } = useAppState();
  const { addMarket, updateMarket } = useAppDispatch();
  
  const getInitialFormData = useCallback(() => {
    const data = market || initialData;
    if (mode !== 'create' && data) {
        const d = data as Partial<Market> & { title: string; description: string; icon: string; };
        return { 
            title: d.title, 
            description: d.description, 
            guildId: d.guildId || '',
            iconType: d.iconType || 'emoji' as 'emoji' | 'image',
            icon: d.icon || '🛒',
            imageUrl: d.imageUrl || '',
            status: d.status || { type: 'open' },
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
  
  const addCondition = () => {
      const currentStatus = formData.status;
      if (currentStatus.type === 'conditional') {
          const newCondition: MarketCondition = { type: MarketConditionType.MinRank, rankId: ranks[0]?.id || '' };
          const newStatus: MarketStatus = {
            type: 'conditional',
            logic: currentStatus.logic,
            conditions: [...currentStatus.conditions, newCondition]
          };
          handleStatusChange(newStatus);
      }
  };

  const updateCondition = (index: number, newCondition: MarketCondition) => {
      const currentStatus = formData.status;
      if (currentStatus.type === 'conditional') {
          const newConditions = [...currentStatus.conditions];
          newConditions[index] = newCondition;
          const newStatus: MarketStatus = {
            type: 'conditional',
            logic: currentStatus.logic,
            conditions: newConditions
          };
          handleStatusChange(newStatus);
      }
  };


  const removeCondition = (index: number) => {
      const currentStatus = formData.status;
      if (currentStatus.type === 'conditional') {
          const newStatus: MarketStatus = {
            type: 'conditional',
            logic: currentStatus.logic,
            conditions: currentStatus.conditions.filter((_, i) => i !== index)
          };
          handleStatusChange(newStatus);
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
  
  const renderConditionEditor = (condition: MarketCondition, index: number) => {
    return (
        <div key={index} className="p-3 bg-stone-800/50 rounded-md space-y-2">
             <div className="flex justify-end">
                <button type="button" onClick={() => removeCondition(index)} className="text-red-400 hover:text-red-300">&times;</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input as="select" label="Condition Type" value={condition.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newType = e.target.value as MarketConditionType;
                    let newCondition: MarketCondition;
                    switch (newType) {
                        case MarketConditionType.MinRank: newCondition = { type: newType, rankId: ranks[0]?.id || '' }; break;
                        case MarketConditionType.DayOfWeek: newCondition = { type: newType, days: [] }; break;
                        case MarketConditionType.DateRange: newCondition = { type: newType, start: '', end: '' }; break;
                        case MarketConditionType.QuestCompleted: newCondition = { type: newType, questId: quests[0]?.id || '' }; break;
                        default: return;
                    }
                    updateCondition(index, newCondition);
                }}>
                    <option value={MarketConditionType.MinRank}>Minimum Rank</option>
                    <option value={MarketConditionType.DayOfWeek}>Day of Week</option>
                    <option value={MarketConditionType.DateRange}>Date Range</option>
                    <option value={MarketConditionType.QuestCompleted}>Quest Completed</option>
                </Input>
                
                {condition.type === MarketConditionType.MinRank && (
                    <Input as="select" label="Rank" value={condition.rankId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(index, { ...condition, rankId: e.target.value })}>
                        {ranks.sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Input>
                )}
                {condition.type === MarketConditionType.QuestCompleted && (
                    <Input as="select" label="Quest" value={condition.questId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(index, { ...condition, questId: e.target.value })}>
                        {quests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                    </Input>
                )}
                 {condition.type === MarketConditionType.DateRange && (
                    <>
                        <Input type="date" label="Start Date" value={condition.start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(index, { ...condition, start: e.target.value })} />
                        <Input type="date" label="End Date" value={condition.end} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(index, { ...condition, end: e.target.value })} />
                    </>
                )}
            </div>
             {condition.type === MarketConditionType.DayOfWeek && (
                <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Days</label>
                    <div className="flex gap-2 flex-wrap">
                        {WEEKDAYS.map((day, dayIndex) => (
                            <label key={day} className="flex items-center gap-1 text-xs">
                                <input type="checkbox" checked={condition.days.includes(dayIndex)} onChange={e => {
                                    const newDays = e.target.checked
                                        ? [...condition.days, dayIndex]
                                        : condition.days.filter(d => d !== dayIndex);
                                    updateCondition(index, { ...condition, days: newDays });
                                }} />
                                {day}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
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
                <label className="flex items-center"><input type="radio" name="status" checked={formData.status.type === 'conditional'} onChange={() => handleStatusChange({type: 'conditional', conditions: [], logic: 'all'})} /> <span className="ml-2">Conditional</span></label>
              </div>
               {formData.status.type === 'conditional' && (
                  <div className="space-y-4 pt-4 border-t border-stone-700/60">
                     <div className="flex items-center gap-4">
                         <span className="text-sm font-medium text-stone-300">Logic:</span>
                         <label className="flex items-center"><input type="radio" name="logic" checked={formData.status.logic === 'all'} onChange={() => handleStatusChange({ type: 'conditional', conditions: formData.status.conditions, logic: 'all' })} /> <span className="ml-2">All conditions met (AND)</span></label>
                         <label className="flex items-center"><input type="radio" name="logic" checked={formData.status.logic === 'any'} onChange={() => handleStatusChange({ type: 'conditional', conditions: formData.status.conditions, logic: 'any' })} /> <span className="ml-2">Any condition met (OR)</span></label>
                     </div>
                     <div className="space-y-3">{formData.status.conditions.map(renderConditionEditor)}</div>
                     <Button type="button" variant="secondary" onClick={addCondition}>+ Add Condition</Button>
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