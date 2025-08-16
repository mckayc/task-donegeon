import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Market } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditMarketDialog from '../../markets/EditMarketDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import EmptyState from '../../user-interface/EmptyState';
import { MarketplaceIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import MarketIdeaGenerator from '../../quests/MarketIdeaGenerator';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const ManageMarketsPage: React.FC = () => {
    const { settings, isAiConfigured, markets } = useAppState();
    const { deleteSelectedAssets, updateMarketsStatus, cloneMarket } = useAppDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; icon: string; } | null>(null);
    
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'open' | 'close', ids: string[] } | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
    
    const marketIds = useMemo(() => markets.map(m => m.id), [markets]);
    const handleCheckboxClick = useShiftSelect(marketIds, selectedMarkets, setSelectedMarkets);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateMarket = () => {
        setEditingMarket(null);
        setInitialCreateData(null);
        setIsMarketDialogOpen(true);
    };

    const handleEditMarket = (market: Market) => {
        setEditingMarket(market);
        setInitialCreateData(null);
        setIsMarketDialogOpen(true);
    };

    const handleUseIdea = (idea: { title: string; description: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingMarket(null);
        setIsMarketDialogOpen(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedMarkets(markets.map(m => m.id));
        } else {
            setSelectedMarkets([]);
        }
    };
    
    const handleConfirmAction = () => {
        if (!confirmation) return;
        
        switch(confirmation.action) {
            case 'delete':
                deleteSelectedAssets({ markets: confirmation.ids });
                break;
            case 'open':
                updateMarketsStatus(confirmation.ids, 'open');
                break;
            case 'close':
                updateMarketsStatus(confirmation.ids, 'closed');
                break;
        }

        setSelectedMarkets([]);
        setConfirmation(null);
    };

    const getConfirmationMessage = () => {
        if (!confirmation) return '';
        const count = confirmation.ids.length;
        const item = count > 1 ? settings.terminology.stores.toLowerCase() : settings.terminology.store.toLowerCase();
        switch (confirmation.action) {
            case 'delete': return `Are you sure you want to permanently delete ${count} ${item}?`;
            case 'open': return `Are you sure you want to mark ${count} ${item} as open? This won't affect conditional markets.`;
            case 'close': return `Are you sure you want to mark ${count} ${item} as closed? This won't affect conditional markets.`;
            default: return 'Are you sure?';
        }
    };

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
             {selectedMarkets.length > 0 && (
                <>
                    <span className="text-sm font-semibold text-stone-300 px-2">{selectedMarkets.length} selected</span>
                    <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'open', ids: selectedMarkets })}>Mark Open</Button>
                    <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'close', ids: selectedMarkets })}>Mark Closed</Button>
                    <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedMarkets })}>Delete</Button>
                    <div className="border-l h-6 border-stone-600 mx-2"></div>
                </>
            )}
            {isAiAvailable && (
                <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary" size="sm">
                    Create with AI
                </Button>
            )}
            <Button onClick={handleCreateMarket} size="sm">
                Create New {settings.terminology.store}
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card
                title={`All Created ${settings.terminology.stores}`}
                headerAction={headerActions}
            >
                {markets.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedMarkets.length === markets.length && markets.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
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
                                        conditional: { text: 'Conditional', color: 'bg-blue-500/20 text-blue-300' },
                                    };

                                    return (
                                        <tr key={market.id} className="border-b border-stone-700/40 last:border-b-0">
                                            <td className="p-4"><input type="checkbox" checked={selectedMarkets.includes(market.id)} onChange={e => handleCheckboxClick(e, market.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
                                            <td className="p-4 font-bold">{market.icon} {market.title}</td>
                                            <td className="p-4 text-stone-400 hidden md:table-cell">{market.description}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusConfig[status.type].color}`}>
                                                    {statusConfig[status.type].text}
                                                </span>
                                            </td>
                                            <td className="p-4 relative">
                                                <button onClick={() => setOpenDropdownId(openDropdownId === market.id ? null : market.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                                </button>
                                                {openDropdownId === market.id && (
                                                    <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleEditMarket(market); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                        <button onClick={() => { cloneMarket(market.id); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50 disabled:opacity-50 disabled:text-stone-500" disabled={isBank}>Clone</button>
                                                        <button onClick={() => { setConfirmation({ action: 'delete', ids: [market.id] }); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50 disabled:opacity-50 disabled:text-stone-500" disabled={isBank}>Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                    initialData={initialCreateData || undefined}
                    onClose={() => {
                        setIsMarketDialogOpen(false);
                        setInitialCreateData(null);
                    }}
                />
            )}
            
            <ConfirmDialog
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                onConfirm={handleConfirmAction}
                title="Confirm Action"
                message={getConfirmationMessage()}
            />

            {isGeneratorOpen && <MarketIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
        </div>
    );
};

export default ManageMarketsPage;
