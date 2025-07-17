
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/ConfirmDialog';

const FONT_OPTIONS = [
    "'MedievalSharp', cursive", "'Uncial Antiqua', cursive", "'Press Start 2P', cursive", "'IM Fell English SC', serif", 
    "'Cinzel Decorative', cursive", "'Comic Neue', 'cursive'", "'Special Elite', cursive", "'Metamorphous', serif", 
    "'Almendra', serif", "'Almendra Display', serif", "'Almendra SC', serif", "'Butcherman', cursive", 
    "'Creepster', cursive", "'Eater', cursive", "'Fondamento', cursive", "'Fruktur', cursive", "'Griffy', cursive", 
    "'Henny Penny', cursive", "'New Rocker', cursive", "'Nosifer', cursive", "'Pirata One', cursive", "'Rye', cursive", 
    "'Sancreek', cursive", "'Smokum', cursive", "'Roboto', sans-serif", "'Lora', serif", "'Vollkorn', serif", 
    "'EB Garamond', serif", "'Cormorant Garamond', serif", "'Crimson Pro', serif", "'Cinzel', serif"
];

const CompactColorInput: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => {
    const {h, s, l} = parseHslString(value);
    const hex = rgbToHex(hslToRgb(h,s,l));

    const handleHexChange = (hexVal: string) => {
        const [newH, newS, newL] = hexToHsl(hexVal);
        onChange(`${newH} ${newS}% ${newL}%`);
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-stone-300">{label}</label>
            <input type="color" value={hex} onChange={e => handleHexChange(e.target.value)} className="w-full h-10 p-1 bg-stone-700 border border-stone-600 rounded-md cursor-pointer" />
        </div>
    );
};

const CompactHueSaturationInput: React.FC<{ label: string, hue: string, saturation: string, lightness: string, onHueChange: (v: string) => void, onSatChange: (v: string) => void, onLightnessChange: (v: string) => void }> = ({ label, hue, saturation, lightness, onHueChange, onSatChange, onLightnessChange }) => {
    const hex = rgbToHex(hslToRgb(Number(hue), Number(saturation.replace('%','')), Number(lightness.replace('%',''))));

    const handleHexChange = (hexVal: string) => {
        const [newH, newS, newL] = hexToHsl(hexVal);
        onHueChange(String(newH));
        onSatChange(`${newS}%`);
        onLightnessChange(`${newL}%`);
    };
    
    return (
        <div>
            <label className="block text-sm font-medium mb-1 text-stone-300">{label}</label>
            <input type="color" value={hex} onChange={e => handleHexChange(e.target.value)} className="w-full h-10 p-1 bg-stone-700 border border-stone-600 rounded-md cursor-pointer" />
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
        <Card title="Accessibility Contrast" className="mt-4">
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
        </Card>
    );
};


const ThemePreview: React.FC<{ themeData: ThemeStyle }> = ({ themeData }) => {
    return (
        <div style={themeData as React.CSSProperties} className="p-4 rounded-lg h-full transition-all duration-300 flex flex-col bg-stone-900 border-2 border-stone-700">
             <div className="flex-grow p-4 rounded-lg space-y-4" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                <h1>Theme Preview</h1>
                <p>This is paragraph text, with a <span>span of text</span> inside it.</p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed btn-primary">Primary Button</button>
                  <button className="px-6 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-stone-600 text-stone-100 hover:bg-stone-500">Secondary</button>
                </div>
                <p className="text-sm text-accent">This is accent text.</p>
             </div>
        </div>
    );
};

const FontEditor: React.FC<{
    label: string;
    fontKey: keyof ThemeStyle;
    sizeKey: keyof ThemeStyle;
    styles: ThemeStyle;
    onStyleChange: (key: keyof ThemeStyle, value: string) => void;
}> = ({ label, fontKey, sizeKey, styles, onStyleChange }) => {
  return (
    <div>
      <Input as="select" label={label} value={styles[fontKey]} onChange={e => onStyleChange(fontKey, e.target.value)}>
        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
      </Input>
      <div className="mt-2">
          <label className="flex justify-between text-sm font-medium mb-1">{label} Size <span>({styles[sizeKey]})</span></label>
          <input type="range" min="0.8" max="4" step="0.05" value={parseFloat(styles[sizeKey] as string)} onChange={e => onStyleChange(sizeKey, `${e.target.value}rem`)} className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer" />
      </div>
    </div>
  );
};


