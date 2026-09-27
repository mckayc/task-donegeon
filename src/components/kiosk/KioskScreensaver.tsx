import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Quest, QuestType, QuestCompletionStatus, RewardCategory } from '../../types';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useUIState } from '../../context/UIContext';
import { useEconomyState } from '../../context/EconomyContext';
import Avatar from '../user-interface/Avatar';
import { toYMD } from '../../utils/quests';
import { isQuestScheduledForDay } from '../../utils/conditions';
import { Sparkles, Moon, Clock, Trophy, Flame, Zap, ShieldCheck } from 'lucide-react';

interface KioskScreensaverProps {
    onWake: () => void;
    onSelectUser: (user: User) => void;
}

export const KioskScreensaver: React.FC<KioskScreensaverProps> = ({ onWake, onSelectUser }) => {
    const { settings } = useSystemState();
    const { users } = useAuthState();
    const { quests, questCompletions } = useQuestsState();
    const { activeTimer } = useUIState();
    const { rewardTypes } = useEconomyState();

    const [currentTime, setCurrentTime] = useState(new Date());
    // Burn-in prevention offset (drifts subtly every 45s)
    const [driftOffset, setDriftOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timeInterval);
    }, []);

    // Drift offset update to prevent screen burn-in on always-on wall tablets
    useEffect(() => {
        const driftInterval = setInterval(() => {
            const randomX = Math.floor(Math.random() * 16) - 8; // -8px to +8px
            const randomY = Math.floor(Math.random() * 16) - 8;
            setDriftOffset({ x: randomX, y: randomY });
        }, 45000);
        return () => clearInterval(driftInterval);
    }, []);

    // Wake on any keypress
    useEffect(() => {
        const handleKeyDown = () => onWake();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onWake]);

    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map((u: User) => [u.id, u]));
        const userIdsToShow = settings.sharedMode.userIds || [];
        const filtered = userIdsToShow.map((id: string) => userMap.get(id)).filter((u): u is User => !!u);
        return filtered.length > 0 ? filtered : users;
    }, [users, settings.sharedMode.userIds]);

    // Calculate today's realm accomplishments
    const realmStats = useMemo(() => {
        const todayYMD = toYMD(currentTime);
        const todayStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()).getTime();
        const todayEnd = todayStart + 86400000;

        let totalScheduledDuties = 0;
        let totalCompletedDuties = 0;
        let totalGoldEarned = 0;
        let totalXpEarned = 0;

        const userDutyProgress: {
            user: User;
            scheduled: number;
            completed: number;
            percent: number;
        }[] = [];

        sharedUsers.forEach(user => {
            const userCompletionsToday = questCompletions.filter(c => {
                if (c.userId !== user.id) return false;
                const compTime = new Date(c.completedAt).getTime();
                return compTime >= todayStart && compTime < todayEnd && c.status === QuestCompletionStatus.Approved;
            });

            // Calculate XP/Gold earned today
            userCompletionsToday.forEach(c => {
                const quest = quests.find(q => q.id === c.questId);
                if (quest && quest.rewards) {
                    quest.rewards.forEach(r => {
                        const rt = rewardTypes.find(t => t.id === r.rewardTypeId);
                        if (rt?.category === RewardCategory.Currency) {
                            totalGoldEarned += r.amount;
                        } else if (rt?.category === RewardCategory.XP) {
                            totalXpEarned += r.amount;
                        }
                    });
                }
            });

            // Count scheduled duties today
            const userDuties = quests.filter(q => {
                if (!q.isActive || q.type !== QuestType.Duty) return false;
                if (!isQuestScheduledForDay(q, currentTime)) return false;
                if (q.assignedUserIds && q.assignedUserIds.length > 0) {
                    return q.assignedUserIds.includes(user.id);
                }
                return true;
            });

            const completedQuestIds = new Set(userCompletionsToday.map(c => c.questId));
            const completedCount = userDuties.filter(d => completedQuestIds.has(d.id)).length;
            const scheduledCount = userDuties.length;

            totalScheduledDuties += scheduledCount;
            totalCompletedDuties += completedCount;

            const percent = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 100;
            userDutyProgress.push({
                user,
                scheduled: scheduledCount,
                completed: completedCount,
                percent: Math.min(100, percent)
            });
        });

        const overallPercent = totalScheduledDuties > 0
            ? Math.round((totalCompletedDuties / totalScheduledDuties) * 100)
            : 100;

        return {
            totalScheduledDuties,
            totalCompletedDuties,
            overallPercent: Math.min(100, overallPercent),
            totalGoldEarned,
            totalXpEarned,
            userDutyProgress,
            allDone: totalScheduledDuties > 0 && totalCompletedDuties >= totalScheduledDuties
        };
    }, [currentTime, sharedUsers, quests, questCompletions]);

    // Format active timer if running
    const activeTimerInfo = useMemo(() => {
        if (!activeTimer) return null;
        const quest = quests.find(q => q.id === activeTimer.questId);
        const user = users.find(u => u.id === activeTimer.userId);
        if (!quest || !user) return null;

        const isCountdown = quest.timerConfig?.mode === 'countdown';
        const duration = quest.timerConfig?.durationSeconds || 0;
        const elapsed = (Date.now() - activeTimer.startTime + activeTimer.pausedTime) / 1000;
        const remaining = isCountdown ? Math.max(0, duration - elapsed) : elapsed;

        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        return {
            quest,
            user,
            formatted,
            isPaused: activeTimer.isPaused
        };
    }, [activeTimer, quests, users, currentTime]);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedSeconds = currentTime.getSeconds().toString().padStart(2, '0');
    const formattedDate = currentTime.toLocaleDateString('default', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={onWake}
            className="fixed inset-0 z-[9990] bg-stone-950 text-stone-100 flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none cursor-pointer"
            style={{
                transform: `translate(${driftOffset.x}px, ${driftOffset.y}px)`,
                transition: 'transform 3s ease-in-out'
            }}
        >
            {/* Ambient Background Glows & Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-950/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-950/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stone-900/40 rounded-full blur-3xl" />
            </div>

            {/* Top Bar: Castle Brand & Status */}
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏰</span>
                    <div>
                        <h2 className="font-medieval text-xl text-amber-400 font-bold tracking-wider">
                            {settings.terminology.appName || 'Task Donegeon'}
                        </h2>
                        <span className="text-xs text-stone-400 uppercase tracking-widest font-mono">
                            Realm Ambient Display
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-stone-400 bg-stone-900/60 border border-stone-800 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        Live Realm
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-amber-300" />
                        Screensaver
                    </span>
                </div>
            </div>

            {/* Center Area: Big Ambient Clock & Realm Summary */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4 text-center">
                {/* Clock */}
                <div className="flex items-baseline justify-center font-mono font-extrabold tracking-tight">
                    <span className="text-7xl sm:text-8xl md:text-9xl text-stone-100 drop-shadow-[0_4px_24px_rgba(255,255,255,0.1)]">
                        {formattedTime}
                    </span>
                    <span className="text-2xl sm:text-3xl md:text-4xl text-emerald-400/80 ml-2 font-light">
                        :{formattedSeconds}
                    </span>
                </div>

                {/* Date */}
                <p className="mt-2 text-lg sm:text-2xl text-amber-200/90 font-medieval tracking-wide">
                    {formattedDate}
                </p>

                {/* Active Quest Timer Banner (If timer is running) */}
                {activeTimerInfo && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl shadow-lg backdrop-blur-md"
                    >
                        <Clock className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span className="text-sm font-medium text-emerald-200">
                            Active Quest Timer ({activeTimerInfo.user.gameName}):
                        </span>
                        <span className="font-mono text-xl font-bold text-amber-300">
                            {activeTimerInfo.formatted}
                        </span>
                        {activeTimerInfo.isPaused && (
                            <span className="text-xs bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded">
                                Paused
                            </span>
                        )}
                    </motion.div>
                )}

                {/* All Done Celebration Badge */}
                {realmStats.allDone && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-sm font-semibold tracking-wide"
                    >
                        <Trophy className="w-4 h-4 text-amber-400" />
                        All Daily Realm Duties Conquered Today!
                    </motion.div>
                )}

                {/* Realm Accomplishments Pill Bar */}
                {settings.sharedMode.screensaverShowStats !== false && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm">
                        <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-stone-300">
                                Duties Done: <strong className="text-emerald-400">{realmStats.totalCompletedDuties}</strong> / {realmStats.totalScheduledDuties}
                            </span>
                            <span className="text-xs font-mono text-stone-500">
                                ({realmStats.overallPercent}%)
                            </span>
                        </div>

                        {realmStats.totalGoldEarned > 0 && (
                            <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <span className="text-amber-400">💰</span>
                                <span className="text-stone-300">
                                    Gold Earned: <strong className="text-amber-300">+{realmStats.totalGoldEarned}</strong>
                                </span>
                            </div>
                        )}

                        {realmStats.totalXpEarned > 0 && (
                            <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800/80 px-4 py-2 rounded-xl backdrop-blur-sm">
                                <Zap className="w-4 h-4 text-purple-400" />
                                <span className="text-stone-300">
                                    XP Earned: <strong className="text-purple-300">+{realmStats.totalXpEarned}</strong>
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Section: Explorers Roster & Wake Prompt */}
            <div className="relative z-10 flex flex-col gap-4">
                {/* Explorer Quick-Cards Carousel/Grid */}
                {settings.sharedMode.screensaverShowUsers !== false && (
                    <div className="flex items-center justify-center gap-3 sm:gap-5 overflow-x-auto py-2 scrollbar-hide">
                        {realmStats.userDutyProgress.map(({ user, scheduled, completed, percent }) => (
                            <div
                                key={user.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectUser(user);
                                }}
                                className="group relative flex items-center gap-3 bg-stone-900/70 hover:bg-stone-850 border border-stone-800/80 hover:border-emerald-500/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 transition-all transform hover:-translate-y-1 shadow-lg backdrop-blur-sm cursor-pointer flex-shrink-0"
                                title={`Tap to sign in as ${user.gameName}`}
                            >
                                <div className="relative">
                                    <Avatar
                                        user={user}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-stone-700 group-hover:border-amber-400 transition-colors"
                                    />
                                    {percent === 100 && scheduled > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                                            ✓
                                        </span>
                                    )}
                                </div>

                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs sm:text-sm text-stone-200 group-hover:text-amber-300 transition-colors">
                                            {user.gameName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-16 sm:w-20 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono text-stone-400">
                                            {completed}/{scheduled}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wake Action Prompt */}
                <div className="flex items-center justify-center gap-2 text-stone-400 text-xs sm:text-sm animate-pulse pt-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Touch anywhere or tap an Explorer to unlock the board</span>
                </div>
            </div>
        </motion.div>
    );
};
