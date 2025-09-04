
import React, { useMemo } from 'react';
import { Market, Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { MarketplaceIcon, PencilIcon, CopyIcon, TrashIcon } from '../user-interface/Icons';

interface MarketTableProps {
    markets: Market[];
    selectedMarkets: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onEdit: (market: Market) => void;
    onClone: (marketId: string) => void;
    onDeleteRequest: (ids: string[]) => void;
    terminology: Terminology;
    onCreate: () => void;
}

const MarketTable: React.FC<MarketTableProps> = ({
    markets,
    selectedMarkets,
    onSelectAll,
    onSelectOne,
    onEdit,
    onClone,
    onDeleteRequest,
    terminology,
    onCreate,
}) => {
    if (markets.length === 0) {
        return (
            <EmptyState 
                Icon={MarketplaceIcon}
                title={`No ${terminology.stores} Found`}
                message={`Create a ${terminology.store.toLowerCase()} to allow users to spend their currency.`}
                actionButton={<Button onClick={onCreate}>Create {terminology.store}</Button>}
            />
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12"><input type="checkbox" onChange={onSelectAll} checked={selectedMarkets.length === markets.length && markets.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                        <th className="p-4 font-semibold">Title</th>
                        <th className="p-4 font-semibold hidden md:table-cell">Description</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {markets.map(market => {
                        const isBank = market.id === 'market-bank';
                        const status = market.status;
                        const statusConfig = {
                            open: { text: 'Open', color: 'bg-green-500/20 text-green-300' },
                            closed: { text: 'Closed', color: 'bg-stone-500/20 text-stone-300' },
                            conditional: { text: 'Conditionally Open', color: 'bg-blue-500/20 text-blue-300' },
                        };

                        return (
                            <tr key={market.id} className="border-b border-stone-700/40 last:border-b-0">
                                <td className="p-4">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedMarkets.includes(market.id)} 
                                        onChange={(e) => onSelectOne(e, market.id)} 
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                    />
                                </td>
                                <td className="p-4 font-bold">
                                    <button onClick={() => onEdit(market)} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-2">
                                        {market.icon} {market.title}
                                    </button>
                                </td>
                                <td className="p-4 text-stone-400 hidden md:table-cell">{market.description}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusConfig[status.type].color}`}>
                                        {statusConfig[status.type].text}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(market)} className="h-8 w-8 text-stone-400 hover:text-white">
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Clone" onClick={() => onClone(market.id)} className="h-8 w-8 text-stone-400 hover:text-white" disabled={isBank}>
                                            <CopyIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([market.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50" disabled={isBank}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default MarketTable;