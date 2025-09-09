import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '../../types';
import Button from '../user-interface/Button';
import { Reorder, motion } from 'framer-motion';
import { allCardComponents } from '../pages/Dashboard';
import { ArrowLeftIcon, ArrowRightIcon, Eye, EyeOff } from 'lucide-react';

interface DashboardCustomizationDialogProps {
  userLayout: DashboardLayout;
  onClose: () => void;
  onSave: (newLayout: DashboardLayout) => void;
}

const LayoutOption: React.FC<{ type: DashboardLayout['layoutType'], selected: boolean, onClick: () => void, children: React.ReactNode }> = ({ type, selected, onClick, children }) => (
    <button onClick={onClick} className={`p-2 rounded-lg border-2 ${selected ? 'border-emerald-500 bg-emerald-900/40' : 'border-stone-600 hover:border-stone-500'}`}>
        <div className="text-stone-300 mb-2">{children}</div>
        <p className="text-xs font-semibold">{type.replace(/[-]/g, ' ')}</p>
    </button>
);

const CardItem: React.FC<{
    cardId: string;
    column: 'main' | 'side';
    isCardHidden: boolean;
    layoutType: DashboardLayout['layoutType'];
    onMove: (cardId: string, from: 'main' | 'side', to: 'main' | 'side') => void;
    onToggleVisibility: (cardId: string) => void;
}> = ({ cardId, column, isCardHidden, layoutType, onMove, onToggleVisibility }) => {
    const hasSideColumn = layoutType !== 'single-column';

    return (
        <div className={`group p-2 bg-stone-700 rounded-md text-stone-200 text-sm font-semibold flex items-center justify-between transition-opacity ${isCardHidden ? 'opacity-40' : ''}`}>
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


const DashboardCustomizationDialog: React.FC<DashboardCustomizationDialogProps> = ({ userLayout, onClose, onSave }) => {
    const [tempLayout, setTempLayout] = useState<DashboardLayout>(JSON.parse(JSON.stringify(userLayout)));

    const handleSave = () => {
        onSave(tempLayout);
        onClose();
    };
    
    const handleReorder = useCallback((column: 'main' | 'side', newOrder: string[]) => {
        const newLayout = JSON.parse(JSON.stringify(tempLayout));
        if (newLayout.layoutType === 'single-column') {
            newLayout.columns.main.order = newOrder;
            newLayout.columns.side.order = [];
        } else {
            newLayout.columns[column].order = newOrder;
        }
        setTempLayout(newLayout);
    }, [tempLayout]);
    
    const handleMoveItem = useCallback((cardId: string, from: 'main' | 'side', to: 'main' | 'side') => {
        if (from === to) return;

        const newLayout = JSON.parse(JSON.stringify(tempLayout));
        newLayout.columns[from].order = newLayout.columns[from].order.filter((id: string) => id !== cardId);
        newLayout.columns[to].order.push(cardId);
        setTempLayout(newLayout);

    }, [tempLayout]);

    const handleToggleVisibility = useCallback((cardId: string) => {
        const newLayout = JSON.parse(JSON.stringify(tempLayout));
        const isHidden = newLayout.hidden.includes(cardId);
        if (isHidden) {
            newLayout.hidden = newLayout.hidden.filter((id: string) => id !== cardId);
        } else {
            newLayout.hidden.push(cardId);
        }
        setTempLayout(newLayout);
    }, [tempLayout]);

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

    const renderLayoutEditor = () => {
        if (tempLayout.layoutType === 'single-column') {
            const combinedOrder = [...tempLayout.columns.main.order, ...tempLayout.columns.side.order];
            return (
                 <ColumnDropZone title="Visible Cards">
                    <Reorder.Group axis="y" values={combinedOrder} onReorder={(newOrder) => handleReorder('main', newOrder)} className="space-y-2 min-h-[100px] flex-grow">
                        {combinedOrder.map(cardId => {
                             const isHidden = tempLayout.hidden.includes(cardId);
                             const sourceColumn = tempLayout.columns.main.order.includes(cardId) ? 'main' : 'side';
                            return (
                                <Reorder.Item key={cardId} value={cardId}>
                                    <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column={sourceColumn} layoutType={tempLayout.layoutType} isCardHidden={isHidden} />
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
                    <Reorder.Group axis="y" values={tempLayout.columns.main.order} onReorder={(newOrder) => handleReorder('main', newOrder)} className="space-y-2 min-h-[100px] flex-grow">
                        {tempLayout.columns.main.order.map(cardId => (
                            <Reorder.Item key={cardId} value={cardId}>
                                <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column='main' layoutType={tempLayout.layoutType} isCardHidden={tempLayout.hidden.includes(cardId)} />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </ColumnDropZone>
                <ColumnDropZone title="Side Column" className={tempLayout.layoutType === 'two-column-main-right' ? 'order-1' : ''}>
                    <Reorder.Group axis="y" values={tempLayout.columns.side.order} onReorder={(newOrder) => handleReorder('side', newOrder)} className="space-y-2 min-h-[100px] flex-grow">
                        {tempLayout.columns.side.order.map(cardId => (
                            <Reorder.Item key={cardId} value={cardId}>
                                <CardItem cardId={cardId} onMove={handleMoveItem} onToggleVisibility={handleToggleVisibility} column='side' layoutType={tempLayout.layoutType} isCardHidden={tempLayout.hidden.includes(cardId)} />
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </ColumnDropZone>
            </>
        );
    };

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
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            {renderLayoutEditor()}
                         </div>
                    </div>
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