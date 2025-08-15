import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import SimpleColorPicker from '../user-interface/SimpleColorPicker';
import { getContrast, getWcagRating, parseHslString } from '../../utils/colors';
import { useAuthState } from '../../context/AuthContext';
import { useUIState } from '../../context/UIStateContext';
import ConfirmDialog from '../user-interface/ConfirmDialog';

const FONT_OPTIONS = [
    "'MedievalSharp', cursive", "'Uncial Antiqua', cursive", "'Press Start 2P', cursive", "'IM Fell English SC', serif", 
    "'Cinzel Decorative', cursive", "'Cinzel', serif", "'Comic Neue', cursive", "'Special Elite', cursive", "'Metamorphous', serif", 
    "'Almendra', serif", "'Almendra Display', serif", "'Almendra SC', serif", "'Butcherman', cursive", 
    "'Creepster', cursive", "'Eater', cursive", "'Fondamento', cursive", "'Fruktur', cursive", "'Griffy', cursive", 
    "'Henny Penny', cursive", "'New Rocker', cursive", "'Nosifer', cursive", "'Pirata One', cursive", "'Rye', cursive", 
    "'Sancreek', cursive", "'Smokum', cursive", "'Roboto', sans-serif", "'Lora', serif", "'Vollkorn', serif", 
    "'EB Garamond', serif", "'Cormorant Garamond', serif", "'Crimson Pro', serif"
];

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-stone-700/60 last:border-b-0">
            <button
                className="w-full flex justify-between items-center text-left py-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-xl font-semibold text-stone-200">{title}</h3>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="pb-6 space-y-4">{children}</div>}
        </div>
    );
};

const ThemePreview: React.FC<{ themeStyles: React.CSSProperties }> = ({ themeStyles }) => {
    const { settings } = useAppState();
    return (
        <div style={themeStyles} className="p-4 rounded-lg transition-all duration-300 flex flex-col border-2 border-stone-700 h-full" data-theme>
             <div className="flex-grow p-4 rounded-lg space-y-4" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                <h1>{settings.terminology.appName}</h1>
                <p>This is a preview of your theme. The quick brown fox jumps over the lazy dog.</p>
                <div className="flex gap-4">
                    <Button variant="default">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                </div>
                <Card title="Sample Card" className="mt-4">
                    <p>This card uses the secondary background color.</p>
                </Card>
             </div>
        </div>
    );
};

