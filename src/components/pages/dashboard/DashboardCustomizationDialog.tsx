
// FIX: Added `useMemo` to React import.
import React, { useState, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../../types';
import Button from '../user-interface/Button';
import { Reorder } from 'framer-motion';
import { allCardComponents, defaultLayout } from '../Dashboard';
import { ArrowLeftIcon, ArrowRightIcon, Eye, EyeOff } from 'lucide-react';

interface DashboardCustomizationDialogProps {
  userLayout: DashboardLayout;
  onClose: () => void;
  onSave: (newLayout: DashboardLayout) => void;
  inactiveConditionalCards: string[];
}

const LayoutOption: React.FC<{ type: DashboardLayout['layoutType'], selected: boolean, onClick: () => void, children: React.ReactNode }> = ({ type, selected, onClick, children }) => (
    <button onClick={onClick} className={`p-2 rounded-lg border-2 ${selected ? 'border-emerald-500 bg-emerald-900/40' : 'border-stone-600 hover:border-stone-500'}`}>
        <div className="text-stone-300 mb-2">{children}</div>
        <p className="text-xs font-semibold">{type.replace(/[-]/g, ' ')}</p>
    </button>
);

const conditionalCardTooltips: { [key: string]: string } = {
    trophy: "This card appears when you have an earned trophy.",
    pendingApprovals: "This card appears when you have items pending approval.",
    readingActivity: "This card appears when there is an active reading session.",
};

const CardItem: React.FC<{
    cardId: string;
    column: 'main' | 'side';
    isCardHidden: boolean;
    layoutType: DashboardLayout['layoutType'];
    isInactiveConditional: boolean;
    onMove: (cardId: string, from: 'main' | 'side', to: 'main' | 'side') => void;
    onToggleVisibility: (cardId: string) => void;
}> = ({ cardId, column, isCardHidden, layoutType, isInactiveConditional, onMove, onToggleVisibility }) => {
    const hasSideColumn = layoutType !== 'single-column';
    const tooltipText = conditionalCardTooltips[cardId] || "This is a conditional card.";

    return (
        <div 
            className={`group p-2 bg-stone-700 rounded-md text-stone-200 text-sm font-semibold flex items-center justify-between transition-opacity ${isCardHidden ? 'opacity-40' : ''} ${isInactiveConditional ? 'opacity-50' : ''}`}
            title={isInactiveConditional ? tooltipText : ''}
        >
            <span>{allCardComponents[cardId]?.name || cardId}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {column === 'main' && hasSideColumn && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(cardId, 'main', 'side')} title="Move to Side Column">
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                )}
                {column === 'side' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(cardId, 'side', 'main')} title="Move to Main Column">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                )}
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onToggleVisibility(cardId)} title={isCardHidden ? "Show Card" : "Hide Card"}>
                    {isCardHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
};


