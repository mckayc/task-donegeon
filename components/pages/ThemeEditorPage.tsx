import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString } from '../../utils/colors';
import { TrophyIcon, RankIcon } from '../ui/icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/confirm-dialog';
import SimpleColorPicker from '../ui/simple-color-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ToggleSwitch from '../ui/toggle-switch';

const FONT_GROUPS = [
  {
    label: 'Thematic & Display',
    fonts: [
      "'MedievalSharp', cursive", "'Uncial Antiqua', cursive", "'Press Start 2P', cursive", "'Cinzel Decorative', cursive", 
      "'Almendra', serif", "'Almendra Display', serif", "'Almendra SC', serif", "'Butcherman', cursive", 
      "'Creepster', cursive", "'Eater', cursive", "'Fondamento', cursive", "'Fruktur', cursive", "'Griffy', cursive", 
      "'Henny Penny', cursive", "'New Rocker', cursive", "'Nosifer', cursive", "'Pirata One', cursive", "'Rye', cursive", 
      "'Sancreek', cursive", "'Smokum', cursive", "'Special Elite', cursive"
    ]
  },
  {
    label: 'Serif',
    fonts: [
      "'IM Fell English SC', serif", "'Metamorphous', serif", "'Lora', serif", "'Vollkorn', serif", 
      "'EB Garamond', serif", "'Cormorant Garamond', serif", "'Crimson Pro', serif", "'Cinzel', serif"
    ]
  },
  {
    label: 'Sans-Serif',
    fonts: ["'Roboto', sans-serif"]
  },
  {
    label: 'Fun',
    fonts: ["'Comic Neue', cursive"]
  }
];