const ContrastChecker: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
    const pairs = useMemo(() => {
        const primaryHsl = `${styles['--color-primary-hue']} ${styles['--color-primary-saturation']} ${styles['--color-primary-lightness']}`;
        return [
            { label: "Text on Primary BG", fg: styles['--color-text-primary-hsl'], bg: styles['--color-bg-primary-hsl'] },
            { label: "Muted Text on Primary BG", fg: styles['--color-text-muted-hsl'] || styles['--color-text-secondary-hsl'], bg: styles['--color-bg-primary-hsl'] },
            { label: "Text on Card BG", fg: styles['--color-text-primary-hsl'], bg: styles['--color-bg-secondary-hsl'] },
            { label: "Button Text on Primary Button", fg: '210 40% 98%', bg: primaryHsl }
        ];
    }, [styles]);

    return (
        <div className="space-y-2">
            {pairs.map(pair => {
                const ratio = getContrast(pair.fg, `hsl(${pair.bg})`);
                const rating = getWcagRating(ratio);
                return (
                    <div key={pair.label} className="flex justify-between items-center text-sm p-2 bg-stone-900/40 rounded-md">
                        <span className="text-stone-300">{pair.label}</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${rating === 'Fail' ? 'text-red-400' : 'text-green-400'}`}>{ratio.toFixed(2)}:1</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${rating === 'Fail' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{rating}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const AppearancePage: React.FC = () => {
    const { settings, themes } = useAppState();
    const { addTheme, updateTheme, deleteTheme } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const { guilds } = useAppState();

    const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id || 'new');
    const [formData, setFormData] = useState<ThemeDefinition | null>(null);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);
    
    // Set initial form data based on selected theme
    useEffect(() => {
        const themeToEdit = themes.find(t => t.id === selectedThemeId);
        // Use emerald as base for any missing styles
        const emeraldTheme = themes.find(t => t.id === 'emerald');
        const defaultStyles = emeraldTheme?.styles || {} as ThemeStyle;

        const newPropertyDefaults = {
            '--color-text-muted-hsl': defaultStyles['--color-text-secondary-hsl'],
            '--input-bg-hsl': '240 10% 25%',
            '--button-radius': '0.375rem',
        };

        if (themeToEdit) {
            // Copy theme and merge defaults for any missing new properties
            const newFormData = JSON.parse(JSON.stringify(themeToEdit));
            newFormData.styles = { ...newPropertyDefaults, ...newFormData.styles };
            setFormData(newFormData);
        } else {
            // Create new theme based on emerald, but with our new property defaults
            setFormData({
                id: 'new', name: 'New Custom Theme', isCustom: true,
                styles: {
                    ...defaultStyles,
                    ...newPropertyDefaults,
                } as ThemeStyle
            });
        }
    }, [selectedThemeId, themes]);
    
    // Apply live preview styles
    useEffect(() => {
        if (formData) {
            Object.entries(formData.styles).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value as string);
            });
            document.body.dataset.theme = formData.id;
        }
    }, [formData]);

    // Revert to saved theme on unmount
    useEffect(() => {
        return () => {
            let activeThemeId: string | undefined = settings.theme;
            if (appMode.mode === 'guild') {
                const guild = guilds.find(g => g.id === appMode.guildId);
                activeThemeId = guild?.themeId || currentUser?.theme || settings.theme;
            } else {
                activeThemeId = currentUser?.theme || settings.theme;
            }
            const theme = themes.find(t => t.id === activeThemeId);
            if (theme) {
                Object.entries(theme.styles).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(key, value as string);
                });
                document.body.dataset.theme = theme.id;
            }
        };
    }, []);

    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (formData) setFormData(p => p ? { ...p, styles: { ...p.styles, [key]: value } } : null);
    };

    const handleSave = () => {
        if (!formData || !formData.name.trim()) return;
        if (formData.id === 'new') addTheme({ name: formData.name, isCustom: true, styles: formData.styles });
        else updateTheme(formData);
        addNotification({ type: 'success', message: 'Theme saved!' });
    };

    if (!formData) return null;

    return (
        <div className="space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2 bg-stone-800/80 backdrop-blur-sm border-b border-stone-700/60">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-medieval text-stone-100">Appearance Settings</h1>
                    <Button onClick={handleSave}>{formData.id === 'new' ? 'Create Theme' : 'Save Changes'}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="lg:sticky top-28 self-start">
                    <ThemePreview themeStyles={formData.styles as React.CSSProperties} />
                </div>

                <div className="space-y-6">
                    <Card>
                        <CollapsibleSection title="General" defaultOpen>
                            <div className="space-y-4">
                                <Input as="select" label="Theme to Edit" value={selectedThemeId} onChange={e => setSelectedThemeId(e.target.value)}>
                                    <optgroup label="Custom Themes">
                                        <option value="new">-- Create New --</option>
                                        {themes.filter(t => t.isCustom).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </optgroup>
                                    <optgroup label="Premade Themes">
                                        {themes.filter(t => !t.isCustom).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </optgroup>
                                </Input>
                                <Input label="Theme Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!formData.isCustom} />
                                {formData.isCustom && formData.id !== 'new' && <Button variant="destructive" size="sm" onClick={() => setDeletingTheme(formData)}>Delete Theme</Button>}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Colors">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SimpleColorPicker label="Primary Accent" hslValue={`${formData.styles['--color-primary-hue']} ${formData.styles['--color-primary-saturation']} ${formData.styles['--color-primary-lightness']}`} onChange={v => {
                                    const { h, s, l } = parseHslString(v);
                                    handleStyleChange('--color-primary-hue', String(h));
                                    handleStyleChange('--color-primary-saturation', `${s}%`);
                                    handleStyleChange('--color-primary-lightness', `${l}%`);
                                }} />
                                <SimpleColorPicker label="Secondary Accent" hslValue={`${formData.styles['--color-accent-hue']} ${formData.styles['--color-accent-saturation']} ${formData.styles['--color-accent-lightness']}`} onChange={v => {
                                    const { h, s, l } = parseHslString(v);
                                    handleStyleChange('--color-accent-hue', String(h));
                                    handleStyleChange('--color-accent-saturation', `${s}%`);
                                    handleStyleChange('--color-accent-lightness', `${l}%`);
                                }} />
                                <SimpleColorPicker label="Main Background" hslValue={formData.styles['--color-bg-primary-hsl']} onChange={v => handleStyleChange('--color-bg-primary-hsl', v)} />
                                <SimpleColorPicker label="Card Background" hslValue={formData.styles['--color-bg-secondary-hsl']} onChange={v => handleStyleChange('--color-bg-secondary-hsl', v)} />
                                <SimpleColorPicker label="Primary Text" hslValue={formData.styles['--color-text-primary-hsl']} onChange={v => handleStyleChange('--color-text-primary-hsl', v)} />
                                <SimpleColorPicker label="Muted Text" hslValue={formData.styles['--color-text-muted-hsl'] || ''} onChange={v => handleStyleChange('--color-text-muted-hsl', v)} />
                                <SimpleColorPicker label="Border" hslValue={formData.styles['--color-border-hsl']} onChange={v => handleStyleChange('--color-border-hsl', v)} />
                                <SimpleColorPicker label="Input Background" hslValue={formData.styles['--input-bg-hsl'] || ''} onChange={v => handleStyleChange('--input-bg-hsl', v)} />
                             </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Typography">
                            <Input as="select" label="Heading Font" value={formData.styles['--font-display']} onChange={e => handleStyleChange('--font-display', e.target.value)}>
                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                            </Input>
                            <Input as="select" label="Body Font" value={formData.styles['--font-body']} onChange={e => handleStyleChange('--font-body', e.target.value)}>
                                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>)}
                            </Input>
                            <div><label className="flex justify-between text-sm">H1 Size <span>({formData.styles['--font-size-h1']})</span></label><input type="range" min="1.5" max="4" step="0.1" value={parseFloat(formData.styles['--font-size-h1'])} onChange={e => handleStyleChange('--font-size-h1', `${e.target.value}rem`)} className="w-full" /></div>
                            <div><label className="flex justify-between text-sm">Body Size <span>({formData.styles['--font-size-body']})</span></label><input type="range" min="0.8" max="1.2" step="0.05" value={parseFloat(formData.styles['--font-size-body'])} onChange={e => handleStyleChange('--font-size-body', `${e.target.value}rem`)} className="w-full" /></div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Components">
                            <div><label className="flex justify-between text-sm">Button Radius <span>({formData.styles['--button-radius']})</span></label><input type="range" min="0" max="2" step="0.1" value={parseFloat(formData.styles['--button-radius'] || '0')} onChange={e => handleStyleChange('--button-radius', `${e.target.value}rem`)} className="w-full" /></div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Accessibility">
                             <ContrastChecker styles={formData.styles} />
                        </CollapsibleSection>
                    </Card>
                </div>
            </div>
            <ConfirmDialog isOpen={!!deletingTheme} onClose={() => setDeletingTheme(null)} onConfirm={() => {
                if (deletingTheme) { deleteTheme(deletingTheme.id); setSelectedThemeId('emerald'); }
                setDeletingTheme(null);
            }} title="Delete Theme" message={`Are you sure you want to delete "${deletingTheme?.name}"?`} />
        </div>
    );
};

export default AppearancePage;