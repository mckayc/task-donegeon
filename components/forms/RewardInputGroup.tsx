import React from 'react';
import { RewardCategory, RewardItem } from '../../types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useAppState } from '../../context/AppContext';
import { useAnchorEquivalent } from '../../hooks/useRewardValue';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/Label';

interface RewardInputGroupProps {
  category: 'rewards' | 'setbacks' | 'cost' | 'payout' | 'lateSetbacks' | 'incompleteSetbacks';
  items: RewardItem[];
  onChange: (index: number, field: keyof RewardItem, value: string | number) => void;
  onAdd: (rewardCat: RewardCategory) => void;
  onRemove: (index: number) => void;
}

const RewardItemRow: React.FC<{
    item: RewardItem;
    originalIndex: number;
    filteredRewardTypes: { id: string; name: string }[];
    onChange: (index: number, field: keyof RewardItem, value: string | number) => void;
    onRemove: (index: number) => void;
}> = ({ item, originalIndex, filteredRewardTypes, onChange, onRemove }) => {
    
    const anchorEquivalent = useAnchorEquivalent(item.amount, item.rewardTypeId);

    return (
        <div className="flex items-center gap-2">
            <Select onValueChange={(value) => onChange(originalIndex, 'rewardTypeId', value)} defaultValue={item.rewardTypeId}>
                <SelectTrigger className="flex-grow"><SelectValue placeholder="Select..."/></SelectTrigger>
                <SelectContent>
                    {filteredRewardTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Input type="number" min="1" value={item.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(originalIndex, 'amount', e.target.value)} className="w-24 flex-shrink-0" aria-label="Amount" />
            <div className="flex-1 text-left min-w-[150px]">
                {anchorEquivalent && <span className="text-xs text-amber-300">{anchorEquivalent}</span>}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(originalIndex)} className="text-red-400 hover:text-red-300 flex-shrink-0" aria-label={`Remove item`}>
                <X className="h-4 w-4"/>
            </Button>
        </div>
    );
};


const RewardInputGroup: React.FC<RewardInputGroupProps> = ({ category, items, onChange, onAdd, onRemove }) => {
  const { rewardTypes } = useAppState();

  const currencyTypes = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);
  const xpTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);

  const categoryLabel = category.replace(/([A-Z])/g, ' $1').trim();
  const showAddButtons = category === 'rewards' || category === 'cost' || category === 'payout' || category === 'lateSetbacks' || category === 'incompleteSetbacks';
  const buttonVerb = category.toLowerCase().includes('setback') ? 'Subtract' : 'Add';

  const currencyItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => rewardTypes.find(rt => rt.id === item.rewardTypeId)?.category === RewardCategory.Currency);

  const xpItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => rewardTypes.find(rt => rt.id === item.rewardTypeId)?.category === RewardCategory.XP);

  return (
    <div className="p-4 bg-background rounded-lg">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h4 className="font-semibold text-foreground capitalize">
          {categoryLabel} {category === 'payout' && <span className="text-sm font-normal text-muted-foreground">(Optional)</span>}
        </h4>
        {showAddButtons && (
            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onAdd(RewardCategory.Currency)}>{buttonVerb} Currency</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onAdd(RewardCategory.XP)}>{buttonVerb} XP</Button>
            </div>
        )}
      </div>
      
      <div className="space-y-3">
        {currencyItems.length > 0 && (
            <div className="space-y-2">
                <Label className="block text-sm font-medium text-muted-foreground">Currency</Label>
                {currencyItems.map(({ item, originalIndex }) => (
                    <RewardItemRow key={`currency-${originalIndex}`} item={item} originalIndex={originalIndex} filteredRewardTypes={currencyTypes} onChange={onChange} onRemove={onRemove} />
                ))}
            </div>
        )}
        {xpItems.length > 0 && (
            <div className="space-y-2">
                 <Label className="block text-sm font-medium text-muted-foreground">XP</Label>
                {xpItems.map(({ item, originalIndex }) => (
                    <RewardItemRow key={`xp-${originalIndex}`} item={item} originalIndex={originalIndex} filteredRewardTypes={xpTypes} onChange={onChange} onRemove={onRemove} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default RewardInputGroup;