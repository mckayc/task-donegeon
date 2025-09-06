import React, { useState } from 'react';
import { DashboardLayout } from '../../types';
import Button from '../user-interface/Button';
import { Reorder } from 'framer-motion';
import { allCardComponents } from '../pages/Dashboard';
import { LayoutIcon } from 'lucide-react';

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

const CardItem: React.FC<{ cardId: string, children: React.ReactNode }> = ({ cardId, children }) => (
    <div className="p-2 bg-stone-700 rounded-md text-stone-200 text-sm font-semibold cursor-grab active:cursor-grabbing">
        {allCardComponents[cardId]?.name || cardId}
    </div>
);


const DashboardCustomizationDialog: React.FC<DashboardCustomizationDialogProps> = ({ userLayout, onClose, onSave }) => {
    const [tempLayout, setTempLayout] = useState<DashboardLayout>(JSON.parse(JSON.stringify(userLayout)));

    const handleSave = () => {
        onSave(tempLayout);
        onClose();
    };
    
    const handleReorder = (column: 'main' | 'side' | 'hidden', newOrder: string[]) => {
        const newLayout = { ...tempLayout };
        if (column === 'hidden') {
            newLayout.hidden = newOrder;
        } else {
            newLayout.columns[column].order = newOrder;
        }
        setTempLayout(newLayout);
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`space-y-4 ${tempLayout.layoutType === 'single-column' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                            <h3 className="font-bold text-lg text-stone-200">Visible Cards</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 bg-stone-900/50 rounded-lg ${tempLayout.layoutType === 'two-column-main-right' ? 'order-2' : ''}`}>
                                    <h4 className="font-semibold text-stone-300 mb-2">Main Column</h4>
                                    {/* FIX: Cast `newOrder` to string[] to match the expected type. */}
                                    <Reorder.Group axis="y" values={tempLayout.columns.main.order} onReorder={(newOrder) => handleReorder('main', newOrder as string[])} className="space-y-2 min-h-[100px]">
                                        {tempLayout.columns.main.order.map(cardId => (
                                            <Reorder.Item key={cardId} value={cardId}>
                                                <CardItem cardId={cardId}>{cardId}</CardItem>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                </div>
                                {tempLayout.layoutType !== 'single-column' && (
                                    <div className={`p-4 bg-stone-900/50 rounded-lg ${tempLayout.layoutType === 'two-column-main-right' ? 'order-1' : ''}`}>
                                        <h4 className="font-semibold text-stone-300 mb-2">Side Column</h4>
                                        {/* FIX: Cast `newOrder` to string[] to match the expected type. */}
                                        <Reorder.Group axis="y" values={tempLayout.columns.side.order} onReorder={(newOrder) => handleReorder('side', newOrder as string[])} className="space-y-2 min-h-[100px]">
                                            {tempLayout.columns.side.order.map(cardId => (
                                                <Reorder.Item key={cardId} value={cardId}>
                                                    <CardItem cardId={cardId}>{cardId}</CardItem>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-1 p-4 bg-stone-900/50 rounded-lg">
                            <h4 className="font-semibold text-stone-300 mb-2">Hidden Cards</h4>
                            {/* FIX: Cast `newOrder` to string[] to match the expected type. */}
                            <Reorder.Group axis="y" values={tempLayout.hidden} onReorder={(newOrder) => handleReorder('hidden', newOrder as string[])} className="space-y-2 min-h-[100px]">
                                {tempLayout.hidden.map(cardId => (
                                    <Reorder.Item key={cardId} value={cardId}>
                                        <CardItem cardId={cardId}>{cardId}</CardItem>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
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