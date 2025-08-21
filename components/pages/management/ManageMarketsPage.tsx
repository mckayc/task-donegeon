import React, { useState, useRef, useEffect } from 'react';
import { Market } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import EditMarketDialog from '../markets/EditMarketDialog';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import EmptyState from '../user-interface/EmptyState';
import { MarketplaceIcon } from '../user-interface/Icons';
import MarketIdeaGenerator from '../quests/MarketIdeaGenerator';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import MarketTable from '../markets/MarketTable';
import { useShiftSelect } from '../../hooks/useShiftSelect';

const ManageMarketsPage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { markets } = useEconomyState();
    const { updateMarketsStatus, cloneMarket } = useEconomyDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; icon: string; } | null>(null);
    
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'open' | 'close', ids: string[] } | null>(null);
    
    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const marketIds = React.useMemo(() => markets.map(m => m.id), [markets]);
    const handleCheckboxClick = useShiftSelect(marketIds, selectedMarkets, setSelectedMarkets);
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedMarkets(e.target.checked ? marketIds : []);
    };

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
                <MarketTable
                    markets={markets}
                    selectedMarkets={selectedMarkets}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleCheckboxClick}
                    onEdit={handleEditMarket}
                    onClone={cloneMarket}
                    onDeleteRequest={(ids) => setConfirmation({ action: 'delete', ids })}
                    terminology={settings.terminology}
                    onCreate={handleCreateMarket}
                />
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