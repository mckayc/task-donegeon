import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Market } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditMarketDialog from '../../markets/EditMarketDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import EmptyState from '../../user-interface/EmptyState';
import { MarketplaceIcon, EllipsisVerticalIcon } from '../../user-interface/Icons';
import MarketIdeaGenerator from '../../quests/MarketIdeaGenerator';
import { useEconomyState, useEconomyDispatch } from '../../../context/EconomyContext';
import MarketTable from '../../markets/MarketTable';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useUIState } from '../../../context/UIContext';

const MarketCard: React.FC<{
    market: Market;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (market: Market) => void;
    onClone: (marketId: string) => void;
    onDeleteRequest: (marketId: string) => void;
}> = ({ market, isSelected, onToggle, onEdit, onClone, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isBank = market.id === 'market-bank';
    const status = market.status;
    const statusConfig = {
        open: { text: 'Open', color: 'bg-green-500/20 text-green-300' },
        closed: { text: 'Closed', color: 'bg-stone-500/20 text-stone-300' },
        conditional: { text: 'Conditional', color: 'bg-blue-500/20 text-blue-300' },
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4 border border-stone-700">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="text-2xl flex-shrink-0">{market.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{market.title}</p>
                <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${statusConfig[status.type].color}`}>
                    {statusConfig[status.type].text}
                </span>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(market); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onClone(market.id); setDropdownOpen(false); }} disabled={isBank} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700 disabled:opacity-50">Clone</button>
                        <button onClick={() => { onDeleteRequest(market.id); setDropdownOpen(false); }} disabled={isBank} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700 disabled:opacity-50">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageMarketsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { markets } = useEconomyState();
    const { updateMarketsStatus, cloneMarket } = useEconomyDispatch();
    const { isMobileView } = useUIState();

    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; icon: string; } | null>(null);
    
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'open' | 'close', ids: string[] } | null>(null);
    
    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
    const globalSets = useMemo(() => settings.conditionSets.filter(cs => cs.isGlobal), [settings.conditionSets]);

    const marketIds = React.useMemo(() => markets.map(m => m.id), [markets]);
    const handleCheckboxClick = useShiftSelect(marketIds, selectedMarkets, setSelectedMarkets);

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
            {globalSets.length > 0 && (
                <div className="bg-sky-900/50 border border-sky-700 text-sky-200 text-sm p-4 rounded-lg">
                    <p>
                        <span className="font-bold">Active Global Sets:</span> {globalSets.map(s => s.name).join(', ')}. These rules apply to all items on this page.
                    </p>
                </div>
            )}
            <Card
                title={`All Created ${settings.terminology.stores}`}
                headerAction={headerActions}
            >
                {selectedMarkets.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedMarkets.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleEditMarket(markets.find(m => m.id === selectedMarkets[0])!)} disabled={selectedMarkets.length !== 1}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => cloneMarket(selectedMarkets[0])} disabled={selectedMarkets.length !== 1 || selectedMarkets[0] === 'market-bank'}>Clone</Button>
                        <Button size="sm" variant="secondary" className="!bg-green-800/60 hover:!bg-green-700/70 text-green-200" onClick={() => setConfirmation({ action: 'open', ids: selectedMarkets })}>Mark Open</Button>
                        <Button size="sm" variant="secondary" className="!bg-yellow-800/60 hover:!bg-yellow-700/70 text-yellow-200" onClick={() => setConfirmation({ action: 'close', ids: selectedMarkets })}>Mark Closed</Button>
                        <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setConfirmation({ action: 'delete', ids: selectedMarkets })}>Delete</Button>
                    </div>
                )}
                {isMobileView ? (
                    <div className="space-y-3">
                        {markets.map(market => (
                            <MarketCard
                                key={market.id}
                                market={market}
                                isSelected={selectedMarkets.includes(market.id)}
                                onToggle={(e) => handleCheckboxClick(e, market.id)}
                                onEdit={handleEditMarket}
                                onClone={cloneMarket}
                                onDeleteRequest={(id) => setConfirmation({ action: 'delete', ids: [id] })}
                            />
                        ))}
                    </div>
                ) : (
                    <MarketTable
                        markets={markets}
                        selectedMarkets={selectedMarkets}
                        onSelectAll={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMarkets(e.target.checked ? marketIds : [])}
                        onSelectOne={handleCheckboxClick}
                        onEdit={handleEditMarket}
                        onClone={cloneMarket}
                        onDeleteRequest={(ids: string[]) => setConfirmation({ action: 'delete', ids })}
                        terminology={settings.terminology}
                        onCreate={handleCreateMarket}
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