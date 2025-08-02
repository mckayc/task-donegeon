import React, { useState, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { AppSettings, ThemeDefinition, SidebarConfigItem, Page, SidebarLink } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import ToggleSwitch from '../ui/ToggleSwitch';
import EmojiPicker from '../ui/EmojiPicker';
import { GrabHandleIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/Icons';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type SidebarKey = keyof AppSettings['sidebars'];

const AppearancePage: React.FC = () => {
    const { settings, themes: allThemes } = useAppState();
    const { updateSettings, addNotification } = useAppDispatch();
    
    // Initialize state once from settings, preventing resets on re-render from sync
    const [formState, setFormState] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));
    
    const [activeTab, setActiveTab] = useState<SidebarKey>('main');
    const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        const applyThemeStyles = (themeId: string) => {
            const theme = allThemes.find(t => t.id === themeId);
            if (theme) {
                Object.entries(theme.styles).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(key, value);
                });
                if (themeId) {
                  document.body.dataset.theme = themeId;
                }
            }
        };

        // Apply the preview theme from the form state
        applyThemeStyles(formState.theme);

        // Cleanup function to restore the original theme from global state when the component unmounts
        return () => {
            applyThemeStyles(settings.theme);
        };
    }, [formState.theme, settings.theme, allThemes]);

    const handleSave = () => {
        updateSettings(formState);
        addNotification({ type: 'success', message: 'Appearance settings saved successfully!' });
    };

    const handleSidebarItemChange = (index: number, field: keyof SidebarLink, value: string | boolean) => {
        const newSidebarConfig = [...formState.sidebars[activeTab]];
        const item = newSidebarConfig[index];
        if (item.type === 'link') {
            (item as any)[field] = value;
            setFormState(p => ({ ...p, sidebars: { ...p.sidebars, [activeTab]: newSidebarConfig }}));
        }
    };
    
    const handleIndent = (index: number) => {
        const newSidebarConfig = [...formState.sidebars[activeTab]];
        const item = newSidebarConfig[index];
        const prevItem = newSidebarConfig[index - 1];
        if (item.type === 'link' && index > 0 && prevItem) {
            item.level = Math.min(item.level + 1, prevItem.level + 1);
            setFormState(p => ({ ...p, sidebars: { ...p.sidebars, [activeTab]: newSidebarConfig }}));
        }
    };

    const handleOutdent = (index: number) => {
        const newSidebarConfig = [...formState.sidebars[activeTab]];
        const item = newSidebarConfig[index];
        if (item.type === 'link' && item.level > 0) {
            item.level = item.level - 1;
            setFormState(p => ({ ...p, sidebars: { ...p.sidebars, [activeTab]: newSidebarConfig }}));
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML); // for Firefox
        setTimeout(() => e.currentTarget.classList.add('opacity-50'), 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
        
        const newSidebarConfig = [...formState.sidebars[activeTab]];
        const dragItemContent = newSidebarConfig.splice(dragItem.current, 1)[0];
        newSidebarConfig.splice(dragOverItem.current, 0, dragItemContent);
        
        setFormState(p => ({ ...p, sidebars: { ...p.sidebars, [activeTab]: newSidebarConfig }}));
    };

    const themes: ThemeDefinition[] = allThemes;

    const renderSidebarEditor = () => {
        const items = formState.sidebars[activeTab];
        if (!items) return null; // Guard against empty sidebar configs
        return (
            <div className="space-y-2">
                {items.map((item, index) => (
                     <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-md border bg-background"
                        draggable={item.type === 'link'}
                        onDragStart={item.type === 'link' ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnter={item.type === 'link' ? (e) => handleDragEnter(e, index) : undefined}
                        onDragEnd={item.type === 'link' ? handleDragEnd : undefined}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={item.type === 'link' ? handleDrop : undefined}
                        style={{ marginLeft: `${item.level * 2}rem`}}
                     >
                        {item.type === 'link' && <GrabHandleIcon className="w-5 h-5 text-muted-foreground cursor-grab" />}
                        {item.type === 'link' ? (
                            <>
                                <div className="relative">
                                    <button type="button" onClick={() => setPickerOpenFor(pickerOpenFor === index ? null : index)} className="w-12 h-10 text-xl p-1 rounded-md bg-background border flex items-center justify-center">
                                        {item.emoji}
                                    </button>
                                    {pickerOpenFor === index && <EmojiPicker onSelect={(emoji) => handleSidebarItemChange(index, 'emoji', emoji)} onClose={() => setPickerOpenFor(null)} />}
                                </div>
                                <span className="font-semibold text-foreground flex-grow">{item.termKey ? formState.terminology[item.termKey] : item.id}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleOutdent(index)} disabled={item.level === 0} className="disabled:opacity-30 disabled:cursor-not-allowed"><ArrowLeftIcon className="w-5 h-5" /></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleIndent(index)} disabled={index === 0} className="disabled:opacity-30 disabled:cursor-not-allowed"><ArrowRightIcon className="w-5 h-5" /></Button>
                                <ToggleSwitch enabled={item.isVisible} setEnabled={(val) => handleSidebarItemChange(index, 'isVisible', val)} label="" />
                            </>
                        ) : (
                            item.type === 'header' && <h4 className="font-bold text-accent flex-grow pl-2">{item.title}</h4>
                        )}
                     </div>
                ))}
            </div>
        )
    };

    return (
        <div className="space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <div className="flex justify-end items-center">
                    <Button onClick={handleSave}>Save Appearance Settings</Button>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>General Appearance</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="app-name">App Name</Label>
                        <Input id="app-name" value={formState.terminology.appName} onChange={e => setFormState(p => ({...p, terminology: { ...p.terminology, appName: e.target.value}}))} />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium mb-2">Default Theme</Label>
                        <div className="flex flex-wrap gap-4">
                            {themes.map(theme => {
                                const themeStyle = {
                                    fontFamily: theme.styles['--font-display'],
                                    backgroundColor: `hsl(${theme.styles['--color-bg-primary']})`,
                                    color: `hsl(${theme.styles['--color-text-primary']})`,
                                };
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => setFormState(p => ({...p, theme: theme.id}))}
                                        className={`w-24 h-24 rounded-lg flex flex-col justify-between p-2 text-left transition-all duration-200 border-4 ${formState.theme === theme.id ? 'border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={themeStyle}
                                    >
                                        <h4 className="font-bold text-sm capitalize truncate">{theme.name}</h4>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Sidebar Layout</CardTitle></CardHeader>
                <CardContent>
                    {renderSidebarEditor()}
                </CardContent>
            </Card>
        </div>
    );
};

export default AppearancePage;