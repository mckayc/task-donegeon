import React from 'react';
import { RewardCategory, RewardItem } from '../../../types';
import Input from '../user-interface/Input';
import Button from '../user-interface/Button';
import { useRewardValue } from '../rewards/hooks/useRewardValue';
import { useEconomyState } from '../../context/EconomyContext';

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
    
    const anchorEquivalent = useRewardValue(item.amount, item.rewardTypeId);

    return (
        <div className="flex items-center gap-2">
            <select
                value={item.rewardTypeId}
                onChange={(e) => onChange(originalIndex, 'rewardTypeId', e.target.value)}
                className="flex-grow px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
            >
                <option value="" disabled>Select...</option>
                {filteredRewardTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
            <Input type="number" min="1" step="1" value={item.amount} onChange={(e) => onChange(originalIndex, 'amount', e.target.value)} className="w-24 flex-shrink-0 no-spinner" aria-label="Amount" />
            <div className="flex-1 text-left min-w-[150px]">
                {anchorEquivalent && <span className="text-xs text-amber-300">(~{anchorEquivalent})</span>}
            </div>
            <button type="button" onClick={() => onRemove(originalIndex)} className="text-red-400 hover:text-red-300 p-2 rounded-full bg-stone-700 hover:bg-stone-600 flex-shrink-0" aria-label={`Remove item`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};


const RewardInputGroup: React.FC<RewardInputGroupProps> = ({ category, items, onChange, onAdd, onRemove }) => {
  const { rewardTypes } = useEconomyState();

  const currencyTypes = rewardTypes.filter(rt => rt.category === RewardCategory.Currency);
  const xpTypes = rewardTypes.filter(rt => rt.category === RewardCategory.XP);

  const categoryLabel = category.replace(/([A-Z])/g, ' $1').trim();
  const showAddButtons = category === 'rewards' || category === 'cost' || category === 'payout' || category === 'lateSetbacks' || category === 'incompleteSetbacks' || category === 'setbacks';
  const buttonVerb = category.toLowerCase().includes('setback') ? 'Subtract' : 'Add';

  const currencyItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => rewardTypes.find(rt => rt.id === item.rewardTypeId)?.category === RewardCategory.Currency);

  const xpItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => rewardTypes.find(rt => rt.id === item.rewardTypeId)?.category === RewardCategory.XP);

  return (
    <div className="p-4 bg-stone-900/50 rounded-lg">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <h4 className="font-semibold text-stone-200 capitalize">
          {categoryLabel} {category === 'payout' && <span className="text-sm font-normal text-stone-400">(Optional)</span>}
        </h4>
        {showAddButtons && (
            <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => onAdd(RewardCategory.Currency)} className="text-sm py-1 px-3">{buttonVerb} Currency</Button>
                <Button type="button" variant="secondary" onClick={() => onAdd(RewardCategory.XP)} className="text-sm py-1 px-3">{buttonVerb} XP</Button>
            </div>
        )}
      </div>
      
      <div className="space-y-3">
        {currencyItems.length > 0 && (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-400">Currency</label>
                {currencyItems.map(({ item, originalIndex }) => (
                    <RewardItemRow key={`currency-${originalIndex}`} item={item} originalIndex={originalIndex} filteredRewardTypes={currencyTypes} onChange={onChange} onRemove={onRemove} />
                ))}
            </div>
        )}
        {xpItems.length > 0 && (
            <div className="space-y-2">
                 <label className="block text-sm font-medium text-stone-400">XP</label>
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
