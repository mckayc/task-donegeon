


import React, { useEffect, useState } from 'react';
import { useUIState, useUIDispatch } from './context/UIContext';
import { useAuthState } from './context/AuthContext';
import FirstRunWizard from './components/auth/FirstRunWizard';
import MainLayout from './components/layout/MainLayout';
import SwitchUser from './components/auth/SwitchUser';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/user-interface/NotificationContainer';
import AppLockScreen from './components/auth/AppLockScreen';
import OnboardingWizard from './components/auth/OnboardingWizard';
import SharedLayout from './components/layout/SharedLayout';
import BugReporter from './components/dev/BugReporter';
import { useDeveloperState, useDeveloperDispatch } from './context/DeveloperContext';
import { useCommunityState } from './context/CommunityContext';
import { useSystemState, useSystemDispatch } from './context/SystemContext';
import { useIsDataLoaded } from './context/DataProvider';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { Role, Guild, ThemeDefinition } from './types';
import UpdateAvailable from './components/user-interface/UpdateAvailable';

const App: React.FC = () => {
  const { settings, themes, isUpdateAvailable } = useSystemState();
  const { guilds } = useCommunityState();
  const { appMode, activePage, isKioskDevice } = useUIState();
  const { currentUser, isAppUnlocked, isFirstRun, isSwitchingUser } = useAuthState();
  const { isRecording, isPickingElement, trackClicks, trackElementDetails } = useDeveloperState();
  const { addLogEntry } = useDeveloperDispatch();
  const { installUpdate } = useSystemDispatch();
  const { setIsMobileView } = useUIDispatch();
  const isDataLoaded = useIsDataLoaded();
  
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobileView]);

  useEffect(() => {
    // If we are on a page that handles its own theme preview, don't apply the global theme.
    if (activePage === 'Appearance') {
        return;
    }

    let activeThemeId: string | undefined = settings.theme; // Default to system theme

    if (appMode.mode === 'guild') {
        const currentGuild = guilds.find((g: Guild) => g.id === appMode.guildId);
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
    const theme = themes.find((t: ThemeDefinition) => t.id === activeThemeId);
    if (theme) {
        Object.entries(theme.styles).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
        });
    }

    if (activeThemeId) {
        document.body.dataset.theme = activeThemeId;
    }
  }, [settings.theme, currentUser, appMode, guilds, themes, activePage]);

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

  useEffect(() => {
    if (!isRecording || !trackClicks) {
      return;
    }

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const loggableTarget = target.closest('[data-log-id]');

      // Ignore clicks on the bug reporter UI itself
      if (target.closest('[data-bug-reporter-ignore]')) {
        return;
      }

      if (loggableTarget) {
          const logId = loggableTarget.getAttribute('data-log-id');
          addLogEntry({
              type: 'ACTION',
              message: `Clicked: ${logId}`,
          });
      } else {
          if (trackElementDetails) {
            const elementInfo = {
              tag: target.tagName.toLowerCase(),
              id: target.id || undefined,
              classes: typeof target.className === 'string' ? target.className : undefined,
              text: target.innerText?.substring(0, 50).replace(/\n/g, ' ') || undefined,
            };

            addLogEntry({
              type: 'ACTION',
              message: `Clicked element: <${elementInfo.tag}>`,
              element: elementInfo,
            });
          } else {
             addLogEntry({
              type: 'ACTION',
              message: `Clicked element: <${target.tagName.toLowerCase()}>`,
            });
          }
      }
    };

    // Use capture phase to get the click before other handlers might stop it
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isRecording, addLogEntry, trackClicks, trackElementDetails]);

  useEffect(() => {
    document.body.style.cursor = isPickingElement ? 'crosshair' : 'default';
  }, [isPickingElement]);

  // --- Service Worker Update Listener ---
  useEffect(() => {
      setShowUpdateToast(!!isUpdateAvailable);
  }, [isUpdateAvailable]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const showOnboarding = currentUser && !currentUser.hasBeenOnboarded;
  const showBugReporter = settings.developerMode.enabled && currentUser?.role === Role.DonegeonMaster;

  const renderAppContent = () => {
    // 1. First Run: This is the absolute first gate. If the app has no users,
    // it must run the setup wizard.
    if (isFirstRun) {
      return <FirstRunWizard />;
    }
  
    // 2. Kiosk Mode: This is a special, high-priority view. If the device has
    // kiosk mode enabled locally, show the shared layout immediately.
    if (settings.sharedMode.enabled && isKioskDevice) {
      return <SharedLayout />;
    }
  
    // 3. App Lock: If we are not in Kiosk mode, this is the second gate. If the app
    // hasn't been unlocked for the session, show the lock screen.
    if (!isAppUnlocked) {
      return <AppLockScreen />;
    }
  
    // --- From this point on, the application is considered "unlocked" for the session. ---
  
    // 4. User Switching: If the user is actively switching profiles, show that UI.
    if (isSwitchingUser) {
      return <SwitchUser />;
    }
    
    // 5. No User Logged In: If the app is unlocked but no user is selected
    // (e.g., after logging out from a personal session), show the login page.
    if (!currentUser) {
      return <AuthPage />;
    }
  
    // 6. User is Logged In: A user is authenticated, show the main application.
    return <MainLayout />;
  };

  return (
    <ErrorBoundary>
      <NotificationContainer />
      {showUpdateToast && <UpdateAvailable onUpdateClick={installUpdate} onDismiss={() => setShowUpdateToast(false)} />}
      {showOnboarding && <OnboardingWizard />}
      
      {renderAppContent()}

      {showBugReporter && <BugReporter />}
    </ErrorBoundary>
  );
};

export default App;