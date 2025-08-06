import React from 'react';
import { hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';

interface SimpleColorPickerProps {
  label: string;
  hslValue: string; // Expects a string like "224 71% 4%" or "hsl(224 71% 4%)"
  onChange: (value: string) => void;
}

const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({ label, hslValue, onChange }) => {
    const { h, s, l } = parseHslString(hslValue);
    const hex = rgbToHex(hslToRgb(h, s, l));

    const handleHexChange = (hexVal: string) => {
        const [newH, newS, newL] = hexToHsl(hexVal);
        onChange(`${newH} ${newS}% ${newL}%`);
    };
    
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex items-center gap-2 p-2 bg-stone-700/50 rounded-md">
                <input 
                    type="color" 
                    value={hex} 
                    onChange={e => handleHexChange(e.target.value)} 
                    className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                    aria-label={label}
                />
                <span className="text-xs font-mono text-stone-400">{hex.toUpperCase()}</span>
            </div>
        </div>
    );
};

export default SimpleColorPicker;
