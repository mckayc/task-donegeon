


import React, { useState } from 'react';
import { Market } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditMarketDialog from '../markets/EditMarketDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import EmptyState from '../ui/EmptyState';
import { MarketplaceIcon } from '../ui/Icons';

const ManageMarketsPage: React.FC = () => {
    const { markets, settings } = useAppState();
    const { deleteMarket } = useAppDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [deletingMarket, setDeletingMarket] = useState<Market | null>(null);


    const handleCreateMarket = () => {
        setEditingMarket(null);
        setIsMarketDialogOpen(true);
    };

    const handleEditMarket = (market: Market) => {
        setEditingMarket(market);
        setIsMarketDialogOpen(true);
    };

    const handleDeleteRequest = (market: Market) => {
        setDeletingMarket(market);
    };

    const handleConfirmDelete = () => {
        if (deletingMarket) {
            deleteMarket(deletingMarket.id);
        }
        setDeletingMarket(null);
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-8">
                <Button onClick={handleCreateMarket}>Create New {settings.terminology.store}</Button>
            </div>

            <Card title={`All ${settings.terminology.stores}`}>
                {markets.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markets.map(market => (
                                    <tr key={market.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{market.icon} {market.title}</td>
                                        <td className="p-4 text-stone-400">{market.description}</td>
                                        <td className="p-4 space-x-2">
                                            <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditMarket(market)}>Edit</Button>
                                            <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteRequest(market)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState 
                        Icon={MarketplaceIcon}
                        title={`No ${settings.terminology.stores} Found`}
                        message={`Create a ${settings.terminology.store.toLowerCase()} to allow users to spend their currency.`}
                        actionButton={<Button onClick={handleCreateMarket}>Create {settings.terminology.store}</Button>}
                    />
                )}
            </Card>

            {isMarketDialogOpen && (
                <EditMarketDialog
                    market={editingMarket}
                    onClose={() => setIsMarketDialogOpen(false)}
                />
            )}
            
            {deletingMarket && (
                <ConfirmDialog
                    isOpen={!!deletingMarket}
                    onClose={() => setDeletingMarket(null)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${settings.terminology.store}`}
                    message={`Are you sure you want to delete the ${settings.terminology.store.toLowerCase()} "${deletingMarket.title}"? This is permanent.`}
                />
            )}
        </div>
    );
};

export default ManageMarketsPage;