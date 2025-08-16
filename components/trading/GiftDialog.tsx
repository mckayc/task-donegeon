import React, { useState, useMemo } from 'react';
import { Guild, User, GameAsset } from '../../types';
import { useData } from '../../context/DataProvider';
import { useActionsDispatch } from '../../context/ActionsContext';
import { useAuthState } from '../../context/AuthContext';
import Button from '../user-interface/Button';
import DynamicIcon from '../user-interface/DynamicIcon';
import ConfirmDialog from '../user-interface/ConfirmDialog';

interface GiftDialogProps {
    recipient: User;
    guild: Guild;
    onClose: () => void;
}

const GiftDialog: React.FC<GiftDialogProps> = ({ recipient, guild, onClose }) => {
    const { gameAssets } = useData();
    const { currentUser } = useAuthState();
    const { sendGift } = useActionsDispatch();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const giftableItems = useMemo(() => {
        if (!currentUser) return [];

        const itemCounts = currentUser.ownedAssetIds.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const uniqueAssets = Array.from(new Set(currentUser.ownedAssetIds))
            .map(id => gameAssets.find(asset => asset.id === id))
            .filter((asset): asset is GameAsset => 
                !!asset && asset.category.toLowerCase() !== 'avatar' && !asset.category.toLowerCase().includes('theme')
            );

        return uniqueAssets.map(asset => ({ ...asset, count: itemCounts[asset.id] }));
    }, [currentUser, gameAssets]);

    const handleInitiateGift = () => {
        if (selectedAssetId) {
            setIsConfirming(true);
        }
    };

    const handleConfirmGift = () => {
        if (currentUser && selectedAssetId) {
            sendGift(recipient.id, selectedAssetId, guild.id);
            onClose();
        }
        setIsConfirming(false);
    };

    const selectedAsset = gameAssets.find(a => a.id === selectedAssetId);

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-stone-700/60">
                        <h2 className="text-3xl font-medieval text-emerald-400">Send Gift</h2>
                        <p className="text-stone-300">To: <span className="font-bold text-accent-light">{recipient.gameName}</span></p>
                    </div>
                    
                    <div className="p-6 flex-grow overflow-y-auto scrollbar-hide">
                        {giftableItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {giftableItems.map(asset => (
                                    <button
                                        key={asset.id}
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`relative p-3 rounded-lg text-center transition-all duration-200 ${
                                            selectedAssetId === asset.id 
                                            ? 'bg-emerald-800/60 border-2 border-emerald-500 ring-2 ring-emerald-500/50 scale-105' 
                                            : 'bg-stone-900/50 border-2 border-transparent hover:border-emerald-600'
                                        }`}
                                    >
                                        {asset.count > 1 && (
                                            <div className="absolute top-1 right-1 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-stone-800">
                                                {asset.count}
                                            </div>
                                        )}
                                        <div className="w-20 h-20 mx-auto bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                                            <DynamicIcon iconType={asset.iconType} icon={asset.icon} imageUrl={asset.imageUrl} className="w-full h-full object-contain text-4xl" />
                                        </div>
                                        <p className="font-semibold text-sm text-stone-200 truncate">{asset.name}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-stone-400 text-center">You have no giftable items in your collection.</p>
                        )}
                    </div>

                    <div className="p-4 bg-black/20 rounded-b-xl flex justify-between items-center">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <div className="flex items-center gap-4">
                            {selectedAsset && <p className="text-sm text-stone-300">Sending: <span className="font-bold">{selectedAsset.name}</span></p>}
                            <Button onClick={handleInitiateGift} disabled={!selectedAssetId}>
                                Send Gift
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {isConfirming && selectedAsset && (
                <ConfirmDialog
                    isOpen={isConfirming}
                    onClose={() => setIsConfirming(false)}
                    onConfirm={handleConfirmGift}
                    title="Confirm Gift"
                    message={`Are you sure you want to gift "${selectedAsset.name}" to ${recipient.gameName}? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default GiftDialog;