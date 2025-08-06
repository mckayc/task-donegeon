
import React, { useRef, useEffect } from 'react';
import Picker, { EmojiStyle, Theme } from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={pickerRef} className="absolute z-20 mt-2">
      <Picker
        onEmojiClick={(emojiData) => {
          onSelect(emojiData.emoji);
          onClose();
        }}
        theme={Theme.DARK}
        emojiStyle={EmojiStyle.NATIVE}
        lazyLoadEmojis={true}
        searchPlaceHolder="Search for an emoji"
        />
    </div>
  );
};

export default EmojiPicker;
