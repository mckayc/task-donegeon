import React from 'react';
import { ChronicleEvent } from '../../../types';
import Button from '../user-interface/Button';

interface ChroniclesDetailDialogProps {
  date: Date;
  events: ChronicleEvent[];
  onClose: () => void;
}

const ChroniclesDetailDialog: React.FC<ChroniclesDetailDialogProps> = ({ date, events, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-700/60">
            <h2 className="text-2xl font-medieval text-emerald-400">{date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            <p className="text-stone-400">Activity Log</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-hide">
            {events.length > 0 ? (
                events.map(event => (
                    <div key={event.id} className={`p-3 rounded-md border-l-4`} style={{borderColor: event.color}}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl mt-1">{event.icon}</span>
                            <div>
                                <p className="font-semibold text-stone-200">{event.title}</p>
                                <p className="text-xs text-stone-400">{event.status}</p>
                                {event.note && <p className="text-sm text-stone-400 italic mt-1">"{event.note}"</p>}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-stone-400 text-center py-8">No activities were recorded on this day.</p>
            )}
        </div>
        <div className="p-4 border-t border-stone-700/60 text-right">
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ChroniclesDetailDialog;
