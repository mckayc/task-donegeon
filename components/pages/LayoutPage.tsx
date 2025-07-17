import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { AppSettings, ThemeDefinition, SidebarConfigItem, Page, SidebarLink } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import ToggleSwitch from '../ui/ToggleSwitch';
import EmojiPicker from '../ui/EmojiPicker';
import { GrabHandleIcon, ArrowLeftIcon, ArrowRightIcon } from '../ui/Icons';

type SidebarKey = keyof AppSettings['sidebars'];

const AppearancePage: React.FC = () => {
    const { settings } = useSettings();
    const { themes: allThemes } = useAppState();
    const { updateSettings, addNotification } = useAppDispatch();
    
    const [formState, setFormState] = useState(settings);
    const [activeTab, setActiveTab] = useState<SidebarKey>('main');
    const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        document.body.dataset.theme = formState.theme;
        return () => { document.body.dataset.theme = settings.theme; };
    }, [formState.theme, settings.theme]);

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
                        className="flex items-center gap-2 p-2 rounded-md border border-stone-700 bg-stone-800/50"
                        draggable={item.type === 'link'}
                        onDragStart={item.type === 'link' ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnter={item.type === 'link' ? (e) => handleDragEnter(e, index) : undefined}
                        onDragEnd={item.type === 'link' ? handleDragEnd : undefined}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={item.type === 'link' ? handleDrop : undefined}
                        style={{ marginLeft: `${item.level * 2}rem`}}
                     >
                        {item.type === 'link' && <GrabHandleIcon className="w-5 h-5 text-stone-500 cursor-grab" />}
                        {item.type === 'link' ? (
                            <>
                                <div className="relative">
                                    <button type="button" onClick={() => setPickerOpenFor(pickerOpenFor === index ? null : index)} className="w-12 h-10 text-xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                                        {item.emoji}
                                    </button>
                                    {pickerOpenFor === index && <EmojiPicker onSelect={(emoji) => handleSidebarItemChange(index, 'emoji', emoji)} onClose={() => setPickerOpenFor(null)} />}
                                </div>
                                <span className="font-semibold text-stone-200 flex-grow">{item.termKey ? formState.terminology[item.termKey] : item.id}</span>
                                <button type="button" onClick={() => handleOutdent(index)} disabled={item.level === 0} className="p-1 rounded-md hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowLeftIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={() => handleIndent(index)} disabled={index === 0} className="p-1 rounded-md hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowRightIcon className="w-5 h-5" /></button>
                                <ToggleSwitch enabled={item.isVisible} setEnabled={(val) => handleSidebarItemChange(index, 'isVisible', val)} label="" />
                            </>
                        ) : (
                            <h4 className="font-bold text-accent flex-grow pl-2">{item.title}</h4>
                        )}
                     </div>
                ))}
            </div>
        )
    };

    return (
        <div className="space-y-8 relative">
            <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-6 pb-4 mb-2" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))', borderBottom: '1px solid hsl(var(--color-border))' }}>
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-medieval text-stone-100" style={{ color: 'hsl(var(--color-text-primary))' }}>Appearance</h1>
                    <Button onClick={handleSave}>Save Appearance Settings</Button>
                </div>
            </div>

            <Card title="General Appearance">
                <div className="space-y-6">
                    <Input label="App Name" value={formState.terminology.appName} onChange={e => setFormState(p => ({...p, terminology: { ...p.terminology, appName: e.target.value}}))} />
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--color-text-secondary))' }}>Default Theme</label>
                        <div className="flex flex-wrap gap-4">
                            {themes.map(theme => {
                                const themeStyle = {
                                    fontFamily: theme.styles['--font-display'],
                                    backgroundColor: `hsl(${theme.styles['--color-primary-hue']} ${theme.styles['--color-primary-saturation']} ${theme.styles['--color-primary-lightness']})`
                                };
                                return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => setFormState(p => ({...p, theme: theme.id}))}
                                    className={`capitalize w-24 h-16 rounded-lg font-bold text-white flex items-center justify-center transition-all ${formState.theme === theme.id ? 'ring-2 ring-offset-2 ring-offset-stone-800 ring-white' : ''}`}
                                    style={themeStyle}
                                >
                                    {theme.name}
                                </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                 <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('main')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'main' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Main Sidebar</button>
                    </nav>
                </div>
                <p className="text-stone-400 text-sm mb-4">Drag and drop to reorder links. Use arrows to create nested groups.</p>
                {renderSidebarEditor()}
            </Card>
        </div>
    );
};

export default AppearancePage;