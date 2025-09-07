
import React, { useState, useMemo } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import Button from '../user-interface/Button';
import { Market, GameAsset, MarketOpenStatus } from '../../types';
import PurchaseDialog from '../markets/PurchaseDialog';
import ExchangeView from '../markets/ExchangeView';
import { isMarketOpenForUser } from '../markets/utils/markets';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useProgressionState } from '../../context/ProgressionContext';
import ConditionStatusDialog from '../markets/ConditionStatusDialog';
import ArcadeView from '../markets/ArcadeView';

const MarketplacePage: React.FC = () => {
    const { settings, appliedModifiers, modifierDefinitions, scheduledEvents } = useSystemState();
    const { quests, questGroups, questCompletions } = useQuestsState();
    const { ranks, userTrophies, trophies } = useProgressionState();
    const { markets, gameAssets } = useEconomyState();
    const { guilds } = useCommunityState();
    const { currentUser } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { appMode, activeMarketId } = useUIState();
    const { setActiveMarketId } = useUIDispatch();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [viewingConditionsForMarket, setViewingConditionsForMarket] = useState<Market | null>(null);
    
    const marketDependencies = useMemo(() => ({
        appliedModifiers, modifierDefinitions, quests, ranks, questCompletions, allConditionSets: settings.conditionSets,
        userTrophies, trophies, gameAssets, guilds, questGroups, appMode
    }), [appliedModifiers, modifierDefinitions, quests, ranks, questCompletions, settings.conditionSets, userTrophies, trophies, gameAssets, guilds, questGroups, appMode]);

    const visibleMarkets = React.useMemo(() => {
        if (!currentUser) return [];
        
        return markets.map((market: Market) => {
            const isPersonalMarket = market.guildId == null;
            let shouldShow = false;

            if (appMode.mode === 'personal' && isPersonalMarket) {
                shouldShow = true;
            }
            if (appMode.mode === 'guild' && !isPersonalMarket && market.guildId === appMode.guildId) {
                shouldShow = true;
            }
            if (!shouldShow) return null;

            const status = isMarketOpenForUser(market, currentUser, marketDependencies as any);
            return { ...market, openStatus: status };

        }).filter((m): m is Market & { openStatus: MarketOpenStatus } => !!m);
    }, [markets, appMode, currentUser, marketDependencies]);

    const activeMarket = React.useMemo(() => {
        return markets.find((m: Market) => m.id === activeMarketId);
    }, [markets, activeMarketId]);


    if (activeMarket) {
        if (activeMarket.id === 'market-arcade') {
            return <ArcadeView market={activeMarket} />;
        }
        if (activeMarket.id === 'market-bank') {
            return <ExchangeView market={activeMarket} />;
        }
        
        // This part is unreachable if other market views are implemented,
        // but it's a good fallback. For now, we only have the Arcade and Exchange.
        return (
            <div>
                 <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                    &larr; Back to the {settings.terminology.shoppingCenter}
                </Button>
            </div>
        )
    }

    return (
        <div>
            {visibleMarkets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleMarkets.map((market: Market & { openStatus: MarketOpenStatus }) => {
                        const { openStatus } = market;
                        const isTrulyDisabled = openStatus.isOpen === false && openStatus.reason !== 'CONDITIONAL';

                        return (
                            <button 
                                key={market.id} 
                                onClick={() => {
                                    if (openStatus.isOpen === false) {
                                        if (openStatus.reason === 'CONDITIONAL') {
                                            setViewingConditionsForMarket(market);
                                        } else {
                                            let message = openStatus.message;
                                            if (openStatus.reason === 'SETBACK' && openStatus.redemptionQuest) {
                                                message += ` Complete your quest, '${openStatus.redemptionQuest.title}', to unlock it.`
                                            }
                                            addNotification({ type: 'error', message, duration: 8000 });
                                        }
                                    } else {
                                        setActiveMarketId(market.id);
                                    }
                                }}
                                disabled={isTrulyDisabled}
                                className={`text-left group ${isTrulyDisabled ? 'cursor-not-allowed' : ''}`}
                            >
                                <div className={`relative bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm aspect-square flex flex-col justify-center items-center ${!openStatus.isOpen ? 'opacity-50' : ''} ${!isTrulyDisabled ? 'group-hover:bg-stone-700/50 group-hover:border-accent transition-colors duration-200' : ''}`}>
                                    {!openStatus.isOpen && (
                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center z-10">
                                            <span className="text-5xl" role="img" aria-label="Locked">🔒</span>
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="size-32 mb-2 rounded-full overflow-hidden flex items-center justify-center">
                                                <div
                                                    onClick={(e) => {
                                                        if (market.iconType === 'image' && market.imageUrl) {
                                                            e.stopPropagation();
                                                            setPreviewImageUrl(market.imageUrl);
                                                        }
                                                    }}
                                                    className={`w-full h-full flex items-center justify-center ${market.iconType === 'image' && market.imageUrl ? 'cursor-pointer' : ''}`}
                                                >
                                                    <DynamicIcon 
                                                        iconType={market.iconType} 
                                                        icon={market.icon} 
                                                        imageUrl={market.imageUrl} 
                                                        className="text-7xl leading-none group-hover:scale-110 transition-transform duration-200"
                                                        altText={`${market.title} icon`}
                                                    />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-accent-light">{market.title}</h3>
                                            <p className="text-stone-400 mt-1 text-sm">{market.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
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
            {viewingConditionsForMarket && currentUser && (
                <ConditionStatusDialog
                    market={viewingConditionsForMarket}
                    user={currentUser}
                    onClose={() => setViewingConditionsForMarket(null)}
                />
            )}
        </div>
    );
};

export default MarketplacePage;
