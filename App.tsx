import React, { useEffect, useMemo } from 'react';
import { useAppState } from './context/AppContext';
import { useUIState } from './context/UIStateContext';
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
import { BugReportStatus, Role } from './types';
import { useDeveloper, useDeveloperState } from './context/DeveloperContext';
import { BugDetailDialog } from './components/dev/BugDetailDialog';

const App: React.FC = () => {
  const { isDataLoaded, settings, guilds, themes, bugReports } = useAppState();
  const { currentUser, isAppUnlocked, isFirstRun, isSwitchingUser, isSharedViewActive } = useAuthState();
  const { appMode, activePage } = useUIState();
  const { isRecording, addLogEntry, setDetailedBugReportId } = useDeveloper();
  const { isPickingElement, detailedBugReportId } = useDeveloperState();

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
            document.documentElement.style.setProperty(key, value);
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

  const detailedReport = useMemo(() => {
    if (!detailedBugReportId) return null;
    return bugReports.find(r => r.id === detailedBugReportId) || null;
  }, [detailedBugReportId, bugReports]);

  const allBugReportTags = useMemo(() => {
    const defaultTags = ['Bug Report', 'Feature Request', 'UI/UX Feedback', 'Content Suggestion', 'In Progress', 'Acknowledged', 'Resolved', 'Converted to Quest'];
    const allTagsFromReports = bugReports.flatMap(r => r.tags || []);
    const submissionTagPrefix = 'ai submissions:';
    const filteredTags = allTagsFromReports.filter(tag => !tag.toLowerCase().startsWith(submissionTagPrefix));
    return Array.from(new Set([...defaultTags, ...filteredTags])).sort();
  }, [bugReports]);

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
      {detailedReport && (
          <BugDetailDialog
              report={detailedReport}
              onClose={() => setDetailedBugReportId(null)}
              allTags={allBugReportTags}
              getTagColor={getTagColor}
          />
      )}
    </>
  );
};

export default App;