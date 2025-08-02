import React, { useState, useRef, useEffect } from 'react';
import { Market } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import EditMarketDialog from '../markets/EditMarketDialog';
import ConfirmDialog from '../ui/confirm-dialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import EmptyState from '../ui/empty-state';
import { MarketplaceIcon, EllipsisVerticalIcon } from '@/components/ui/icons';
import MarketIdeaGenerator from '../quests/MarketIdeaGenerator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';

const ManageMarketsPage: React.FC = () => {
    const { markets, settings, isAiConfigured } = useAppState();
    const { deleteMarkets, updateMarketsStatus, cloneMarket } = useAppDispatch();
    const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
    const [editingMarket, setEditingMarket] = useState<Market | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ title: string; description: string; icon: string; } | null>(null);
    
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: 'delete' | 'open' | 'close', ids: string[] } | null>(null);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;


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

    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            setSelectedMarkets(markets.map(m => m.id));
        } else {
            setSelectedMarkets([]);
        }
    };

    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedMarkets(prev => [...prev, id]);
        } else {
            setSelectedMarkets(prev => prev.filter(marketId => marketId !== id));
        }
    };
    
    const handleConfirmAction = () => {
        if (!confirmation) return;
        
        switch(confirmation.action) {
            case 'delete':
                deleteMarkets(confirmation.ids);
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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{`All Created ${settings.terminology.stores}`}</CardTitle>
                     <div className="flex items-center gap-2 flex-wrap">
                        {isAiAvailable && (
                            <Button onClick={() => setIsGeneratorOpen(true)} variant="outline" size="sm">
                                Create with AI
                            </Button>
                        )}
                        <Button onClick={handleCreateMarket} size="sm">
                            Create New {settings.terminology.store}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                {selectedMarkets.length > 0 && (
                    <div className="flex items-center gap-2 p-2 mb-4 bg-background rounded-lg border">
                        <span className="text-sm font-semibold px-2">{selectedMarkets.length} selected</span>
                        <Button size="sm" variant="outline" onClick={() => setConfirmation({ action: 'open', ids: selectedMarkets })}>Mark Open</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmation({ action: 'close', ids: selectedMarkets })}>Mark Closed</Button>
                        <Button size="sm" variant="destructive" onClick={() => setConfirmation({ action: 'delete', ids: selectedMarkets })}>Delete</Button>
                    </div>
                 )}
                {markets.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4 w-12"><Checkbox onCheckedChange={(checked) => handleSelectAll(checked)} checked={selectedMarkets.length === markets.length && markets.length > 0} /></th>
                                    <th className="p-4 font-semibold">Title</th>
                                    <th className="p-4 font-semibold hidden md:table-cell">Description</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markets.map(market => {
                                    const isBank = market.id === 'market-bank';
                                    const status = market.status;
                                    const statusConfig = {
                                        open: { text: 'Open', color: 'bg-green-500/20 text-green-300' },
                                        closed: { text: 'Closed', color: 'bg-muted-foreground/20 text-muted-foreground' },
                                        conditional: { text: 'Conditional', color: 'bg-blue-500/20 text-blue-300' },
                                    };

                                    return (
                                        <tr key={market.id} className="border-b last:border-b-0">
                                            <td className="p-4"><Checkbox checked={selectedMarkets.includes(market.id)} onCheckedChange={(checked) => handleSelectOne(market.id, checked === true)} /></td>
                                            <td className="p-4 font-bold">{market.icon} {market.title}</td>
                                            <td className="p-4 text-muted-foreground hidden md:table-cell">{market.description}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusConfig[status.type].color}`}>
                                                    {statusConfig[status.type].text}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleEditMarket(market)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => cloneMarket(market.id)} disabled={isBank}>Clone</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setConfirmation({ action: 'delete', ids: [market.id] })} disabled={isBank} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                </CardContent>
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