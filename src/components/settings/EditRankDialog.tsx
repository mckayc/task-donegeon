import React, { useState, useEffect } from 'react';
import { Rank } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useProgressionState, useProgressionDispatch } from '../../context/ProgressionContext';
import NumberInput from '../user-interface/NumberInput';

interface EditRankDialogProps {
  rank: Rank | null;
  onClose: () => void;
}

const EditRankDialog: React.FC<EditRankDialogProps> = ({ rank, onClose }) => {
  const { ranks } = useProgressionState();
  const { setRanks } = useProgressionDispatch();
  const [formData, setFormData] = useState({ 
      name: '', 
      xpThreshold: 0,
      iconType: 'emoji' as 'emoji' | 'image',
      icon: '🔰',
      imageUrl: '',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);


  useEffect(() => {
    if (rank) {
      setFormData({ 
          name: rank.name, 
          xpThreshold: rank.xpThreshold,
          iconType: rank.iconType || 'emoji',
          icon: rank.icon || '🔰',
          imageUrl: rank.imageUrl || '',
      });
    }
  }, [rank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedRanks;
    if (rank) {
      updatedRanks = ranks.map(r => r.id === rank.id ? { ...r, ...formData } : r);
    } else {
      const newRank: Rank = { id: `rank-${Date.now()}`, ...formData };
      updatedRanks = [...ranks, newRank];
    }
    setRanks(updatedRanks);
    onClose();
  };

  const dialogTitle = rank ? 'Edit Rank' : 'Create New Rank';

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Rank Name" 
            value={formData.name} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))} 
            required 
          />
           <NumberInput 
            label="XP Threshold" 
            min={0}
            value={formData.xpThreshold} 
            onChange={(newValue) => setFormData(p => ({ ...p, xpThreshold: newValue }))}
          />
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Icon Type</label>
            <div className="flex gap-4 p-2 bg-stone-700/50 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500"/>
                    <span>Emoji</span>
                </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" />
                    <span>Image</span>
                </label>
            </div>
          </div>
          {formData.iconType === 'emoji' ? (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                  className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2"
                >
                  <span className="text