import React, { useState, useEffect, useRef } from 'react';
import SharedHeader from './SharedHeader';
import SharedCalendarPage from '../pages/SharedCalendarPage';
import SharedLeaderboardPage from '../pages/SharedLeaderboardPage';

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
    const [activeView, setActiveView] = useState<SharedView>('calendar');
    const wakeLock = useRef<WakeLockSentinel | null>(null);

    // --- Screen Wake Lock API Implementation ---
    useEffect(() => {
        const acquireWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock.current = await (navigator as any).wakeLock.request('screen');
                    console.log('Screen Wake Lock is active.');
                    
                    wakeLock.current.addEventListener('release', () => {
                        console.log('Screen Wake Lock was released by the system.');
                        wakeLock.current = null;
                    });
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                }
            } else {
                console.log('Screen Wake Lock API not supported on this browser.');
            }
        };

        const handleVisibilityChange = () => {
            if (wakeLock.current !== null && document.visibilityState === 'visible') {
                console.log('Page is visible again, re-acquiring wake lock.');
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
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);


    return (
        <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
            <div className="flex-1 flex flex-col overflow-hidden">
                <SharedHeader activeView={activeView} setActiveView={setActiveView} />
                <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                    {activeView === 'calendar' ? <SharedCalendarPage /> : <SharedLeaderboardPage />}
                </main>
            </div>
        </div>
    );
};

export default SharedLayout;