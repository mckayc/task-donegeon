
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Market } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditMarketDialog from '../markets/EditMarketDialog';

const ManageMarketsPage: React.FC = () => {
    const { markets } = useAppState();
    const { deleteMarket } = useAppDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);

    const handleCreateMarket = () => {
        setEditingMarket(null);
        setIsMarketDialogOpen(true);
    };

    const handleEditMarket = (market: Market) => {
        setEditingMarket(market);
        setIsMarketDialogOpen(true);
    };

    const handleDeleteMarket = (marketId: string) => {
        if (window.confirm('Are you sure you want to delete this market? This is permanent.')) {
            deleteMarket(marketId);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Manage Markets</h1>
                <Button onClick={handleCreateMarket}>Create New Market</Button>
            </div>

            <Card title="All Markets">
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
                                    <td className="p-4 font-bold">{market.title}</td>
                                    <td className="p-4 text-stone-400">{market.description}</td>
                                    <td className="p-4 space-x-2">
                                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEditMarket(market)}>Edit</Button>
                                        <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDeleteMarket(market.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {markets.length === 0 && <p className="text-stone-400 p-4 text-center">No markets have been created yet.</p>}
            </Card>

            {isMarketDialogOpen && (
                <EditMarketDialog
                    market={editingMarket}
                    onClose={() => setIsMarketDialogOpen(false)}
                />
            )}
        </div>
    );
};

export default ManageMarketsPage;
