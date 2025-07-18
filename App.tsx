

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
  const { isAppUnlocked, isFirstRun, currentUser, isSwitchingUser, isDataLoaded, settings, isSharedViewActive, appMode, guilds } = useAppState();

  useEffect(() => {
    let activeTheme = settings.theme; // Default to system theme

    if (appMode.mode === 'guild') {
        const currentGuild = guilds.find(g => g.id === appMode.guildId);
        if (currentGuild?.themeId) {
            activeTheme = currentGuild.themeId; // Guild theme takes precedence
        }
    }

    if (currentUser?.theme) {
        activeTheme = currentUser.theme; // User's personal theme takes highest precedence
    }
    
    document.body.dataset.theme = activeTheme;
  }, [settings.theme, currentUser, appMode, guilds]);


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