
import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ThemesPage: React.FC = () => {
    const { currentUser, settings, themes } = useAppState();
    const { updateUser, addNotification } = useAppDispatch();
    
    if (!currentUser) return null;

    const [selectedThemeId, setSelectedThemeId] = useState(currentUser.theme || settings.theme);

    useEffect(() => {
        // Instant theme preview when selection changes
        document.body.dataset.theme = selectedThemeId;
        // Cleanup function to revert theme if user navigates away without saving
        return () => {
            document.body.dataset.theme = currentUser.theme || settings.theme;
        };
    }, [selectedThemeId, currentUser.theme, settings.theme]);

    const handleSave = () => {
        if (currentUser.ownedThemes.includes(selectedThemeId)) {
            updateUser(currentUser.id, { theme: selectedThemeId });
            addNotification({ type: 'success', message: 'Theme updated successfully!' });
        } else {
            addNotification({ type: 'error', message: "You don't own this theme yet." });
        }
    };

    const getPreviewStyle = (theme: ThemeDefinition) => ({
        fontFamily: theme.styles['--font-h1'],
        backgroundColor: `hsl(${theme.styles['--color-bg-primary']})`,
        color: `hsl(${theme.styles['--color-text-primary']})`,
    });
    
    const getAccentStyle = (theme: ThemeDefinition, type: 'primary' | 'accent' | 'accent-light') => ({
        backgroundColor: `hsl(${theme.styles[`--color-${type}-hue`]} ${theme.styles[`--color-${type}-saturation`]} ${theme.styles[`--color-${type}-lightness`]})`
    });

    return (
        <div>
            <div className="flex justify-end items-center mb-8">
                <Button onClick={handleSave} disabled={!currentUser.ownedThemes.includes(selectedThemeId)}>
                    Save Active Theme
                </Button>
            </div>
            
            <Card>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {themes.map(theme => {
                        const isOwned = currentUser.ownedThemes.includes(theme.id);
                        const isActive = selectedThemeId === theme.id;
                        
                        return (
                            <div key={theme.id} className="space-y-3">
                                <button
                                    onClick={() => setSelectedThemeId(theme.id)}
                                    className={`w-full aspect-[4/3] rounded-lg transition-all duration-200 border-4 ${isActive ? 'border-white shadow-2xl scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={getPreviewStyle(theme)}
                                    disabled={!isOwned}
                                >
                                    <div className="p-2 flex flex-col justify-between h-full">
                                        <h3 className="text-lg font-bold capitalize truncate">{theme.name}</h3>
                                        <div className="flex justify-end items-center gap-1">
                                            <div className="w-4 h-4 rounded-full" style={getAccentStyle(theme, 'primary')}></div>
                                            <div className="w-4 h-4 rounded-full" style={getAccentStyle(theme, 'accent')}></div>
                                            <div className="w-4 h-4 rounded-full" style={getAccentStyle(theme, 'accent-light')}></div>
                                        </div>
                                    </div>
                                </button>
                                <div className="text-center">
                                    {isOwned ? (
                                        <span className="text-xs font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full">OWNED</span>
                                    ) : (
                                        <span className="text-xs font-bold text-stone-500 bg-stone-700/50 px-3 py-1 rounded-full">LOCKED</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default ThemesPage;