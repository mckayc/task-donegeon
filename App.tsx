

import React, { useEffect } from 'react';
import { useAppState } from './context/AppContext';
import FirstRunWizard from './components/auth/FirstRunWizard';
import MainLayout from './components/layout/MainLayout';
import SwitchUser from './components/auth/SwitchUser';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/ui/NotificationContainer';

const App: React.FC = () => {
  const { isFirstRun, currentUser, isSwitchingUser, settings } = useAppState();

  useEffect(() => {
    const activeTheme = currentUser?.theme || settings.theme;
    document.body.dataset.theme = activeTheme;
  }, [settings.theme, currentUser?.theme, currentUser?.ownedThemes]);

  return (
    <>
      <NotificationContainer />
      {(() => {
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