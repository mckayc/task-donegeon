
import React, { useState, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EditThemeDialog from '../admin/EditThemeDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useSettings } from '../../context/SettingsContext';
import { SparklesIcon } from '../ui/Icons';
import ThemeIdeaGenerator from '../quests/ThemeIdeaGenerator';

const ThemePreviewCard: React.FC<{ theme: ThemeDefinition, onEdit: () => void, onDelete: () => void, onExport: () => void }> = ({ theme, onEdit, onDelete, onExport }) => {
    const previewStyle = {
        fontFamily: theme.styles['--font-body'],
        backgroundColor: `hsl(${theme.styles['--color-bg-primary']})`,
        color: `hsl(${theme.styles['--color-text-primary']})`,
    };
    const accentStyle = (type: 'primary' | 'accent' | 'accent-light') => {
        const h = theme.styles[`--color-${type}-hue`];
        const s = theme.styles[`--color-${type}-saturation`];
        const l = theme.styles[`--color-${type}-lightness`];
        return { backgroundColor: `hsl(${h} ${s} ${l})` };
    }

    return (
        <Card className="flex flex-col">
            <div style={previewStyle} className="p-4 rounded-t-xl flex-grow">
                <h3 className="font-bold text-lg capitalize" style={{ fontFamily: theme.styles['--font-display']}}>{theme.name}</h3>
                <p className="text-sm mt-1">Example body text.</p>
                <div className="flex justify-end items-center gap-2 mt-4">
                    <div className="w-5 h-5 rounded-full" style={accentStyle('primary')} title="Primary"></div>
                    <div className="w-5 h-5 rounded-full" style={accentStyle('accent')} title="Accent"></div>
                    <div className="w-5 h-5 rounded-full" style={accentStyle('accent-light')} title="Accent Light"></div>
                </div>
            </div>
            <div className="p-3 bg-stone-900/50 rounded-b-xl flex justify-end gap-2">
                {theme.isCustom && <Button variant="secondary" className="text-xs py-1 px-2" onClick={onExport}>Export</Button>}
                <Button variant="secondary" className="text-xs py-1 px-2" onClick={onEdit}>Edit</Button>
                {theme.isCustom && <Button variant="secondary" className="text-xs py-1 px-2 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={onDelete}>Delete</Button>}
            </div>
        </Card>
    );
};

const ThemeEditorPage: React.FC = () => {
    const { themes } = useAppState();
    const { addTheme, deleteTheme } = useAppDispatch();
    const { isAiAvailable } = useSettings();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<ThemeDefinition | null>(null);
    const [deletingTheme, setDeletingTheme] = useState<ThemeDefinition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    const handleCreate = () => {
        setEditingTheme(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (theme: ThemeDefinition) => {
        setEditingTheme(theme);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (theme: ThemeDefinition) => {
        setDeletingTheme(theme);
    };

    const handleConfirmDelete = () => {
        if (deletingTheme) {
            deleteTheme(deletingTheme.id);
        }
        setDeletingTheme(null);
    };
    
    const handleExport = (theme: ThemeDefinition) => {
        const { id, ...exportableTheme } = theme;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportableTheme, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${theme.name.replace(/ /g, '_')}.theme.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                // Basic validation
                if (typeof parsed.name === 'string' && typeof parsed.styles === 'object' && parsed.styles['--font-body']) {
                    addTheme({ ...parsed, isCustom: true, name: themes.some(t => t.name === parsed.name) ? `${parsed.name} (Imported)`: parsed.name });
                } else {
                    throw new Error("Invalid theme file format.");
                }
            } catch (error) {
                console.error("Error importing theme:", error);
                alert("Failed to import theme. Please check file format.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleUseIdea = (idea: { name: string; styles: any; }) => {
        addTheme({ ...idea, isCustom: true });
        setIsGeneratorOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-end items-center mb-8">
                <div className="flex gap-2">
                    {isAiAvailable && (
                        <Button onClick={() => setIsGeneratorOpen(true)} variant="secondary">
                            Create with AI
                        </Button>
                    )}
                    <Button variant="secondary" onClick={handleImportClick}>Import Theme</Button>
                    <Button onClick={handleCreate}>Create New Theme</Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {themes.map(theme => (
                    <ThemePreviewCard
                        key={theme.id}
                        theme={theme}
                        onEdit={() => handleEdit(theme)}
                        onDelete={() => handleDeleteRequest(theme)}
                        onExport={() => handleExport(theme)}
                    />
                ))}
            </div>

            {isDialogOpen && <EditThemeDialog themeToEdit={editingTheme} onClose={() => setIsDialogOpen(false)} />}
            {isGeneratorOpen && <ThemeIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
            
            <ConfirmDialog
                isOpen={!!deletingTheme}
                onClose={() => setDeletingTheme(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Theme"
                message={`Are you sure you want to delete the theme "${deletingTheme?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ThemeEditorPage;
