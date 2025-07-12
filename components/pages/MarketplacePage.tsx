import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import { PurchaseRequestStatus, RewardCategory, Market, MarketItem } from '../../types';

const MarketItemView: React.FC<{ market: Market }> = ({ market }) => {
    const { rewardTypes, currentUser, purchaseRequests, appMode, settings } = useAppState();
    const { purchaseMarketItem, cancelPurchaseRequest } = useAppDispatch();
    const [sortBy, setSortBy] = useState<'default' | 'title-asc' | 'title-desc' | 'cost-low' | 'cost-high'>('default');

    if (!currentUser) return null;

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

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

    const canAfford = (cost: { rewardTypeId: string; amount: number }[]) => {
        return cost.every(c => getBalance(c.rewardTypeId) >= c.amount);
    };
    
    const isEquipped = (item: MarketItem) => {
        if (!item.avatarAssetPayout) return false;
        return currentUser.avatar[item.avatarAssetPayout.slot] === item.avatarAssetPayout.assetId;
    };

    const sortedItems = useMemo(() => {
        const getSortCost = (item: MarketItem): number => {
            if (item.cost.length === 0) return 0;
            const goldCost = item.cost.find(c => c.rewardTypeId === 'core-gold');
            if (goldCost) return goldCost.amount * 1000;
            const gemCost = item.cost.find(c => c.rewardTypeId === 'core-gems');
            if (gemCost) return gemCost.amount * 100;
            const crystalCost = item.cost.find(c => c.rewardTypeId === 'core-crystal');
            if (crystalCost) return crystalCost.amount * 10;
            return item.cost[0].amount;
        };

        const items = [...market.items];

        switch (sortBy) {
            case 'title-asc':
                return items.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc':
                return items.sort((a, b) => b.title.localeCompare(a.title));
            case 'cost-low':
                return items.sort((a, b) => getSortCost(a) - getSortCost(b));
            case 'cost-high':
                return items.sort((a, b) => getSortCost(b) - getSortCost(a));
            case 'default':
            default:
                return items;
        }
    }, [market.items, sortBy]);

    return (
        <Card 
            title={`${market.icon || '🛒'} ${market.title}`}
            headerAction={
                <div className="flex items-center gap-2">
                    <label htmlFor="sort-market-items" className="text-sm font-medium text-stone-400">Sort by:</label>
                    <select
                        id="sort-market-items"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                    >
                        <option value="default">Default</option>
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="cost-low">Cost (Low-High)</option>
                        <option value="cost-high">Cost (High-Low)</option>
                    </select>
                </div>
            }
        >
            <p className="text-stone-400 mb-6 -mt-2">{market.description}</p>
            {sortedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedItems.map(item => {
                        const existingRequest = purchaseRequests.find(p => 
                            p.userId === currentUser.id && 
                            p.itemId === item.id && 
                            p.status === PurchaseRequestStatus.Pending &&
                            p.guildId === market.guildId
                        );
                        
                        const equipped = isEquipped(item);
                        const costRewards = item.cost.map(c => ({...getRewardInfo(c.rewardTypeId), amount: c.amount, rewardTypeId: c.rewardTypeId }));
                        const payoutRewards = item.payout.map(p => ({...getRewardInfo(p.rewardTypeId), amount: p.amount, rewardTypeId: p.rewardTypeId }));

                        return (
                             <div key={item.id} className="bg-violet-900/30 border-2 border-violet-700/60 rounded-xl shadow-lg flex flex-col h-full">
                                <div className="p-4 border-b border-white/10">
                                    <h4 className="font-bold text-lg text-stone-100">{item.title}</h4>
                                    <p className="text-stone-300 text-sm mt-1">{item.description}</p>
                                </div>

                                <div className="p-4 flex-grow space-y-4">
                                    {costRewards.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Cost</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                                                {costRewards.map(r => (
                                                    <span key={r.rewardTypeId} className="text-amber-300 flex items-center gap-1" title={r.name}>
                                                        - {r.amount} <span className="text-base">{r.icon}</span> 
                                                        <span className="text-xs text-stone-400 font-normal">(Have: {getBalance(r.rewardTypeId)})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {payoutRewards.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-accent/80 uppercase tracking-wider">Payout</p>
                                             <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                                                {payoutRewards.map(r => (
                                                    <span key={r.rewardTypeId} className="text-accent-light flex items-center gap-1" title={r.name}>
                                                        + {r.amount} <span className="text-base">{r.icon}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {item.avatarAssetPayout && (
                                        <div>
                                            <p className="text-xs font-semibold text-sky-400/80 uppercase tracking-wider">Unlocks Cosmetic</p>
                                            <p className="text-sky-300 text-sm font-semibold mt-1">{item.avatarAssetPayout.assetId}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 mt-auto bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
                                     {existingRequest ? (
                                        <>
                                            <Button className="text-sm py-1 px-3" disabled>Pending</Button>
                                            <Button 
                                                variant="secondary" 
                                                className="text-sm py-1 px-3 !bg-orange-800/60 hover:!bg-orange-700/70 text-orange-200"
                                                onClick={() => cancelPurchaseRequest(existingRequest.id)}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : equipped ? (
                                        <Button className="text-sm py-1 px-3" disabled>Equipped</Button>
                                    ) : (
                                        <Button 
                                            className="text-sm py-1 px-3"
                                            disabled={!canAfford(item.cost)}
                                            onClick={() => purchaseMarketItem(market.id, item.id)}
                                        >
                                            Purchase
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-stone-400 text-center">This {settings.terminology.store.toLowerCase()} has no items for sale.</p>
            )}
        </Card>
    );
};


const MarketplacePage: React.FC = () => {
    const { markets, appMode, activeMarketId, settings } = useAppState();
    const { setActiveMarketId } = useAppDispatch();
    
    const visibleMarkets = React.useMemo(() => {
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        return markets.filter(market => market.guildId === currentGuildId);
    }, [markets, appMode]);

    const activeMarket = React.useMemo(() => {
        return markets.find(m => m.id === activeMarketId);
    }, [markets, activeMarketId]);


    if (activeMarket) {
        return (
            <div>
                 <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                    &larr; Back to the {settings.terminology.shoppingCenter}
                </Button>
                <MarketItemView market={activeMarket} />
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">{settings.terminology.shoppingCenter}</h1>
            {visibleMarkets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleMarkets.map(market => (
                        <button key={market.id} onClick={() => setActiveMarketId(market.id)} className="text-left">
                            <Card className="h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200">
                                <div className="flex flex-col items-center text-center">
                                    <span className="text-5xl mb-4">{market.icon || '🛒'}</span>
                                    <h3 className="text-xl font-bold text-accent-light">{market.title}</h3>
                                    <p className="text-stone-400 mt-2 flex-grow">{market.description}</p>
                                </div>
                            </Card>
                        </button>
                    ))}
                </div>
            ) : (
                 <Card>
                    <p className="text-stone-400 text-center">There are no {settings.terminology.stores.toLowerCase()} available in this mode.</p>
                </Card>
            )}
        </div>
    );
};

export default MarketplacePage;