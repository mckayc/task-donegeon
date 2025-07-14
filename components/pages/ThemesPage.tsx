

import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Theme } from '../../types';
import Button from '../ui/Button';

const ALL_THEMES: Theme[] = [
    'emerald', 'rose', 'sky', 'arcane', 'cartoon', 'forest', 'ocean', 'vulcan', 
    'royal', 'winter', 'sunset', 'cyberpunk', 'steampunk', 'parchment', 'eerie'
];

const ThemesPage: React.FC = () => {
    const { currentUser, settings, markets } = useAppState();
    const { updateUser, addNotification, setActivePage, setActiveMarketId } = useAppDispatch();
    
    if (!currentUser) return null;

    const [selectedTheme, setSelectedTheme] = useState(currentUser.theme || settings.theme);

    useEffect(() => {
        // Instant theme preview
        document.body.dataset.theme = selectedTheme;
        // Cleanup function to revert theme if user navigates away without saving
        return () => {
            document.body.dataset.theme = currentUser.theme || settings.theme;
        };
    }, [selectedTheme, currentUser.theme, settings.theme]);

    const handleSave = () => {
        if (currentUser.ownedThemes.includes(selectedTheme)) {
            updateUser(currentUser.id, { theme: selectedTheme });
            addNotification({ type: 'success', message: 'Theme updated successfully!' });
        } else {
            addNotification({ type: 'error', message: "You don't own this theme yet." });
        }
    };

    const handleGoToStore = () => {
        const themeStore = markets.find(m => m.id === 'market-themes');
        if (themeStore) {
            setActiveMarketId(themeStore.id);
            setActivePage('Marketplace');
        } else {
            addNotification({type: 'error', message: 'Theme store not found!'});
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-medieval text-stone-100">Themes</h1>
                <Button onClick={handleSave} disabled={!currentUser.ownedThemes.includes(selectedTheme)}>
                    Save Active Theme
                </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {ALL_THEMES.map(theme => {
                    const isOwned = currentUser.ownedThemes.includes(theme);
                    const isActive = selectedTheme === theme;
                    
                    return (
                        <div key={theme} className="space-y-3">
                            <button
                                onClick={() => setSelectedTheme(theme)}
                                className={`w-36 h-28 rounded-lg transition-all duration-200 border-4 ${isActive ? 'border-white shadow-2xl scale-105' : 'border-transparent'}`}
                                style={{ 
                                    backgroundColor: `hsl(var(--color-${theme}-hue, 224), var(--color-${theme}-saturation, 39%), var(--color-${theme}-lightness, 10%))`,
                                    fontFamily: `var(--font-${theme}-display, 'Roboto')`,
                                }}
                            >
                                <div className="p-2 flex flex-col justify-between h-full text-white">
                                    <h3 className="text-lg font-bold capitalize">{theme}</h3>
                                    <div className="flex justify-end items-center gap-1">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(var(--color-${theme}-hue, 158), var(--color-${theme}-saturation, 84%), var(--color-${theme}-lightness, 39%))`}}></div>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(var(--color-${theme}-accent-hue, 158), var(--color-${theme}-accent-saturation, 75%), var(--color-${theme}-accent-lightness, 58%))`}}></div>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(var(--color-${theme}-accent-light-hue, 158), var(--color-${theme}-accent-light-saturation, 70%), var(--color-${theme}-accent-light-lightness, 45%))`}}></div>
                                    </div>
                                </div>
                            </button>
                            <div className="text-center">
                                {isOwned ? (
                                    <span className="text-xs font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full">OWNED</span>
                                ) : (
                                    <Button onClick={handleGoToStore} variant="secondary" className="text-xs py-1 px-3">
                                        Go to Store
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
             <style>{`
                :root { 
                    --color-emerald-hue: 158; --color-emerald-saturation: 84%; --color-emerald-lightness: 39%; --font-emerald-display: 'MedievalSharp', cursive;
                    --color-rose-hue: 346; --color-rose-saturation: 84%; --color-rose-lightness: 59%; --font-rose-display: 'MedievalSharp', cursive;
                    --color-sky-hue: 204; --color-sky-saturation: 85%; --color-sky-lightness: 54%; --font-sky-display: 'MedievalSharp', cursive;
                    --color-arcane-hue: 265; --color-arcane-saturation: 60%; --color-arcane-lightness: 55%; --font-arcane-display: 'Uncial Antiqua', cursive;
                    --color-cartoon-hue: 25; --color-cartoon-saturation: 95%; --color-cartoon-lightness: 55%; --font-cartoon-display: 'Comic Neue', cursive;
                    --color-forest-hue: 130; --color-forest-saturation: 60%; --color-forest-lightness: 40%; --font-forest-display: 'Metamorphous', serif;
                    --color-ocean-hue: 180; --color-ocean-saturation: 85%; --color-ocean-lightness: 45%; --font-ocean-display: 'Uncial Antiqua', cursive;
                    --color-vulcan-hue: 0; --color-vulcan-saturation: 85%; --color-vulcan-lightness: 50%; --font-vulcan-display: 'Metamorphous', serif;
                    --color-royal-hue: 250; --color-royal-saturation: 60%; --color-royal-lightness: 50%; --font-royal-display: 'Uncial Antiqua', cursive;
                    --color-winter-hue: 205; --color-winter-saturation: 70%; --color-winter-lightness: 50%; --font-winter-display: 'Metamorphous', serif;
                    --color-sunset-hue: 15; --color-sunset-saturation: 90%; --color-sunset-lightness: 60%; --font-sunset-display: 'MedievalSharp', cursive;
                    --color-cyberpunk-hue: 320; --color-cyberpunk-saturation: 100%; --color-cyberpunk-lightness: 60%; --font-cyberpunk-display: 'Press Start 2P', cursive;
                    --color-steampunk-hue: 30; --color-steampunk-saturation: 60%; --color-steampunk-lightness: 50%; --font-steampunk-display: 'IM Fell English SC', serif;
                    --color-parchment-hue: 20; --color-parchment-saturation: 50%; --color-parchment-lightness: 40%; --font-parchment-display: 'IM Fell English SC', serif;
                    --color-eerie-hue: 120; --color-eerie-saturation: 40%; --color-eerie-lightness: 45%; --font-eerie-display: 'Metamorphous', serif;

                    --color-emerald-accent-hue: 158; --color-emerald-accent-saturation: 75%; --color-emerald-accent-lightness: 58%;
                    --color-rose-accent-hue: 346; --color-rose-accent-saturation: 91%; --color-rose-accent-lightness: 71%;
                    --color-sky-accent-hue: 202; --color-sky-accent-saturation: 90%; --color-sky-accent-lightness: 70%;
                    --color-arcane-accent-hue: 265; --color-arcane-accent-saturation: 70%; --color-arcane-accent-lightness: 75%;
                    --color-cartoon-accent-hue: 200; --color-cartoon-accent-saturation: 85%; --color-cartoon-accent-lightness: 60%;
                    --color-forest-accent-hue: 90; --color-forest-accent-saturation: 50%; --color-forest-accent-lightness: 65%;
                    --color-ocean-accent-hue: 170; --color-ocean-accent-saturation: 70%; --color-ocean-accent-lightness: 70%;
                    --color-vulcan-accent-hue: 30; --color-vulcan-accent-saturation: 90%; --color-vulcan-accent-lightness: 60%;
                    --color-royal-accent-hue: 50; --color-royal-accent-saturation: 80%; --color-royal-accent-lightness: 60%;
                    --color-winter-accent-hue: 210; --color-winter-accent-saturation: 60%; --color-winter-accent-lightness: 65%;
                    --color-sunset-accent-hue: 330; --color-sunset-accent-saturation: 80%; --color-sunset-accent-lightness: 70%;
                    --color-cyberpunk-accent-hue: 180; --color-cyberpunk-accent-saturation: 100%; --color-cyberpunk-accent-lightness: 50%;
                    --color-steampunk-accent-hue: 180; --color-steampunk-accent-saturation: 30%; --color-steampunk-accent-lightness: 55%;
                    --color-parchment-accent-hue: 0; --color-parchment-accent-saturation: 40%; --color-parchment-accent-lightness: 45%;
                    --color-eerie-accent-hue: 280; --color-eerie-accent-saturation: 40%; --color-eerie-accent-lightness: 60%;

                    --color-emerald-accent-light-hue: 158; --color-emerald-accent-light-saturation: 70%; --color-emerald-accent-light-lightness: 45%;
                    --color-rose-accent-light-hue: 346; --color-rose-accent-light-saturation: 80%; --color-rose-accent-light-lightness: 60%;
                    --color-sky-accent-light-hue: 202; --color-sky-accent-light-saturation: 80%; --color-sky-accent-light-lightness: 60%;
                    --color-arcane-accent-light-hue: 45; --color-arcane-accent-light-saturation: 80%; --color-arcane-accent-light-lightness: 65%;
                    --color-cartoon-accent-light-hue: 200; --color-cartoon-accent-light-saturation: 90%; --color-cartoon-accent-light-lightness: 70%;
                    --color-forest-accent-light-hue: 40; --color-forest-accent-light-saturation: 50%; --color-forest-accent-light-lightness: 55%;
                    --color-ocean-accent-light-hue: 160; --color-ocean-accent-light-saturation: 60%; --color-ocean-accent-light-lightness: 80%;
                    --color-vulcan-accent-light-hue: 30; --color-vulcan-accent-light-saturation: 80%; --color-vulcan-accent-light-lightness: 75%;
                    --color-royal-accent-light-hue: 50; --color-royal-accent-light-saturation: 70%; --color-royal-accent-light-lightness: 75%;
                    --color-winter-accent-light-hue: 215; --color-winter-accent-light-saturation: 50%; --color-winter-accent-light-lightness: 55%;
                    --color-sunset-accent-light-hue: 330; --color-sunset-accent-light-saturation: 70%; --color-sunset-accent-light-lightness: 80%;
                    --color-cyberpunk-accent-light-hue: 60; --color-cyberpunk-accent-light-saturation: 100%; --color-cyberpunk-accent-light-lightness: 55%;
                    --color-steampunk-accent-light-hue: 40; --color-steampunk-accent-light-saturation: 40%; --color-steampunk-accent-light-lightness: 70%;
                    --color-parchment-accent-light-hue: 0; --color-parchment-accent-light-saturation: 30%; --color-parchment-accent-light-lightness: 30%;
                    --color-eerie-accent-light-hue: 280; --color-eerie-accent-light-saturation: 30%; --color-eerie-accent-light-lightness: 75%;
                }
            `}</style>
        </div>
    );
};

export default ThemesPage;