const ThemeEditorPage: React.FC = () => {
    const { themes, isAiConfigured } = useAppState();
    const { addTheme, updateTheme, deleteTheme, addNotification } = useAppDispatch();

    const [selectedThemeId, setSelectedThemeId] = useState<string>('new');
    const [formData, setFormData] = useState<ThemeDefinition | null>(null);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const isAiAvailable = useAppState().settings.enableAiFeatures && isAiConfigured;

    useEffect(() => {
        const themeToEdit = themes.find(t => t.id === selectedThemeId);
        if (themeToEdit) {
            setFormData(JSON.parse(JSON.stringify(themeToEdit)));
        } else {
            // New Theme state
            const defaultStyles = themes.find(t => t.id === 'emerald')?.styles;
            setFormData({
                id: 'new',
                name: 'New Custom Theme',
                isCustom: true,
                styles: defaultStyles || {} as ThemeStyle
            });
        }
    }, [selectedThemeId]);

    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (!formData) return;
        setFormData(p => p ? ({ ...p, styles: { ...p.styles, [key]: value } }) : null);
    };
    
    const handleSave = () => {
        if (!formData || !formData.name.trim()) {
            addNotification({type: 'error', message: 'Theme name cannot be empty.'});
            return;
        }
        
        if (selectedThemeId === 'new' || formData.id === 'new') {
            const { id, ...newThemeData } = formData;
            addTheme(newThemeData);
        } else {
            updateTheme(formData);
        }
    };
    
    const handleUseIdea = (idea: { name: string; styles: any; }) => {
        const fullStyles = {
            ...themes.find(t => t.id === 'emerald')!.styles, // ensure all keys exist
            ...idea.styles,
        }
        setFormData({ name: idea.name, styles: fullStyles, isCustom: true, id: 'new' });
        setSelectedThemeId('new');
        setIsGeneratorOpen(false);
    };

    if (!formData) return <div>Loading theme data...</div>

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:sticky top-24 self-start">
                     <ThemePreview themeData={formData.styles} />
                </div>

                <div className="space-y-6">
                    <Card>
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <Input as="select" label="Theme to Edit" value={selectedThemeId} onChange={e => setSelectedThemeId(e.target.value)}>
                                <option value="new">-- Create New Theme --</option>
                                <optgroup label="Custom Themes">
                                    {themes.filter(t => t.isCustom).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                                <optgroup label="Preset Themes">
                                    {themes.filter(t => !t.isCustom).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                            </Input>
                            {isAiAvailable && (
                                <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary" className="mt-7">
                                    Idea Generator
                                </Button>
                            )}
                        </div>
                         <Input label="Theme Name" value={formData.name} onChange={e => setFormData(p => p ? ({...p, name: e.target.value}) : null)} required className="mt-4" />
                    </Card>

                    <Card title="Fonts & Sizes">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <FontEditor label="H1 Font" fontKey="--font-h1" sizeKey="--font-size-h1" styles={formData.styles} onStyleChange={handleStyleChange} />
                             <FontEditor label="Paragraph Font" fontKey="--font-p" sizeKey="--font-size-p" styles={formData.styles} onStyleChange={handleStyleChange} />
                             <FontEditor label="Span Font" fontKey="--font-span" sizeKey="--font-size-span" styles={formData.styles} onStyleChange={handleStyleChange} />
                             <FontEditor label="Button Font" fontKey="--font-button" sizeKey="--font-size-button" styles={formData.styles} onStyleChange={handleStyleChange} />
                        </div>
                    </Card>

                    <Card title="Colors">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                            <CompactColorInput label="Primary BG" value={formData.styles['--color-bg-primary']} onChange={v => handleStyleChange('--color-bg-primary', v)} />
                            <CompactColorInput label="Secondary BG" value={formData.styles['--color-bg-secondary']} onChange={v => handleStyleChange('--color-bg-secondary', v)} />
                            <CompactColorInput label="Tertiary BG" value={formData.styles['--color-bg-tertiary']} onChange={v => handleStyleChange('--color-bg-tertiary', v)} />
                            <CompactColorInput label="Primary Text" value={formData.styles['--color-text-primary']} onChange={v => handleStyleChange('--color-text-primary', v)} />
                            <CompactColorInput label="Secondary Text" value={formData.styles['--color-text-secondary']} onChange={v => handleStyleChange('--color-text-secondary', v)} />
                            <CompactColorInput label="Border" value={formData.styles['--color-border']} onChange={v => handleStyleChange('--color-border', v)} />
                            <CompactHueSaturationInput label="Primary Color" hue={formData.styles['--color-primary-hue']} saturation={formData.styles['--color-primary-saturation']} lightness={formData.styles['--color-primary-lightness']}
                                onHueChange={v => handleStyleChange('--color-primary-hue', v)} onSatChange={v => handleStyleChange('--color-primary-saturation', v)} onLightnessChange={v => handleStyleChange('--color-primary-lightness', v)} />
                            
                            <CompactHueSaturationInput label="Accent Color" hue={formData.styles['--color-accent-hue']} saturation={formData.styles['--color-accent-saturation']} lightness={formData.styles['--color-accent-lightness']}
                                onHueChange={v => handleStyleChange('--color-accent-hue', v)} onSatChange={v => handleStyleChange('--color-accent-saturation', v)} onLightnessChange={v => handleStyleChange('--color-accent-lightness', v)} />

                            <CompactHueSaturationInput label="Accent Light Color" hue={formData.styles['--color-accent-light-hue']} saturation={formData.styles['--color-accent-light-saturation']} lightness={formData.styles['--color-accent-light-lightness']}
                                onHueChange={v => handleStyleChange('--color-accent-light-hue', v)} onSatChange={v => handleStyleChange('--color-accent-light-saturation', v)} onLightnessChange={v => handleStyleChange('--color-accent-light-lightness', v)} />
                        </div>
                    </Card>

                    <ContrastChecker styles={formData.styles} />

                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-stone-700">
                        {formData.isCustom && selectedThemeId !== 'new' && (
                            <Button variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => setDeletingTheme(formData)}>Delete Theme</Button>
                        )}
                        <Button onClick={handleSave}>{(selectedThemeId === 'new' || formData.id === 'new') ? 'Create Theme' : 'Save Changes'}</Button>
                    </div>
                </div>
            </div>

            {isGeneratorOpen && <ThemeIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
            <ConfirmDialog
                isOpen={!!deletingTheme}
                onClose={() => setDeletingTheme(null)}
                onConfirm={() => {
                    if (deletingTheme) {
                        deleteTheme(deletingTheme.id);
                        setSelectedThemeId('new');
                    }
                    setDeletingTheme(null);
                }}
                title="Delete Theme"
                message={`Are you sure you want to delete the theme "${deletingTheme?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ThemeEditorPage;
