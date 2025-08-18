import React, { useState, useMemo } from 'react';
import { Guild, RewardItem, GameAsset } from '../../types';
import Button from '../user-interface/Button';
import { useData } from '../../context/DataProvider';
import { useAuthState } from '../../context/AuthContext';
import { useActionsDispatch } from '../../context/ActionsContext';
import Input from '../user-interface/Input';
import DynamicIcon from '../user-interface/DynamicIcon';

interface DonateDialogProps {
  guild: Guild;
  onClose: () => void;
}

const DonateDialog: React.FC<DonateDialogProps> = ({ guild, onClose }) => {
  const { rewardTypes, gameAssets } = useData();
  const { currentUser } = useAuthState();
  const { donateToGuild } = useActionsDispatch();
  
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  
  if (!currentUser) return null;

  const giftableItems = useMemo(() => {
    const itemCounts = currentUser.ownedAssetIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Array.from(new Set(currentUser.ownedAssetIds))
        .map(id => gameAssets.find(asset => asset.id === id))
        .filter((a): a is GameAsset => !!a && a.category.toLowerCase() !== 'avatar' && !a.category.toLowerCase().includes('theme'))
        .map(asset => ({...asset, count: itemCounts[asset.id]}));
  }, [currentUser.ownedAssetIds, gameAssets]);

  const handleRewardChange = (rewardTypeId: string, value: string) => {
    const amount = parseInt(value, 10) || 0;
    let newRewards = [...rewards];
    const maxAmount = currentUser.personalPurse[rewardTypeId] || 0;

    const cappedAmount = Math.max(0, Math.min(amount, maxAmount));

    if (cappedAmount > 0) {
        const existingIndex = newRewards.findIndex(r => r.rewardTypeId === rewardTypeId);
        if (existingIndex > -1) newRewards[existingIndex] = { ...newRewards[existingIndex], amount: cappedAmount };
        else newRewards.push({ rewardTypeId, amount: cappedAmount });
    } else {
        newRewards = newRewards.filter(r => r.rewardTypeId !== rewardTypeId);
    }
    setRewards(newRewards);
  };
  
  const handleItemToggle = (assetId: string) => {
      setAssetIds(prev => prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]);
  }

  const handleSubmit = () => {
    if (rewards.length === 0 && assetIds.length === 0) return;
    donateToGuild(guild.id, rewards, assetIds);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Donate to {guild.name}</h2>
        <p className="text-stone-400 mb-6">Contribute your personal resources to the guild treasury.</p>
        
        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
            <div>
                <h3 className="font-bold text-lg text-stone-200 mb-2">Currency</h3>
                <div className="p-4 bg-stone-900/50 rounded-lg space-y-2">
                    {rewardTypes.filter(rt => rt.category === 'Currency').map(rt => {
                        const balance = currentUser.personalPurse[rt.id] || 0;
                        if (balance === 0) return null;
                        const donatedAmount = rewards.find(r => r.rewardTypeId === rt.id)?.amount || '';
                        return (
                             <div key={rt.id} className="flex items-center gap-4">
                                <span className="text-xl w-6 text-center">{rt.icon}</span>
                                <span className="text-sm text-stone-300 flex-grow">{rt.name} (Have: {balance})</span>
                                <Input type="number" min="0" max={balance} value={donatedAmount} onChange={e => handleRewardChange(rt.id, e.target.value)} className="w-24 h-8 text-sm" />
                            </div>
                        )
                    })}
                </div>
            </div>
            <div>
                <h3 className="font-bold text-lg text-stone-200 mb-2">Items</h3>
                 <div className="p-4 bg-stone-900/50 rounded-lg">
                    {giftableItems.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                            {giftableItems.map(asset => {
                                const isSelected = assetIds.includes(asset.id);
                                return (
                                    <button key={asset.id} onClick={() => handleItemToggle(asset.id)} className={`relative p-2 rounded-lg border-2 ${isSelected ? 'border-emerald-500 bg-emerald-900/40' : 'border-transparent bg-stone-900/50'}`}>
                                        <div className="w-16 h-16 mx-auto bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                            <DynamicIcon iconType={asset.iconType} icon={asset.icon} imageUrl={asset.imageUrl} className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-xs text-stone-300 truncate mt-1">{asset.name}</p>
                                        {asset.count > 1 && <div className="absolute top-1 right-1 text-xs font-bold bg-emerald-600 text-white rounded-full size-4 flex items-center justify-center">{asset.count}</div>}
                                    </button>
                                );
                            })}
                        </div>
                    ) : <p className="text-xs text-stone-500 text-center italic">No giftable items in your inventory.</p>}
                 </div>
            </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 mt-auto">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={rewards.length === 0 && assetIds.length === 0}>Confirm Donation</Button>
        </div>
      </div>
    </div>
  );
};

export default DonateDialog;
