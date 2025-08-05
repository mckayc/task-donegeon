import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GameAsset, RewardItem } from '../../types';
import Button from '../ui/Button';

interface PurchaseDialogProps {
  asset: GameAsset;
  marketId: string;
  onClose: () => void;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ asset, marketId, onClose }) => {
    const { currentUser, rewardTypes, appMode } = useAppState();
    const { purchaseMarketItem } = useAppDispatch();
    
    if (!currentUser) return null;

    const currentBalances = useMemo(() => {
        if (appMode.mode === 'personal') {
            return { purse: currentUser.personalPurse, experience: currentUser.personalExperience };
        }
        return currentUser.guildBalances[appMode.guildId] || { purse: {}, experience: {} };
    }, [currentUser, appMode]);

    const getBalance = (rewardTypeId: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === rewardTypeId);
        if (!rewardDef) return 0;
        return rewardDef.category === 'Currency'
            ? currentBalances.purse[rewardTypeId] || 0
            : currentBalances.experience[rewardTypeId] || 0;
    };
    
    const canAfford = (costGroup: RewardItem[]) => {
        return costGroup.every(c => getBalance(c.rewardTypeId) >= c.amount);
    };

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown', icon: rewardDef?.icon || '❓' };
    };

    const handlePurchase = (costGroupIndex: number) => {
        purchaseMarketItem(asset.id, marketId, costGroupIndex);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-2xl font-medieval text-accent">Purchase "{asset.name}"</h2>
                    <p className="text-stone-300 mt-1">Select your payment method.</p>
                </div>

                <div className="p-6 space-y-4">
                    {asset.costGroups.map((group, index) => {
                        const isAffordable = canAfford(group);
                        return (
                            <button
                                key={index}
                                onClick={() => handlePurchase(index)}
                                disabled={!isAffordable}
                                className="w-full text-left p-4 rounded-lg bg-stone-900/50 hover:bg-stone-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-lg font-semibold">
                                {group.map((r, rIndex) => {
                                    const info = getRewardInfo(r.rewardTypeId);
                                    return <span key={r.rewardTypeId} className="text-amber-300 flex items-center gap-1.5" title={info.name}>{r.amount} <span className="text-xl">{info.icon}</span></span>
                                })}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default PurchaseDialog;