const DashboardCustomizationDialog: React.FC<DashboardCustomizationDialogProps> = ({ userLayout, onClose, onSave, inactiveConditionalCards }) => {
    const [tempLayout, setTempLayout] = useState<DashboardLayout>(() => {
        // This initializer runs only once, creating a robust starting state.
        const layout = JSON.parse(JSON.stringify(userLayout));
        
        if (!layout.columns) layout.columns = { main: { order: [], collapsed: [] }, side: { order: [], collapsed: [] } };
        if (!layout.columns.main) layout.columns.main = { order: [], collapsed: [] };
        if (!layout.columns.side) layout.columns.side = { order: [], collapsed: [] };
        if (!layout.hidden) layout.hidden = [];

        const allKnownIdsInOrderArrays = new Set([
            ...layout.columns.main.order,
            ...layout.columns.side.order,
        ]);

        Object.keys(allCardComponents).forEach(cardId => {
            if (!allKnownIdsInOrderArrays.has(cardId)) {
                // This is a new, unknown card. Add it to its default position.
                if (defaultLayout.columns.main.order.includes(cardId)) {
                    layout.columns.main.order.push(cardId);
                } else if (defaultLayout.columns.side.order.includes(cardId)) {
                    layout.columns.side.order.push(cardId);
                } else {
                    layout.columns.main.order.push(cardId);
                }
            }
        });
        return layout;
    });

    const handleSave = () => {
        onSave(tempLayout);
        onClose();
    };
    
    // FIX: Replaced buggy handleReorder logic with a more robust version that preserves hidden cards.
    const handleReorder = useCallback((column: 'main' | 'side', newVisibleOrder: string[]) => {
        setTempLayout(prevLayout => {
            const newLayout = JSON.parse(JSON.stringify(prevLayout));

            if (newLayout.layoutType === 'single-column') {
                const hiddenCardsFromMain = prevLayout.columns.main.order.filter((id: string) => prevLayout.hidden.includes(id));
                const hiddenCardsFromSide = prevLayout.columns.side.order.filter((id: string) => prevLayout.hidden.includes(id));
                
                newLayout.columns.main.order = [...newVisibleOrder, ...hiddenCardsFromMain];
                newLayout.columns.side.order = hiddenCardsFromSide;
            } else {
                const fullOrder = prevLayout.columns[column].order;
                const visibleCardsInColumn = fullOrder.filter((id: string) => !prevLayout.hidden.includes(id));
                const newOrderCopy = [...newVisibleOrder];
                
                const newFullOrder = fullOrder.map((cardId: string) => {
                    if (visibleCardsInColumn.includes(cardId)) {
                        return newOrderCopy.shift()!;
                    }
                    return cardId;
                });
            
                newLayout.columns[column].order = newFullOrder;
            }
            return newLayout;
        });
    }, []);
    
    const handleMoveItem = useCallback((cardId: string, from: 'main' | 'side', to: 'main' | 'side') => {
        if (from === to) return;

        setTempLayout(prevLayout => {
            const newLayout = JSON.parse(JSON.stringify(prevLayout));
            newLayout.columns[from].order = newLayout.columns[from].order.filter((id: string) => id !== cardId);
            newLayout.columns[to].order.push(cardId);
            return newLayout;
        });
    }, []);

    const handleToggleVisibility = useCallback((cardId: string) => {
        setTempLayout(prevLayout => {
            const newLayout = JSON.parse(JSON.stringify(prevLayout));
            const isHidden = newLayout.hidden.includes(cardId);
            if (isHidden) {
                newLayout.hidden = newLayout.hidden.filter((id: string) => id !== cardId);
            } else {
                newLayout.hidden.push(cardId);
            }
            return newLayout;
        });
    }, []);

    const ColumnDropZone: React.FC<{
        title: string;
        children: React.ReactNode;
        className?: string;
    }> = ({ title, children, className }) => (
        <div className={`p-4 bg-stone-900/50 rounded-lg transition-all duration-200 h-full flex flex-col ${className}`}>
            <h4 className="font-semibold text-stone-300 mb-2 flex-shrink-0">{title}</h4>
            {children}
        </div>
    );
    
    const allVisibleCards = useMemo(() => {
        const allOrderedCards = tempLayout.layoutType === 'single-column'
            ? [...tempLayout.columns.main.order, ...tempLayout.columns.side.order]
            : tempLayout.columns.main.order;
        
        return allOrderedCards.filter(id => !tempLayout.hidden.includes(id));
    }, [tempLayout]);

    const allSideVisibleCards = useMemo(() => {
        return tempLayout.columns.side.order.filter(id => !tempLayout.hidden.includes(id));
    }, [tempLayout]);


    const renderLayoutEditor = () => {
        if (tempLayout.layoutType === 'single-column') {
            return (
                 <ColumnDropZone title="Visible Cards">
                    {/* FIX: Cast `newOrder` to string[] to resolve TypeScript error. */}
                    <Reorder.Group axis="y" values={allVisibleCards} onReorder={newOrder => handleReorder('main', newOrder as string[])} className="space-y-2 min-h-[100px] flex-grow">
                        {allVisibleCards.map(cardId => {
                             const sourceColumn = defaultLayout.columns.main.order.includes(cardId) ? 'main' : 'side';
                            return (
                                <Reorder.Item key={cardId} value={cardId}>
                                    <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column={sourceColumn} layoutType={tempLayout.layoutType} isCardHidden={false} isInactiveConditional={inactiveConditionalCards.includes(cardId)} />
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </ColumnDropZone>
            );
        }
        return (
            <>
                <ColumnDropZone title="Main Column" className={tempLayout.layoutType === 'two-column-main-right' ? 'order-2' : ''}>
                    {/* FIX: Cast `newOrder` to string[] to resolve TypeScript error. */}
                    <Reorder.Group axis="y" values={allVisibleCards} onReorder={newOrder => handleReorder('main', newOrder as string[])} className="space-y-2 min-h-[100px] flex-grow">
                        {allVisibleCards.map(cardId => (
                            <Reorder.Item key={cardId} value={cardId}>
                                <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column='main' layoutType={tempLayout.layoutType} isCardHidden={false} isInactiveConditional={inactiveConditionalCards.includes(cardId)} />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </ColumnDropZone>
                <ColumnDropZone title="Side Column" className={tempLayout.layoutType === 'two-column-main-right' ? 'order-1' : ''}>
                    {/* FIX: Cast `newOrder` to string[] to resolve TypeScript error. */}
                    <Reorder.Group axis="y" values={allSideVisibleCards} onReorder={(newOrder) => handleReorder('side', newOrder as string[])} className="space-y-2 min-h-[100px] flex-grow">
                        {allSideVisibleCards.map(cardId => (
                            <Reorder.Item key={cardId} value={cardId}>
                                <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column='side' layoutType={tempLayout.layoutType} isCardHidden={false} isInactiveConditional={inactiveConditionalCards.includes(cardId)} />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </ColumnDropZone>
            </>
        );
    };
    
     const allHiddenCards = Object.keys(allCardComponents).filter(id => tempLayout.hidden.includes(id));

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Customize Dashboard</h2>
                </div>
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="font-bold text-lg text-stone-200 mb-3">Layout Style</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <LayoutOption type="two-column-main-left" selected={tempLayout.layoutType === 'two-column-main-left'} onClick={() => setTempLayout(p => ({...p, layoutType: 'two-column-main-left'}))}>
                                <div className="flex gap-2 h-16"><div className="w-2/3 bg-stone-600 rounded"></div><div className="w-1/3 bg-stone-700 rounded"></div></div>
                            </LayoutOption>
                             <LayoutOption type="two-column-main-right" selected={tempLayout.layoutType === 'two-column-main-right'} onClick={() => setTempLayout(p => ({...p, layoutType: 'two-column-main-right'}))}>
                                <div className="flex gap-2 h-16"><div className="w-1/3 bg-stone-700 rounded"></div><div className="w-2/3 bg-stone-600 rounded"></div></div>
                            </LayoutOption>
                            <LayoutOption type="single-column" selected={tempLayout.layoutType === 'single-column'} onClick={() => setTempLayout(p => ({...p, layoutType: 'single-column'}))}>
                                <div className="flex gap-2 h-16"><div className="w-full bg-stone-600 rounded"></div></div>
                            </LayoutOption>
                        </div>
                    </div>

                    <div>
                         <h3 className="font-bold text-lg text-stone-200 mb-3">Card Arrangement</h3>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {renderLayoutEditor()}
                         </div>
                    </div>
                     {allHiddenCards.length > 0 && (
                        <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3">Hidden Cards</h3>
                            <ColumnDropZone title="">
                                <div className="space-y-2">
                                    {allHiddenCards.map(cardId => {
                                        const sourceColumn = tempLayout.columns.main.order.includes(cardId) ? 'main' : 'side';
                                        return (
                                            <CardItem key={cardId} cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column={sourceColumn} layoutType={tempLayout.layoutType} isCardHidden={true} isInactiveConditional={inactiveConditionalCards.includes(cardId)}/>
                                        );
                                    })}
                                </div>
                            </ColumnDropZone>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-black/20 mt-auto flex justify-end space-x-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Layout</Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardCustomizationDialog;