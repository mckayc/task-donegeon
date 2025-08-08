import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { Market, MarketStatus, MarketCondition, MarketConditionType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';
import { useEconomyDispatch } from '../../context/EconomyContext';
import { useQuestState } from '../../context/QuestContext';

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
  const { guilds, ranks } = useAppState();
  const { quests } = useQuestState();
  const { addMarket, updateMarket } = useEconomyDispatch();
  
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
      if (formData.status.type !== 'conditional') return;
      const newCondition: MarketCondition = { type: MarketConditionType.MinRank, rankId: ranks[0]?.id || '' };
      handleStatusChange({ ...formData.status, conditions: [...formData.status.conditions, newCondition] });
  };

  const updateCondition = (index: number, newCondition: MarketCondition) => {
      if (formData.status.type !== 'conditional') return;
      const newConditions = [...formData.status.conditions];
      newConditions[index] = newCondition;
      handleStatusChange({ ...formData.status, conditions: newConditions });
  };


  const removeCondition = (index: number) => {
      if (formData.status.type !== 'conditional') return;
      handleStatusChange({ ...formData.status, conditions: formData.status.conditions.filter((_, i) => i !== index) });
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
        onClose();
        return;
    }

    if (market && mode === 'edit') {
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
                <Input as="select" label="Condition Type" value={condition.type} onChange={e => {
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
                    <Input as="select" label="Rank" value={condition.rankId} onChange={e => updateCondition(index, { ...condition, rankId: e.target.value })}>
                        {ranks.sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Input>
                )}
                 {condition.type === MarketConditionType.QuestCompleted && (
                    <Input as="select" label="Quest" value={condition.questId} onChange={e => updateCondition(index, { ...condition, questId: e.target.value })}>
                        {quests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                    </Input>
                )}
            </div>
            {condition.type === MarketConditionType.DateRange && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input type="date" label="Start Date" value={condition.start} onChange={e => updateCondition(index, { ...condition, start: e.target.value })} />
                    <Input type="date" label="End Date" value={condition.end} onChange={e => updateCondition(index, { ...condition, end: e.target.value })} />
                </div>
            )}
             {condition.type === MarketConditionType.DayOfWeek && (
                <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Days</label>
                    <div className="flex flex-wrap gap-2">{WEEKDAYS.map((day, dayIndex) => (<button type="button" key={day} onClick={() => {
                        const newDays = condition.days.includes(dayIndex) ? condition.days.filter(d => d !== dayIndex) : [...condition.days, dayIndex];
                        updateCondition(index, { ...condition, days: newDays });
                    }} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${condition.days.includes(dayIndex) ? 'btn-primary' : 'bg-stone-700 hover:bg-stone-600'}`}>{day}</button>))}</div>
                </div>
            )}
        </div>
    );
  };


  const dialogTitle = market ? 'Edit Market' : 'Create New Market';

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <Input label="Market Title" id="title" name="title" value={formData.title} onChange={handleChange} required />
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
                    <span className="text-2xl">{formData.icon}</span><span className="text-stone-300">Click to change</span>
                </button>
                {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji) => { setFormData(p => ({ ...p, icon: emoji })); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
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
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" placeholder="What is sold in this market?" />
          </div>
           <div className="p-4 bg-stone-900/50 rounded-lg">
            <h3 className="font-semibold text-stone-200 mb-2">Scope</h3>
            <select name="guildId" value={formData.guildId} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                <option value="">Personal (Available to individuals)</option>
                {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="p-4 bg-stone-900/50 rounded-lg">
             <h3 className="font-semibold text-stone-200 mb-3">Market Status</h3>
             <div className="flex space-x-4">
                 <label className="flex items-center"><input type="radio" name="statusType" value="open" checked={formData.status.type === 'open'} onChange={() => handleStatusChange({type: 'open'})} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" /> <span className="ml-2">Open</span></label>
                 <label className="flex items-center"><input type="radio" name="statusType" value="closed" checked={formData.status.type === 'closed'} onChange={() => handleStatusChange({type: 'closed'})} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" /> <span className="ml-2">Closed</span></label>
                 <label className="flex items-center"><input type="radio" name="statusType" value="conditional" checked={formData.status.type === 'conditional'} onChange={() => handleStatusChange({type: 'conditional', conditions: [], logic: 'all'})} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" /> <span className="ml-2">Conditional</span></label>
            </div>

            {formData.status.type === 'conditional' && (
                <div className="mt-4 pt-4 border-t border-stone-700/60 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">Logic</label>
                        <div className="flex space-x-4"><label className="flex items-center"><input type="radio" name="logic" value="all" checked={formData.status.logic === 'all'} onChange={() => {
                            if (formData.status.type === 'conditional') {
                                handleStatusChange({...formData.status, logic: 'all'});
                            }
                        }} className="h-4 w-4 text-emerald-600" /> <span className="ml-2">Match ALL conditions</span></label><label className="flex items-center"><input type="radio" name="logic" value="any" checked={formData.status.logic === 'any'} onChange={() => {
                            if (formData.status.type === 'conditional') {
                                handleStatusChange({...formData.status, logic: 'any'});
                            }
                        }} className="h-4 w-4 text-emerald-600" /> <span className="ml-2">Match ANY condition</span></label></div>
                    </div>
                    {formData.status.conditions.map(renderConditionEditor)}
                    <Button type="button" variant="secondary" onClick={addCondition} className="text-sm py-1 px-2">+ Add Condition</Button>
                </div>
            )}
          </div>
          <div className="flex justify-end space-x-4 pt-4">
             {mode === 'ai-creation' ? (
                 <div className="w-full flex justify-between items-center">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit">Create Market</Button>
                    </div>
                </div>
             ) : (
                <>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{onSave ? 'Save Changes' : (market ? 'Save Changes' : 'Create Market')}</Button>
                </>
             )}
          </div>
        </form>
      </div>
    </div>
     {isGalleryOpen && (
      <ImageSelectionDialog 
        onSelect={(url) => {
          setFormData(p => ({...p, imageUrl: url}));
          setIsGalleryOpen(false);
        }}
        onClose={() => setIsGalleryOpen(false)}
      />
    )}
    </>
  );
};

export default EditMarketDialog;