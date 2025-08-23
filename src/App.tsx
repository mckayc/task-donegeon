import React, { useEffect } from 'react';
import { useUIState } from './context/UIContext';
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
import { Role } from './types';
import { Guild } from './types';
import { ThemeDefinition } from './types';
import { useDeveloperState, useDeveloperDispatch } from './context/DeveloperContext';
import { useCommunityState } from './context/CommunityContext';
import { useSystemState } from './context/SystemContext';
import { useIsDataLoaded } from './context/DataProvider';
import ErrorBoundary from './components/layout/ErrorBoundary';

const App: React.FC = () => {
  const { settings, themes } = useSystemState();
  const { guilds } = useCommunityState();
  const { appMode, activePage } = useUIState();
  const { currentUser, isAppUnlocked, isFirstRun, isSwitchingUser, isSharedViewActive } = useAuthState();
  const { isRecording, isPickingElement } = useDeveloperState();
  const { addLogEntry } = useDeveloperDispatch();
  const isDataLoaded = useIsDataLoaded();

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
    if (!isRecording) {
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
      }
    };

    // Use capture phase to get the click before other handlers might stop it
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isRecording, addLogEntry]);

  useEffect(() => {
    document.body.style.cursor = isPickingElement ? 'crosshair' : 'default';
  }, [isPickingElement]);


  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const showOnboarding = currentUser && !currentUser.hasBeenOnboarded;
  const showBugReporter = settings.developerMode.enabled && currentUser?.role === Role.DonegeonMaster;

  return (
    <ErrorBoundary>
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

      {showBugReporter && <BugReporter />}
    </ErrorBoundary>
  );
};

export default App;