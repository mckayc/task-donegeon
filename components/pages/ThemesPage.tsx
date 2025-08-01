import React, { useState, useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ThemeDefinition, AppMode } from '../../types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const ThemesPage: React.FC = () => {
    const { currentUser, settings, themes, markets, guilds, appMode } = useAppState();
    const { updateUser, addNotification, setActivePage, setActiveMarketId } = useAppDispatch();
    
    if (!currentUser) return null;

    const [selectedThemeId, setSelectedThemeId] = useState(currentUser.theme || settings.theme);

    const applyThemeStyles = (themeId: string) => {
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
            Object.entries(theme.styles).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
            if (themeId) {
                document.body.dataset.theme = themeId;
            }
        }
    };

    useEffect(() => {
        // Apply the selected preview theme
        applyThemeStyles(selectedThemeId);

        // Cleanup function to revert to the actual saved theme when navigating away
        return () => {
            let activeThemeId: string | undefined = settings.theme;
            if (appMode.mode === 'guild') {
                const guild = guilds.find(g => g.id === appMode.guildId);
                if (guild?.themeId) {
                    activeThemeId = guild.themeId;
                } else if (currentUser?.theme) {
                    activeThemeId = currentUser.theme;
                }
            } else {
                if (currentUser?.theme) {
                    activeThemeId = currentUser.theme;
                }
            }
            if(activeThemeId) {
                applyThemeStyles(activeThemeId);
            }
        };
    }, [selectedThemeId, themes, currentUser, settings, appMode, guilds]);


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
              <CardContent className="p-6">
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
                                        <Button onClick={goToThemeMarket} variant="link" className="text-xs font-bold">
                                            Unlock ➔
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
              </CardContent>
            </Card>
        </div>
    );
};

export default ThemesPage;
