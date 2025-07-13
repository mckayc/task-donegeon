
import React, { useEffect } from 'react';
import { useAppState } from './context/AppContext';
import FirstRunWizard from './components/auth/FirstRunWizard';
import MainLayout from './components/layout/MainLayout';
import SwitchUser from './components/auth/SwitchUser';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/ui/NotificationContainer';
import AppLockScreen from './components/auth/AppLockScreen';

const App: React.FC = () => {
  const { isAppUnlocked, isFirstRun, currentUser, isSwitchingUser, targetedUserForLogin, settings } = useAppState();

  useEffect(() => {
    const activeTheme = currentUser?.theme || settings.theme;
    document.body.dataset.theme = activeTheme;
  }, [settings.theme, currentUser?.theme, currentUser?.ownedThemes]);

  return (
    <>
      <NotificationContainer />
      {(() => {
        // Don't show lock screen on the very first run (before an admin exists)
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
          // This now correctly handles both normal login and targeted admin login
          return <AuthPage />;
        }
      
        return <MainLayout />;
      })()}
    </>
  );
};

export default App;