import React, { useState, useMemo } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { Quest, QuestType, QuestKind, Role, User, PrivilegeItem } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import Avatar from '../user-interface/Avatar';
import Card from '../user-interface/Card';
import { 
    Sparkles, X, Check, ArrowRight, Clock, Plus, Trash2, Edit3, 
    RefreshCw, Shield, Compass, Heart, Flame, Users, ChevronDown, 
    ChevronUp, Gift, Calendar, AlertCircle, CheckCircle2, Wand2
} from 'lucide-react';

interface QuestArchitectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPlanDeployed?: (groupId: string) => void;
}

export interface PlanQuestItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: 'Duty' | 'Venture';
    timeOfDay?: 'any' | 'morning' | 'afternoon' | 'evening';
    timerMode?: 'none' | 'countdown' | 'stopwatch';
    timerDurationSeconds?: number;
    checkpoints: string[];
    suggestedRewardTypeName: string;
    suggestedRewardAmount: number;
    suggestedChildId?: string;
    suggestedChildName?: string;
}

export interface ArchitectPlan {
    id: string;
    title: string;
    strategyStyle: string;
    philosophy: string;
    gamificationHook: string;
    suggestedGroupName: string;
    suggestedPrivilege?: {
        title: string;
        description: string;
        icon: string;
        type: 'timer' | 'unlock_only';
        durationMinutes?: number;
        minDutyPercentage?: number;
    };
    quests: PlanQuestItem[];
}

const INSPIRATION_PRESETS = [
    {
        label: '🐕 Dog Care Routine',
        goal: 'Feed, walk, and care for the family dog every morning and evening without arguing.',
        purpose: 'Build empathy, daily dependability, and shared responsibility without parents having to nag.',
        style: 'balanced' as const
    },
    {
        label: '🌅 Stress-Free Morning',
        goal: 'Get dressed, eat breakfast, pack backpacks, and brush teeth independently before 7:30 AM.',
        purpose: 'Foster morning self-sufficiency, reduce school-morning frantic stress, and start days positively.',
        style: 'speed_efficiency' as const
    },
    {
        label: '🧹 Bedroom & Laundry Care',
        goal: 'Keep bedroom floor clear, make bed daily, and fold clean clothes on laundry days.',
        purpose: 'Teach pride in personal spaces and respectful stewardship of our shared home.',
        style: 'habit_builder' as const
    },
    {
        label: '📚 Reading & Focus Hour',
        goal: 'Complete 25 minutes of quiet book reading and organize schoolwork daily after school.',
        purpose: 'Cultivate deep reading habits, focus stamina, and love of learning without screen distractions.',
        style: 'epic_adventure' as const
    },
    {
        label: '🍳 Junior Chef Apprentice',
        goal: 'Help plan, prepare, and clean up dinner twice a week alongside parents.',
        purpose: 'Learn essential nutrition, cooking safety, teamwork, and family mealtime connection.',
        style: 'epic_adventure' as const
    }
];

