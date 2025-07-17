
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import { SparklesIcon, TrophyIcon, RankIcon } from '../ui/Icons';
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
    const { settings } = useAppState();
    return (
        <div style={themeData as React.CSSProperties} className="p-6 rounded-lg h-full transition-all duration-300 flex flex-col bg-stone-900 border-2 border-stone-700">
             <div className="flex-grow p-4 rounded-lg space-y-4" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                <Card 
                    title={settings.terminology.level} 
                    className="lg:col-span-1"
                >
                    <div className="cursor-pointer text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-5xl border-4 border-accent">
                           <RankIcon />
                        </div>
                        <p className="text-2xl font-bold text-accent-light">Adept</p>
                        <p className="text-stone-400">Level 5</p>
                        <div className="w-full bg-stone-700 rounded-full h-4 mt-4 overflow-hidden">
                            <div className="h-4 rounded-full btn-primary" style={{width: `60%`}}></div>
                        </div>
                    </div>
                </Card>

                <Card title="Inventory">
                    <div>
                        <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{settings.terminology.currency}</h4>
                        <div className="space-y-2 mt-2">
                            <div className="flex items-baseline justify-between">
                                <span className="text-stone-200 flex items-center gap-2"><span>💰</span> <span>Gold</span></span>
                                <span className="font-semibold text-accent-light">125</span>
                            </div>
                        </div>
                    </div>
                </Card>

                 <Card title={`Latest ${settings.terminology.award}`}>
                     <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-amber-900/50 rounded-full flex items-center justify-center text-amber-400 text-3xl"><TrophyIcon /></div>
                        <p className="mt-2 text-lg font-semibold text-amber-300">First Quest</p>
                    </div>
                </Card>
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
    }, [selectedThemeId]); // This effect ONLY runs when the user selects a different theme, not on background syncs.

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
                                    <SparklesIcon className="w-5 h-5 mr-2" /> Idea Generator
                                </Button>
                            )}
                        </div>
                         <Input label="Theme Name" value={formData.name} onChange={e => setFormData(p => p ? ({...p, name: e.target.value}) : null)} required className="mt-4" />
                    </Card>

                    <Card title="Fonts & Sizes">
                        <div className="space-y-4">
                             <Input as="select" label="Display Font" value={formData.styles['--font-display']} onChange={e => handleStyleChange('--font-display', e.target.value)}>
                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                            </Input>
                            <Input as="select" label="Body Font" value={formData.styles['--font-body']} onChange={e => handleStyleChange('--font-body', e.target.value)}>
                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                            </Input>
                            <div>
                                <label className="flex justify-between text-sm font-medium mb-1">Display Font Size <span>({formData.styles['--font-size-display']})</span></label>
                                <input type="range" min="1.5" max="4" step="0.1" value={parseFloat(formData.styles['--font-size-display'])} onChange={e => handleStyleChange('--font-size-display', `${e.target.value}rem`)} className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                             <div>
                                <label className="flex justify-between text-sm font-medium mb-1">Body Font Size <span>({formData.styles['--font-size-body']})</span></label>
                                <input type="range" min="0.8" max="1.2" step="0.05" value={parseFloat(formData.styles['--font-size-body'])} onChange={e => handleStyleChange('--font-size-body', `${e.target.value}rem`)} className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                    </Card>

                    <Card title="Colors">
                        <div className="space-y-4">
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
