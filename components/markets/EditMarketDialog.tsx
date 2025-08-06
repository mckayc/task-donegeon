import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Market, MarketStatus, MarketCondition, MarketConditionType, Role } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmojiPicker from '../ui/emoji-picker';
import ImageSelectionDialog from '../ui/image-selection-dialog';
import DynamicIcon from '../ui/dynamic-icon';
import { X } from 'lucide-react';

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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleStatusChange = (newStatusType: 'open' | 'closed' | 'conditional') => {
      if (newStatusType === 'conditional') {
          setFormData(p => ({...p, status: { type: 'conditional', conditions: [], logic: 'all' } }));
      } else {
          setFormData(p => ({...p, status: { type: newStatusType } }));
      }
  };
  
  const addCondition = () => {
      if (formData.status.type !== 'conditional') return;
      const newCondition: MarketCondition = { type: MarketConditionType.MinRank, rankId: ranks[0]?.id || '' };
      setFormData(p => ({...p, status: { ...p.status, conditions: [...(p.status as any).conditions, newCondition] } as MarketStatus }));
  };

  const updateCondition = (index: number, newCondition: MarketCondition) => {
      if (formData.status.type !== 'conditional') return;
      const newConditions = [...(formData.status as any).conditions];
      newConditions[index] = newCondition;
      setFormData(p => ({...p, status: { ...p.status, conditions: newConditions } as MarketStatus }));
  };

  const removeCondition = (index: number) => {
      if (formData.status.type !== 'conditional') return;
      setFormData(p => ({...p, status: { ...p.status, conditions: (p.status as any).conditions.filter((_: any, i: number) => i !== index) } as MarketStatus }));
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
        <div key={index} className="p-3 bg-background/50 rounded-md space-y-2 border">
             <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">Condition #{index + 1}</p>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(index)}><X className="w-4 h-4 text-red-400"/></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={condition.type} onValueChange={(newType: MarketConditionType) => {
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
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={MarketConditionType.MinRank}>Minimum Rank</SelectItem>
                            <SelectItem value={MarketConditionType.DayOfWeek}>Day of Week</SelectItem>
                            <SelectItem value={MarketConditionType.DateRange}>Date Range</SelectItem>
                            <SelectItem value={MarketConditionType.QuestCompleted}>Quest Completed</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 {/* ... Omitted for brevity: specific editors for each condition type ... */}
            </div>
        </div>
    );
  }

  return (
     <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{market ? 'Edit Market' : 'Create New Market'}</DialogTitle>
             {mode === 'ai-creation' && <DialogDescription>Review and adjust the AI-generated details below.</DialogDescription>}
          </DialogHeader>
          <form id="market-form" onSubmit={handleSubmit} className="space-y-4 py-4 overflow-y-auto pr-6">
            <div className="space-y-2">
                <Label htmlFor="market-title">Title</Label>
                <Input id="market-title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="market-desc">Description</Label>
                <Textarea id="market-desc" name="description" value={formData.description} onChange={handleChange} />
            </div>
            {/* ... Icon selection logic ... */}
             <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={formData.guildId} onValueChange={(v) => handleSelectChange('guildId', v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Personal</SelectItem>
                        {guilds.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 pt-4 border-t">
                <Label>Market Status</Label>
                <div className="flex gap-2">
                    <Button type="button" variant={formData.status.type === 'open' ? 'default' : 'secondary'} onClick={() => handleStatusChange('open')}>Open</Button>
                    <Button type="button" variant={formData.status.type === 'closed' ? 'default' : 'secondary'} onClick={() => handleStatusChange('closed')}>Closed</Button>
                    <Button type="button" variant={formData.status.type === 'conditional' ? 'default' : 'secondary'} onClick={() => handleStatusChange('conditional')}>Conditional</Button>
                </div>
            </div>
            {formData.status.type === 'conditional' && (
                <div className="p-4 bg-background rounded-lg border space-y-3">
                    {/* ... Conditional logic form ... */}
                </div>
            )}
          </form>
           <DialogFooter>
             {mode === 'ai-creation' ? (
                <div className="w-full flex justify-between items-center">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit" form="market-form">Create Market</Button>
                    </div>
                </div>
             ) : (
                <>
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="market-form">{onSave ? 'Save Changes' : (market ? 'Save Changes' : 'Create Market')}</Button>
                </>
             )}
            </DialogFooter>
        </DialogContent>
     </Dialog>
  )
};

export default EditMarketDialog;
