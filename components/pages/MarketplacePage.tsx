import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import Button from '../ui/Button';
import { PurchaseRequestStatus, RewardCategory, Market, GameAsset, RewardItem, ScheduledEvent, IAppData } from '../../types';
import PurchaseDialog from '../markets/PurchaseDialog';
import ExchangeView from '../markets/ExchangeView';
import { isMarketOpenForUser } from '../../utils/markets';
import ImagePreviewDialog from '../ui/ImagePreviewDialog';
import DynamicIcon from '../ui/DynamicIcon';
import { toYMD } from '../../utils/quests';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';

const MarketItemView: React.FC<{ market: Market }> = ({ market }) => {
    const { settings, scheduledEvents } = useAppState();
    const { rewardTypes, gameAssets } = useEconomyState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const [sortBy, setSortBy] = useState<'default' | 'title-asc' | 'title-desc'>('default');
    const [itemToPurchase, setItemToPurchase] = useState<GameAsset | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    if (!currentUser) return null;

    const itemsForSale = useMemo(() => {
        return gameAssets.filter(asset => asset.isForSale && asset.marketIds.includes(market.id));
    }, [gameAssets, market.id]);

    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const sortedItems = useMemo(() => {
        const items = [...itemsForSale];
        switch (sortBy) {
            case 'title-asc': return items.sort((a, b) => a.name.localeCompare(b.name));
            case 'title-desc': return items.sort((a, b) => b.name.localeCompare(a.name));
            default: return items;
        }
    }, [itemsForSale, sortBy]);
    
    const activeSaleEvent = useMemo(() => {
        const todayYMD = toYMD(new Date());
        return scheduledEvents.find(event => 
            event.eventType === 'MarketSale' &&
            event.modifiers.marketId === market.id &&
            todayYMD >= event.startDate &&
            todayYMD <= event.endDate &&
            event.guildId === market.guildId
        );
    }, [scheduledEvents, market.id, market.guildId]);

    const ItemCard: React.FC<{ asset: GameAsset }> = ({ asset }) => {
        const saleForThisItem = useMemo(() => {
            if (!activeSaleEvent) return null;
            if (!activeSaleEvent.modifiers.assetIds || activeSaleEvent.modifiers.assetIds.length === 0 || activeSaleEvent.modifiers.assetIds.includes(asset.id)) {
                return activeSaleEvent;
            }
            return null;
        }, [asset.id]);

        const getDiscountedCostGroups = (costGroups: RewardItem[][], sale: ScheduledEvent | null): RewardItem[][] => {
            if (!sale || !sale.modifiers.discountPercent) return costGroups;
            const discount = sale.modifiers.discountPercent / 100;
            return costGroups.map(group =>
                group.map(cost => ({
                    ...cost,
                    amount: Math.max(0, Math.ceil(cost.amount * (1 - discount)))
                }))
            );
        };

        const finalCostGroups = useMemo(() => getDiscountedCostGroups(asset.costGroups, saleForThisItem), [saleForThisItem, asset.costGroups]);
        
        const canAffordAny = useMemo(() => {
            if (!currentUser) return false;
            
            let balances: { purse: { [key: string]: number }, experience: { [key: string]: number } };
            
            if (appMode.mode === 'guild') {
                balances = currentUser.guildBalances[appMode.guildId] || { purse: {}, experience: {} };
            } else {
                balances = { purse: currentUser.personalPurse, experience: currentUser.personalExperience };
            }
            
            const getBalance = (rewardTypeId: string): number => {
                const rewardDef = rewardTypes.find(rt => rt.id === rewardTypeId);
                if (!rewardDef) return 0;
                return (rewardDef.category === 'Currency' ? balances.purse[rewardTypeId] : balances.experience[rewardTypeId]) || 0;
            };

            return finalCostGroups.some(group => 
                group.every(costItem => getBalance(costItem.rewardTypeId) >= costItem.amount)
            );
        }, [currentUser, appMode, finalCostGroups, rewardTypes]);

        const userPurchaseCount = currentUser.ownedAssetIds.filter(id => id === asset.id).length;
        const isSoldOut = asset.purchaseLimit !== null && asset.purchaseLimitType === 'Total' && asset.purchaseCount >= asset.purchaseLimit;
        const isUserLimitReached = asset.purchaseLimit !== null && asset.purchaseLimitType === 'PerUser' && userPurchaseCount >= asset.purchaseLimit;
        const canPurchase = !isSoldOut && !isUserLimitReached;

        let buttonText = 'Purchase';
        if (isSoldOut) buttonText = 'Sold Out';
        else if (isUserLimitReached) buttonText = 'Limit Reached';
        else if (!canAffordAny) buttonText = "Can't Afford";

        return (
             <div className={`relative bg-violet-900/30 border-2 border-violet-700/60 rounded-xl shadow-lg flex flex-col h-full ${!canPurchase || !canAffordAny ? 'opacity-60' : ''}`}>
                {saleForThisItem && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        {saleForThisItem.modifiers.discountPercent}% OFF
                    </div>
                )}
                <div className="p-4 border-b border-white/10">
                    <button
                        onClick={() => setPreviewImageUrl(asset.url)}
                        className="w-full h-32 bg-black/20 rounded-md mb-3 flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500 ring-offset-2 ring-offset-violet-900/30"
                        aria-label={`View larger image of ${asset.name}`}
                    >
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                    </button>
                    <h4 className="font-bold text-lg text-stone-100">{asset.name}</h4>
                    <p className="text-stone-300 text-sm mt-1">{asset.description}</p>
                </div>

                <div className="p-4 flex-grow space-y-4">
                    {asset.costGroups.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Cost</p>
                            <div className="space-y-2 mt-1">
                                {asset.costGroups.map((group, index) => (
                                    <div key={index}>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
                                            {group.map((r, rIndex) => {
                                                const info = getRewardInfo(r.rewardTypeId);
                                                const finalCost = finalCostGroups[index][rIndex].amount;
                                                return (
                                                    <span key={r.rewardTypeId} className={`text-amber-300 flex items-center gap-1 ${saleForThisItem ? 'line-through text-amber-300/60' : ''}`} title={info.name}>
                                                        {r.amount} <span className="text-base">{info.icon}</span>
                                                        {saleForThisItem && <span className="text-green-400 font-bold no-underline ml-1">{finalCost} {info.icon}</span>}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                        {index < asset.costGroups.length - 1 && <p className="text-center text-xs font-bold text-stone-400 my-1">OR</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                 <div className="text-xs text-stone-400 px-4 pb-2">
                    {asset.purchaseLimit !== null && asset.purchaseLimitType === 'Total' && <span>Limit: {asset.purchaseLimit} total ({asset.purchaseLimit - asset.purchaseCount} left)</span>}
                    {asset.purchaseLimit !== null && asset.purchaseLimitType === 'PerUser' && <span>Limit: {asset.purchaseLimit} per person (You own: {userPurchaseCount})</span>}
                    {asset.requiresApproval && <span className="block text-sky-300 font-semibold">Requires Approval</span>}
                </div>

                <div className="p-3 mt-auto bg-black/20 border-t border-white/10 flex items-center justify-end gap-2">
                     <Button className="text-sm py-1 px-3" onClick={() => setItemToPurchase(asset)} disabled={!canPurchase || !canAffordAny}>
                        {buttonText}
                    </Button>
                </div>
            </div>
        )
    };

    return (
        <>
            <Card 
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
                            <option value="title-asc">Name (A-Z)</option>
                            <option value="title-desc">Name (Z-A)</option>
                        </select>
                    </div>
                }
            >
                <p className="text-stone-400 mb-6 -mt-2">{market.description}</p>
                {sortedItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sortedItems.map(asset => <ItemCard key={asset.id} asset={asset} />)}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center">This {settings.terminology.store.toLowerCase()} has no items for sale.</p>
                )}
            </Card>
            {itemToPurchase && (
                <PurchaseDialog
                    asset={itemToPurchase}
                    marketId={market.id}
                    onClose={() => setItemToPurchase(null)}
                    scheduledEvents={scheduledEvents}
                />
            )}
            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Market item preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </>
    );
};


const MarketplacePage: React.FC = () => {
    const appState = useAppState();
    const authState = useAuthState();
    const questsState = useQuestsState();
    const economyState = useEconomyState();
    const { settings } = appState;
    const { markets } = economyState;
    const { currentUser } = authState;
    const { appMode, activeMarketId } = useUIState();
    const { setActiveMarketId } = useUIDispatch();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    
    const visibleMarkets = React.useMemo(() => {
        if (!currentUser) return [];
        
        const fullAppDataForCheck: IAppData = { ...appState, ...authState, ...questsState, ...economyState };
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        return markets.filter(market => 
            market.guildId === currentGuildId && isMarketOpenForUser(market, currentUser, fullAppDataForCheck)
        );
    }, [markets, appMode, currentUser, appState, authState, questsState, economyState]);

    const activeMarket = React.useMemo(() => {
        return markets.find(m => m.id === activeMarketId);
    }, [markets, activeMarketId]);


    if (activeMarket) {
        // Dedicated view for the exchange
        if (activeMarket.id === 'market-bank') {
            return <ExchangeView market={activeMarket} />;
        }
        
        // Standard view for all other markets
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
            {visibleMarkets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleMarkets.map(market => (
                        <button key={market.id} onClick={() => setActiveMarketId(market.id)} className="text-left">
                            <Card className="h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 mb-4 rounded-full overflow-hidden">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (market.iconType === 'image' && market.imageUrl) {
                                                    setPreviewImageUrl(market.imageUrl);
                                                }
                                            }}
                                            disabled={market.iconType !== 'image' || !market.imageUrl}
                                            className="w-full h-full disabled:cursor-default"
                                        >
                                            <DynamicIcon 
                                                iconType={market.iconType} 
                                                icon={market.icon} 
                                                imageUrl={market.imageUrl} 
                                                className="w-full h-full text-5xl"
                                                altText={`${market.title} icon`}
                                            />
                                        </button>
                                    </div>
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

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Market icon preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default MarketplacePage;