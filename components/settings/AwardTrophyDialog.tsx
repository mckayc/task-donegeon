
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Trophy, User } from '../../types';
import Button from '../ui/Button';

interface AwardTrophyDialogProps {
  user: User;
  onClose: () => void;
}

const AwardTrophyDialog: React.FC<AwardTrophyDialogProps> = ({ user, onClose }) => {
    const { trophies, userTrophies } = useAppState();
    const { awardTrophy } = useAppDispatch();
    const [selectedTrophyId, setSelectedTrophyId] = useState<string>('');
    const [error, setError] = useState('');

    const userHasTrophy = (trophyId: string) => {
        return userTrophies.some(ut => ut.userId === user.id && ut.trophyId === trophyId);
    }
    
    const availableTrophies = trophies.filter(t => t.isManual && !userHasTrophy(t.id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrophyId) {
            setError('Please select a trophy to award.');
            return;
        }
        awardTrophy(user.id, selectedTrophyId);
        onClose();
    };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Award Trophy</h2>
        <p className="text-stone-300 mb-6">Select a trophy to award to <span className="font-bold text-emerald-300">{user.gameName}</span>.</p>
        
        {availableTrophies.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="trophy" className="block text-sm font-medium text-stone-300 mb-1">Available Trophies</label>
                    <select
                        id="trophy"
                        value={selectedTrophyId}
                        onChange={(e) => setSelectedTrophyId(e.target.value)}
                        className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                    >
                        <option value="" disabled>Select a trophy...</option>
                        {availableTrophies.map(trophy => (
                            <option key={trophy.id} value={trophy.id}>
                                {trophy.name}
                            </option>
                        ))}
                    </select>
                </div>
                 {error && <p className="text-red-400 text-center">{error}</p>}
                <div className="flex justify-end space-x-4 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Award Trophy</Button>
                </div>
            </form>
        ) : (
             <div>
                <p className="text-stone-400 text-center py-4">{user.gameName} has already earned all available manual trophies!</p>
                 <div className="text-right mt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AwardTrophyDialog;
