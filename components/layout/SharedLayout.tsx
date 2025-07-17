import React, { useState } from 'react';
import SharedHeader from './SharedHeader';
import SharedCalendarPage from '../pages/SharedCalendarPage';

const SharedLayout: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <div className="flex h-screen" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', color: 'hsl(var(--color-text-primary))' }}>
            <div className="flex-1 flex flex-col overflow-hidden">
                <SharedHeader currentDate={currentDate} setCurrentDate={setCurrentDate} />
                <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--color-bg-tertiary))' }}>
                    <SharedCalendarPage currentDate={currentDate} />
                </main>
            </div>
        </div>
    );
};

export default SharedLayout;