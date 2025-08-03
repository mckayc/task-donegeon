import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, ThemeStyle } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { getContrast, getWcagRating, hslValuesToCss, parseHslString, hexToHsl, rgbToHex, hslToRgb } from '../../utils/colors';
import { TrophyIcon, RankIcon } from '../ui/icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';
import ConfirmDialog from '../ui/confirm-dialog';
import SimpleColorPicker from '../ui/simple-color-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
        { label: "Text on Card BG", fg: styles['--color-text-primary'], bg: styles['--color-bg-secondary'] },
    ];

    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Contrast Check (WCAG)</h4>
            {pairs.map(pair => {
                const ratio = getContrast(pair.fg, pair.bg);
                const rating = getWcagRating(ratio);
                const colorClass = rating === 'AAA' ? 'text-green-400' : rating === 'AA' ? 'text-yellow-400' : 'text-red-400';
                return (
                    <div key={pair.label} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{pair.label}:</span>
                        <span className={`font-bold ${colorClass}`}>{ratio.toFixed(2)} ({rating})</span>
                    </div>
                )
            })}
        </div>
    );
};

const LivePreview: React.FC<{ styles: ThemeStyle }> = ({ styles }) => {
     const previewStyle = {
        '--font-display': styles['--font-display'],
        '--font-body': styles['--font-body'],
        '--font-size-display': styles['--font-size-display'],
        '--font-size-body': styles['--font-size-body'],
        '--color-bg-primary': `hsl(${styles['--color-bg-primary']})`,
        '--color-bg-secondary': `hsl(${styles['--color-bg-secondary']})`,
        '--color-bg-tertiary': `hsl(${styles['--color-bg-tertiary']})`,
        '--color-text-primary': `hsl(${styles['--color-text-primary']})`,
        '--color-text-secondary': `hsl(${styles['--color-text-secondary']})`,
        '--color-border': `hsl(${styles['--color-border']})`,
        '--color-primary': `hsl(${styles['--color-primary-hue']} ${styles['--color-primary-saturation']} ${styles['--color-primary-lightness']})`,
        '--color-accent': `hsl(${styles['--color-accent-hue']} ${styles['--color-accent-saturation']} ${styles['--color-accent-lightness']})`,
        '--color-accent-light': `hsl(${styles['--color-accent-light-hue']} ${styles['--color-accent-light-saturation']} ${styles['--color-accent-light-lightness']})`,
    };

    return (
        <div style={previewStyle as React.CSSProperties} className="p-4 rounded-lg flex-1 flex flex-col gap-4 overflow-hidden" >
            <h1 className="text-3xl font-display text-accent">Dashboard</h1>
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto scrollbar-hide">
                <Card className="bg-card text-card-foreground">
                    <CardContent className="p-4">
                        <h4 className="font-bold text-lg flex items-center gap-2"><TrophyIcon className="w-5 h-5"/> Example Card</h4>
                        <p className="text-sm mt-2">This is a sample card with body text. It uses the secondary background color.</p>
                        <Button className="mt-4 bg-primary text-primary-foreground">Primary Button</Button>
                    </CardContent>
                </Card>
                 <Card className="bg-card text-card-foreground">
                    <CardContent className="p-4">
                        <h4 className="font-bold text-lg flex items-center gap-2"><RankIcon className="w-5 h-5"/> Another Card</h4>
                        <p className="text-sm mt-2 text-muted-foreground">This card has some secondary text to show contrast.</p>
                        <Button className="mt-4" variant="secondary">Secondary Button</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ThemeEditorPage: React.FC = () => {
    const { themes, isAiConfigured } = useAppState();
    const { addTheme, updateTheme, deleteTheme } = useAppDispatch();
    
    const [selectedThemeId, setSelectedThemeId] = useState(themes[0]?.id || '');
    const [formData, setFormData] = useState<ThemeDefinition | null>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);

    useEffect(() => {
        const theme = themes.find(t => t.id === selectedThemeId);
        if (theme) {
            setFormData(JSON.parse(JSON.stringify(theme)));
        }
    }, [selectedThemeId, themes]);

    const handleStyleChange = (key: keyof ThemeStyle, value: string) => {
        if (!formData) return;
        setFormData(prev => prev ? ({ ...prev, styles: { ...prev.styles, [key]: value } }) : null);
    };

    const handleSave = async () => {
        if (!formData) return;
        if (formData.id.startsWith('new-')) { // It's a new theme
            const { id, ...newThemeData } = formData;
            const newTheme = await addTheme({ ...newThemeData, isCustom: true });
            if (newTheme) {
                setSelectedThemeId(newTheme.id);
            }
        } else { // It's an existing theme
            updateTheme({ ...formData, isCustom: true });
        }
    };
    
    const handleCreateNew = () => {
        const newId = `new-${Date.now()}`;
        const newTheme: ThemeDefinition = {
            id: newId,
            name: 'New Custom Theme',
            isCustom: true,
            styles: themes.find(t => t.id === 'emerald')?.styles || themes[0].styles,
        };
        setFormData(newTheme);
        setSelectedThemeId(newId);
    };
    
    const handleConfirmDelete = () => {
        if (deletingTheme) {
            deleteTheme(deletingTheme.id);
            setSelectedThemeId(themes[0]?.id || '');
        }
        setDeletingTheme(null);
    };
    
    const handleUseIdea = (idea: {name: string, styles: any}) => {
        const newId = `new-${Date.now()}`;
        const newTheme: ThemeDefinition = {
            id: newId,
            name: idea.name,
            isCustom: true,
            styles: {
                ...themes[0].styles, // ensure all keys exist
                ...idea.styles,
                 '--font-size-display': '2.75rem',
                 '--font-size-body': '1rem',
            }
        };
        setFormData(newTheme);
        setSelectedThemeId(newId);
        setIsGeneratorOpen(false);
    }
    
    if (!formData) return <div>Loading theme editor...</div>

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col bg-tertiary p-4 rounded-lg">
                <LivePreview styles={formData.styles} />
            </div>

            <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {themes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleCreateNew}>New</Button>
                     {isAiConfigured && (
                        <Button onClick={() => setIsGeneratorOpen(true)} variant="outline">AI Ideas</Button>
                    )}
                </div>
                 <div className="p-4 bg-card rounded-lg flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                    <div className="space-y-2">
                        <Label>Theme Name</Label>
                        <Input value={formData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(p => p ? { ...p, name: e.target.value } : null)} />
                    </div>
                 </div>
                 <div className="flex justify-between items-center p-2 bg-card rounded-lg">
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