const ContrastChecker: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
    const pairs = [
        { label: "Text on Primary BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-primary'] },
        { label: "Secondary Text on Primary BG", fg: styles['--color-text-secondary'], bg: styles['--color-bg-primary'] },
        { label: "Text on Card BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-secondary'] },
    ];

    return (
        <div className="space-y-2 p-3 bg-background rounded-lg border">
            <h4 className="font-semibold text-foreground text-sm">Contrast Check (WCAG)</h4>
            {pairs.map(pair => {
                const ratio = getContrast(pair.fg, pair.bg);
                const rating = getWcagRating(ratio);
                const colorClass = rating === 'AAA' ? 'text-green-400' : rating === 'AA' ? 'text-yellow-400' : 'text-red-400';
                return (
                    <div key={pair.label} className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{pair.label}:</span>
                        <span className={`font-bold ${colorClass}`}>{ratio.toFixed(2)} ({rating})</span>
                    </div>
                )
            })}
        </div>
    );
};

const LivePreview: React.FC<{ onHighlight: (id: string) => void }> = ({ onHighlight }) => {
    return (
        <div className="p-4 rounded-lg flex-1 flex flex-col gap-4 overflow-hidden h-full cursor-pointer" style={{ backgroundColor: 'hsl(var(--color-bg-primary))' }} data-interactive-id="bgPrimary" onClick={() => onHighlight('bgPrimary')}>
            <h1 className="text-3xl font-display" style={{ color: 'hsl(var(--color-accent-hue) var(--color-accent-saturation) var(--color-accent-lightness))' }} data-interactive-id="accent" onClick={(e) => { e.stopPropagation(); onHighlight('accent'); }}>Dashboard</h1>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto scrollbar-hide">
                <Card style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }} data-interactive-id="bgSecondary" onClick={(e) => { e.stopPropagation(); onHighlight('bgSecondary'); }}>
                    <CardContent className="p-4">
                        <h4 className="font-bold text-lg flex items-center gap-2" data-interactive-id="textPrimary" onClick={(e) => { e.stopPropagation(); onHighlight('textPrimary'); }}>
                            <TrophyIcon className="w-5 h-5"/> Example Card
                        </h4>
                        <p className="text-sm mt-2" data-interactive-id="textPrimary" onClick={(e) => { e.stopPropagation(); onHighlight('textPrimary'); }}>This is a sample card with body text. It uses the secondary background color.</p>
                        <Button className="mt-4" data-interactive-id="primary" onClick={(e) => { e.stopPropagation(); onHighlight('primary'); }}>Primary Button</Button>
                    </CardContent>
                </Card>
                 <Card style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }} data-interactive-id="bgSecondary" onClick={(e) => { e.stopPropagation(); onHighlight('bgSecondary'); }}>
                    <CardContent className="p-4">
                        <h4 className="font-bold text-lg flex items-center gap-2" data-interactive-id="textPrimary" onClick={(e) => { e.stopPropagation(); onHighlight('textPrimary'); }}><RankIcon className="w-5 h-5"/> Another Card</h4>
                        <p className="text-sm mt-2" style={{ color: 'hsl(var(--color-text-secondary))' }} data-interactive-id="textSecondary" onClick={(e) => { e.stopPropagation(); onHighlight('textSecondary'); }}>This card has some secondary text to show contrast.</p>
                        <Button className="mt-4" variant="secondary" data-interactive-id="accent" onClick={(e) => { e.stopPropagation(); onHighlight('accent'); }}>Secondary Button</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ThemeEditorPage: React.FC = () => {
    const { themes, isAiConfigured, settings, currentUser, guilds, appMode } = useAppState();
    const { addTheme, updateTheme, deleteTheme } = useAppDispatch();
    
    const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id || '');
    const [formData, setFormData] = useState<ThemeDefinition | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [highlightedControl, setHighlightedControl] = useState<string | null>(null);

    useEffect(() => {
        const theme = themes.find(t => t.id === selectedThemeId);
        if (theme) {
            setFormData(JSON.parse(JSON.stringify(theme)));
        }
    }, [selectedThemeId, themes]);
    
    useEffect(() => {
        const root = document.documentElement;
        if (formData) {
            Object.entries(formData.styles).forEach(([key, value]) => {
                root.style.setProperty(key, value);
            });
        }
        return () => {
            let activeThemeId: string | undefined = settings.theme;
            if (appMode.mode === 'guild') {
                const currentGuild = guilds.find(g => g.id === appMode.guildId);
                if (currentGuild?.themeId) activeThemeId = currentGuild.themeId;
                else if (currentUser?.theme) activeThemeId = currentUser.theme;
            } else {
                if (currentUser?.theme) activeThemeId = currentUser.theme;
            }
            const savedTheme = themes.find(t => t.id === activeThemeId);
            if(savedTheme) {
                Object.entries(savedTheme.styles).forEach(([key, value]) => {
                    root.style.setProperty(key, value);
                });
            }
        }
    }, [formData, settings.theme, currentUser?.theme, appMode, guilds, themes]);

    const deriveStyles = (styles: ThemeStyle): Partial<ThemeStyle> => {
        const bgSecondary = parseHslString(styles['--color-bg-secondary']);
        const primaryAccent = {h: parseInt(styles['--color-primary-hue']), s: parseInt(styles['--color-primary-saturation']), l: parseInt(styles['--color-primary-lightness'])};
        const accent = {h: parseInt(styles['--color-accent-hue']), s: parseInt(styles['--color-accent-saturation']), l: parseInt(styles['--color-accent-lightness'])};
        
        return {
            '--color-bg-tertiary': hslValuesToCss(bgSecondary.h, bgSecondary.s, Math.min(100, bgSecondary.l + 8)),
            '--color-border': hslValuesToCss(bgSecondary.h, bgSecondary.s, Math.min(100, bgSecondary.l + 12)),
            '--color-accent-light-hue': String(accent.h),
            '--color-accent-light-saturation': `${Math.min(100, accent.s + 5)}%`,
            '--color-accent-light-lightness': `${Math.min(100, accent.l + 15)}%`,

            '--color-duty-bg': hslValuesToCss(primaryAccent.h, Math.max(0, primaryAccent.s - 40), Math.max(0, primaryAccent.l - 10)),
            '--color-duty-border': hslValuesToCss(primaryAccent.h, Math.max(0, primaryAccent.s - 30), Math.max(0, primaryAccent.l)),
            '--color-duty-text': hslValuesToCss(primaryAccent.h, Math.max(0, primaryAccent.s - 10), Math.min(100, primaryAccent.l + 40)),
            
            '--color-venture-bg': hslValuesToCss(accent.h, Math.max(0, accent.s - 30), Math.max(0, accent.l - 20)),
            '--color-venture-border': hslValuesToCss(accent.h, Math.max(0, accent.s - 20), Math.max(0, accent.l - 10)),
            '--color-venture-text': hslValuesToCss(accent.h, Math.max(0, accent.s), Math.min(100, accent.l + 30)),
            
            '--color-item-bg': hslValuesToCss(bgSecondary.h + 20, bgSecondary.s, bgSecondary.l + 5),
            '--color-item-border': hslValuesToCss(bgSecondary.h + 20, bgSecondary.s, bgSecondary.l + 15),
            '--color-item-text': hslValuesToCss(bgSecondary.h + 20, bgSecondary.s, bgSecondary.l + 50),
            
            '--color-trophy-bg': hslValuesToCss(45, Math.max(0, accent.s - 10), Math.max(0, accent.l - 15)),
            '--color-trophy-border': hslValuesToCss(45, Math.max(0, accent.s), Math.max(0, accent.l - 5)),
            '--color-trophy-text': hslValuesToCss(45, Math.max(0, accent.s), Math.min(100, accent.l + 40)),
        }
    };
    
    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (!formData) return;
        
        const newStyles = {...formData.styles};

        if (key.includes('-hue') || key.includes('-saturation') || key.includes('-lightness')) {
            const base = key.substring(0, key.lastIndexOf('-'));
            if(key.includes('-hue')) newStyles[`${base}-hue` as keyof ThemeStyle] = value.split(' ')[0];
            if(key.includes('-saturation')) newStyles[`${base}-saturation` as keyof ThemeStyle] = value;
            if(key.includes('-lightness')) newStyles[`${base}-lightness` as keyof ThemeStyle] = value;
            if (key.includes('-hue')) { // When changing a color with a picker, update all HSL
                const { h, s, l } = parseHslString(value);
                 newStyles[`${base}-hue` as keyof ThemeStyle] = String(h);
                 newStyles[`${base}-saturation` as keyof ThemeStyle] = `${s}%`;
                 newStyles[`${base}-lightness` as keyof ThemeStyle] = `${l}%`;
            } else {
                 newStyles[key] = value;
            }
        } else {
             newStyles[key] = value;
        }

        if (!isAdvanced) {
            const derived = deriveStyles(newStyles);
            Object.assign(newStyles, derived);
        }

        setFormData(p => p ? { ...p, styles: newStyles } : null);
    };

    const handleSave = async () => {
        if (!formData) return;
        if (formData.id.startsWith('new-')) {
            const newTheme = await addTheme({ name: formData.name, isCustom: true, styles: formData.styles });
            if (newTheme) setSelectedThemeId(newTheme.id);
        } else {
            updateTheme(formData);
        }
    };
    const handleCreateNew = () => {
        const newId = `new-${Date.now()}`;
        const defaultTheme = themes.find(t => t.id === 'emerald') || themes[0];
        setFormData({
            id: newId,
            name: 'New Custom Theme',
            isCustom: true,
            styles: JSON.parse(JSON.stringify(defaultTheme.styles)),
        });
        setSelectedThemeId(newId);
    };
    const handleConfirmDelete = () => {
        if (deletingTheme) {
            deleteTheme(deletingTheme.id);
            setSelectedThemeId(themes[0]?.id || '');
            setDeletingTheme(null);
        }
    };
    const handleUseIdea = (idea: {name: string, styles: any}) => {
        const newId = `new-${Date.now()}`;
        setFormData({
            id: newId,
            name: idea.name,
            isCustom: true,
            styles: idea.styles,
        });
        setSelectedThemeId(newId);
        setIsGeneratorOpen(false);
    };

    const highlight = (id: string) => {
        setHighlightedControl(id);
        setTimeout(() => setHighlightedControl(null), 1500);
    };
    
    const getHighlightClass = (id: string) => highlightedControl === id ? 'ring-2 ring-accent ring-offset-2 ring-offset-card transition-all duration-300' : '';

    if (!formData) return <div>Loading theme editor...</div>

    const s = formData.styles;
    const corePalette = {
        bgPrimary: s['--color-bg-primary'],
        bgSecondary: s['--color-bg-secondary'],
        textPrimary: s['--color-text-primary'],
        textSecondary: s['--color-text-secondary'],
        primary: hslValuesToCss(parseInt(s['--color-primary-hue']), parseInt(s['--color-primary-saturation']), parseInt(s['--color-primary-lightness'])),
        accent: hslValuesToCss(parseInt(s['--color-accent-hue']), parseInt(s['--color-accent-saturation']), parseInt(s['--color-accent-lightness'])),
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col bg-card border rounded-lg p-4 min-h-[400px]">
                <LivePreview onHighlight={highlight}/>
            </div>

            <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{themes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={handleCreateNew}>New</Button>
                    {isAiConfigured && <Button onClick={() => setIsGeneratorOpen(true)} variant="outline">AI Ideas</Button>}
                </div>
                 <div className="p-4 bg-card rounded-lg border flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                    <div className="space-y-2">
                        <Label>Theme Name</Label>
                        <Input value={formData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(p => p ? { ...p, name: e.target.value } : null)} />
                    </div>
                    <ToggleSwitch enabled={isAdvanced} setEnabled={setIsAdvanced} label="Show Advanced Controls"/>
                    
                    {!isAdvanced ? (
                        <div className="space-y-4 pt-4 border-t">
                             <div className={`p-2 rounded-md ${getHighlightClass('bgPrimary')}`}><SimpleColorPicker label="Primary Background" hslValue={corePalette.bgPrimary} onChange={v => handleStyleChange('--color-bg-primary', v)} /></div>
                             <div className={`p-2 rounded-md ${getHighlightClass('bgSecondary')}`}><SimpleColorPicker label="Secondary/Card Background" hslValue={corePalette.bgSecondary} onChange={v => handleStyleChange('--color-bg-secondary', v)} /></div>
                             <div className={`p-2 rounded-md ${getHighlightClass('textPrimary')}`}><SimpleColorPicker label="Primary Text" hslValue={corePalette.textPrimary} onChange={v => handleStyleChange('--color-text-primary', v)} /></div>
                             <div className={`p-2 rounded-md ${getHighlightClass('textSecondary')}`}><SimpleColorPicker label="Secondary Text" hslValue={corePalette.textSecondary} onChange={v => handleStyleChange('--color-text-secondary', v)} /></div>
                             <div className={`p-2 rounded-md ${getHighlightClass('primary')}`}><SimpleColorPicker label="Primary Accent" hslValue={corePalette.primary} onChange={v => handleStyleChange('--color-primary-hue', v)} /></div>
                             <div className={`p-2 rounded-md ${getHighlightClass('accent')}`}><SimpleColorPicker label="Secondary Accent" hslValue={corePalette.accent} onChange={v => handleStyleChange('--color-accent-hue', v)} /></div>
                             <ContrastChecker styles={formData.styles} />
                        </div>
                    ) : (
                         <div className="space-y-2 pt-4 border-t">
                            {Object.entries(formData.styles).filter(([k]) => !k.startsWith('--font')).map(([key, value]) => (
                               <div key={key}>
                                 <Label className="capitalize text-xs text-muted-foreground">{key.replace('--color-', '').replace(/-/g, ' ')}</Label>
                                 <Input value={value} onChange={e => handleStyleChange(key as keyof ThemeStyle, e.target.value)} />
                               </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2" data-control-id="fontDisplay">
                            <Label>Display Font</Label>
                            <Select value={formData.styles['--font-display']} onValueChange={v => handleStyleChange('--font-display', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {FONT_GROUPS.map(group => (
                                        <SelectGroup key={group.label}>
                                            <SelectLabel>{group.label}</SelectLabel>
                                            {group.fonts.map(font => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font.split(',')[0].replace(/'/g, '')}</SelectItem>)}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2" data-control-id="fontBody">
                            <Label>Body Font</Label>
                             <Select value={formData.styles['--font-body']} onValueChange={v => handleStyleChange('--font-body', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                     {FONT_GROUPS.map(group => (
                                        <SelectGroup key={group.label}>
                                            <SelectLabel>{group.label}</SelectLabel>
                                            {group.fonts.map(font => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font.split(',')[0].replace(/'/g, '')}</SelectItem>)}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                             <Label>Display Font Size</Label>
                             <Slider defaultValue={[parseInt(formData.styles['--font-size-display'])]} max={6} min={1.5} step={0.1} onValueChange={(v: number[]) => handleStyleChange('--font-size-display', `${v[0]}rem`)} />
                         </div>
                         <div className="space-y-2">
                             <Label>Body Font Size</Label>
                             <Slider defaultValue={[parseInt(formData.styles['--font-size-body'])]} max={1.5} min={0.8} step={0.05} onValueChange={(v: number[]) => handleStyleChange('--font-size-body', `${v[0]}rem`)} />
                         </div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center p-2 bg-card rounded-lg border">
                     {formData.isCustom && <Button variant="destructive" size="sm" onClick={() => setDeletingTheme(formData)}>Delete</Button>}
                     <div className="flex-grow"></div>
                    <Button onClick={handleSave}>{formData.id.startsWith('new-') ? 'Create Theme' : 'Save Changes'}</Button>
                </div>
            </div>
            
            {isGeneratorOpen && <ThemeIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
            
            {deletingTheme && (
                <ConfirmDialog
                    isOpen={!!deletingTheme}
                    onClose={() => setDeletingTheme(null)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Theme"
                    message={`Are you sure you want to delete the theme "${deletingTheme.name}"? This is permanent.`}
                />
            )}
        </div>
    );
};

export default ThemeEditorPage;