import React, { useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import FirstRunWizard from '@/components/auth/FirstRunWizard';
import MainLayout from '@/components/layout/MainLayout';
import SwitchUser from '@/components/auth/SwitchUser';
import NotificationContainer from '@/components/ui/notification-container';
import AppLockScreen from '@/components/auth/AppLockScreen';
import OnboardingWizard from '@/components/auth/OnboardingWizard';
import SharedLayout from '@/components/layout/SharedLayout';
import { TooltipProvider } from "@/components/ui/tooltip";

const App: React.FC = () => {
  const { isAppUnlocked, isFirstRun, currentUser, isSwitchingUser, isDataLoaded, settings, isSharedViewActive, appMode, guilds, themes, isRestarting, activePage } = useAppState();

  useEffect(() => {
    // If we are on a page that handles its own theme preview, don't let the global effect override it.
    if (activePage === 'Appearance' || activePage === 'Theme Editor') {
        return;
    }

    let activeThemeId: string | undefined = settings.theme; // Default to system theme

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
    
    const theme = themes.find(t => t.id === activeThemeId);
    const root = document.documentElement;

    if (theme) {
        Object.entries(theme.styles).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

  }, [settings.theme, currentUser?.id, currentUser?.theme, appMode, guilds, themes, activePage]);

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


  if (isRestarting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-6"></div>
        <h1 className="text-3xl font-display text-accent">Application Restarting</h1>
        <p className="text-foreground mt-2">Please wait a few moments. The page will reload automatically.</p>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  const showOnboarding = currentUser && !currentUser.hasBeenOnboarded;

  return (
    <TooltipProvider>
      <NotificationContainer />
      {showOnboarding && <OnboardingWizard />}

      {(() => {
        if (isFirstRun) { return <FirstRunWizard />; }
        if (!isAppUnlocked && !isFirstRun) { return <AppLockScreen />; }
        
        if (isSwitchingUser) { return <SwitchUser />; }
        
        if (settings.sharedMode.enabled && isSharedViewActive) {
          return <SharedLayout />;
        }

        if (!currentUser) { return <SwitchUser />; }
      
        return <MainLayout />;
      })()}
    </TooltipProvider>
  );
};

export default App;