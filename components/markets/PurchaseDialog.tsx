import React, { useMemo } from 'react';
import { useData } from '../../context/DataProvider';
import { useActionsDispatch } from '../../context/ActionsContext';
import { useAuthState } from '../../context/AuthContext';
import { GameAsset, RewardItem, ScheduledEvent, RewardCategory } from '../../types';
import Button from '../user-interface/Button';
import { getFinalCostGroups } from '../../utils/markets';
import { useUIState } from '../../context/UIContext';

interface PurchaseDialogProps {
  asset: GameAsset;
  marketId: string;
  onClose: () => void;
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({ asset, marketId, onClose }) => {
    const { rewardTypes, scheduledEvents, markets } = useData();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { purchaseMarketItem } = useActionsDispatch();
    
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
        return rewardDef.category === RewardCategory.Currency
            ? currentBalances.purse[rewardTypeId] || 0
            : currentBalances.experience[rewardTypeId] || 0;
    };

    const finalCostGroups = getFinalCostGroups(asset.costGroups, marketId, asset.id, scheduledEvents);

    const { costOptions, getRewardInfo } = useMemo(() => {
        const rewardInfo = (id: string) => rewardTypes.find(rt => rt.id === id) || { name: 'Unknown', icon: '❓' };
        
        const options = finalCostGroups.map((group, index) => {
            const canAfford = group.every(cost => getBalance(cost.rewardTypeId) >= cost.amount);
            return {
                index,
                costItems: group,
                canAfford,
            };
        });

        return { costOptions: options, getRewardInfo: rewardInfo };
    }, [finalCostGroups, rewardTypes, getBalance]);

    const handlePurchase = (costGroupIndex: number) => {
        purchaseMarketItem(asset.id, marketId, currentUser, costGroupIndex);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Confirm Purchase</h2>
                <p className="text-lg text-stone-200 mb-6">"{asset.name}"</p>
                <div className="space-y-4">
                    <p className="text-stone-300">{asset.description}</p>
                    <div className="space-y-3">
                        {costOptions.map(({ index, costItems, canAfford }) => (
                            <div key={index} className={`p-3 rounded-lg border ${canAfford ? 'border-emerald-700 bg-emerald-900/30' : 'border-stone-700 bg-stone-900/30'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-stone-200">Cost Option {costOptions.length > 1 ? index + 1 : ''}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                                            {costItems.map(r => {
                                                const { name, icon } = getRewardInfo(r.rewardTypeId);
                                                return <span key={r.rewardTypeId} className="text-amber-300 flex items-center gap-1" title={name}>{r.amount} <span className="text-base">{icon}</span></span>;
                                            })}
                                        </div>
                                    </div>
                                    <Button onClick={() => handlePurchase(index)} disabled={!canAfford}>
                                        {canAfford ? 'Buy' : 'Cannot Afford'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDialog;
