

import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ThemesPage: React.FC = () => {
    const { currentUser, settings, themes, markets, guilds } = useAppState();
    const { updateUser, addNotification, setActivePage, setActiveMarketId } = useAppDispatch();
    
    if (!currentUser) return null;

    const [selectedThemeId, setSelectedThemeId] = useState(currentUser.theme || settings.theme);

    useEffect(() => {
        // Instant theme preview when selection changes
        document.body.dataset.theme = selectedThemeId;
        // Cleanup function to revert theme if user navigates away without saving
        return () => {
            const userTheme = currentUser?.theme;
            const guildTheme = settings.theme; // Fallback
            document.body.dataset.theme = userTheme || guildTheme;
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
    
    const goToThemeMarket = () => {
        const themeMarket = markets.find(m => m.title.toLowerCase().includes('themes'));
        if(themeMarket) {
            setActiveMarketId(themeMarket.id);
        }
        setActivePage('Marketplace');
    }

    const lockedThemeIds = useMemo(() => {
        return new Set(guilds.map(g => g.themeId).filter(Boolean));
    }, [guilds]);

    const getPreviewStyle = (theme: ThemeDefinition) => ({
        fontFamily: theme.styles['--font-display'],
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
                        const isLockedByGuild = lockedThemeIds.has(theme.id);
                        const isSelectable = isOwned && !isLockedByGuild;
                        
                        return (
                            <div key={theme.id} className="space-y-3">
                                <button
                                    onClick={() => setSelectedThemeId(theme.id)}
                                    className={`w-full aspect-[4/3] rounded-lg transition-all duration-200 border-4 ${isActive ? 'border-white shadow-2xl scale-105' : 'border-transparent opacity-70 hover:opacity-100'} ${!isSelectable ? '!opacity-50 cursor-not-allowed' : ''}`}
                                    style={getPreviewStyle(theme)}
                                    disabled={!isSelectable}
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
                                    {isLockedByGuild ? (
                                        <span className="text-xs font-bold text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">LOCKED BY GUILD</span>
                                    ) : isOwned ? (
                                        <span className="text-xs font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full">OWNED</span>
                                    ) : (
                                        <button onClick={goToThemeMarket} className="text-xs font-bold text-stone-400 bg-stone-700/50 px-3 py-1 rounded-full hover:bg-stone-700 hover:text-white transition-colors">
                                            Unlock ➔
                                        </button>
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