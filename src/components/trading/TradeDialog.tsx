import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameAsset, TradeOffer, RewardItem, TradeStatus, RewardTypeDefinition, User } from '../../types';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useAuthState } from '../../context/AuthContext';
import Button from '../user-interface/Button';
import DynamicIcon from '../user-interface/DynamicIcon';
import Input from '../user-interface/Input';
import Avatar from '../user-interface/Avatar';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import NumberInput from '../user-interface/NumberInput';

interface TradeDialogProps {
    tradeOffer: TradeOffer;
    onClose: () => void;
}

const TradeOfferPanel: React.FC<{
    user: User;
    offer: { assetIds: string[]; rewards: RewardItem[] };
    isLocked: boolean;
    isMyPanel: boolean;
    onOfferChange?: (updates: { assetIds?: string[], rewards?: RewardItem[] }) => void;
}> = ({ user, offer, isLocked, isMyPanel, onOfferChange }) => {
    const { gameAssets, rewardTypes } = useEconomyState();
    const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

    const offeredAssets = useMemo(() => offer.assetIds.map(id => gameAssets.find(a => a.id === id)).filter((a): a is GameAsset => !!a), [offer.assetIds, gameAssets]);

    const handleItemToggle = (assetId: string) => {
        if (!onOfferChange) return;
        const newAssetIds = offer.assetIds.includes(assetId) ? offer.assetIds.filter(id => id !== assetId) : [...offer.assetIds, assetId];
        onOfferChange({ assetIds: newAssetIds });
    };

    const handleRewardChange = (rewardTypeId: string, amount: number) => {
        if (!onOfferChange) return;
        let newRewards = [...offer.rewards];

        if (amount > 0) {
            const existingIndex = newRewards.findIndex(r => r.rewardTypeId === rewardTypeId);
            if (existingIndex > -1) {
                newRewards[existingIndex] = { ...newRewards[existingIndex], amount };
            } else {
                newRewards.push({ rewardTypeId, amount });
            }
        } else {
            newRewards = newRewards.filter(r => r.rewardTypeId !== rewardTypeId);
        }
        onOfferChange({ rewards: newRewards });
    };
    
    const AssetSelector: React.FC<{ onToggle: (id: string) => void; selectedIds: string[] }> = ({ onToggle, selectedIds }) => {
        const ownedItems = useMemo(() => {
            return user.ownedAssetIds
                .map((id: string) => gameAssets.find((asset: GameAsset) => asset.id === id))
                .filter((asset): asset is GameAsset => !!asset && asset.category.toLowerCase() !== 'avatar' && !asset.category.toLowerCase().includes('theme'));
        }, [user.ownedAssetIds, gameAssets]);

        return (
            <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto pr-2">
                {ownedItems.map(asset => {
                    const isSelected = selectedIds.includes(asset.id);
                    return (
                        <button key={asset.id} onClick={() => onToggle(asset.id)} className={`p-2 rounded-lg border-2 ${isSelected ? 'border-emerald-500 bg-emerald-900/40' : 'border-transparent bg-stone-900/50'}`}>
                             <div className="w-16 h-16 mx-auto bg-stone-700 rounded-md flex items-center justify-center overflow-hidden">
                                <DynamicIcon iconType={asset.iconType} icon={asset.icon} imageUrl={asset.imageUrl} className="w-full h-full object-contain" />
                            </div>
                            <p className="text-xs text-stone-300 truncate mt-1">{asset.name}</p>
                        </button>
                    )
                })}
            </div>
        );
    };

    return (
        <div className={`p-4 rounded-lg h-full flex flex-col ${isLocked ? 'bg-green-900/30 border-2 border-green-700/50' : 'bg-stone-900/50'}`}>
            <h3 className="font-bold text-lg text-stone-200 mb-2">{user.gameName}'s Offer</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                <div>
                    <h4 className="font-semibold text-sm text-stone-400">Items ({offeredAssets.length})</h4>
                    <div className="min-h-[6rem] p-2 bg-black/20 rounded-md mt-1">
                        {offeredAssets.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {offeredAssets.map(asset => (
                                     <div key={asset.id} className="p-1 rounded-md bg-stone-700/50" title={asset.name}>
                                        <DynamicIcon iconType={asset.iconType} icon={asset.icon} imageUrl={asset.imageUrl} className="w-12 h-12 mx-auto object-contain" />
                                     </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-stone-500 text-center pt-5 italic">No items offered.</p>}
                    </div>
                     {!isLocked && isMyPanel && <Button size="sm" variant="secondary" onClick={() => setIsAssetSelectorOpen(p => !p)} className="mt-2 w-full text-xs">{isAssetSelectorOpen ? 'Close Selector' : 'Add/Remove Items'}</Button>}
                     {isAssetSelectorOpen && isMyPanel && <AssetSelector onToggle={handleItemToggle} selectedIds={offer.assetIds} />}
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-stone-400">Currency</h4>
                     <div className="min-h-[6rem] p-2 bg-black/20 rounded-md mt-1 space-y-2">
                        {rewardTypes.filter(rt => rt.category === 'Currency').map(rt => {
                            const offeredAmount = offer.rewards.find(r => r.rewardTypeId === rt.id)?.amount || 0;
                            if (!isMyPanel && offeredAmount === 0) return null;
                            return (
                                <div key={rt.id} className="flex items-center gap-2">
                                    <span className="text-xl w-6 text-center">{rt.icon}</span>
                                    <span className="text-sm text-stone-300 flex-grow">{rt.name}</span>
                                    {isMyPanel && !isLocked ? (
                                        <NumberInput value={offeredAmount} onChange={newValue => handleRewardChange(rt.id, newValue)} min={0} className="w-24 h-8" />
                                    ) : (
                                        <span className="font-semibold text-amber-300">{offeredAmount}</span>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                </div>
            </div>
            {isLocked && <p className="text-center font-bold text-green-300 text-sm mt-3 flex-shrink-0">Offer Locked</p>}
        </div>
    );
};

const TradeDialog: React.FC<TradeDialogProps> = ({ tradeOffer, onClose }) => {
    const { users } = useAuthState();
    const { currentUser } = useAuthState();
    const { updateTradeOffer, acceptTrade, cancelOrRejectTrade } = useEconomyDispatch();
    
    if (!currentUser || !tradeOffer) return null;

    const isInitiator = currentUser.id === tradeOffer.initiatorId;
    const otherUserId = isInitiator ? tradeOffer.recipientId : tradeOffer.initiatorId;
    const otherUser = users.find(u => u.id === otherUserId);
    
    const myOffer = isInitiator ? tradeOffer.initiatorOffer : tradeOffer.recipientOffer;
    const theirOffer = isInitiator ? tradeOffer.recipientOffer : tradeOffer.initiatorOffer;
    const isMyOfferLocked = isInitiator ? tradeOffer.initiatorLocked : tradeOffer.recipientLocked;
    const isTheirOfferLocked = isInitiator ? tradeOffer.recipientLocked : tradeOffer.initiatorLocked;

    const handleOfferChange = (updates: { assetIds?: string[], rewards?: RewardItem[]}) => {
        const newOffer = { ...myOffer, ...updates };
        const payload: Partial<TradeOffer> = isInitiator 
            ? { initiatorOffer: newOffer, status: TradeStatus.OfferUpdated, initiatorLocked: false, recipientLocked: false }
            : { recipientOffer: newOffer, status: TradeStatus.OfferUpdated, initiatorLocked: false, recipientLocked: false };
        updateTradeOffer(tradeOffer.id, payload);
    };
    
    const handleLockOffer = () => {
        const payload = isInitiator ? { initiatorLocked: true } : { recipientLocked: true };
        updateTradeOffer(tradeOffer.id, payload);
    };
    
    const handleAccept = () => acceptTrade(tradeOffer.id);
    const handleCancel = () => { cancelOrRejectTrade(tradeOffer.id, 'cancelled'); onClose(); };
    const handleReject = () => { cancelOrRejectTrade(tradeOffer.id, 'rejected'); onClose(); };
    
    const canAccept = isMyOfferLocked && isTheirOfferLocked;
    const offerWasUpdated = tradeOffer.status === TradeStatus.OfferUpdated && (!isMyOfferLocked || !isTheirOfferLocked);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-3xl font-medieval text-accent">Trade Offer</h2>
                    <p className="text-stone-300">With: <span className="font-bold text-accent-light">{otherUser?.gameName}</span></p>
                </div>

                <div className="flex-grow p-6 grid grid-cols-2 gap-6 overflow-hidden">
                    <TradeOfferPanel user={currentUser} offer={myOffer} isLocked={isMyOfferLocked} isMyPanel={true} onOfferChange={handleOfferChange} />
                    {otherUser && <TradeOfferPanel user={otherUser} offer={theirOffer} isLocked={isTheirOfferLocked} isMyPanel={false} />}
                </div>

                <div className="p-4 bg-black/20 rounded-b-xl flex-shrink-0 flex justify-between items-center">
                    <div>
                        {isInitiator && tradeOffer.status === TradeStatus.Pending && <Button variant="destructive" size="sm" onClick={handleCancel}>Cancel Offer</Button>}
                        {!isInitiator && (tradeOffer.status === TradeStatus.Pending || tradeOffer.status === TradeStatus.OfferUpdated) && <Button variant="destructive" size="sm" onClick={handleReject}>Reject Offer</Button>}
                    </div>

                    <div className="flex items-center gap-4">
                        {offerWasUpdated && <p className="text-sm font-semibold text-yellow-400">Offer was updated. Please re-lock.</p>}
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                        {!isMyOfferLocked && <Button onClick={handleLockOffer} disabled={myOffer.assetIds.length === 0 && myOffer.rewards.length === 0}>Lock Offer</Button>}
                        {isMyOfferLocked && !isTheirOfferLocked && <p className="text-sm font-semibold text-stone-400">Waiting for {otherUser?.gameName}...</p>}
                        {canAccept && <Button onClick={handleAccept}>Accept Trade</Button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeDialog;