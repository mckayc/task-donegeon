import React, { useState, useMemo } from 'react';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { PrivilegeItem, UserAllowanceConfig, AllowancePayoutRecord, QuestType, QuestCompletionStatus, User, Role } from '../../types';
import { isQuestScheduledForDay, toYMD } from '../../utils/conditions';
import { formatPrivilegeSchedule, formatPrivilegeTimeWindow } from '../../utils/privileges';
import { Sparkles, DollarSign, Plus, Trash2, Edit2, Check, Clock, ShieldCheck, PiggyBank, History, Trophy, Calendar } from 'lucide-react';
import Avatar from '../user-interface/Avatar';
import PrivilegeDialog from './PrivilegeDialog';

export const ManagePrivilegesPage: React.FC = () => {
    const { settings } = useSystemState();
    const { updateSettings } = useSystemDispatch();
    const { users } = useAuthState();
    const { updateUser, depositToVault } = useAuthDispatch();
    const { quests, questCompletions } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { addNotification } = useNotificationsDispatch();

    const [activeTab, setActiveTab] = useState<'privileges' | 'allowance'>('privileges');

    // Dialog state for adding/editing privilege
    const [editingPrivilege, setEditingPrivilege] = useState<Partial<PrivilegeItem> | null>(null);

    const explorers = useMemo(() => {
        return users.filter(u => u.role === Role.Explorer);
    }, [users]);

    const currencyOptions = useMemo(() => {
        return rewardTypes.filter(r => r.category === 'Currency');
    }, [rewardTypes]);

    // Save privilege item
    const handleSavePrivilege = (privilegeToSave: PrivilegeItem) => {
        const currentPrivileges = settings.privileges || [];
        const isExisting = currentPrivileges.some(p => p.id === privilegeToSave.id);

        const updated = isExisting
            ? currentPrivileges.map(p => p.id === privilegeToSave.id ? privilegeToSave : p)
            : [...currentPrivileges, privilegeToSave];

        updateSettings({ ...settings, privileges: updated });
        setEditingPrivilege(null);
        addNotification({
            type: 'success',
            message: `Privilege "${privilegeToSave.title}" saved successfully!`
        });
    };

    const handleTogglePrivilegeActive = (id: string, isActive: boolean) => {
        const currentPrivileges = settings.privileges || [];
        const updated = currentPrivileges.map(p => p.id === id ? { ...p, isActive } : p);
        updateSettings({ ...settings, privileges: updated });
    };

    const handleDeletePrivilege = (id: string) => {
        const updated = (settings.privileges || []).filter(p => p.id !== id);
        updateSettings({ ...settings, privileges: updated });
        addNotification({ type: 'info', message: 'Privilege deleted.' });
    };

    // Update child allowance config
    const handleUpdateChildAllowance = (userId: string, partial: Partial<UserAllowanceConfig>) => {
        const currentAllowance = settings.allowance || { enabled: true, userConfigs: [], payoutHistory: [] };
        const existingConfigIndex = currentAllowance.userConfigs.findIndex(c => c.userId === userId);

        let updatedConfigs: UserAllowanceConfig[] = [];
        if (existingConfigIndex >= 0) {
            updatedConfigs = currentAllowance.userConfigs.map((c, idx) =>
                idx === existingConfigIndex ? { ...c, ...partial } : c
            );
        } else {
            const newConfig: UserAllowanceConfig = {
                userId,
                enabled: true,
                weeklyAmount: 10,
                minThresholdPercent: 70,
                calculationType: 'pro_rated',
                payoutDestination: 'purse',
                currencyRewardTypeId: currencyOptions[0]?.id || 'core-gold',
                ...partial
            };
            updatedConfigs = [...currentAllowance.userConfigs, newConfig];
        }

        updateSettings({
            ...settings,
            allowance: {
                ...currentAllowance,
                userConfigs: updatedConfigs
            }
        });
    };

    // Calculate weekly duty stats for a given user for last week or current week
    const calculateUserWeeklyStats = (user: User, weekOffset: number = 0) => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek - (weekOffset * 7));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let totalScheduled = 0;
        let totalCompleted = 0;

        for (let d = 0; d < 7; d++) {
            const checkDay = new Date(startOfWeek);
            checkDay.setDate(startOfWeek.getDate() + d);
            const checkDayYMD = toYMD(checkDay);

            const dutiesOnDay = quests.filter(q => {
                if (!q.isActive || q.type !== QuestType.Duty) return false;
                if (q.assignedUserIds && q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(user.id)) {
                    return false;
                }
                return isQuestScheduledForDay(q, checkDay);
            });

            totalScheduled += dutiesOnDay.length;

            dutiesOnDay.forEach(duty => {
                const isCompleted = questCompletions.some(c =>
                    c.userId === user.id &&
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
        return {
            totalScheduled,
            totalCompleted,
            percent: Math.min(100, percent),
            weekStart: toYMD(startOfWeek),
            weekEnd: toYMD(endOfWeek)
        };
    };

    // Process allowance payout for a user
    const handleProcessPayout = async (user: User, stats: ReturnType<typeof calculateUserWeeklyStats>, config: UserAllowanceConfig) => {
        let payoutAmount = 0;
        if (config.calculationType === 'threshold_all_or_nothing') {
            payoutAmount = stats.percent >= config.minThresholdPercent ? config.weeklyAmount : 0;
        } else {
            payoutAmount = Math.round((config.weeklyAmount * (stats.percent / 100)) * 100) / 100;
        }

        if (payoutAmount <= 0) {
            addNotification({
                type: 'info',
                message: `${user.gameName} did not reach the minimum threshold for allowance payout (${stats.percent}% completed).`
            });
            return;
        }

        // Credit the child's purse or deposit to Enchanted Vault
        if (config.payoutDestination === 'vault') {
            await depositToVault(user.id, {
                purse: { [config.currencyRewardTypeId]: payoutAmount },
                experience: {}
            });
        } else {
            const currentPurseAmount = user.personalPurse[config.currencyRewardTypeId] || 0;
            updateUser(user.id, {
                personalPurse: {
                    ...user.personalPurse,
                    [config.currencyRewardTypeId]: currentPurseAmount + payoutAmount
                }
            });
        }

        const newRecord: AllowancePayoutRecord = {
            id: `payout-${Date.now()}`,
            userId: user.id,
            weekStart: stats.weekStart,
            weekEnd: stats.weekEnd,
            scheduledDutiesCount: stats.totalScheduled,
            completedDutiesCount: stats.totalCompleted,
            completionPercentage: stats.percent,
            amountPaid: payoutAmount,
            currencyRewardTypeId: config.currencyRewardTypeId,
            payoutDestination: config.payoutDestination,
            paidAt: new Date().toISOString(),
            note: `Approved by Donegeon Master`
        };

        const currentAllowance = settings.allowance || { enabled: true, userConfigs: [], payoutHistory: [] };
        updateSettings({
            ...settings,
            allowance: {
                ...currentAllowance,
                payoutHistory: [newRecord, ...(currentAllowance.payoutHistory || [])]
            }
        });

        addNotification({
            type: 'success',
            message: `Paid $${payoutAmount.toFixed(2)} allowance to ${user.gameName}!`
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-700/60">
                <div>
                    <h1 className="text-3xl font-medieval text-stone-100 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        Privileges & Allowance System
                    </h1>
                    <p className="text-sm text-stone-400 mt-1">
                        Gate screen time and rewards behind daily duties, and automate weekly duty-based allowances.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-stone-800/80 p-1 rounded-xl border border-stone-700">
                    <button
                        onClick={() => setActiveTab('privileges')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'privileges'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-stone-300 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Daily Privileges
                    </button>
                    <button
                        onClick={() => setActiveTab('allowance')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                            activeTab === 'allowance'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-stone-300 hover:text-white'
                        }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        Weekly Allowance Engine
                    </button>
                </div>
            </div>

            {/* TAB 1: DAILY PRIVILEGES */}
            {activeTab === 'privileges' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-stone-200">Configured Privileges</h2>
                            <p className="text-xs text-stone-400">
                                Privileges automatically unlock on each child's dashboard as soon as their required duties for today are completed.
                            </p>
                        </div>

                        <Button
                            onClick={() => setEditingPrivilege({
                                title: '',
                                description: '',
                                icon: '🎮',
                                assignedUserIds: [],
                                type: 'timer',
                                timerDurationMinutes: 45,
                                minDutyPercentage: 100,
                                requiresAllDailyDuties: true,
                                isActive: true
                            })}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Privilege
                        </Button>
                    </div>

                    {/* Privileges List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(settings.privileges || []).map(privilege => {
                            const assignedUsers = users.filter(u => privilege.assignedUserIds.includes(u.id));

                            return (
                                <Card 
                                    key={privilege.id} 
                                    className={`border p-4 flex flex-col justify-between transition-all ${
                                        privilege.isActive !== false 
                                            ? 'border-stone-700/80 bg-stone-900/90 shadow-md' 
                                            : 'border-stone-800 bg-stone-950/60 opacity-60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl p-2.5 rounded-xl bg-stone-800 border border-stone-700 shadow-inner">
                                                    {privilege.icon}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-stone-100 text-base">
                                                            {privilege.title}
                                                        </h3>
                                                        {privilege.isActive === false && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                                                                Paused
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-mono text-emerald-400">
                                                        {privilege.type === 'timer'
                                                            ? `⏱ ${privilege.timerDurationMinutes || 45} Min Countdown`
                                                            : '✨ Status Unlock Only'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingPrivilege(privilege)}
                                                    className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                                                    title="Edit Privilege"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrivilege(privilege.id)}
                                                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                                                    title="Delete Privilege"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-stone-400 mt-2.5 line-clamp-2">
                                            {privilege.description || 'No description provided.'}
                                        </p>

                                        {/* Scheduling & Requirement Badges */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-600/40">
                                                📅 {formatPrivilegeSchedule(privilege)}
                                            </span>
                                            {privilege.timeOfDay && privilege.timeOfDay !== 'any' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-sky-950/70 text-sky-300 border border-sky-600/40">
                                                    {formatPrivilegeTimeWindow(privilege)}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-amber-950/70 text-amber-300 border border-amber-600/40">
                                                🎯 {privilege.minDutyPercentage ?? 100}% Chores
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                            <span className="text-stone-500 font-medium">Eligible:</span>
                                            {assignedUsers.length > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {assignedUsers.slice(0, 3).map(u => (
                                                            <Avatar key={u.id} user={u} className="w-5 h-5 rounded-full ring-1 ring-stone-900" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] text-stone-300 truncate max-w-[120px]">
                                                        {assignedUsers.map(u => u.gameName).join(', ')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-emerald-400">
                                                    ✨ All Children
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <ToggleSwitch
                                                enabled={privilege.isActive !== false}
                                                setEnabled={(val) => handleTogglePrivilegeActive(privilege.id, val)}
                                                label=""
                                                data-log-id={`toggle-privilege-active-${privilege.id}`}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}

                        {(!settings.privileges || settings.privileges.length === 0) && (
                            <div className="col-span-full p-8 text-center bg-stone-900/40 rounded-xl border border-dashed border-stone-800">
                                <Sparkles className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                                <h3 className="font-bold text-stone-300">No Privileges Created Yet</h3>
                                <p className="text-xs text-stone-400 mt-1">
                                    Click "Add Privilege" above to create screen time, game time, or play privileges.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: WEEKLY ALLOWANCE ENGINE */}
            {activeTab === 'allowance' && (
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                        <strong className="text-amber-300 font-semibold block mb-1">
                            💡 How the Allowance Engine Works:
                        </strong>
                        At the end of each week (or whenever you choose), the engine checks how many scheduled duties each child completed. If pro-rated, they earn their completion percentage (e.g. 90% of $10 = $9.00). You can process payouts directly to their purse or into their Enchanted Vault savings with one click.
                    </div>

                    {/* Per-Child Allowance Configurations */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-stone-200">Explorer Allowance Setup & Weekly Review</h2>

                        {explorers.map(user => {
                            const config = (settings.allowance?.userConfigs || []).find(c => c.userId === user.id) || {
                                userId: user.id,
                                enabled: true,
                                weeklyAmount: 10,
                                minThresholdPercent: 70,
                                calculationType: 'pro_rated' as const,
                                payoutDestination: 'purse' as const,
                                currencyRewardTypeId: currencyOptions[0]?.id || 'core-gold'
                            };

                            const currentWeekStats = calculateUserWeeklyStats(user, 0);
                            const lastWeekStats = calculateUserWeeklyStats(user, 1);

                            return (
                                <Card key={user.id} className="border border-stone-700/80 bg-stone-900/90 p-5 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-stone-800 border-2 border-emerald-500 flex items-center justify-center font-bold text-stone-200">
                                                {user.gameName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-stone-100 text-lg">{user.gameName}</h3>
                                                <span className="text-xs text-stone-400">@{user.username}</span>
                                            </div>
                                        </div>

                                        <ToggleSwitch
                                            enabled={config.enabled}
                                            setEnabled={val => handleUpdateChildAllowance(user.id, { enabled: val })}
                                            label="Enable Allowance"
                                        />
                                    </div>

                                    {config.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                                            <div>
                                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                                    Base Weekly Amount ($)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={config.weeklyAmount}
                                                    onChange={e => handleUpdateChildAllowance(user.id, { weeklyAmount: Math.max(0, Number(e.target.value) || 0) })}
                                                    min={0}
                                                    step={0.5}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                                    Calculation Model
                                                </label>
                                                <select
                                                    value={config.calculationType}
                                                    onChange={e => handleUpdateChildAllowance(user.id, { calculationType: e.target.value as any })}
                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200"
                                                >
                                                    <option value="pro_rated">Pro-Rated by % Completed</option>
                                                    <option value="threshold_all_or_nothing">All-or-Nothing (Pass/Fail)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                                    Min Qualifying % ({config.minThresholdPercent}%)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={config.minThresholdPercent}
                                                    onChange={e => handleUpdateChildAllowance(user.id, { minThresholdPercent: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
                                                    min={1}
                                                    max={100}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                                    Payout Destination
                                                </label>
                                                <select
                                                    value={config.payoutDestination}
                                                    onChange={e => handleUpdateChildAllowance(user.id, { payoutDestination: e.target.value as any })}
                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200"
                                                >
                                                    <option value="purse">Personal Purse (Wallet)</option>
                                                    <option value="vault">Enchanted Vault (Savings)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Current & Last Week Review Cards */}
                                    {config.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            {/* Current Week Pace */}
                                            <div className="p-3.5 rounded-xl bg-stone-850/80 border border-stone-800">
                                                <div className="flex items-center justify-between text-xs font-semibold text-stone-300 mb-2">
                                                    <span>Current Week Progress</span>
                                                    <span className="font-mono text-emerald-400">
                                                        {currentWeekStats.totalCompleted} / {currentWeekStats.totalScheduled} ({currentWeekStats.percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden mb-2">
                                                    <div
                                                        className="bg-emerald-500 h-full rounded-full transition-all"
                                                        style={{ width: `${currentWeekStats.percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-stone-400">
                                                    <span>Current Earning:</span>
                                                    <strong className="text-amber-300 font-mono text-sm">
                                                        ${((config.weeklyAmount * (currentWeekStats.percent / 100))).toFixed(2)}
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* Last Week Ready for Payout */}
                                            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
                                                        <span>Previous Week Payout Review</span>
                                                        <span className="font-mono">
                                                            {lastWeekStats.percent}% Completed
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-stone-400">
                                                        {lastWeekStats.totalCompleted} of {lastWeekStats.totalScheduled} duties finished ({lastWeekStats.weekStart} to {lastWeekStats.weekEnd})
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between pt-2 border-t border-emerald-900/60">
                                                    <span className="font-mono font-bold text-amber-300 text-sm">
                                                        Payout: ${((config.weeklyAmount * (lastWeekStats.percent / 100))).toFixed(2)}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleProcessPayout(user, lastWeekStats, config)}
                                                        className="!bg-emerald-600 hover:!bg-emerald-500 text-white font-semibold text-xs"
                                                    >
                                                        Pay Last Week
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {explorers.length === 0 && (
                            <p className="text-center text-stone-500 py-8">
                                No Explorer accounts found. Create Explorer accounts in Manage Users to assign allowances.
                            </p>
                        )}
                    </div>

                    {/* Payout History */}
                    {settings.allowance?.payoutHistory && settings.allowance.payoutHistory.length > 0 && (
                        <div className="pt-4 space-y-3">
                            <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                                <History className="w-5 h-5 text-amber-400" />
                                Recent Allowance Payout History
                            </h3>
                            <div className="bg-stone-900/80 border border-stone-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs text-stone-300">
                                    <thead className="bg-stone-850 text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800">
                                        <tr>
                                            <th className="p-3">Date Paid</th>
                                            <th className="p-3">Explorer</th>
                                            <th className="p-3">Week Span</th>
                                            <th className="p-3">Duties Finished</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Destination</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-800">
                                        {settings.allowance.payoutHistory.slice(0, 10).map(record => {
                                            const user = users.find(u => u.id === record.userId);
                                            return (
                                                <tr key={record.id} className="hover:bg-stone-850/50">
                                                    <td className="p-3 font-mono">
                                                        {new Date(record.paidAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 font-semibold text-stone-100">
                                                        {user?.gameName || 'Unknown'}
                                                    </td>
                                                    <td className="p-3 font-mono text-stone-400">
                                                        {record.weekStart} ~ {record.weekEnd}
                                                    </td>
                                                    <td className="p-3 font-mono text-emerald-400">
                                                        {record.completedDutiesCount}/{record.scheduledDutiesCount} ({record.completionPercentage}%)
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-amber-300">
                                                        ${record.amountPaid.toFixed(2)}
                                                    </td>
                                                    <td className="p-3 capitalize text-stone-400">
                                                        {record.payoutDestination === 'vault' ? 'Enchanted Vault' : 'Purse'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Privilege Add/Edit Modal */}
            {editingPrivilege && (
                <PrivilegeDialog
                    privilege={editingPrivilege}
                    allUsers={users}
                    onClose={() => setEditingPrivilege(null)}
                    onSave={handleSavePrivilege}
                />
            )}
        </div>
    );
};
