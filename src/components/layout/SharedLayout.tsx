import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SharedHeader from './SharedHeader';
import SharedCalendarPage from '../pages/SharedCalendarPage';
import SharedLeaderboardPage from '../pages/SharedLeaderboardPage';
import { KioskScreensaver } from '../kiosk/KioskScreensaver';
import { useSystemState } from '../../context/SystemContext';
import { useUIDispatch } from '../../context/UIContext';
import { useAuthDispatch } from '../../context/AuthContext';
import { User } from '../../types';

export type SharedView = 'calendar' | 'leaderboard';

interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

const SharedLayout: React.FC = () => {
    const { settings } = useSystemState();
    const { setScreenDimmed } = useUIDispatch();
    const { setTargetedUserForLogin, setIsSwitchingUser } = useAuthDispatch();
    const [activeView, setActiveView] = useState<SharedView>('calendar');
    const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
    const [isScreensaverActive, setIsScreensaverActive] = useState<boolean>(false);

    const wakeLock = useRef<WakeLockSentinel | null>(null);
    const inactivityDimTimerRef = useRef<number | null>(null);
    const screensaverTimerRef = useRef<number | null>(null);

    const {
        autoDim,
        autoDimStartTime,
        autoDimStopTime,
        autoDimInactivitySeconds,
        screensaverEnabled = true,
        screensaverInactivityMinutes = 3,
    } = settings.sharedMode;

    const isWithinDimmingTime = useCallback(() => {
        if (!autoDimStartTime || !autoDimStopTime) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startH, startM] = autoDimStartTime.split(':').map(Number);
        const startTime = startH * 60 + startM;
        
        const [stopH, stopM] = autoDimStopTime.split(':').map(Number);
        const stopTime = stopH * 60 + stopM;
        
        if (startTime > stopTime) {
            return currentTime >= startTime || currentTime < stopTime;
        } else {
            return currentTime >= startTime && currentTime < stopTime;
        }
    }, [autoDimStartTime, autoDimStopTime]);

    const resetDimTimer = useCallback(() => {
        setScreenDimmed(false);
        
        if (inactivityDimTimerRef.current) {
            clearTimeout(inactivityDimTimerRef.current);
        }

        if (autoDim && isWithinDimmingTime()) {
            inactivityDimTimerRef.current = window.setTimeout(() => {
                setScreenDimmed(true);
            }, (autoDimInactivitySeconds || 30) * 1000);
        }
    }, [autoDim, isWithinDimmingTime, autoDimInactivitySeconds, setScreenDimmed]);

    // Screensaver timer management
    const resetScreensaverTimer = useCallback(() => {
        if (screensaverTimerRef.current) {
            clearTimeout(screensaverTimerRef.current);
        }

        if (screensaverEnabled) {
            const timeoutMs = (screensaverInactivityMinutes || 3) * 60 * 1000;
            screensaverTimerRef.current = window.setTimeout(() => {
                setIsScreensaverActive(true);
            }, timeoutMs);
        }
    }, [screensaverEnabled, screensaverInactivityMinutes]);

    const handleWakeScreensaver = useCallback(() => {
        setIsScreensaverActive(false);
        resetScreensaverTimer();
        resetDimTimer();
    }, [resetScreensaverTimer, resetDimTimer]);

    const handleScreensaverSelectUser = useCallback((user: User) => {
        setIsScreensaverActive(false);
        resetScreensaverTimer();
        resetDimTimer();
        setTargetedUserForLogin(user);
        setIsSwitchingUser(true);
    }, [resetScreensaverTimer, resetDimTimer, setTargetedUserForLogin, setIsSwitchingUser]);

    // Listen for user activity to manage dimming and screensaver
    useEffect(() => {
        const handleActivity = () => {
            if (!isScreensaverActive) {
                resetScreensaverTimer();
            }
            resetDimTimer();
        };

        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, handleActivity));

        resetScreensaverTimer();
        resetDimTimer();

        const timeCheckInterval = setInterval(resetDimTimer, 60000);

        return () => {
            if (inactivityDimTimerRef.current) clearTimeout(inactivityDimTimerRef.current);
            if (screensaverTimerRef.current) clearTimeout(screensaverTimerRef.current);
            clearInterval(timeCheckInterval);
            events.forEach(event => window.removeEventListener(event, handleActivity));
            setScreenDimmed(false);
        };
    }, [resetDimTimer, resetScreensaverTimer, setScreenDimmed, isScreensaverActive]);

    // --- Screen Wake Lock API Implementation ---
    useEffect(() => {
        const acquireWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    const newLock = await (navigator as any).wakeLock.request('screen');
                    setIsWakeLockActive(true);
                    console.log('Screen Wake Lock is active.');
                    
                    newLock.addEventListener('release', () => {
                        console.log('Screen Wake Lock was released by the system.');
                        if (wakeLock.current === newLock) {
                            wakeLock.current = null;
                            setIsWakeLockActive(false);
                        }
                    });
                    wakeLock.current = newLock;
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                    wakeLock.current = null;
                    setIsWakeLockActive(false);
                }
            } else {
                console.log('Screen Wake Lock API not supported on this browser.');
                setIsWakeLockActive(false);
            }
        };

        const handleVisibilityChange = () => {
            if (wakeLock.current === null && document.visibilityState === 'visible') {
                acquireWakeLock();
            }
        };

        acquireWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLock.current !== null) {
                wakeLock.current.release();
                console.log('Screen Wake Lock released.');
                wakeLock.current = null;
                setIsWakeLockActive(false);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <div className="relative h-screen w-screen overflow-hidden" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
            <SharedHeader
                activeView={activeView}
                setActiveView={setActiveView}
                onTriggerScreensaver={() => setIsScreensaverActive(true)}
                isWakeLockActive={isWakeLockActive}
            />
            <main className="absolute top-20 left-0 right-0 bottom-0" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                {activeView === 'calendar' ? <SharedCalendarPage /> : <SharedLeaderboardPage />}
            </main>

            {/* Ambient Screensaver Overlay */}
            <AnimatePresence>
                {isScreensaverActive && (
                    <KioskScreensaver
                        onWake={handleWakeScreensaver}
                        onSelectUser={handleScreensaverSelectUser}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SharedLayout;
