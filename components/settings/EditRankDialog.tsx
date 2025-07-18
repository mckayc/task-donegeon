import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Rank } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import EmojiPicker from '../ui/EmojiPicker';

interface EditRankDialogProps {
  rank: Rank | null;
  onClose: () => void;
}

const EditRankDialog: React.FC<EditRankDialogProps> = ({ rank, onClose }) => {
  const { ranks } = useAppState();
  const { setRanks } = useAppDispatch();
  const [formData, setFormData] = useState({ 
      name: '', 
      xpThreshold: 0,
      icon: '🔰',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);


  useEffect(() => {
    if (rank) {
      setFormData({ 
          name: rank.name, 
          xpThreshold: rank.xpThreshold,
          icon: rank.icon || '🔰'
      });
    }
  }, [rank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rank) {
      const updatedRanks = ranks.map(r => r.id === rank.id ? { ...r, ...formData } : r);
      setRanks(updatedRanks);
    } else {
      const newRank: Rank = { id: `rank-${Date.now()}`, ...formData };
      setRanks([...ranks, newRank]);
    }
    onClose();
  };

  const dialogTitle = rank ? 'Edit Rank' : 'Create New Rank';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Rank Name" 
            value={formData.name} 
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
            required 
          />
           <Input 
            label="XP Threshold" 
            type="number"
            min="0"
            value={formData.xpThreshold} 
            onChange={(e) => setFormData(p => ({ ...p, xpThreshold: parseInt(e.target.value) || 0 }))} 
            required 
          />
           <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2"
              >
                <span className="text-2xl">{formData.icon}</span>
                <span className="text-stone-300">Click to change</span>
              </button>
              {isEmojiPickerOpen && (
                <EmojiPicker
                  onSelect={(emoji) => setFormData(p => ({ ...p, icon: emoji }))}
                  onClose={() => setIsEmojiPickerOpen(false)}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{rank ? 'Save Changes' : 'Create Rank'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRankDialog;
