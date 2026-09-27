import React, { useMemo } from 'react';
import Card from '../user-interface/Card';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { QuestType, QuestCompletionStatus, UserAllowanceConfig } from '../../types';
import { isQuestScheduledForDay, toYMD } from '../../utils/conditions';
import { DollarSign, PiggyBank, Calendar, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';

export const AllowanceWidget: React.FC = () => {
    const { currentUser } = useAuthState();
    const { settings } = useSystemState();
    const { quests, questCompletions } = useQuestsState();
    const { rewardTypes } = useEconomyState();

    const allowanceConfig = useMemo<UserAllowanceConfig | null>(() => {
        if (!currentUser || !settings.allowance?.enabled) return null;
        return settings.allowance.userConfigs.find(c => c.userId === currentUser.id && c.enabled) || null;
    }, [currentUser, settings.allowance]);

    const currencyName = useMemo(() => {
        if (!allowanceConfig) return '$';
        const rt = rewardTypes.find(r => r.id === allowanceConfig.currencyRewardTypeId);
        return rt ? rt.name : 'Dollars';
    }, [allowanceConfig, rewardTypes]);

    // Calculate current week's duties and completion
    const weeklyStats = useMemo(() => {
        if (!currentUser || !allowanceConfig) {
            return { totalScheduled: 0, totalCompleted: 0, percent: 0, projectedAmount: 0, daysRemaining: 0 };
        }

        const now = new Date();
        // Calculate beginning of this week (Sunday)
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let totalScheduled = 0;
        let totalCompleted = 0;

        // Iterate through all 7 days of the week to count scheduled duties
        for (let d = 0; d < 7; d++) {
            const checkDay = new Date(startOfWeek);
            checkDay.setDate(startOfWeek.getDate() + d);
            const checkDayYMD = toYMD(checkDay);

            const dutiesOnDay = quests.filter(q => {
                if (!q.isActive || q.type !== QuestType.Duty) return false;
                if (q.assignedUserIds && q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) {
                    return false;
                }
                return isQuestScheduledForDay(q, checkDay);
            });

            totalScheduled += dutiesOnDay.length;

            // Check completions on that day
            dutiesOnDay.forEach(duty => {
                const isCompleted = questCompletions.some(c =>
                    c.userId === currentUser.id &&
                    c.questId === duty.id &&
                    c.status === QuestCompletionStatus.Approved &&
                    toYMD(new Date(c.completedAt)) === checkDayYMD
                );
                if (isCompleted) {
                    totalCompleted += 1;
                }
            });
        }

        const percent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 100;

        // Calculate projected allowance
        let projectedAmount = 0;
        if (allowanceConfig.calculationType === 'threshold_all_or_nothing') {
            projectedAmount = percent >= allowanceConfig.minThresholdPercent ? allowanceConfig.weeklyAmount : 0;
        } else {
            // Pro-rated by percent
            projectedAmount = Math.round((allowanceConfig.weeklyAmount * (percent / 100)) * 100) / 100;
        }

        const daysRemaining = 6 - dayOfWeek;

        return {
            totalScheduled,
            totalCompleted,
            percent: Math.min(100, percent),
            projectedAmount,
            daysRemaining
        };
    }, [currentUser, allowanceConfig, quests, questCompletions]);

    if (!allowanceConfig) return null;

    return (
        <Card className="border border-stone-700/80 bg-stone-900/90 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">💰</span>
                    <div>
                        <h3 className="font-medieval text-base text-amber-300 font-bold">
                            Weekly Allowance Tracker
                        </h3>
                        <p className="text-xs text-stone-400">
                            Earned by completing scheduled daily duties each week
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs text-stone-400">Target</span>
                    <p className="font-mono font-bold text-amber-300 text-sm">
                        ${allowanceConfig.weeklyAmount.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="pt-3 space-y-3">
                {/* Projected Allowance Hero Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-stone-850 border border-stone-800">
                    <div>
                        <span className="text-xs text-stone-400 uppercase font-mono">Pace This Week</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-mono font-black text-emerald-400">
                                ${weeklyStats.projectedAmount.toFixed(2)}
                            </span>
                            <span className="text-xs text-stone-400 font-mono">
                                / ${allowanceConfig.weeklyAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-xs text-stone-400">Destination</span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-stone-200 mt-0.5">
                            {allowanceConfig.payoutDestination === 'vault' ? (
                                <>
                                    <PiggyBank className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Enchanted Vault</span>
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Personal Purse</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Duty Completion Progress */}
                <div>
                    <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Weekly Duties Done
                        </span>
                        <span className="font-mono text-emerald-400">
                            {weeklyStats.totalCompleted} / {weeklyStats.totalScheduled} ({weeklyStats.percent}%)
                        </span>
                    </div>

                    <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${weeklyStats.percent}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1.5 font-mono">
                        <span>Min required: {allowanceConfig.minThresholdPercent}%</span>
                        <span>{weeklyStats.daysRemaining} days left in week</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
