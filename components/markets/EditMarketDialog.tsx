import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Market, MarketStatus, MarketCondition, MarketConditionType } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';

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
                 <div>
                    <Label>Condition Type</Label>
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
            </div>
        </div>
    );
  }

  return <div>Dialog Content Here</div>
};

export default EditMarketDialog;