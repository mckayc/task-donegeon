import React, { useState, useMemo } from 'react';
import { PrivilegeItem, PrivilegeTimeOfDay, User, Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import Avatar from '../user-interface/Avatar';
import { X, Clock, Calendar, Check, Sparkles, AlertCircle, Sun, Moon, Sunrise, Flame, Users } from 'lucide-react';
import { DAY_NAMES_SHORT, formatTimeStr } from '../../utils/privileges';

interface PrivilegeDialogProps {
    privilege: Partial<PrivilegeItem>;
    allUsers: User[];
    onClose: () => void;
    onSave: (privilege: PrivilegeItem) => void;
}

const EMOJI_PRESETS = ['🎮', '📱', '📺', '🚲', '🍦', '🎬', '🎧', '🛹', '🍕', '😴', '🕹️', '🏊‍♂️', '🛝', '🎳', '🏕️', '🧁'];

const TITLE_SUGGESTIONS = [
    { title: 'Screen Time (45 Mins)', icon: '🎮', duration: 45, type: 'timer' as const, duty: 100 },
    { title: 'Weekend Gaming Time', icon: '🕹️', duration: 90, type: 'timer' as const, duty: 100, days: [0, 6] },
    { title: 'Afternoon iPad Session', icon: '📱', duration: 30, type: 'timer' as const, duty: 100, time: 'afternoon' as const },
    { title: 'Movie Night & Popcorn', icon: '🎬', duration: 120, type: 'timer' as const, duty: 100, days: [5, 6] },
    { title: 'Stay Up 30 Mins Late', icon: '😴', type: 'unlock_only' as const, duty: 100 },
    { title: 'Midday Break / Music', icon: '🎧', duration: 20, type: 'timer' as const, duty: 50 },
    { title: 'Outdoor Bike Riding', icon: '🚲', duration: 60, type: 'timer' as const, duty: 75 },
    { title: 'Choose Dessert / Treat', icon: '🍦', type: 'unlock_only' as const, duty: 100 },
];

export const PrivilegeDialog: React.FC<PrivilegeDialogProps> = ({
    privilege,
    allUsers,
    onClose,
    onSave,
}) => {
    const isNew = !privilege.id;

    // Form state
    const [title, setTitle] = useState(privilege.title || '');
    const [description, setDescription] = useState(privilege.description || '');
    const [icon, setIcon] = useState(privilege.icon || '🎮');
    const [type, setType] = useState<'timer' | 'unlock_only'>(privilege.type || 'timer');
    const [durationMinutes, setDurationMinutes] = useState(privilege.timerDurationMinutes || 45);
    const [minDutyPercentage, setMinDutyPercentage] = useState(privilege.minDutyPercentage ?? 100);
    const [isActive, setIsActive] = useState(privilege.isActive !== false);

    // Scheduling: Days of week (empty = all days)
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(privilege.daysOfWeek || []);

    // Scheduling: Time of day
    const [timeOfDay, setTimeOfDay] = useState<PrivilegeTimeOfDay>(privilege.timeOfDay || 'any');
    const [startTime, setStartTime] = useState(privilege.startTime || '15:30');
    const [endTime, setEndTime] = useState(privilege.endTime || '18:00');

    // Assigned Users
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>(privilege.assignedUserIds || []);
    const [userFilter, setUserFilter] = useState<'explorers' | 'all'>('explorers');

    // Filtered users for selection
    const displayUsers = useMemo(() => {
        if (userFilter === 'explorers') {
            const explorers = allUsers.filter(u => u.role === Role.Explorer);
            return explorers.length > 0 ? explorers : allUsers;
        }
        return allUsers;
    }, [allUsers, userFilter]);

    // Handle day toggle
    const handleToggleDay = (dayIndex: number) => {
        if (daysOfWeek.length === 0) {
            // Currently all days; switching to specific days minus this one
            setDaysOfWeek([0, 1, 2, 3, 4, 5, 6].filter(d => d !== dayIndex));
        } else if (daysOfWeek.includes(dayIndex)) {
            const next = daysOfWeek.filter(d => d !== dayIndex);
            setDaysOfWeek(next.length === 0 ? [] : next);
        } else {
            const next = [...daysOfWeek, dayIndex].sort((a, b) => a - b);
            setDaysOfWeek(next.length === 7 ? [] : next);
        }
    };

    const handleSetAllDays = () => setDaysOfWeek([]);
    const handleSetWeekdays = () => setDaysOfWeek([1, 2, 3, 4, 5]);
    const handleSetWeekends = () => setDaysOfWeek([0, 6]);

    // Day schedule status
    const isAllDays = daysOfWeek.length === 0 || daysOfWeek.length === 7;
    const isWeekdaysOnly = daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every(d => daysOfWeek.includes(d));
    const isWeekendsOnly = daysOfWeek.length === 2 && [0, 6].every(d => daysOfWeek.includes(d));

    // Handle user toggle
    const handleToggleUser = (userId: string) => {
        if (assignedUserIds.includes(userId)) {
            setAssignedUserIds(assignedUserIds.filter(id => id !== userId));
        } else {
            setAssignedUserIds([...assignedUserIds, userId]);
        }
    };

    const handleSelectAllChildren = () => {
        setAssignedUserIds([]); // Empty array represents all explorers
    };

    const handleSelectEveryone = () => {
        setAssignedUserIds(allUsers.map(u => u.id));
    };

    // Apply template suggestion
    const handleApplySuggestion = (s: typeof TITLE_SUGGESTIONS[0]) => {
        setTitle(s.title);
        setIcon(s.icon);
        setType(s.type);
        if (s.duration) setDurationMinutes(s.duration);
        if (s.duty) setMinDutyPercentage(s.duty);
        if (s.days) setDaysOfWeek(s.days);
        if (s.time) setTimeOfDay(s.time);
    };

    const handleSave = () => {
        if (!title.trim()) return;

        const updated: PrivilegeItem = {
            id: privilege.id || `priv-${Date.now()}`,
            title: title.trim(),
            description: description.trim(),
            icon: icon.trim() || '🎮',
            type,
            timerDurationMinutes: type === 'timer' ? durationMinutes : undefined,
            minDutyPercentage,
            requiresAllDailyDuties: minDutyPercentage === 100,
            assignedUserIds,
            isActive,
            daysOfWeek: daysOfWeek.length > 0 && daysOfWeek.length < 7 ? daysOfWeek : undefined,
            timeOfDay,
            startTime: timeOfDay === 'custom' ? startTime : undefined,
            endTime: timeOfDay === 'custom' ? endTime : undefined,
        };

        onSave(updated);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
            <div className="bg-stone-900 border border-stone-700/90 rounded-2xl shadow-2xl max-w-3xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-stone-800 border border-stone-700/80 shadow-inner">
                            {icon}
                        </span>
                        <div>
                            <h2 className="text-xl font-medieval text-emerald-400 font-bold">
                                {isNew ? 'Create New Privilege' : 'Edit Privilege'}
                            </h2>
                            <p className="text-xs text-stone-400">
                                Configure daily rewards, screen time, and custom permissions for your children.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                    {/* Quick Suggestions (if new) */}
                    {isNew && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-semibold text-stone-300">Quick Templates</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TITLE_SUGGESTIONS.map((s, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleApplySuggestion(s)}
                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700 hover:border-emerald-500/50 text-stone-300 transition-all flex items-center gap-1.5"
                                    >
                                        <span>{s.icon}</span>
                                        <span>{s.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Basic Info & Duration */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 pb-1 border-b border-stone-800">
                                1. Privilege Details
                            </h3>

                            {/* Icon & Title */}
                            <div>
                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                    Privilege Title & Icon *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={icon}
                                        onChange={e => setIcon(e.target.value)}
                                        className="w-14 text-center text-xl bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-emerald-500"
                                        maxLength={4}
                                    />
                                    <Input
                                        placeholder="e.g. Screen Time (45 Mins)"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="flex-grow"
                                    />
                                </div>
                                {/* Emoji Quick Picks */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {EMOJI_PRESETS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setIcon(emoji)}
                                            className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-transform ${
                                                icon === emoji
                                                    ? 'bg-emerald-600/40 border border-emerald-500 scale-110'
                                                    : 'bg-stone-800/70 hover:bg-stone-700/80 border border-stone-700/60'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-stone-300 mb-1">
                                    Description (Optional)
                                </label>
                                <Input
                                    placeholder="Explain how or when this privilege is enjoyed..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Type & Duration */}
                            <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/60 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                                        Privilege Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setType('timer')}
                                            className={`p-2.5 rounded-lg border text-left transition-all ${
                                                type === 'timer'
                                                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                                                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Countdown Timer</span>
                                            </div>
                                            <p className="text-[10px] text-stone-400 font-normal mt-0.5">
                                                Includes digital timer with pause/resume
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setType('unlock_only')}
                                            className={`p-2.5 rounded-lg border text-left transition-all ${
                                                type === 'unlock_only'
                                                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                                                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Status Unlock</span>
                                            </div>
                                            <p className="text-[10px] text-stone-400 font-normal mt-0.5">
                                                General reward (treat, sleepover, etc.)
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {type === 'timer' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-semibold text-stone-300">
                                                Timer Duration
                                            </label>
                                            <span className="text-xs font-mono font-bold text-emerald-400">
                                                {durationMinutes} Minutes
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {[15, 30, 45, 60, 90, 120].map((mins) => (
                                                <button
                                                    key={mins}
                                                    type="button"
                                                    onClick={() => setDurationMinutes(mins)}
                                                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                                                        durationMinutes === mins
                                                            ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                                                            : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                                                    }`}
                                                >
                                                    {mins}m
                                                </button>
                                            ))}
                                        </div>
                                        <Input
                                            type="number"
                                            value={durationMinutes}
                                            onChange={e => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
                                            min={1}
                                            max={600}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Duty Requirement */}
                            <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/60">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-semibold text-stone-300">
                                        Required Chores Completion
                                    </label>
                                    <span className="text-xs font-mono font-bold text-amber-400">
                                        {minDutyPercentage}% of Today's Duties
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-400 mb-2">
                                    Allows multiple tiers in the same day (e.g. 50% for quick break, 100% for full gaming).
                                </p>
                                <div className="flex gap-2">
                                    {[25, 50, 75, 100].map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setMinDutyPercentage(pct)}
                                            className={`flex-1 py-1 text-xs rounded border transition-all ${
                                                minDutyPercentage === pct
                                                    ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold'
                                                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                            }`}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Scheduling & User Assignment */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 pb-1 border-b border-stone-800">
                                2. Scheduling & Assignment
                            </h3>

                            {/* Day Schedule (Weekdays / Weekends) */}
                            <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/60 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                                        <Calendar className="w-4 h-4 text-emerald-400" />
                                        <span>Day Schedule</span>
                                    </div>
                                    <span className="text-[11px] font-medium text-emerald-400">
                                        {isAllDays && 'Every Day'}
                                        {isWeekdaysOnly && 'Weekdays Only'}
                                        {isWeekendsOnly && 'Weekends Only'}
                                        {!isAllDays && !isWeekdaysOnly && !isWeekendsOnly && `${daysOfWeek.length} Days Selected`}
                                    </span>
                                </div>

                                {/* Preset day buttons */}
                                <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleSetAllDays}
                                        className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-all ${
                                            isAllDays
                                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        📅 Every Day
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSetWeekdays}
                                        className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-all ${
                                            isWeekdaysOnly
                                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        💼 Weekdays
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSetWeekends}
                                        className={`py-1.5 px-2 rounded text-xs font-medium border text-center transition-all ${
                                            isWeekendsOnly
                                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        🎉 Weekends
                                    </button>
                                </div>

                                {/* Individual day toggles (Sun - Sat) */}
                                <div className="flex items-center justify-between pt-1">
                                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                                        const isSelected = isAllDays || daysOfWeek.includes(dayIndex);
                                        const isWeekend = dayIndex === 0 || dayIndex === 6;

                                        return (
                                            <button
                                                key={dayIndex}
                                                type="button"
                                                onClick={() => handleToggleDay(dayIndex)}
                                                title={DAY_NAMES_SHORT[dayIndex]}
                                                className={`w-9 h-9 rounded-lg font-bold text-xs transition-all flex flex-col items-center justify-center border ${
                                                    isSelected
                                                        ? isWeekend
                                                            ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-sm'
                                                            : 'bg-emerald-900/60 border-emerald-500 text-emerald-200 shadow-sm'
                                                        : 'bg-stone-850 border-stone-700/70 text-stone-500 hover:text-stone-300'
                                                }`}
                                            >
                                                <span>{DAY_NAMES_SHORT[dayIndex].charAt(0)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time-of-Day Window (Different Privileges in the Same Day) */}
                            <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/60 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                                        <Clock className="w-4 h-4 text-sky-400" />
                                        <span>Time-of-Day Window</span>
                                    </div>
                                    <span className="text-[11px] text-sky-400 font-medium">
                                        {timeOfDay === 'any' && 'Any Time Today'}
                                        {timeOfDay === 'morning' && '🌅 Morning'}
                                        {timeOfDay === 'afternoon' && '☀️ Afternoon'}
                                        {timeOfDay === 'evening' && '🌙 Evening'}
                                        {timeOfDay === 'custom' && `${formatTimeStr(startTime)} – ${formatTimeStr(endTime)}`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setTimeOfDay('any')}
                                        className={`p-2 rounded text-xs font-medium border text-left transition-all ${
                                            timeOfDay === 'any'
                                                ? 'bg-sky-950/70 border-sky-500 text-sky-300'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        ⚡ Any Time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTimeOfDay('morning')}
                                        className={`p-2 rounded text-xs font-medium border text-left transition-all ${
                                            timeOfDay === 'morning'
                                                ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        🌅 Morning
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTimeOfDay('afternoon')}
                                        className={`p-2 rounded text-xs font-medium border text-left transition-all ${
                                            timeOfDay === 'afternoon'
                                                ? 'bg-orange-950/70 border-orange-500 text-orange-300'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        ☀️ Afternoon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTimeOfDay('evening')}
                                        className={`p-2 rounded text-xs font-medium border text-left transition-all ${
                                            timeOfDay === 'evening'
                                                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        🌙 Evening
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTimeOfDay('custom')}
                                        className={`col-span-2 sm:col-span-2 p-2 rounded text-xs font-medium border text-left transition-all ${
                                            timeOfDay === 'custom'
                                                ? 'bg-sky-950/70 border-sky-500 text-sky-300'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        ⏰ Custom Hours...
                                    </button>
                                </div>

                                {timeOfDay === 'custom' && (
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-700/60">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-stone-400 mb-1">
                                                Starts At
                                            </label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-stone-400 mb-1">
                                                Ends At
                                            </label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Selection (IMPROVED UI) */}
                            <div className="p-3 bg-stone-800/50 rounded-xl border border-stone-700/60 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                                        <Users className="w-4 h-4 text-emerald-400" />
                                        <span>Who Can Enjoy This?</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setUserFilter(userFilter === 'explorers' ? 'all' : 'explorers')}
                                            className="text-[10px] text-stone-400 hover:text-stone-200 underline"
                                        >
                                            {userFilter === 'explorers' ? 'Show All Users' : 'Explorers Only'}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick selection presets */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllChildren}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                            assignedUserIds.length === 0
                                                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                                                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                                        }`}
                                    >
                                        ✨ All Children (Everyone)
                                    </button>
                                </div>

                                {/* User Cards List */}
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {displayUsers.map((user) => {
                                        const isSelected = assignedUserIds.includes(user.id);
                                        const isAllSelected = assignedUserIds.length === 0;

                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => handleToggleUser(user.id)}
                                                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50'
                                                        : isAllSelected
                                                        ? 'bg-stone-800/80 border-emerald-600/30 text-stone-300 hover:bg-stone-750'
                                                        : 'bg-stone-850 border-stone-700/70 text-stone-400 hover:bg-stone-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Avatar user={user} className="w-7 h-7 rounded-full flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-semibold text-stone-200 truncate">
                                                            {user.gameName}
                                                        </div>
                                                        <div className="text-[10px] text-stone-400 truncate">
                                                            @{user.username} {user.role === Role.Explorer && '• Explorer'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {isSelected ? (
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-stone-900 font-bold text-xs">
                                                            ✓
                                                        </span>
                                                    ) : isAllSelected ? (
                                                        <span className="text-[10px] text-emerald-400/80 font-medium px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-600/30">
                                                            Included (All)
                                                        </span>
                                                    ) : (
                                                        <span className="w-5 h-5 rounded-full border border-stone-600" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ToggleSwitch
                            enabled={isActive}
                            setEnabled={setIsActive}
                            label="Active"
                            data-log-id="privilege-dialog-is-active-toggle"
                        />
                        <span className="text-xs text-stone-400">
                            {isActive ? 'Privilege is active' : 'Privilege is paused / inactive'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!title.trim()}>
                            {isNew ? 'Create Privilege' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PrivilegeDialog;
