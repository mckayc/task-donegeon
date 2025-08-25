
import React from 'react';
import { Guild } from '../../../types';
import Button from '../user-interface/Button';

interface DonateDialogProps {
  guild: Guild;
  onClose: () => void;
}

const DonateDialog: React.FC<DonateDialogProps> = ({ guild, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Donate to {guild.name}</h2>
        <p className="text-lg text-stone-200 mb-6">This feature is coming soon!</p>
        <p className="text-stone-400">You will be able to donate your personal currency and items to the guild treasury here.</p>
        <div className="flex justify-end space-x-4 pt-4 mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default DonateDialog;
