import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import { TrophyIcon, RankIcon } from '../ui/Icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/ConfirmDialog';
import SimpleColorPicker from '../ui/SimpleColorPicker';

const FONT_OPTIONS = [
    "'MedievalSharp', cursive", "'Uncial Antiqua', cursive", "'Press Start 2P', cursive", "'IM Fell English SC', serif", 
    "'Cinzel Decorative', cursive", "'Comic Neue', 'cursive'", "'Special Elite', cursive", "'Metamorphous', serif", 
    "'Almendra', serif", "'Almendra Display', serif", "'Almendra SC', serif", "'Butcherman', cursive", 
    "'Creepster', cursive", "'Eater', cursive", "'Fondamento', cursive", "'Fruktur', cursive", "'Griffy', cursive", 
    "'Henny Penny', cursive", "'New Rocker', cursive", "'Nosifer', cursive", "'Pirata One', cursive", "'Rye', cursive", 
    "'Sancreek', cursive", "'Smokum', cursive", "'Roboto', sans-serif", "'Lora', serif", "'Vollkorn', serif", 
    "'EB Garamond', serif", "'Cormorant Garamond', serif", "'Crimson Pro', serif", "'Cinzel', serif"
];


const ContrastChecker: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
    const pairs = [
        { label: "Text on Primary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-primary'] },
        { label: "Secondary Text on Primary BG", fg: styles['--color-text-secondary'], bg: styles['--color-bg-primary'] },
        { label: "Text on Secondary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-secondary'] },
        { label: "Accent Text on Primary BG", fg: `hsl(${styles['--color-accent-hue']} ${styles['--color-accent-saturation']} ${styles['--color-accent-lightness']})`, bg: styles['--color-bg-primary']},
        { label: "Button Text on Button BG", fg: '0 0% 100%', bg: `hsl(${styles['--color-primary-hue']} ${styles['--color-primary-saturation']} ${styles['--color-primary-lightness']})`}
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
    const livePreviewStyles = Object.fromEntries(
        Object.entries(themeData).map(([key, value]) => [key, `hsl(${value})`])
    ) as React.CSSProperties;
    
    livePreviewStyles.fontFamily = themeData['--font-body'];

    return (
        <div style={livePreviewStyles} className="p-4 rounded-lg h-full transition-all duration-300 flex flex-col bg-stone-900 border-2 border-stone-700">
             <div className="flex-grow p-4 rounded-lg space-y-4" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                <Card 
                    title={settings.terminology.level} 
                    className="lg:col-span-1"
                >
                    <div className="cursor-pointer text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-5xl border-4" style={{borderColor: 'hsl(var(--color-accent-hue) var(--color-accent-saturation) var(--color-accent-lightness))'}}>
                           <RankIcon />
                        </div>
                        <p className="text-2xl font-bold" style={{color: 'hsl(var(--color-accent-light-hue) var(--color-accent-light-saturation) var(--color-accent-light-lightness))'}}>Adept</p>
                        <p style={{color: 'hsl(var(--color-text-secondary))'}}>Level 5</p>
                        <div className="w-full bg-stone-700 rounded-full h-4 mt-4 overflow-hidden">
                            <div className="h-4 rounded-full" style={{width: `60%`, backgroundColor: 'hsl(var(--color-primary-hue) var(--color-primary-saturation) var(--color-primary-lightness))'}}></div>
                        </div>
                    </div>
                </Card>
             </div>
        </div>
    );
};


const ThemeEditorPage: React.FC = () => {
    const { themes, isAiConfigured } = useAppState();
    const { addTheme, updateTheme, deleteTheme, addNotification } = useAppDispatch();

    const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id || 'new');
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
    }, [selectedThemeId, themes]);

    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (!formData) return;
        setFormData(p => p ? ({ ...p, styles: { ...p.styles, [key]: value } }) : null);
    };

    const handleHslPartChange = (keyPrefix: string, part: 'hue' | 'saturation' | 'lightness', value: string) => {
         if (!formData) return;
        const fullKey = `--color-${keyPrefix}-${part}`;
        handleStyleChange(fullKey as keyof ThemeStyle, value);
    };
    
    const handleSave = () => {
        if (!formData || !formData.name.trim()) {
            addNotification({type: 'error', message: 'Theme name cannot be empty.'});
            return;
        }
        
        if (formData.id === 'new') {
            const { id, ...newThemeData } = formData;
            addTheme(newThemeData);
        } else {
            updateTheme(formData);
        }
    };

     const handleCreateNew = () => {
        const newName = prompt("Enter a name for the new theme:", "My Custom Theme");
        if(newName && newName.trim()){
            const defaultStyles = themes.find(t => t.id === 'emerald')?.styles;
            const newThemeData = {
                name: newName.trim(),
                isCustom: true,
                styles: defaultStyles || {} as ThemeStyle
            };
            addTheme(newThemeData);
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 lg:sticky top-24 self-start space-y-4">
                     <ThemePreview themeData={formData.styles} />
                     <Card title="Select Theme">
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                             <button onClick={handleCreateNew} className="w-full aspect-square rounded-lg transition-all duration-200 border-2 border-dashed border-stone-600 hover:border-emerald-500 hover:text-emerald-400 flex flex-col items-center justify-center">
                                <span className="text-3xl">+</span>
                                <span className="text-xs font-semibold">New Theme</span>
                             </button>
                            {themes.map(theme => (
                                <div key={theme.id} className="relative group">
                                <button
                                    onClick={() => setSelectedThemeId(theme.id)}
                                    className={`w-full aspect-square rounded-lg transition-all duration-200 border-4 ${selectedThemeId === theme.id ? 'border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={{ fontFamily: theme.styles['--font-display'], backgroundColor: `hsl(${theme.styles['--color-bg-primary']})`, color: `hsl(${theme.styles['--color-text-primary']})` }}
                                >
                                    <div className="p-1 flex flex-col justify-between h-full">
                                        <h3 className="text-sm font-bold capitalize truncate">{theme.name}</h3>
                                    </div>
                                </button>
                                {theme.isCustom && (
                                    <button onClick={() => setDeletingTheme(theme)} className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        &times;
                                    </button>
                                )}
                                </div>
                            ))}
                        </div>
                     </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <Input label="Theme Name" value={formData.name} onChange={e => setFormData(p => p ? ({...p, name: e.target.value}) : null)} required className="mt-4" disabled={!formData.isCustom} />
                            {isAiAvailable && (
                                <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary" className="mt-7">
                                    Idea Generator
                                </Button>
                            )}
                        </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <SimpleColorPicker label="Primary Background" hslValue={formData.styles['--color-bg-primary']} onChange={v => handleStyleChange('--color-bg-primary', v)} />
                            <SimpleColorPicker label="Secondary Background" hslValue={formData.styles['--color-bg-secondary']} onChange={v => handleStyleChange('--color-bg-secondary', v)} />
                            <SimpleColorPicker label="Tertiary Background" hslValue={formData.styles['--color-bg-tertiary']} onChange={v => handleStyleChange('--color-bg-tertiary', v)} />
                            <SimpleColorPicker label="Primary Text" hslValue={formData.styles['--color-text-primary']} onChange={v => handleStyleChange('--color-text-primary', v)} />
                            <SimpleColorPicker label="Secondary Text" hslValue={formData.styles['--color-text-secondary']} onChange={v => handleStyleChange('--color-text-secondary', v)} />
                            <SimpleColorPicker label="Border" hslValue={formData.styles['--color-border']} onChange={v => handleStyleChange('--color-border', v)} />
                        </div>
                         <div className="pt-4 mt-4 border-t border-stone-700/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SimpleColorPicker label="Primary/Button" hslValue={`hsl(${formData.styles['--color-primary-hue']} ${formData.styles['--color-primary-saturation']} ${formData.styles['--color-primary-lightness']})`} 
                                onChange={v => {
                                    const {h, s, l} = parseHslString(v);
                                    handleHslPartChange('primary', 'hue', String(h));
                                    handleHslPartChange('primary', 'saturation', `${s}%`);
                                    handleHslPartChange('primary', 'lightness', `${l}%`);
                                }} />
                            <SimpleColorPicker label="Accent" hslValue={`hsl(${formData.styles['--color-accent-hue']} ${formData.styles['--color-accent-saturation']} ${formData.styles['--color-accent-lightness']})`} 
                                onChange={v => {
                                    const {h, s, l} = parseHslString(v);
                                    handleHslPartChange('accent', 'hue', String(h));
                                    handleHslPartChange('accent', 'saturation', `${s}%`);
                                    handleHslPartChange('accent', 'lightness', `${l}%`);
                                }} />
                            <SimpleColorPicker label="Accent Light" hslValue={`hsl(${formData.styles['--color-accent-light-hue']} ${formData.styles['--color-accent-light-saturation']} ${formData.styles['--color-accent-light-lightness']})`} 
                                onChange={v => {
                                    const {h, s, l} = parseHslString(v);
                                    handleHslPartChange('accent-light', 'hue', String(h));
                                    handleHslPartChange('accent-light', 'saturation', `${s}%`);
                                    handleHslPartChange('accent-light', 'lightness', `${l}%`);
                                }} />
                        </div>
                    </Card>
                    
                    <ContrastChecker styles={formData.styles} />

                    <div className="flex justify-end items-center gap-4 pt-4">
                        <Button onClick={handleSave}>{(formData.id === 'new') ? 'Create & Save Theme' : 'Save Changes'}</Button>
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
                        setSelectedThemeId('emerald');
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
