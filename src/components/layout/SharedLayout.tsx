import React, { useState } from 'react';
import SharedHeader from './SharedHeader';
import SharedCalendarPage from '../pages/SharedCalendarPage';
import SharedLeaderboardPage from '../pages/SharedLeaderboardPage';

export type SharedView = 'calendar' | 'leaderboard';

const SharedLayout: React.FC = () => {
    const [activeView, setActiveView] = useState<SharedView>('calendar');

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