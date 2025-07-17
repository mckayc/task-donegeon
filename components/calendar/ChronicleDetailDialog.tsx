import React from 'react';
import Button from '../ui/Button';
import ChronicleEventList from './ChronicleEventList';

interface ChronicleDetailDialogProps {
  date: Date;
  onClose: () => void;
}

const ChronicleDetailDialog: React.FC<ChronicleDetailDialogProps> = ({ date, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-stone-700/60">
              <h2 className="text-2xl font-medieval text-emerald-400">{date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              <p className="text-sm text-stone-400">Activity Log</p>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-grow">
              <ChronicleEventList date={date} />
          </div>
          <div className="p-4 border-t border-stone-700/60 text-right">
              <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
  );
};

export default ChronicleDetailDialog;
