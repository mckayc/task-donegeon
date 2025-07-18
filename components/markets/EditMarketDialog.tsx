

import React, { useState, useEffect } from 'react';
import { useGameDataState, useAppDispatch } from '../../context/AppContext';
import { Market } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import EmojiPicker from '../ui/EmojiPicker';

interface EditMarketDialogProps {
  market: Market | null;
  initialData?: { title: string; description: string; icon: string; };
  onClose: () => void;
}

const EditMarketDialog: React.FC<EditMarketDialogProps> = ({ market, initialData, onClose }) => {
  const { guilds } = useGameDataState();
  const { addMarket, updateMarket } = useAppDispatch();
  const [formData, setFormData] = useState({ 
      title: initialData?.title || '', 
      description: initialData?.description || '', 
      guildId: '', 
      icon: initialData?.icon || '🛒',
      status: 'open' as 'open' | 'closed',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (market) {
      setFormData({ 
        title: market.title, 
        description: market.description, 
        guildId: market.guildId || '',
        icon: market.icon || '🛒',
        status: market.status,
      });
    }
  }, [market]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, guildId: formData.guildId || undefined, status: formData.status || 'open' as const };
    if (market) {
      updateMarket({ ...market, ...payload });
    } else {
      addMarket(payload);
    }
    onClose();
  };

  const dialogTitle = market ? 'Edit Market' : 'Create New Market';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Market Title" 
            id="title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
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
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
              placeholder="What is sold in this market?"
            />
          </div>
           <div className="p-4 bg-stone-900/50 rounded-lg">
            <h3 className="font-semibold text-stone-200 mb-2">Scope</h3>
            <select name="guildId" value={formData.guildId} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                <option value="">Personal (Available to individuals)</option>
                {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{market ? 'Save Changes' : 'Create Market'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMarketDialog;