import React, { useState, useEffect, useMemo } from 'react';
import { hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import Input from './Input';

interface SimpleColorPickerProps {
  label: string;
  hslValue: string;
  onChange: (value: string) => void;
}

const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({ label, hslValue, onChange }) => {
    const hex = useMemo(() => {
        const { h, s, l } = parseHslString(hslValue);
        return rgbToHex(hslToRgb(h, s, l));
    }, [hslValue]);

    const [localHex, setLocalHex] = useState(hex);

    useEffect(() => {
        setLocalHex(hex);
    }, [hex]);

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setLocalHex(newHex);
        const [newH, newS, newL] = hexToHsl(newHex);
        onChange(hslValuesToCss(newH, newS, newL));
    };

    const handleTextInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        if (/^#([0-9A-F]{3}){1,2}$/i.test(newHex)) {
             const [newH, newS, newL] = hexToHsl(newHex);
             onChange(hslValuesToCss(newH, newS, newL));
        } else {
            setLocalHex(hex); // Revert to original if invalid
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex items-center gap-2 p-2 bg-stone-700/50 rounded-md">
                <input 
                    type="color" 
                    value={hex} 
                    onChange={handleColorInputChange} 
                    className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                    aria-label={label}
                />
                <Input
                    value={localHex}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalHex(e.target.value)}
                    onBlur={handleTextInputBlur}
                    className="font-mono text-xs !h-8"
                />
            </div>
        </div>
    );
};

export default SimpleColorPicker;