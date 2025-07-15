
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';

const FONT_OPTIONS = [
    "'MedievalSharp', cursive",
    "'Roboto', sans-serif",
    "'Comic Neue', cursive",
    "'Uncial Antiqua', cursive",
    "'Press Start 2P', cursive",
    "'Special Elite', cursive",
    "'Metamorphous', serif",
    "'IM Fell English SC', serif"
];

const DIALOG_ID = 'theme-editor-dialog';

const ColorInput: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => {
    const {h, s, l} = parseHslString(value);
    const hex = rgbToHex(hslToRgb(h,s,l));

    const handleHslChange = (part: 'h' | 's' | 'l', val: number) => {
        const newHsl = {h, s, l, [part]: val};
        onChange(hslValuesToCss(newHsl.h, newHsl.s, newHsl.l));
    };

    const handleHexChange = (hexVal: string) => {
        const [newH, newS, newL] = hexToHsl(hexVal);
        onChange(hslValuesToCss(newH, newS, newL));
    };
    
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input type="color" value={hex} onChange={e => handleHexChange(e.target.value)} className="w-10 h-10 p-1 bg-stone-700 border border-stone-600 rounded-md cursor-pointer" />
                <div className="flex-grow grid grid-cols-3 gap-1">
                    <Input type="number" value={h} onChange={e => handleHslChange('h', Number(e.target.value))} min="0" max="360" aria-label="Hue"/>
                    <Input type="number" value={s} onChange={e => handleHslChange('s', Number(e.target.value))} min="0" max="100" aria-label="Saturation" />
                    <Input type="number" value={l} onChange={e => handleHslChange('l', Number(e.target.value))} min="0" max="100" aria-label="Lightness" />
                </div>
            </div>
        </div>
    );
};

const HueSaturationInput: React.FC<{ label: string, hue: string, saturation: string, lightness: string, onHueChange: (v: string) => void, onSatChange: (v: string) => void, onLightnessChange: (v: string) => void }> = ({ label, hue, saturation, lightness, onHueChange, onSatChange, onLightnessChange }) => {
    const hex = rgbToHex(hslToRgb(Number(hue), Number(saturation.replace('%','')), Number(lightness.replace('%',''))));

    const handleHexChange = (hexVal: string) => {
        const [newH, newS, newL] = hexToHsl(hexVal);
        onHueChange(String(newH));
        onSatChange(`${newS}%`);
        onLightnessChange(`${newL}%`);
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex items-center gap-2">
                 <input type="color" value={hex} onChange={e => handleHexChange(e.target.value)} className="w-10 h-10 p-1 bg-stone-700 border border-stone-600 rounded-md cursor-pointer" />
                <div className="flex-grow grid grid-cols-3 gap-1">
                    <Input type="number" value={hue} onChange={e => onHueChange(e.target.value)} min="0" max="360" aria-label="Hue" />
                    <Input type="text" value={saturation} onChange={e => onSatChange(e.target.value)} placeholder="e.g. 80%" aria-label="Saturation" />
                    <Input type="text" value={lightness} onChange={e => onLightnessChange(e.target.value)} placeholder="e.g. 50%" aria-label="Lightness" />
                </div>
            </div>
        </div>
    );
};

