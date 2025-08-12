import React, { useEffect, useMemo, useState } from 'react';
import { useAppState } from './context/AppContext';
import { useUIState, useUIDispatch } from './context/UIStateContext';
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
import { useDeveloper, useDeveloperState } from './context/DeveloperContext';
import { BugDetailDialog } from './components/dev/BugDetailDialog';
import ChatController from './components/chat/ChatController';
import { useLoadingState } from './context/LoadingContext';

const App: React.FC = () => {
  console.log('[App.tsx] App component rendering...');
  const { isDataLoaded } = useLoadingState();
  const { settings, guilds, themes, bugReports } = useAppState();
  const { currentUser, isAppUnlocked, isFirstRun, isSwitchingUser, isSharedViewActive } = useAuthState();
  const { appMode, activePage, activeBugDetailId } = useUIState();
  const { setActiveBugDetailId } = useUIDispatch();
  const { isRecording, addLogEntry } = useDeveloper();
  const { isPickingElement } = useDeveloperState();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  console.log(`[App.tsx] isDataLoaded state is: ${isDataLoaded}`);

  useEffect(() => {
    if (!isDataLoaded) {
        const timer = setTimeout(() => {
            console.error('[App.tsx] Loading timed out after 10 seconds. isDataLoaded is still false. Displaying error screen.');
            setLoadingTimedOut(true);
        }, 10000); // 10 second timeout

        return () => clearTimeout(timer);
    }
  }, [isDataLoaded]);

  const detailedReport = useMemo(() => {
    if (!activeBugDetailId) return null;
    return bugReports.find(r => r.id === activeBugDetailId);
  }, [activeBugDetailId, bugReports]);

  const getTagColor = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag.startsWith('ai submissions:')) {
        return 'bg-cyan-500/20 text-cyan-300';
    }
    if (lowerTag.startsWith('copy #')) {
        return 'bg-indigo-500/20 text-indigo-300';
    }
    switch (lowerTag) {
        case 'in progress': return 'bg-yellow-500/20 text-yellow-300';
        case 'feature request': return 'bg-purple-500/20 text-purple-300';
        case 'ui/ux feedback': return 'bg-sky-500/20 text-sky-300';
        case 'bug report': return 'bg-red-500/20 text-red-300';
        case 'resolved':
        case 'converted to quest':
             return 'bg-green-500/20 text-green-300';
        default: return 'bg-stone-500/20 text-stone-300';
    }
  };

  const allBugReportTags = useMemo(() => {
      const defaultTags = ['Bug Report', 'Feature Request', 'UI/UX Feedback', 'Content Suggestion', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'];
      const allTagsFromReports = bugReports.flatMap(r => r.tags || []);
      const submissionTagPrefix = 'ai submissions:';
      const filteredTags = allTagsFromReports.filter(tag => !tag.toLowerCase().startsWith(submissionTagPrefix));
      return Array.from(new Set([...defaultTags, ...filteredTags])).sort();
  }, [bugReports]);

  useEffect(() => {
    // If we are on a page that handles its own theme preview, don't apply the global theme.
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
    
    // Find the theme definition and apply its styles
    const theme = themes.find(t => t.id === activeThemeId);
    if (theme) {
        Object.entries(theme.styles).forEach(([key, value]) => {
            // Defensive check to prevent crash from undefined values
            if (value) {
                document.documentElement.style.setProperty(key, value);
            }
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
    if (loadingTimedOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-900 text-center text-stone-300 p-4">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-medieval text-red-500 mb-4">Application Failed to Load</h1>
                    <p className="mb-6">
                        There was a critical error during startup that prevented the application from loading. Please check the browser's developer console for specific error messages.
                    </p>
                    <p className="mb-6 bg-stone-800 p-3 rounded-md">
                        <strong>How to open the console:</strong> Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">F12</kbd> or <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl</kbd> + <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Shift</kbd> + <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">I</kbd>.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    console.log('[App.tsx] isDataLoaded is false, rendering loading spinner.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  console.log('[App.tsx] isDataLoaded is true, proceeding to render main application layout.');

  const showOnboarding = currentUser && !currentUser.hasBeenOnboarded;
  const showBugReporter = settings.developerMode.enabled && currentUser?.role === Role.DonegeonMaster;
  const showChatController = settings.chat.enabled && currentUser;


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

      {showBugReporter && <BugReporter />}
      {showChatController && <ChatController />}
      {detailedReport && (
          <BugDetailDialog 
              report={detailedReport} 
              onClose={() => setActiveBugDetailId(null)} 
              allTags={allBugReportTags} 
              getTagColor={getTagColor}
          />
      )}
    </>
  );
};

export default App;