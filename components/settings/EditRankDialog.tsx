

import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Rank } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';

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