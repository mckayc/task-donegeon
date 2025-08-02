import React from 'react';
import { ChronicleEvent } from '../../types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ChroniclesDetailDialogProps {
  date: Date;
  events: ChronicleEvent[];
  onClose: () => void;
}

const ChroniclesDetailDialog: React.FC<ChroniclesDetailDialogProps> = ({ date, events, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
            <DialogTitle className="text-2xl font-display text-accent">{date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</DialogTitle>
            <p className="text-muted-foreground">Activity Log</p>
        </DialogHeader>
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-hide flex-grow">
            {events.length > 0 ? (
                events.map(event => (
                    <div key={event.id} className={`p-3 rounded-md border-l-4`} style={{borderColor: event.color}}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">{event.icon}</span>
                            <div>
                                <p className="font-semibold text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.status}</p>
                                {event.note && <p className="text-sm text-muted-foreground italic mt-1">"{event.note}"</p>}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground text-center py-8">No activities were recorded on this day.</p>
            )}
        </div>
        <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChroniclesDetailDialog;