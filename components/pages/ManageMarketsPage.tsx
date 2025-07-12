import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Market, MarketItem } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditMarketDialog from '../markets/EditMarketDialog';
import EditMarketItemDialog from '../markets/EditMarketItemDialog';

const ManageMarketsPage: React.FC = () => {
    const { markets, rewardTypes } = useAppState();
    const { deleteMarket, deleteMarketItem } = useAppDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ marketId: string; item: MarketItem | null }>({ marketId: '', item: null });

    const handleCreateMarket = () => {
        setEditingMarket(null);
        setIsMarketDialogOpen(true);
    };

    const handleEditMarket = (market: Market) => {
        setEditingMarket(market);
        setIsMarketDialogOpen(true);
    };

    const handleDeleteMarket = (marketId: string) => {
        if (window.confirm('Are you sure you want to delete this entire market and all its items? This is permanent.')) {
            deleteMarket(marketId);
        }
    };
    
    const handleCreateItem = (marketId: string) => {
        setEditingItem({ marketId, item: null });
        setIsItemDialogOpen(true);
    };
    
    const handleEditItem = (marketId: string, item: MarketItem) => {
        setEditingItem({ marketId, item });
        setIsItemDialogOpen(true);
    };
    
    const handleDeleteItem = (marketId: string, itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            deleteMarketItem(marketId, itemId);
        }
    };

    const getRewardDisplay = (id: string) => {
        const reward = rewardTypes.find(rt => rt.id === id);
        return { name: reward?.name || 'Unknown', icon: reward?.icon || '❓' };
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Manage Markets</h1>
                <Button onClick={handleCreateMarket}>Create New Market</Button>
            </div>

            <div className="space-y-8">
                {markets.map(market => (
                    <Card key={market.id}>
                        <div className="px-6 py-4 border-b border-stone-700/60 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-medieval text-emerald-400">{market.title}</h3>
                                <p className="text-stone-400 text-sm">{market.description}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditMarket(market)}>Edit Market</Button>
                                <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteMarket(market.id)}>Delete Market</Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <h4 className="font-bold text-lg mb-4 text-stone-200">Items in this Market</h4>
                            <div className="space-y-3">
                                {market.items.map(item => (
                                    <div key={item.id} className="bg-stone-900/40 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-stone-100">{item.title}</p>
                                            <p className="text-xs text-stone-400">
                                                Cost: {item.cost.map(c => `${c.amount} ${getRewardDisplay(c.rewardTypeId).icon}`).join(' + ') || 'Free'}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditItem(market.id, item)}>Edit Item</Button>
                                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteItem(market.id, item.id)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             {market.items.length === 0 && <p className="text-stone-400">No items yet.</p>}
                             <Button onClick={() => handleCreateItem(market.id)} className="mt-4 text-sm py-1 px-3">+ Add Item</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {isMarketDialogOpen && (
                <EditMarketDialog
                    market={editingMarket}
                    onClose={() => setIsMarketDialogOpen(false)}
                />
            )}
             {isItemDialogOpen && (
                <EditMarketItemDialog
                    marketId={editingItem.marketId}
                    itemToEdit={editingItem.item || undefined}
                    onClose={() => setIsItemDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default ManageMarketsPage;