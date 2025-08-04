import React from 'react';
import { ScheduledEvent, Role } from '../../types';
import { Button } from '@/components/ui/button';
import { useAppState } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface EventDetailDialogProps {
  event: ScheduledEvent;
  onClose: () => void;
  onEdit?: (event: ScheduledEvent) => void;
  onDelete?: (event: ScheduledEvent) => void;
}

const EventDetailDialog: React.FC<EventDetailDialogProps> = ({ event, onClose, onEdit, onDelete }) => {
    const { markets, currentUser } = useAppState();

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
        
        return <div className="mt-4 p-3 bg-background/50 rounded-lg text-primary">{details}</div>;
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
              className={`border-border`} 
              style={{
                backgroundColor: `hsl(${event.color})`
              }}
            >
                 <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl mt-1">{event.icon || '🎉'}</div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{event.eventType.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <h2 className="text-2xl font-display">{event.title}</h2>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-card space-y-4">
                    <p className="text-foreground whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
                    {getModifierDetails()}
                </div>
                 <DialogFooter className="p-4 bg-card rounded-b-lg justify-between w-full">
                    <div>
                        {currentUser?.role === Role.DonegeonMaster && onDelete && onEdit && (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onEdit(event)}>Edit</Button>
                                <Button variant="destructive" onClick={() => onDelete(event)}>Delete</Button>
                            </div>
                        )}
                    </div>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EventDetailDialog;