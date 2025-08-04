import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString } from '../../utils/colors';
import { TrophyIcon, RankIcon, QuestsIcon } from '../ui/icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/confirm-dialog';
import SimpleColorPicker from '../ui/simple-color-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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

const AssetPreviewCard: React.FC<{ type: string, className?: string }> = ({ type, className }) => (
    <div className={cn("p-2 rounded-lg text-sm font-semibold", className)}>
        {type}
    </div>
);

const LivePreview: React.FC = () => {
    return (
        <div className="p-4 rounded-lg flex-1 flex flex-col gap-4 overflow-hidden h-full" style={{ backgroundColor: 'hsl(var(--color-bg-primary))' }}>
            <h1 className="text-3xl font-display" style={{ color: 'hsl(var(--color-accent-hue) var(--color-accent-saturation) var(--color-accent-lightness))' }}>Dashboard</h1>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
                <Card style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
                    <CardContent className="p-4">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                            <TrophyIcon className="w-5 h-5"/> Example Card
                        </h4>
                        <p className="text-sm mt-2">This is a sample card with primary body text. It uses the secondary background color.</p>
                        <p className="text-sm mt-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>This is secondary text, for less important information.</p>
                        <div className="flex gap-4 mt-4">
                          <Button>Primary</Button>
                          <Button variant="secondary">Secondary</Button>
                        </div>
                    </CardContent>
                </Card>
                <div>
                    <h4 className="font-bold text-lg mb-2" style={{ color: 'hsl(var(--color-text-primary))' }}>Asset Previews</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <AssetPreviewCard type="Duty" className="bg-duty-card border border-duty-card text-duty-card-text" />
                        <AssetPreviewCard type="Venture" className="bg-venture-card border border-venture-card text-venture-card-text" />
                        <AssetPreviewCard type="Item" className="bg-item-card border border-item-card text-item-card-text" />
                        <AssetPreviewCard type="Trophy" className="bg-trophy-card border border-trophy-card text-trophy-card-text" />
                        <AssetPreviewCard type="Reward" className="bg-reward-card border border-reward-card text-reward-card-text" />
                        <AssetPreviewCard type="Group" className="bg-quest-group-card border border-quest-group-card text-quest-group-card-text" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ThemeEditorPage: React.FC = () => {
    console.log('--- ThemeEditorPage Rendering ---');
    const { themes, isAiConfigured, settings, currentUser, guilds, appMode } = useAppState();
    const { addTheme, updateTheme, deleteTheme } = useAppDispatch();
    
    const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id || '');
    const [formData, setFormData] = useState<ThemeDefinition | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);

    useEffect(() => {
        const theme = themes.find(t => t.id === selectedThemeId);
        const defaultTheme = themes.find(t => t.id === 'emerald') || themes[0]; // Get a complete default theme

        if (theme && defaultTheme) {
            console.log(`[ThemeEditor] Loading theme data for: ${theme.name} (${theme.id})`);
            // Merge the loaded theme styles over the default styles to fill in any missing properties
            const completeStyles = { ...defaultTheme.styles, ...theme.styles };
            const completeTheme = { ...theme, styles: completeStyles };
            setFormData(JSON.parse(JSON.stringify(completeTheme)));
        } else if (themes.length > 0) {
            console.warn(`[ThemeEditor] Could not find theme with ID: ${selectedThemeId}. Resetting to first available theme.`);
            setSelectedThemeId(themes[0].id);
        } else {
            // Handle case where there are no themes at all
            setFormData(null);
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
    
    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (!formData) return;
        const newStyles = {...formData.styles, [key]: value};
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
        const defaultTheme = themes.find(t => t.id === 'emerald') || themes[0];
        const completeStyles = { ...defaultTheme.styles, ...idea.styles };

        setFormData({
            id: newId,
            name: idea.name,
            isCustom: true,
            styles: completeStyles,
        });
        setSelectedThemeId(newId);
        setIsGeneratorOpen(false);
    };

    if (!formData) {
        console.log('[ThemeEditor] No formData, rendering loading state. This is normal during theme switches.');
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const s = formData.styles;
    const corePalette = {
        bgPrimary: s['--color-bg-primary'], bgSecondary: s['--color-bg-secondary'],
        textPrimary: s['--color-text-primary'], textSecondary: s['--color-text-secondary'],
        primary: hslValuesToCss(parseInt(s['--color-primary-hue']), parseInt(s['--color-primary-saturation']), parseInt(s['--color-primary-lightness'])),
        accent: hslValuesToCss(parseInt(s['--color-accent-hue']), parseInt(s['--color-accent-saturation']), parseInt(s['--color-accent-lightness'])),
    };
    
    const assetColors = [
        { type: 'Duty', prefix: '--color-duty' },
        { type: 'Venture', prefix: '--color-venture' },
        { type: 'Item', prefix: '--color-item' },
        { type: 'Trophy', prefix: '--color-trophy' },
        { type: 'Reward', prefix: '--color-reward' },
        { type: 'Quest Group', prefix: '--color-quest-group' },
    ];

    const displaySize = parseFloat(s['--font-size-display'] || '2.75');
    const bodySize = parseFloat(s['--font-size-body'] || '1.0');

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 lg:w-[40%] flex flex-col bg-card border rounded-lg p-4 min-h-[500px] lg:max-h-full">
                <LivePreview />
            </div>

            <div className="flex-1 lg:w-[60%] flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{themes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={handleCreateNew}>New</Button>
                    {isAiConfigured && <Button onClick={() => setIsGeneratorOpen(true)} variant="outline">AI Ideas</Button>}
                    <div className="flex-grow"></div>
                    {formData.isCustom && <Button variant="destructive" size="sm" onClick={() => setDeletingTheme(formData)}>Delete</Button>}
                    <Button onClick={handleSave}>{formData.id.startsWith('new-') ? 'Create Theme' : 'Save Changes'}</Button>
                </div>
                <Card className="flex-1 overflow-y-auto">
                    <CardContent className="p-4 space-y-4">
                        <Input value={formData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(p => p ? { ...p, name: e.target.value } : null)} />
                        
                        <div className="pt-4 border-t">
                            <h3 className="font-semibold text-foreground mb-2">Core Palette</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <SimpleColorPicker label="Primary BG" hslValue={corePalette.bgPrimary} onChange={v => handleStyleChange('--color-bg-primary', v)} />
                                <SimpleColorPicker label="Secondary BG" hslValue={corePalette.bgSecondary} onChange={v => handleStyleChange('--color-bg-secondary', v)} />
                                <SimpleColorPicker label="Primary Text" hslValue={corePalette.textPrimary} onChange={v => handleStyleChange('--color-text-primary', v)} />
                                <SimpleColorPicker label="Secondary Text" hslValue={corePalette.textSecondary} onChange={v => handleStyleChange('--color-text-secondary', v)} />
                                <SimpleColorPicker label="Primary Accent" hslValue={corePalette.primary} onChange={v => handleStyleChange('--color-primary-hue', v)} />
                                <SimpleColorPicker label="Secondary Accent" hslValue={corePalette.accent} onChange={v => handleStyleChange('--color-accent-hue', v)} />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="font-semibold text-foreground mb-2">Fonts</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Display Font</Label>
                                    <Select value={s['--font-display']} onValueChange={v => handleStyleChange('--font-display', v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{FONT_GROUPS.map(g => <SelectGroup key={g.label}><SelectLabel>{g.label}</SelectLabel>{g.fonts.map(f => <SelectItem key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0].replace(/'/g, '')}</SelectItem>)}</SelectGroup>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Body Font</Label>
                                    <Select value={s['--font-body']} onValueChange={v => handleStyleChange('--font-body', v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{FONT_GROUPS.map(g => <SelectGroup key={g.label}><SelectLabel>{g.label}</SelectLabel>{g.fonts.map(f => <SelectItem key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0].replace(/'/g, '')}</SelectItem>)}</SelectGroup>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Display Size ({displaySize.toFixed(1)}rem)</Label>
                                    <Slider defaultValue={[displaySize]} max={6} min={1.5} step={0.1} onValueChange={(v: number[]) => handleStyleChange('--font-size-display', `${v[0]}rem`)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Body Size ({bodySize.toFixed(2)}rem)</Label>
                                    <Slider defaultValue={[bodySize]} max={1.5} min={0.8} step={0.05} onValueChange={(v: number[]) => handleStyleChange('--font-size-body', `${v[0]}rem`)} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <h3 className="font-semibold text-foreground mb-2">Asset Card Colors</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-4">
                                {assetColors.map(({ type, prefix }) => (
                                    <div key={type} className="p-2 bg-background/50 rounded-lg">
                                        <h4 className="font-bold text-sm text-foreground mb-2">{type}</h4>
                                        <div className="space-y-2">
                                            <SimpleColorPicker label="BG" hslValue={s[`${prefix}-bg` as keyof ThemeStyle]} onChange={v => handleStyleChange(`${prefix}-bg` as keyof ThemeStyle, v)} />
                                            <SimpleColorPicker label="Border" hslValue={s[`${prefix}-border` as keyof ThemeStyle]} onChange={v => handleStyleChange(`${prefix}-border` as keyof ThemeStyle, v)} />
                                            <SimpleColorPicker label="Text" hslValue={s[`${prefix}-text` as keyof ThemeStyle]} onChange={v => handleStyleChange(`${prefix}-text` as keyof ThemeStyle, v)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