const ContrastChecker: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
    const pairs = [
        { label: "Text on Primary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-primary'] },
        { label: "Secondary Text on Primary BG", fg: styles['--color-text-secondary'], bg: styles['--color-bg-primary'] },
        { label: "Text on Secondary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-secondary'] },
        { label: "Accent Text on Primary BG", fg: `hsl(${styles['--color-accent-hue']} ${styles['--color-accent-saturation']} ${styles['--color-accent-lightness']})`, bg: styles['--color-bg-primary']},
        { label: "Button Text on Button BG", fg: '0 0 100', bg: `hsl(${styles['--color-primary-hue']} ${styles['--color-primary-saturation']} ${styles['--color-primary-lightness']})`}
    ];

    return (
        <div className="p-4 bg-stone-900/50 rounded-lg">
            <h3 className="font-semibold text-lg text-stone-200">Accessibility Contrast</h3>
            <div className="mt-2 space-y-2">
                {pairs.map(pair => {
                    const ratio = getContrast(pair.fg, pair.bg);
                    const rating = getWcagRating(ratio);
                    return (
                        <div key={pair.label} className="flex justify-between items-center text-sm">
                            <span className="text-stone-300">{pair.label}</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${rating === 'Fail' ? 'text-red-400' : 'text-green-400'}`}>{ratio.toFixed(2)}:1</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${rating === 'Fail' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{rating}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


interface EditThemeDialogProps {
    themeToEdit: ThemeDefinition | null;
    onClose: () => void;
}

const EditThemeDialog: React.FC<EditThemeDialogProps> = ({ themeToEdit, onClose }) => {
    const { addTheme, updateTheme } = useAppDispatch();
    const { themes } = useAppState();
    
    const getInitialFormData = (): ThemeDefinition => {
        if (themeToEdit) return JSON.parse(JSON.stringify(themeToEdit));
        return {
            id: '', name: '', isCustom: true,
            styles: themes.find(t => t.id === 'emerald')?.styles || {} as ThemeStyle
        };
    };

    const [formData, setFormData] = useState<ThemeDefinition>(getInitialFormData());

    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.id = 'theme-preview-style';
        const cssVars = Object.entries(formData.styles)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n');
        styleElement.innerHTML = `#${DIALOG_ID} { ${cssVars} }`;
        document.head.appendChild(styleElement);

        return () => {
            document.getElementById('theme-preview-style')?.remove();
        };
    }, [formData.styles]);

    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        setFormData(p => ({ ...p, styles: { ...p.styles, [key]: value } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (themeToEdit) {
            updateTheme(formData);
        } else {
            const { id, ...newThemeData } = formData;
            addTheme(newThemeData);
        }
        onClose();
    };

    const dialogTitle = themeToEdit ? `Edit Theme: ${formData.name}` : 'Create New Theme';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div id={DIALOG_ID} className="border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    <h2 className="text-3xl" style={{ fontFamily: 'var(--font-display)', color: 'hsl(var(--color-text-primary))' }}>{dialogTitle}</h2>
                </div>
                
                <form id="theme-dialog-form" onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-6 overflow-y-auto scrollbar-hide" style={{ color: 'hsl(var(--color-text-primary))' }}>
                    <div className="space-y-4 md:col-span-2">
                         <Input label="Theme Name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-lg border-b pb-1" style={{borderColor: 'hsl(var(--color-border))'}}>Fonts</h3>
                        <Input as="select" label="Display Font" value={formData.styles['--font-display']} onChange={e => handleStyleChange('--font-display', e.target.value)}>
                            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                        </Input>
                         <Input as="select" label="Body Font" value={formData.styles['--font-body']} onChange={e => handleStyleChange('--font-body', e.target.value)}>
                            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                        </Input>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-lg border-b pb-1" style={{borderColor: 'hsl(var(--color-border))'}}>Colors</h3>
                        <ColorInput label="Primary Background" value={formData.styles['--color-bg-primary']} onChange={v => handleStyleChange('--color-bg-primary', v)} />
                        <ColorInput label="Secondary Background" value={formData.styles['--color-bg-secondary']} onChange={v => handleStyleChange('--color-bg-secondary', v)} />
                        <ColorInput label="Tertiary Background" value={formData.styles['--color-bg-tertiary']} onChange={v => handleStyleChange('--color-bg-tertiary', v)} />
                        <ColorInput label="Primary Text" value={formData.styles['--color-text-primary']} onChange={v => handleStyleChange('--color-text-primary', v)} />
                        <ColorInput label="Secondary Text" value={formData.styles['--color-text-secondary']} onChange={v => handleStyleChange('--color-text-secondary', v)} />
                        <ColorInput label="Border" value={formData.styles['--color-border']} onChange={v => handleStyleChange('--color-border', v)} />
                        
                        <HueSaturationInput label="Primary Color" hue={formData.styles['--color-primary-hue']} saturation={formData.styles['--color-primary-saturation']} lightness={formData.styles['--color-primary-lightness']}
                            onHueChange={v => handleStyleChange('--color-primary-hue', v)} onSatChange={v => handleStyleChange('--color-primary-saturation', v)} onLightnessChange={v => handleStyleChange('--color-primary-lightness', v)} />
                        
                        <HueSaturationInput label="Accent Color" hue={formData.styles['--color-accent-hue']} saturation={formData.styles['--color-accent-saturation']} lightness={formData.styles['--color-accent-lightness']}
                            onHueChange={v => handleStyleChange('--color-accent-hue', v)} onSatChange={v => handleStyleChange('--color-accent-saturation', v)} onLightnessChange={v => handleStyleChange('--color-accent-lightness', v)} />

                        <HueSaturationInput label="Accent Light Color" hue={formData.styles['--color-accent-light-hue']} saturation={formData.styles['--color-accent-light-saturation']} lightness={formData.styles['--color-accent-light-lightness']}
                            onHueChange={v => handleStyleChange('--color-accent-light-hue', v)} onSatChange={v => handleStyleChange('--color-accent-light-saturation', v)} onLightnessChange={v => handleStyleChange('--color-accent-light-lightness', v)} />
                    </div>
                    
                    <div className="md:col-span-2">
                        <ContrastChecker styles={formData.styles} />
                    </div>
                </form>
                
                <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="theme-dialog-form">{themeToEdit ? 'Save Changes' : 'Create Theme'}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditThemeDialog;
