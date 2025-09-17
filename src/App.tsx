
import React, { useEffect, useMemo } from 'react';
import { useAuthState } from './context/AuthContext';
import { useUIState, useUIDispatch } from './context/UIContext';
import MainLayout from './components/layout/MainLayout';
import FirstRunWizard from './components/auth/FirstRunWizard';
import SwitchUser from './components/auth/SwitchUser';
import AppLockScreen from './components/auth/AppLockScreen';
import SharedLayout from './components/layout/SharedLayout';
import ErrorBoundary from './components/layout/ErrorBoundary';
import OnboardingWizard from './components/auth/OnboardingWizard';
import UpdateAvailable from './components/user-interface/UpdateAvailable';
import NotificationContainer from './components/user-interface/NotificationContainer';
import { useSystemState, useSystemDispatch } from './context/SystemContext';
import { useCommunityState } from './context/CommunityContext';
import BugReporter from './components/dev/BugReporter';
import { useDeveloperState } from './context/DeveloperContext';
import GameOverlay from './components/games/GameOverlay';
import { Role } from './components/users/types';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
    const { currentUser, isFirstRun, isAppUnlocked, isSwitchingUser, users } = useAuthState();
    const { isKioskDevice, appMode, activeGame, isScreenDimmed } = useUIState();
    const { setActiveGame } = useUIDispatch();
    const { settings, themes, isUpdateAvailable } = useSystemState();
    const { installUpdate, setUpdateAvailable } = useSystemDispatch();
    const { guilds } = useCommunityState();
    const { isRecording } = useDeveloperState();

    const showOnboarding = useMemo(() => {
        return currentUser && !currentUser.hasBeenOnboarded;
    }, [currentUser]);

    const activeThemeId = useMemo(() => {
        let themeId: string | undefined = settings.theme;
        if (appMode.mode === 'guild') {
            const currentGuild = guilds.find(g => g.id === appMode.guildId);
            themeId = currentGuild?.themeId || currentUser?.theme;
        } else {
            themeId = currentUser?.theme;
        }
        return themeId || 'default';
    }, [settings.theme, currentUser, appMode, guilds]);

    useEffect(() => {
        const theme = themes.find(t => t.id === activeThemeId);
        if (theme) {
            Object.entries(theme.styles).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value as string);
            });
            document.body.dataset.theme = theme.id;
        }
    }, [activeThemeId, themes]);

    const renderContent = () => {
        if (isFirstRun) return <FirstRunWizard />;

        // Kiosk Mode Logic
        if (isKioskDevice) {
            if (isSwitchingUser) return <SwitchUser />;
            if (currentUser) return <MainLayout />;
            return <SharedLayout />;
        }
        
        // Standard Mode Logic
        if (!isAppUnlocked && users.length > 0) return <AppLockScreen />;
        if (!currentUser || isSwitchingUser) return <SwitchUser />;
        return <MainLayout />;
    };

    return (
        <ErrorBoundary>
            <div id="app-container" data-theme={activeThemeId}>
                {renderContent()}
                {showOnboarding && <OnboardingWizard />}
                <NotificationContainer />
                {isUpdateAvailable && !isRecording && (
                    <UpdateAvailable onUpdateClick={installUpdate} onDismiss={() => setUpdateAvailable(null)} />
                )}
                {settings.developerMode.enabled && currentUser?.role === Role.DonegeonMaster && <BugReporter />}
                {activeGame && <GameOverlay gameId={activeGame} onClose={() => setActiveGame(null)} />}
                <AnimatePresence>
                    {isScreenDimmed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 - (settings.sharedMode.autoDimBrightness || 0.7) }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black pointer-events-none z-[9998]"
                        />
                    )}
                </AnimatePresence>
            </div>
        </ErrorBoundary>
    );
};

export default App;