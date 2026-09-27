import React, { useState, useMemo, useEffect } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useUIDispatch, useUIState } from '../../context/UIContext';
import { QuestType, QuestCompletionStatus, PrivilegeItem, Quest } from '../../types';
import { isQuestScheduledForDay, toYMD } from '../../utils/conditions';
import { Sparkles, Lock, Unlock, Play, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyPrivilegesWidgetProps {
    onSelectQuest?: (quest: Quest) => void;
}

export const DailyPrivilegesWidget: React.FC<DailyPrivilegesWidgetProps> = ({ onSelectQuest }) => {
    const { currentUser } = useAuthState();
    const { settings } = useSystemState();
    const { quests, questCompletions } = useQuestsState();
    const { startTimer } = useUIDispatch();
    const { activeTimer } = useUIState();

    const [activePrivilegeTimer, setActivePrivilegeTimer] = useState<{
        privilege: PrivilegeItem;
        endTime: number;
        durationSeconds: number;
        isPaused: boolean;
        remainingSeconds: number;
    } | null>(null);

    const [isPendingListOpen, setIsPendingListOpen] = useState(false);

    // Active privileges configured in settings
    const userPrivileges = useMemo(() => {
        if (!currentUser) return [];
        const allPrivileges: PrivilegeItem[] = settings.privileges || [];
        return allPrivileges.filter(p => {
            if (!p.isActive) return false;
            if (!p.assignedUserIds || p.assignedUserIds.length === 0) return true;
            return p.assignedUserIds.includes(currentUser.id);
        });
    }, [settings.privileges, currentUser]);

    // Calculate today's duties for current user
    const dutyStats = useMemo(() => {
        if (!currentUser) return { totalDuties: 0, completedDuties: 0, pendingDuties: [], percent: 100 };

        const now = new Date();
        const todayYMD = toYMD(now);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayEnd = todayStart + 86400000;

        // Scheduled duties for user today
        const scheduledDuties = quests.filter(q => {
            if (!q.isActive || q.type !== QuestType.Duty) return false;
            if (q.assignedUserIds && q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) {
                return false;
            }
            return isQuestScheduledForDay(q, now);
        });

        const userCompletionsToday = questCompletions.filter(c => {
            if (c.userId !== currentUser.id) return false;
            const compTime = new Date(c.completedAt).getTime();
            return compTime >= todayStart && compTime < todayEnd && c.status === QuestCompletionStatus.Approved;
        });

        const completedQuestIds = new Set(userCompletionsToday.map(c => c.questId));
        const completedDuties = scheduledDuties.filter(d => completedQuestIds.has(d.id));
        const pendingDuties = scheduledDuties.filter(d => !completedQuestIds.has(d.id));

        const percent = scheduledDuties.length > 0
            ? Math.round((completedDuties.length / scheduledDuties.length) * 100)
            : 100;

        return {
            totalDuties: scheduledDuties.length,
            completedDuties: completedDuties.length,
            pendingDuties,
            percent: Math.min(100, percent)
        };
    }, [currentUser, quests, questCompletions]);

    // Timer countdown effect for active privilege
    useEffect(() => {
        if (!activePrivilegeTimer || activePrivilegeTimer.isPaused) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((activePrivilegeTimer.endTime - now) / 1000));
            if (remaining <= 0) {
                setActivePrivilegeTimer(prev => prev ? { ...prev, remainingSeconds: 0 } : null);
                clearInterval(interval);
            } else {
                setActivePrivilegeTimer(prev => prev ? { ...prev, remainingSeconds: remaining } : null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activePrivilegeTimer]);

    const handleStartPrivilegeTimer = (privilege: PrivilegeItem) => {
        const durationMins = privilege.timerDurationMinutes || 45;
        const durationSecs = durationMins * 60;
        const endTime = Date.now() + durationSecs * 1000;
        setActivePrivilegeTimer({
            privilege,
            endTime,
            durationSeconds: durationSecs,
            isPaused: false,
            remainingSeconds: durationSecs,
        });
    };

    const formatTimer = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (userPrivileges.length === 0) return null;

    const allUnlocked = dutyStats.percent >= 100;

    return (
        <Card className="overflow-hidden border-2 border-emerald-600/40 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-850 shadow-xl">
            {/* Header with Title and Daily Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">✨</span>
                    <div>
                        <h3 className="font-medieval text-lg text-amber-300 font-bold flex items-center gap-2">
                            Daily Privileges & Unlocks
                        </h3>
                        <p className="text-xs text-stone-400">
                            Complete your daily duties to unlock your daily privileges
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {allUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Unlock className="w-3.5 h-3.5" />
                            All Privileges Unlocked!
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Lock className="w-3.5 h-3.5" />
                            {dutyStats.pendingDuties.length} {dutyStats.pendingDuties.length === 1 ? 'Duty' : 'Duties'} Remaining
                        </span>
                    )}
                </div>
            </div>

            {/* Daily Duties Progress Bar */}
            <div className="py-3">
                <div className="flex items-center justify-between text-xs font-medium text-stone-300 mb-1.5">
                    <span>Today's Daily Duty Progress</span>
                    <span className="font-mono text-emerald-400">
                        {dutyStats.completedDuties} / {dutyStats.totalDuties} ({dutyStats.percent}%)
                    </span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${dutyStats.percent}%` }}
                    />
                </div>

                {/* Remaining Duties Quick Link */}
                {!allUnlocked && dutyStats.pendingDuties.length > 0 && (
                    <div className="mt-2 text-xs">
                        <button
                            onClick={() => setIsPendingListOpen(prev => !prev)}
                            className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        >
                            <span>{isPendingListOpen ? '▼ Hide' : '▶ Show'} remaining duties to finish</span>
                        </button>

                        <AnimatePresence>
                            {isPendingListOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-2 space-y-1.5"
                                >
                                    {dutyStats.pendingDuties.map(duty => (
                                        <div
                                            key={duty.id}
                                            onClick={() => onSelectQuest && onSelectQuest(duty)}
                                            className="flex items-center justify-between p-2 rounded-lg bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 text-stone-200 cursor-pointer transition-colors"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span>{duty.icon}</span>
                                                <span className="font-medium text-xs">{duty.title}</span>
                                            </span>
                                            <span className="text-[10px] text-amber-400 font-mono flex-shrink-0">
                                                Pending
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Active Privilege Timer Overlay (if running) */}
            {activePrivilegeTimer && (
                <div className="my-3 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 shadow-lg text-center backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-mono tracking-wider text-emerald-300 font-bold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                            Privilege Session Active: {activePrivilegeTimer.privilege.title}
                        </span>
                        <button
                            onClick={() => setActivePrivilegeTimer(null)}
                            className="text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                        >
                            ✕ Dismiss
                        </button>
                    </div>

                    <div className="font-mono text-4xl sm:text-5xl font-black text-amber-300 py-1 drop-shadow-md">
                        {formatTimer(activePrivilegeTimer.remainingSeconds)}
                    </div>

                    {activePrivilegeTimer.remainingSeconds === 0 ? (
                        <p className="text-xs text-amber-400 font-bold mt-2 animate-bounce">
                            🎉 Time is up! Great job enjoying your privilege responsibly!
                        </p>
                    ) : (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setActivePrivilegeTimer(p => p ? {
                                    ...p,
                                    isPaused: !p.isPaused,
                                    endTime: p.isPaused ? Date.now() + p.remainingSeconds * 1000 : p.endTime
                                } : null)}
                            >
                                {activePrivilegeTimer.isPaused ? '▶ Resume' : '⏸ Pause'}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActivePrivilegeTimer(null)}
                            >
                                Stop Session
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Privilege Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {userPrivileges.map(privilege => {
                    const requiredPercent = privilege.minDutyPercentage ?? 100;
                    const isUnlocked = dutyStats.percent >= requiredPercent;

                    return (
                        <div
                            key={privilege.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                isUnlocked
                                    ? 'bg-stone-850/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                                    : 'bg-stone-900/60 border-stone-800 opacity-80'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-3xl p-2 rounded-xl bg-stone-800/80 border border-stone-700/50 flex-shrink-0">
                                    {privilege.icon}
                                </span>
                                <div className="min-w-0 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-stone-200 text-sm truncate">
                                            {privilege.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                                        {privilege.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                                {isUnlocked ? (
                                    <>
                                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Unlocked
                                        </span>
                                        {privilege.type === 'timer' ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleStartPrivilegeTimer(privilege)}
                                                className="!bg-emerald-600 hover:!bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-white" />
                                                Start {privilege.timerDurationMinutes || 45}m Timer
                                            </Button>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
                                                Ready to enjoy
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1">
                                            <Lock className="w-3.5 h-3.5" />
                                            Locked
                                        </span>
                                        <span className="text-[11px] font-mono text-stone-400">
                                            Needs {requiredPercent}% Duties
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
