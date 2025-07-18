import React, { useState, useMemo, useEffect } from 'react';
import { useUIState } from '../../context/AppContext';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { syncStatus, syncError } = useUIState();

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const statusConfig = useMemo(() => ({
        idle: { borderColor: 'border-stone-700/60', pulse: false, title: 'Ready.' },
        syncing: { borderColor: 'border-blue-500', pulse: true, title: 'Syncing data...' },
        success: { borderColor: 'border-green-500', pulse: false, title: 'Data is up to date.' },
        error: { borderColor: 'border-red-500', pulse: false, title: `Sync Error: ${syncError || 'An unknown error occurred.'}` },
    }), [syncError]);

    const currentStatus = statusConfig[syncStatus];

    return (
        <div
            title={currentStatus.title}
            className={`hidden lg:block bg-stone-800/50 px-4 py-2 rounded-full border-2 font-mono text-lg font-semibold text-stone-300 flex items-center gap-3 transition-colors duration-500 ${currentStatus.borderColor} ${currentStatus.pulse ? 'animate-pulse' : ''}`}
        >
            <span>{time.toLocaleTimeString()}</span>
        </div>
    );
};

export default Clock;
