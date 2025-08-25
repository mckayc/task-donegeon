import React from 'react';
import { ScheduledEvent } from '../../../types';
import Button from '../user-interface/Button';
import { useEconomyState } from '../../context/EconomyContext';

interface EventDetailDialogProps {
  event: ScheduledEvent;
  onClose: () => void;
}

const EventDetailDialog: React.FC<EventDetailDialogProps> = ({ event, onClose }) => {
    const { markets } = useEconomyState();

    const getModifierDetails = () => {
        const { modifiers } = event;
        if (!modifiers) return null;

        const details = [];

        switch (event.eventType) {
            case 'BonusXP':
                const multiplier = modifiers.xpMultiplier || 1;
                details.push(<p key="xp"><strong>Effect:</strong> {multiplier}x XP on all eligible quests!</p>);
                break;
            case 'MarketSale':
                const marketName = markets.find(m => m.id === modifiers.marketId)?.title || 'a market';
                const discount = modifiers.discountPercent || 0;
                details.push(<p key="sale"><strong>Effect:</strong> {discount}% off in {marketName}!</p>);
                break;
            default:
                return null;
        }
        
        return <div className="mt-4 p-3 bg-stone-900/50 rounded-lg text-emerald-300">{details}</div>;
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className={`backdrop-blur-sm border rounded-xl shadow-2xl max-w-lg w-full border-stone-700/60`} style={{ backgroundColor: `hsl(${event.color})` }} onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl mt-1">{event.icon || '🎉'}</div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{event.eventType.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <h2 className="text-2xl font-medieval">{event.title}</h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-stone-800 space-y-4">
                    <p className="text-stone-300 whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
                    {getModifierDetails()}
                </div>

                <div className="p-4 bg-stone-800 rounded-b-xl flex justify-end items-center gap-2">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default EventDetailDialog;
