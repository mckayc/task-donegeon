

import React, { useEffect } from 'react';
import { useAppState } from './context/AppContext';
import FirstRunWizard from './components/auth/FirstRunWizard';
import MainLayout from './components/layout/MainLayout';
import SwitchUser from './components/auth/SwitchUser';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/ui/NotificationContainer';
import AppLockScreen from './components/auth/AppLockScreen';
import OnboardingWizard from './components/auth/OnboardingWizard';
import SharedLayout from './components/layout/SharedLayout';

const App: React.FC = () => {
  const { isAppUnlocked, isFirstRun, currentUser, isSwitchingUser, isDataLoaded, settings, isSharedViewActive, appMode, guilds, themes } = useAppState();

  useEffect(() => {
    let activeThemeId = settings.theme; // Default to system theme

    if (appMode.mode === 'guild') {
        const currentGuild = guilds.find(g => g.id === appMode.guildId);
        if (currentGuild?.themeId) {
            activeThemeId = currentGuild.themeId; // Guild theme is priority in guild mode
        } else if (currentUser?.theme) {
            activeThemeId = currentUser.theme; // Fallback to user theme
        }
    } else { // Personal mode
        if (currentUser?.theme) {
            activeThemeId = currentUser.theme; // Use personal theme
        }
    }
    
    // Find the theme definition and apply its styles
    const theme = themes.find(t => t.id === activeThemeId);
    if (theme) {
        Object.entries(theme.styles).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    }

    document.body.dataset.theme = activeThemeId;
  }, [settings.theme, currentUser, appMode, guilds, themes]);

  useEffect(() => {
    if (settings.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${settings.favicon}</text></svg>`;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }, [settings.favicon]);


  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const showOnboarding = currentUser && !currentUser.hasBeenOnboarded;

  return (
    <>
      <NotificationContainer />
      {showOnboarding && <OnboardingWizard />}

      {(() => {
        if (isFirstRun) { return <FirstRunWizard />; }
        if (!isAppUnlocked && !isFirstRun) { return <AppLockScreen />; }
        
        // The user switching flow must take precedence over the shared view.
        if (isSwitchingUser) { return <SwitchUser />; }
        
        // If not switching, and shared mode is active, show the shared layout.
        if (settings.sharedMode.enabled && isSharedViewActive) {
          return <SharedLayout />;
        }

        if (!currentUser) { return <AuthPage />; }
      
        return <MainLayout />;
      })()}
    </>
  );
};

export default App;