export const QuestArchitectDialog: React.FC<QuestArchitectDialogProps> = ({
    isOpen,
    onClose,
    onPlanDeployed
}) => {
    const { settings } = useSystemState();
    const { updateSettings } = useSystemDispatch();
    const { users } = useAuthState();
    const { rewardTypes } = useEconomyState();
    const { addQuest, addQuestGroup } = useQuestsDispatch();
    const { addNotification } = useNotificationsDispatch();

    // Intake Form State
    const [goal, setGoal] = useState('');
    const [purpose, setPurpose] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [strategyStyle, setStrategyStyle] = useState<'balanced' | 'habit_builder' | 'epic_adventure' | 'speed_efficiency'>('balanced');

    // Assistant Output State
    const [plans, setPlans] = useState<ArchitectPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-a');
    const [activeStep, setActiveStep] = useState<'intake' | 'review' | 'success'>('intake');
    const [includePrivilege, setIncludePrivilege] = useState<boolean>(true);

    // Loading & Refinement States
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [refinementText, setRefinementText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deployedSummary, setDeployedSummary] = useState<{ groupName: string; questCount: number; planTitle: string } | null>(null);

    // Inline Editing Expanded States
    const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

    // Explorers list
    const explorers = useMemo(() => {
        const expl = users.filter(u => u.role === Role.Explorer);
        return expl.length > 0 ? expl : users;
    }, [users]);

    if (!isOpen) return null;

    const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

    // Helper to calculate user age
    const getUserAge = (birthday?: string): number | undefined => {
        if (!birthday) return undefined;
        const birth = new Date(birthday);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        return age >= 0 ? age : undefined;
    };

    // User selection toggle
    const handleToggleUser = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    // Handle Generation
    const handleGeneratePlans = async (isRefiningCall: boolean = false) => {
        if (!goal.trim()) {
            setError('Please describe what goal or task you want to address.');
            return;
        }

        setError(null);
        if (isRefiningCall) {
            setIsRefining(true);
        } else {
            setIsGenerating(true);
        }

        const targetChildrenData = (selectedUserIds.length > 0
            ? explorers.filter(u => selectedUserIds.includes(u.id))
            : explorers
        ).map(u => ({
            id: u.id,
            name: u.gameName || u.firstName,
            age: getUserAge(u.birthday),
            aboutMe: u.aboutMe
        }));

        const availableRewardsData = rewardTypes.map(r => ({
            id: r.id,
            name: r.name,
            icon: r.icon
        }));

        try {
            const response = await fetch('/api/ai/plan-architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: goal.trim(),
                    purpose: purpose.trim(),
                    children: targetChildrenData,
                    style: strategyStyle,
                    availableRewardTypes: availableRewardsData,
                    refinementInstructions: isRefiningCall ? refinementText.trim() : undefined,
                    existingPlan: isRefiningCall && selectedPlan ? {
                        title: selectedPlan.title,
                        philosophy: selectedPlan.philosophy,
                        strategyStyle: selectedPlan.strategyStyle,
                    } : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to generate quest plans from the AI Assistant.');
            }

            const data = await response.json();
            if (!data.plans || !Array.isArray(data.plans) || data.plans.length === 0) {
                throw new Error('No strategic plans could be generated. Please try again with more details.');
            }

            // Assign unique local IDs to quests if needed
            const hydratedPlans: ArchitectPlan[] = data.plans.map((p: any, pIdx: number) => ({
                id: p.id || `plan-${pIdx === 0 ? 'a' : 'b'}`,
                title: p.title || `Strategic Plan ${pIdx + 1}`,
                strategyStyle: p.strategyStyle || 'Tailored Strategy',
                philosophy: p.philosophy || '',
                gamificationHook: p.gamificationHook || '',
                suggestedGroupName: p.suggestedGroupName || 'New Quest Arc',
                suggestedPrivilege: p.suggestedPrivilege || undefined,
                quests: (p.quests || []).map((q: any, qIdx: number) => {
                    // Match child
                    let matchedChildId = selectedUserIds.length === 1 ? selectedUserIds[0] : undefined;
                    if (q.suggestedChildName && q.suggestedChildName.toLowerCase() !== 'all') {
                        const matched = explorers.find(u => 
                            u.gameName.toLowerCase().includes(q.suggestedChildName.toLowerCase()) ||
                            u.firstName.toLowerCase().includes(q.suggestedChildName.toLowerCase())
                        );
                        if (matched) matchedChildId = matched.id;
                    }

                    return {
                        id: `gen-quest-${pIdx}-${qIdx}-${Date.now()}`,
                        title: q.title || 'Untitled Quest',
                        description: q.description || '',
                        icon: q.icon || '⚔️',
                        type: (q.type === 'Duty' || q.type === 'Venture') ? q.type : 'Duty',
                        timeOfDay: q.timeOfDay || 'any',
                        timerMode: q.timerMode || 'none',
                        timerDurationSeconds: q.timerDurationSeconds || 0,
                        checkpoints: Array.isArray(q.checkpoints) ? q.checkpoints : [],
                        suggestedRewardTypeName: q.suggestedRewardTypeName || 'Gold',
                        suggestedRewardAmount: q.suggestedRewardAmount || 2,
                        suggestedChildId: matchedChildId,
                        suggestedChildName: q.suggestedChildName
                    };
                })
            }));

            setPlans(hydratedPlans);
            setSelectedPlanId(hydratedPlans[0].id);
            setActiveStep('review');
            setRefinementText('');
            if (hydratedPlans[0].quests.length > 0) {
                setExpandedQuestId(hydratedPlans[0].quests[0].id);
            }
        } catch (err: any) {
            console.error('Plan Architect error:', err);
            setError(err.message || 'An error occurred while contacting the AI Assistant.');
        } finally {
            setIsGenerating(false);
            setIsRefining(false);
        }
    };

    // Inline Plan Updates
    const handleUpdateSelectedPlan = (updater: (prev: ArchitectPlan) => ArchitectPlan) => {
        setPlans(prev => prev.map(p => p.id === selectedPlanId ? updater(p) : p));
    };

    const handleUpdateQuest = (questId: string, updates: Partial<PlanQuestItem>) => {
        handleUpdateSelectedPlan(plan => ({
            ...plan,
            quests: plan.quests.map(q => q.id === questId ? { ...q, ...updates } : q)
        }));
    };

    const handleDeleteQuest = (questId: string) => {
        handleUpdateSelectedPlan(plan => ({
            ...plan,
            quests: plan.quests.filter(q => q.id !== questId)
        }));
    };

    const handleAddCheckpoint = (questId: string) => {
        handleUpdateSelectedPlan(plan => ({
            ...plan,
            quests: plan.quests.map(q => {
                if (q.id === questId) {
                    return {
                        ...q,
                        checkpoints: [...q.checkpoints, 'New micro-step...']
                    };
                }
                return q;
            })
        }));
    };

    const handleUpdateCheckpoint = (questId: string, index: number, text: string) => {
        handleUpdateSelectedPlan(plan => ({
            ...plan,
            quests: plan.quests.map(q => {
                if (q.id === questId) {
                    const newCheckpoints = [...q.checkpoints];
                    newCheckpoints[index] = text;
                    return { ...q, checkpoints: newCheckpoints };
                }
                return q;
            })
        }));
    };

    const handleDeleteCheckpoint = (questId: string, index: number) => {
        handleUpdateSelectedPlan(plan => ({
            ...plan,
            quests: plan.quests.map(q => {
                if (q.id === questId) {
                    return {
                        ...q,
                        checkpoints: q.checkpoints.filter((_, i) => i !== index)
                    };
                }
                return q;
            })
        }));
    };

    // Deploy Plan
    const handleDeployPlan = async () => {
        if (!selectedPlan) return;
        setIsGenerating(true);

        try {
            // 1. Create a Quest Group for this plan
            const newGroup = await addQuestGroup({
                name: selectedPlan.suggestedGroupName || selectedPlan.title,
                description: `${selectedPlan.philosophy}\n\nMotivation: ${selectedPlan.gamificationHook}`,
                icon: selectedPlan.quests[0]?.icon || '🛡️',
                questIds: []
            });

            const createdGroupId = newGroup?.id;

            // 2. Resolve Reward Types
            const defaultReward = rewardTypes[0] || { id: 'core-currency', name: 'Gold' };

            // 3. Create each Quest
            for (const q of selectedPlan.quests) {
                const matchedRewardType = rewardTypes.find(r => 
                    r.name.toLowerCase() === q.suggestedRewardTypeName.toLowerCase()
                ) || defaultReward;

                const assigned = q.suggestedChildId 
                    ? [q.suggestedChildId] 
                    : selectedUserIds.length > 0 
                    ? selectedUserIds 
                    : explorers.map(u => u.id);

                const questPayload: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'> = {
                    title: q.title,
                    description: q.description,
                    icon: q.icon || '⚔️',
                    iconType: 'emoji',
                    type: q.type === 'Duty' ? QuestType.Duty : QuestType.Venture,
                    kind: QuestKind.Personal,
                    tags: ['AI Architect', selectedPlan.suggestedGroupName.replace(/[^a-zA-Z0-9]/g, '')],
                    startDateTime: null,
                    endDateTime: null,
                    allDay: true,
                    rrule: q.type === 'Duty' ? 'FREQ=DAILY' : null,
                    startTime: q.timeOfDay === 'morning' ? '07:30' : q.timeOfDay === 'evening' ? '18:00' : null,
                    endTime: q.timeOfDay === 'morning' ? '08:30' : q.timeOfDay === 'evening' ? '19:30' : null,
                    assignedUserIds: assigned,
                    groupIds: createdGroupId ? [createdGroupId] : [],
                    requiresApproval: true,
                    isActive: true,
                    isOptional: false,
                    rewards: [
                        {
                            rewardTypeId: matchedRewardType.id,
                            amount: q.suggestedRewardAmount || 2
                        }
                    ],
                    lateSetbacks: [],
                    incompleteSetbacks: [],
                    checkpoints: q.checkpoints.map((cpText, idx) => ({
                        id: `cp-${Date.now()}-${idx}`,
                        description: cpText,
                        rewards: []
                    })),
                    timerConfig: q.timerMode && q.timerMode !== 'none' ? {
                        mode: q.timerMode,
                        durationSeconds: q.timerDurationSeconds || 600
                    } : undefined
                };

                await addQuest(questPayload);
            }

            // 4. Optionally create Privilege
            if (includePrivilege && selectedPlan.suggestedPrivilege) {
                const priv = selectedPlan.suggestedPrivilege;
                const newPrivilegeItem: PrivilegeItem = {
                    id: `priv-architect-${Date.now()}`,
                    title: priv.title,
                    description: priv.description || 'Unlocked by adhering to your family quest plan',
                    icon: priv.icon || '🍦',
                    type: priv.type || 'unlock_only',
                    timerDurationMinutes: priv.type === 'timer' ? (priv.durationMinutes || 30) : undefined,
                    minDutyPercentage: priv.minDutyPercentage ?? 100,
                    requiresAllDailyDuties: true,
                    assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : [],
                    isActive: true
                };

                const currentPrivileges = settings.privileges || [];
                updateSettings({
                    ...settings,
                    privileges: [...currentPrivileges, newPrivilegeItem]
                });
            }

            setDeployedSummary({
                groupName: selectedPlan.suggestedGroupName,
                questCount: selectedPlan.quests.length,
                planTitle: selectedPlan.title
            });

            addNotification({
                type: 'success',
                message: `🚀 Plan "${selectedPlan.title}" launched with ${selectedPlan.quests.length} quests!`
            });

            setActiveStep('success');
            if (onPlanDeployed && createdGroupId) {
                onPlanDeployed(createdGroupId);
            }
        } catch (err: any) {
            console.error('Failed to deploy plan:', err);
            setError(err.message || 'Failed to deploy the plan into your Donegeon.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
            <div className="bg-stone-900 border border-stone-700/90 rounded-2xl shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[94vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg border border-emerald-500/40">
                            <Sparkles className="w-5 h-5 text-emerald-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-medieval text-emerald-400 font-bold">
                                    The Quest Architect
                                </h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                                    AI Family Strategist
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Describe your goal and purpose — get tailored, actionable plans ready to modify and launch.
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

                {/* Error Banner */}
                {error && (
                    <div className="px-6 py-3 bg-rose-950/70 border-b border-rose-800/80 flex items-center gap-2 text-rose-200 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                    {/* STEP 1: INTAKE */}
                    {activeStep === 'intake' && (
                        <div className="space-y-6">
                            {/* Preset Inspiration Pills */}
                            <div>
                                <label className="block text-xs font-semibold text-stone-400 mb-2">
                                    ✨ Quick Inspiration & Common Family Goals:
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {INSPIRATION_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setGoal(preset.goal);
                                                setPurpose(preset.purpose);
                                                setStrategyStyle(preset.style);
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-750 border border-stone-700 hover:border-emerald-500/50 text-stone-300 transition-all flex items-center gap-1.5"
                                        >
                                            <span>{preset.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Goal & Purpose Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-stone-200">
                                        1. What task, routine, or behavior do you want your kids to do? *
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={goal}
                                        onChange={e => setGoal(e.target.value)}
                                        placeholder="e.g. Feed, walk, and care for the family dog every morning and evening. No fighting over who does what."
                                        className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <p className="text-[11px] text-stone-400">
                                        Be as specific as you like (e.g. times of day, equipment, locations).
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-stone-200">
                                        2. Why is this important? (The Purpose & Value)
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={purpose}
                                        onChange={e => setPurpose(e.target.value)}
                                        placeholder="e.g. Build empathy, consistency, and shared accountability. We want them to feel like a team rather than feeling nagged."
                                        className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <p className="text-[11px] text-stone-400">
                                        The AI will use this underlying purpose to craft motivational quest briefings.
                                    </p>
                                </div>
                            </div>

                            {/* Who is it for? */}
                            <div className="p-4 bg-stone-800/40 rounded-xl border border-stone-700/60 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-bold text-stone-200">
                                            3. Who is this plan for?
                                        </span>
                                    </div>
                                    <span className="text-xs text-stone-400">
                                        {selectedUserIds.length === 0
                                            ? 'Applies to all kids'
                                            : `${selectedUserIds.length} child selected`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {explorers.map(user => {
                                        const isSelected = selectedUserIds.includes(user.id);
                                        const age = getUserAge(user.birthday);

                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => handleToggleUser(user.id)}
                                                className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50'
                                                        : 'bg-stone-850 border-stone-700 text-stone-400 hover:bg-stone-800'
                                                }`}
                                            >
                                                <Avatar user={user} className="w-8 h-8 rounded-full flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-stone-200 truncate">
                                                        {user.gameName}
                                                    </div>
                                                    <div className="text-[10px] text-stone-400">
                                                        {age ? `Age ${age}` : 'Explorer'}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Strategy Style Selector */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-stone-200">
                                    4. Preferred Gamification & Coaching Tone:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    {[
                                        {
                                            id: 'balanced' as const,
                                            icon: Compass,
                                            title: 'Balanced Arc',
                                            desc: 'Balanced rewards, micro-steps, and clear routine accountability.'
                                        },
                                        {
                                            id: 'habit_builder' as const,
                                            icon: Heart,
                                            title: 'Habit Builder',
                                            desc: 'Gentle micro-steps, high encouragement, and low-pressure routine.'
                                        },
                                        {
                                            id: 'epic_adventure' as const,
                                            icon: Shield,
                                            title: 'Epic Adventure',
                                            desc: 'Immersive RPG flavor, knightly rankings, and storytelling lore.'
                                        },
                                        {
                                            id: 'speed_efficiency' as const,
                                            icon: Flame,
                                            title: 'Speed Sprint',
                                            desc: 'Countdown timers, focus sprints, and rapid morning/evening beats.'
                                        }
                                    ].map(style => {
                                        const IconComponent = style.icon;
                                        const isSelected = strategyStyle === style.id;

                                        return (
                                            <div
                                                key={style.id}
                                                onClick={() => setStrategyStyle(style.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50 shadow-md'
                                                        : 'bg-stone-850/60 border-stone-700/80 text-stone-400 hover:bg-stone-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-stone-400'}`} />
                                                    <span className="text-xs font-bold text-stone-200">
                                                        {style.title}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-400 line-clamp-2">
                                                    {style.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: REVIEW & MODIFY PLANS */}
                    {activeStep === 'review' && selectedPlan && (
                        <div className="space-y-6">
                            {/* Plan Switcher Header */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                        Select Strategy:
                                    </span>
                                    <div className="flex gap-2">
                                        {plans.map((p, idx) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedPlanId(p.id)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                                    selectedPlanId === p.id
                                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                                                        : 'bg-stone-800 text-stone-300 hover:bg-stone-750 border border-stone-700'
                                                }`}
                                            >
                                                <span>{idx === 0 ? 'Plan A' : 'Plan B'}</span>
                                                <span className="text-[10px] opacity-80">({p.strategyStyle})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveStep('intake')}
                                    className="text-xs text-stone-400 hover:text-stone-200 underline text-right"
                                >
                                    ← Edit Goal & Purpose
                                </button>
                            </div>

                            {/* Plan Overview Card */}
                            <div className="p-4 bg-emerald-950/30 border border-emerald-600/40 rounded-xl space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-900/50 pb-2">
                                    <div>
                                        <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                                            <span>✨ {selectedPlan.title}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200">
                                                {selectedPlan.strategyStyle}
                                            </span>
                                        </h3>
                                        <p className="text-xs text-stone-300 mt-1">
                                            {selectedPlan.philosophy}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 text-xs pt-1">
                                    <div className="flex-1 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                                        <span className="font-semibold text-amber-400 block mb-0.5">
                                            🎮 Gamification Hook:
                                        </span>
                                        <span className="text-stone-300 text-[11px]">
                                            {selectedPlan.gamificationHook}
                                        </span>
                                    </div>

                                    <div className="flex-1 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                                        <span className="font-semibold text-emerald-400 block mb-0.5">
                                            📂 Suggested Quest Group:
                                        </span>
                                        <input
                                            type="text"
                                            value={selectedPlan.suggestedGroupName}
                                            onChange={e => handleUpdateSelectedPlan(p => ({ ...p, suggestedGroupName: e.target.value }))}
                                            className="w-full bg-stone-850 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Suggested Privilege */}
                                {selectedPlan.suggestedPrivilege && (
                                    <div className="p-3 bg-stone-900/80 rounded-lg border border-purple-900/50 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-1.5 rounded-lg bg-purple-950/80 border border-purple-700/60">
                                                {selectedPlan.suggestedPrivilege.icon}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-purple-300">
                                                        Unlockable Privilege: {selectedPlan.suggestedPrivilege.title}
                                                    </span>
                                                    <span className="text-[10px] text-purple-400 font-mono">
                                                        (100% Chores Required)
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-400">
                                                    {selectedPlan.suggestedPrivilege.description}
                                                </p>
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={includePrivilege}
                                                onChange={e => setIncludePrivilege(e.target.checked)}
                                                className="w-4 h-4 rounded text-emerald-600 bg-stone-800 border-stone-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-xs text-stone-300 font-medium">Include in Launch</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Quests Breakdown & Inline Editor */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                                        <span>Plan Quests & Checkpoints ({selectedPlan.quests.length})</span>
                                        <span className="text-[10px] text-stone-500 font-normal lowercase">
                                            (Click any quest to modify details or checkpoints)
                                        </span>
                                    </h4>
                                </div>

                                <div className="space-y-3">
                                    {selectedPlan.quests.map((quest, qIdx) => {
                                        const isExpanded = expandedQuestId === quest.id;

                                        return (
                                            <div
                                                key={quest.id}
                                                className={`border rounded-xl transition-all ${
                                                    isExpanded
                                                        ? 'bg-stone-850 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/20'
                                                        : 'bg-stone-900/90 border-stone-700/80 hover:border-stone-600'
                                                }`}
                                            >
                                                {/* Quest Header Bar */}
                                                <div
                                                    onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                                                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="text-2xl p-1.5 rounded-lg bg-stone-800 border border-stone-700 flex-shrink-0">
                                                            {quest.icon}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-bold text-stone-200 truncate">
                                                                    {quest.title}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                    quest.type === 'Duty'
                                                                        ? 'bg-sky-950 text-sky-300 border border-sky-600/40'
                                                                        : 'bg-amber-950 text-amber-300 border border-amber-600/40'
                                                                }`}>
                                                                    {quest.type === 'Duty' ? '🔄 Daily Duty' : '🗺️ Venture'}
                                                                </span>
                                                                {quest.timeOfDay && quest.timeOfDay !== 'any' && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                                                                        {quest.timeOfDay === 'morning' ? '🌅 Morning' : quest.timeOfDay === 'evening' ? '🌙 Evening' : '☀️ Afternoon'}
                                                                    </span>
                                                                )}
                                                                {quest.timerMode && quest.timerMode !== 'none' && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {Math.round((quest.timerDurationSeconds || 600) / 60)}m Timer
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-stone-400 truncate mt-0.5">
                                                                {quest.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className="text-xs font-mono font-bold text-amber-400">
                                                            +{quest.suggestedRewardAmount} {quest.suggestedRewardTypeName}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDeleteQuest(quest.id);
                                                            }}
                                                            className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                                                            title="Delete Quest"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-stone-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-stone-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Edit Form */}
                                                {isExpanded && (
                                                    <div className="p-4 border-t border-stone-750 bg-stone-900/60 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                    Emoji Icon
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={quest.icon}
                                                                    onChange={e => handleUpdateQuest(quest.id, { icon: e.target.value })}
                                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-center text-xl text-stone-100"
                                                                    maxLength={4}
                                                                />
                                                            </div>
                                                            <div className="sm:col-span-3">
                                                                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                    Quest Title
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={quest.title}
                                                                    onChange={e => handleUpdateQuest(quest.id, { title: e.target.value })}
                                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-100"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                Briefing Description
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={quest.description}
                                                                onChange={e => handleUpdateQuest(quest.id, { description: e.target.value })}
                                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-100"
                                                            />
                                                        </div>

                                                        {/* Checkpoints (Micro-steps) */}
                                                        <div className="space-y-2 p-3 bg-stone-850/60 rounded-xl border border-stone-750">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                                    <span>Micro-Checkpoints ({quest.checkpoints.length})</span>
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddCheckpoint(quest.id)}
                                                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add Step
                                                                </button>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                {quest.checkpoints.map((cp, cpIdx) => (
                                                                    <div key={cpIdx} className="flex items-center gap-2">
                                                                        <span className="text-xs font-mono text-stone-500 w-5 text-right">
                                                                            {cpIdx + 1}.
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            value={cp}
                                                                            onChange={e => handleUpdateCheckpoint(quest.id, cpIdx, e.target.value)}
                                                                            className="flex-grow bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteCheckpoint(quest.id, cpIdx)}
                                                                            className="p-1 text-stone-500 hover:text-rose-400"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Settings Bar: Assignee, Rewards & Time */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                    Assign To Child
                                                                </label>
                                                                <select
                                                                    value={quest.suggestedChildId || ''}
                                                                    onChange={e => handleUpdateQuest(quest.id, { suggestedChildId: e.target.value || undefined })}
                                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
                                                                >
                                                                    <option value="">✨ All Children</option>
                                                                    {explorers.map(u => (
                                                                        <option key={u.id} value={u.id}>
                                                                            {u.gameName} ({u.firstName})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                    Reward Amount ({quest.suggestedRewardTypeName})
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateQuest(quest.id, {
                                                                            suggestedRewardAmount: Math.max(1, (quest.suggestedRewardAmount || 1) - 1)
                                                                        })}
                                                                        className="w-8 h-8 rounded bg-stone-800 border border-stone-700 text-stone-300 font-bold"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="flex-1 text-center font-mono font-bold text-xs text-amber-400">
                                                                        {quest.suggestedRewardAmount}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateQuest(quest.id, {
                                                                            suggestedRewardAmount: Math.min(10, (quest.suggestedRewardAmount || 1) + 1)
                                                                        })}
                                                                        className="w-8 h-8 rounded bg-stone-800 border border-stone-700 text-stone-300 font-bold"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                                                                    Time of Day
                                                                </label>
                                                                <select
                                                                    value={quest.timeOfDay || 'any'}
                                                                    onChange={e => handleUpdateQuest(quest.id, { timeOfDay: e.target.value as any })}
                                                                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-xs text-stone-200"
                                                                >
                                                                    <option value="any">Any Time</option>
                                                                    <option value="morning">🌅 Morning</option>
                                                                    <option value="afternoon">☀️ Afternoon</option>
                                                                    <option value="evening">🌙 Evening</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Refinement Prompt Bar */}
                            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2">
                                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                                    <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Ask the Assistant to modify or adjust this plan:</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={refinementText}
                                        onChange={e => setRefinementText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && refinementText.trim() && !isRefining) {
                                                handleGeneratePlans(true);
                                            }
                                        }}
                                        placeholder="e.g. 'Make the morning duty simpler for my 7-year-old' or 'Add an evening walk timer'..."
                                        className="flex-grow bg-stone-850 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleGeneratePlans(true)}
                                        disabled={!refinementText.trim() || isRefining}
                                        variant="secondary"
                                        className="flex-shrink-0"
                                    >
                                        {isRefining ? 'Refining...' : '✨ Refine Plan'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS CONFIRMATION */}
                    {activeStep === 'success' && deployedSummary && (
                        <div className="py-8 px-4 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-xl">
                                <Sparkles className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-medieval text-emerald-300 font-bold">
                                Plan Deployed to Donegeon!
                            </h3>
                            <p className="text-sm text-stone-300 max-w-md mx-auto">
                                The <strong className="text-emerald-400">"{deployedSummary.planTitle}"</strong> plan has been activated. 
                                A new Quest Group <strong className="text-stone-100">"{deployedSummary.groupName}"</strong> with {deployedSummary.questCount} quests 
                                has been created and assigned.
                            </p>
                            <div className="pt-4 flex justify-center gap-3">
                                <Button onClick={onClose}>
                                    Done & View Quests
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {activeStep !== 'success' && (
                    <div className="px-6 py-4 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between">
                        {activeStep === 'intake' ? (
                            <>
                                <span className="text-xs text-stone-400">
                                    The Assistant will analyze your purpose and present two balanced plans.
                                </span>
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleGeneratePlans(false)}
                                        disabled={!goal.trim() || isGenerating}
                                        className="shadow-lg shadow-emerald-900/30"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Formulating Plans...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Generate Strategic Plans
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setActiveStep('intake')}
                                >
                                    ← Adjust Goal & Purpose
                                </Button>
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDeployPlan}
                                        disabled={isGenerating || !selectedPlan}
                                        className="!bg-emerald-600 hover:!bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Deploying Quests...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Check className="w-4 h-4" />
                                                Approve & Launch "{selectedPlan.title}"
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestArchitectDialog;
