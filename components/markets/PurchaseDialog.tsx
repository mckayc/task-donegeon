import React, { useMemo } from 'react';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIState } from '../../context/UIStateContext';
import { GameAsset, RewardItem, ScheduledEvent } from '../../types';
import Button from '../user-interface/Button';
import { toYMD } from '../../utils/quests';

interface PurchaseDialogProps {
  asset: GameAsset;
  marketId: string;
  onClose: () => void;
  scheduledEvents: ScheduledEvent[];
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ asset, marketId, onClose, scheduledEvents }) => {
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const { purchaseMarketItem } = useEconomyDispatch();
    
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

    const getFinalCostGroups = () => {
        const todayYMD = toYMD(new Date());
        const activeSaleEvent = scheduledEvents.find(event => 
            event.eventType === 'MarketSale' && event.modifiers.marketId === marketId &&
            todayYMD >= event.startDate && todayYMD <= event.endDate &&
            (!event.modifiers.assetIds || event.modifiers.assetIds.length === 0 || event.modifiers.assetIds.includes(asset.id))
        );

        if (activeSaleEvent && activeSaleEvent.modifiers.discountPercent) {
            const discount = activeSaleEvent.modifiers.discountPercent / 100;
            return asset.costGroups.map(group =>
                group.map(c => ({ ...c, amount: Math.max(0, Math.ceil(c.amount * (1 - discount))) }))
            );
        }
        return asset.costGroups;
    };

    const finalCostGroups = getFinalCostGroups();
    
    const canAfford = (costGroup: RewardItem[]) => {
        return costGroup.every(c => getBalance(c.rewardTypeId) >= c.amount);
    };

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown', icon: rewardDef?.icon || '❓' };
    };

    const handlePurchase = (costGroupIndex: number) => {
        // Pass scheduledEvents to the dispatch function
        purchaseMarketItem(asset.id, marketId, currentUser, costGroupIndex, scheduledEvents);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-2xl font-medieval text-accent">Purchase "{asset.name}"</h2>
                    <p className="text-stone-300 mt-1">Select your payment method.</p>
                </div>

                <div className="p-6 space-y-4">
                    {finalCostGroups.map((group, index) => {
                        const isAffordable = canAfford(group);
                        const originalGroup = asset.costGroups[index];
                        const hasDiscount = JSON.stringify(group) !== JSON.stringify(originalGroup);

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
                                    const originalCost = originalGroup[rIndex].amount;
                                    return (
                                    <span key={r.rewardTypeId} className={`text-amber-300 flex items-center gap-1.5`} title={info.name}>
                                        {hasDiscount && <span className="line-through text-amber-300/60 text-base">{originalCost}</span>}
                                        {r.amount} 
                                        <span className="text-xl">{info.icon}</span>
                                    </span>
                                    )
                                })}
                                </div>
                            </button>
                        )
                    })}
                </div>
                 <div className="p-4 bg-black/20 rounded-b-xl flex justify-end items-center gap-2 flex-wrap">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDialog;