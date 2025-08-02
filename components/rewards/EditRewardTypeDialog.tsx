import React, { useState, useEffect } from 'react';
import { RewardCategory, RewardTypeDefinition } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch } from '../../context/AppContext';
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';

interface EditRewardTypeDialogProps {
  rewardType: RewardTypeDefinition | null;
  onClose: () => void;
}

const EditRewardTypeDialog: React.FC<EditRewardTypeDialogProps> = ({ rewardType, onClose }) => {
  const { addRewardType, updateRewardType } = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: RewardCategory.Currency,
    iconType: 'emoji' as 'emoji' | 'image',
    icon: '💰',
    imageUrl: '',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (rewardType) {
      setFormData({
        name: rewardType.name,
        description: rewardType.description,
        category: rewardType.category,
        iconType: rewardType.iconType || 'emoji',
        icon: rewardType.icon || '💰',
        imageUrl: rewardType.imageUrl || '',
      });
    }
  }, [rewardType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      iconType: formData.iconType,
      icon: formData.icon,
      imageUrl: formData.imageUrl,
    };

    if (rewardType) {
      updateRewardType({ ...rewardType, ...finalData });
    } else {
      addRewardType(finalData);
    }
    onClose();
  };

  const isCore = rewardType?.isCore || false;
  const dialogTitle = rewardType ? `Edit ${isCore ? '' : 'Custom '}Reward` : 'Create New Reward';

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} id="reward-type-form" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="What is this reward for?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleSelectChange('category', value)} defaultValue={formData.category} disabled={isCore}>
                <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={RewardCategory.Currency}>Currency</SelectItem>
                    <SelectItem value={RewardCategory.XP}>Experience (XP)</SelectItem>
                </SelectContent>
              </Select>
              {isCore && <p className="text-xs text-muted-foreground mt-1">Core reward types cannot change their category.</p>}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="reward-type-form">{rewardType ? 'Save Changes' : 'Create Reward'}</Button>
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

export default EditRewardTypeDialog;