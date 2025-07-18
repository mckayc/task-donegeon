





import React from 'react';
import { RewardCategory, RewardItem } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useGameDataState } from '../../context/AppContext';

interface RewardInputGroupProps {
  category: 'rewards' | 'setbacks' | 'cost' | 'payout' | 'lateSetbacks' | 'incompleteSetbacks';
  items: RewardItem[];
  onChange: (index: number, field: keyof RewardItem, value: string | number) => void;
  onAdd: (rewardCat: RewardCategory) => void;
  onRemove: (index: number) => void;
}

const RewardInputGroup: React.FC<RewardInputGroupProps> = ({ category, items, onChange, onAdd, onRemove }) => {
  const { rewardTypes } = useGameDataState();

  return (
    <div className="p-4 bg-stone-900/50 rounded-lg">
      <h4 className="font-semibold text-stone-200 capitalize mb-3">
        {category} {category === 'payout' && <span className="text-sm font-normal text-stone-400">(Optional)</span>}
      </h4>
      {Object.values(RewardCategory).map(rewardCat => {
        const filteredRewardTypes = rewardTypes.filter(rt => rt.category === rewardCat);
        if (filteredRewardTypes.length === 0) return null;

        const categoryItems = items
          .map((item, index) => ({ item, originalIndex: index }))
          .filter(({ item }) => rewardTypes.find(rt => rt.id === item.rewardTypeId)?.category === rewardCat);
        
        const buttonText = category === 'setbacks' || category === 'lateSetbacks' || category === 'incompleteSetbacks' ? `Subtract ${rewardCat}` : `+ Add ${rewardCat}`;

        return (
          <div key={rewardCat} className="mb-3">
            <label className="block text-sm font-medium text-stone-400 mb-2">{rewardCat}</label>
            <div className="space-y-2">
              {categoryItems.map(({ item, originalIndex }) => (
                <div key={originalIndex} className="flex items-center space-x-2">
                  <select
                    value={item.rewardTypeId}
                    onChange={(e) => onChange(originalIndex, 'rewardTypeId', e.target.value)}
                    className="flex-grow px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
                  >
                    <option value="" disabled>Select...</option>
                    {filteredRewardTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                  <Input type="number" min="1" value={item.amount} onChange={(e) => onChange(originalIndex, 'amount', e.target.value)} className="w-24" aria-label="Amount" />
                  <button type="button" onClick={() => onRemove(originalIndex)} className="text-red-400 hover:text-red-300 p-2 rounded-full bg-stone-700 hover:bg-stone-600" aria-label={`Remove ${rewardCat} item`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={() => onAdd(rewardCat)} className="mt-2 text-sm py-1 px-3">{buttonText}</Button>
          </div>
        );
      })}
    </div>
  );
};

export default RewardInputGroup;