

import React, { useMemo, useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';
import { AvatarAsset, DigitalAsset } from '../../types';

const AvatarPage: React.FC = () => {
    const { currentUser, markets, digitalAssets } = useAppState();
    const { updateUser } = useAppDispatch();

    const { ownedAssetsBySlot, allMarketAvatarItems, availableSlots } = useMemo(() => {
        const slots = new Map<string, AvatarAsset[]>();
        const marketItems = new Map<string, string>(); // assetId -> title

        markets.forEach(market => {
            market.items.forEach(item => {
                if (item.avatarAssetPayout) {
                    marketItems.set(item.avatarAssetPayout.assetId, item.title);
                }
            });
        });
        
        currentUser?.ownedAvatarAssets?.forEach(asset => {
            const currentSlotAssets = slots.get(asset.slot) || [];
            slots.set(asset.slot, [...currentSlotAssets, asset]);
        });
        
        const slotKeys = Array.from(slots.keys());
        return { 
            ownedAssetsBySlot: slots, 
            allMarketAvatarItems: marketItems,
            availableSlots: slotKeys,
        };
    }, [currentUser?.ownedAvatarAssets, markets]);
    
    const [activeSlot, setActiveSlot] = useState<string>(availableSlots[0] || 'hair');


    if (!currentUser) {
        return <Card title="Error"><p>Could not load user data.</p></Card>;
    }
    
    const handleEquipItem = (asset: AvatarAsset) => {
        const newAvatarConfig = { ...currentUser.avatar, [asset.slot]: asset.assetId };
        updateUser(currentUser.id, { avatar: newAvatarConfig });
    };

    const assetsForActiveSlot = ownedAssetsBySlot.get(activeSlot) || [];

    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">Customize Your Avatar</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex items-center justify-center">
                    <div className="w-64 h-64 md:w-80 md:h-80">
                         <Avatar user={currentUser} className="w-full h-full" />
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <div className="border-b border-stone-700 mb-4">
                            <nav className="-mb-px flex space-x-6">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setActiveSlot(slot)}
                                        className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeSlot === slot
                                            ? 'border-emerald-500 text-emerald-400'
                                            : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-500'
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide p-1">
                            {assetsForActiveSlot.map(asset => {
                                const isEquipped = currentUser.avatar[asset.slot] === asset.assetId;
                                const fullAsset = digitalAssets.find(da => da.slot === asset.slot && da.assetId === asset.assetId);

                                return (
                                    <button
                                        key={asset.assetId}
                                        onClick={() => handleEquipItem(asset)}
                                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                                            isEquipped 
                                            ? 'bg-emerald-800/60 border-2 border-emerald-500 ring-2 ring-emerald-500/50 scale-105' 
                                            : 'bg-stone-900/50 border-2 border-transparent hover:border-emerald-600'
                                        }`}
                                    >
                                        <div className="w-20 h-20 mx-auto bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                                            {fullAsset?.imageUrl ? (
                                                <img src={fullAsset.imageUrl} alt={fullAsset.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-xs text-stone-500">No Img</div>
                                            )}
                                        </div>
                                        <p className="font-semibold text-sm text-stone-200 truncate">
                                            {allMarketAvatarItems.get(asset.assetId) || asset.assetId}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                         {assetsForActiveSlot.length === 0 && (
                            <p className="text-stone-400 text-center py-8">
                                No items owned for the '{activeSlot}' slot. Visit the Marketplace to get more!
                            </p>
                         )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AvatarPage;