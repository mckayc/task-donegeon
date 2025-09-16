import React, { useState, useEffect, useMemo } from 'react';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useAuthState } from '../../context/AuthContext';

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const LiveTimerWidget: React.FC = () => {
    const { activeTimer } = useUIState();
    const { setTimedQuestDetail } = useUIDispatch();
    const { quests } = useQuestsState();
    const { currentUser } = useAuthState();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const activeQuest = useMemo(() => {
        if (!activeTimer) return null;
        return quests.find(q => q.id === activeTimer.questId);
    }, [activeTimer, quests]);

    useEffect(() => {
        if (!activeTimer || activeTimer.isPaused) {
            return;
        }

        const calculateElapsed = () => {
            const now = Date.now();
            const elapsed = Math.round((now - activeTimer.startTime + activeTimer.pausedTime) / 1000);
            setElapsedSeconds(elapsed);
        };

        calculateElapsed(); // Initial calculation
        const interval = setInterval(calculateElapsed, 1000);
        return () => clearInterval(interval);

    }, [activeTimer]);

    if (!activeTimer || !activeQuest || currentUser?.id !== activeTimer.userId) {
        return null;
    }

    const isCountdown = activeQuest.timerConfig?.mode === 'countdown';
    const duration = activeQuest.timerConfig?.durationSeconds || 0;
    const timeToShow = isCountdown ? Math.max(0, duration - elapsedSeconds) : elapsedSeconds;

    return (
        <button
            onClick={() => setTimedQuestDetail(activeQuest)}
            className="flex items-center gap-2 bg-emerald-800/50 px-3 py-1.5 rounded-full border border-emerald-700/60 hover:bg-emerald-700/60 transition-colors mx-2"
        >
            <span className="text-lg">{activeQuest.icon}</span>
            <span className="font-semibold font-mono text-emerald-300">
                {formatTime(timeToShow)}
            </span>
            {activeTimer.isPaused && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>}
        </button>
    );
};

export default LiveTimerWidget;