import React, { useState, useEffect, useRef, useCallback } from 'react';
import SharedHeader from './SharedHeader';
import SharedCalendarPage from '../pages/SharedCalendarPage';
import SharedLeaderboardPage from '../pages/SharedLeaderboardPage';
import { useSystemState } from '../../context/SystemContext';
import { useUIDispatch } from '../../context/UIContext';

export type SharedView = 'calendar' | 'leaderboard';

// Type definition for the Screen Wake Lock API's sentinel object.
// This is needed because the type might not be in the default TS lib.
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

const SharedLayout: React.FC = () => {
    const { settings } = useSystemState();
    const { setScreenDimmed } = useUIDispatch();
    const [activeView, setActiveView] = useState<SharedView>('calendar');
    const wakeLock = useRef<WakeLockSentinel | null>(null);

    const inactivityTimerRef = useRef<number | null>(null);

    const { autoDim, autoDimStartTime, autoDimStopTime, autoDimInactivitySeconds } = settings.sharedMode;

    const isWithinDimmingTime = useCallback(() => {
        if (!autoDimStartTime || !autoDimStopTime) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startH, startM] = autoDimStartTime.split(':').map(Number);
        const startTime = startH * 60 + startM;
        
        const [stopH, stopM] = autoDimStopTime.split(':').map(Number);
        const stopTime = stopH * 60 + stopM;
        
        // Handle overnight case (e.g., 21:00 to 06:00)
        if (startTime > stopTime) {
            return currentTime >= startTime || currentTime < stopTime;
        } else {
            return currentTime >= startTime && currentTime < stopTime;
        }
    }, [autoDimStartTime, autoDimStopTime]);

    const resetDimTimer = useCallback(() => {
        setScreenDimmed(false);
        
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        if (autoDim && isWithinDimmingTime()) {
            inactivityTimerRef.current = window.setTimeout(() => {
                setScreenDimmed(true);
            }, (autoDimInactivitySeconds || 30) * 1000);
        }
    }, [autoDim, isWithinDimmingTime, autoDimInactivitySeconds, setScreenDimmed]);

    useEffect(() => {
        if (autoDim) {
            const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, resetDimTimer));
            
            resetDimTimer(); // Start the timer initially
            
            const timeCheckInterval = setInterval(resetDimTimer, 60000);

            return () => {
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                clearInterval(timeCheckInterval);
                events.forEach(event => window.removeEventListener(event, resetDimTimer));
                setScreenDimmed(false); // Ensure screen isn't left dimmed
            };
        }
    }, [autoDim, resetDimTimer, setScreenDimmed]);


    // --- Screen Wake Lock API Implementation ---
    useEffect(() => {
        const acquireWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // The type for navigator.wakeLock is not standard yet.
                    const newLock = await (navigator as any).wakeLock.request('screen');
                    console.log('Screen Wake Lock is active.');
                    
                    newLock.addEventListener('release', () => {
                        console.log('Screen Wake Lock was released by the system.');
                         if (wakeLock.current === newLock) {
                           wakeLock.current = null;
                        }
                    });
                    wakeLock.current = newLock;
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                    wakeLock.current = null;
                }
            } else {
                console.log('Screen Wake Lock API not supported on this browser.');
            }
        };

        const handleVisibilityChange = () => {
            if (wakeLock.current === null && document.visibilityState === 'visible') {
                acquireWakeLock();
            }
        };

        acquireWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function to release the lock when the component unmounts
        return () => {
            if (wakeLock.current !== null) {
                wakeLock.current.release();
                console.log('Screen Wake Lock released.');
                wakeLock.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);


    return (
        <div className="relative h-screen w-screen overflow-hidden" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
            <SharedHeader activeView={activeView} setActiveView={setActiveView} />
            <main className="absolute top-20 left-0 right-0 bottom-0" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                {activeView === 'calendar' ? <SharedCalendarPage /> : <SharedLeaderboardPage />}
            </main>
        </div>
    );
};

export default SharedLayout;