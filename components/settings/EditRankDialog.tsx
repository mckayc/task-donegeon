import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Rank } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmojiPicker from '../ui/emoji-picker';
import ImageSelectionDialog from '../ui/image-selection-dialog';
import DynamicIcon from '../ui/dynamic-icon';

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
        icon: rank.icon,
        imageUrl: rank.imageUrl || '',
      });
    } else {
        // Find the highest existing threshold to suggest a new one
        const highestThreshold = ranks.reduce((max, r) => Math.max(max, r.xpThreshold), 0);
        setFormData(prev => ({ ...prev, xpThreshold: highestThreshold + 100}));
    }
  }, [rank, ranks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rank) {
      const updatedRanks = ranks.map(r => r.id === rank.id ? { ...r, ...formData } : r);
      setRanks(updatedRanks);
    } else {
      const newRank: Rank = { ...formData, id: `rank-${Date.now()}` };
      const updatedRanks = [...ranks, newRank];
      setRanks(updatedRanks);
    }
    onClose();
  };
  
  const dialogTitle = rank ? 'Edit Rank' : 'Create New Rank';

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form id="rank-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rank Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="xpThreshold">XP Threshold</Label>
              <Input id="xpThreshold" name="xpThreshold" type="number" value={formData.xpThreshold} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, xpThreshold: parseInt(e.target.value) || 0 }))} required />
            </div>
            
            <div className="space-y-2">
                <Label>Icon Type</Label>
                <div className="flex gap-4 p-2 bg-background rounded-md">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-primary bg-background border-input"/>
                        <span>Emoji</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-primary bg-background border-input" />
                        <span>Image</span>
                    </label>
                </div>
            </div>
            {formData.iconType === 'emoji' ? (
              <div className="space-y-2">
                <Label>Icon (Emoji)</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                    className="w-full text-left px-3 py-2 bg-background border border-input rounded-md flex items-center gap-2"
                  >
                    <span className="text-2xl">{formData.icon}</span>
                    <span className="text-muted-foreground">Click to change</span>
                  </button>
                  {isEmojiPickerOpen && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setFormData(p => ({ ...p, icon: emoji }));
                        setIsEmojiPickerOpen(false);
                      }}
                      onClose={() => setIsEmojiPickerOpen(false)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Image Icon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <DynamicIcon 
                      iconType={formData.iconType} 
                      icon={formData.icon} 
                      imageUrl={formData.imageUrl}
                      className="w-full h-full text-4xl"
                      altText="Selected icon"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsGalleryOpen(true)}>Select Image</Button>
                </div>
              </div>
            )}
            
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="rank-form">{rank ? 'Save Changes' : 'Create Rank'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isGalleryOpen && (
        <ImageSelectionDialog 
          onSelect={(url) => {
            setFormData(p => ({...p, imageUrl: url}));
            setIsGalleryOpen(false);
          }}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </>
  );
};

export default EditRankDialog;