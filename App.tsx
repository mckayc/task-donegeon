
import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import { useGameData } from './context/GameDataContext'; // Import useGameData
import FirstRunWizard from './components/auth/FirstRunWizard';
import MainLayout from './components/layout/MainLayout';
import SwitchUser from './components/auth/SwitchUser';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/ui/NotificationContainer';
import AppLockScreen from './components/auth/AppLockScreen';
import OnboardingWizard from './components/auth/OnboardingWizard';

const App: React.FC = () => {
  const { isAppUnlocked, isFirstRun, currentUser, isSwitchingUser } = useAuth();
  const { settings } = useSettings();
  const { isDataLoaded } = useGameData(); // Get the data loaded flag

  useEffect(() => {
    if (currentUser || settings.theme) {
      const activeTheme = currentUser?.theme || settings.theme;
      document.body.dataset.theme = activeTheme;
    }
  }, [settings.theme, currentUser]);

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
        if (!isAppUnlocked && !isFirstRun) {
            return <AppLockScreen />;
        }
        
        if (isFirstRun) {
          return <FirstRunWizard />;
        }
        
        if (isSwitchingUser) {
          return <SwitchUser />;
        }
      
        if (!currentUser) {
          return <AuthPage />;
        }
      
        return <MainLayout />;
      })()}
    </>
  );
};

export default App;
