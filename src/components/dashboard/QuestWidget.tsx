
import React, { useMemo } from 'react';
import { Quest, QuestKind, QuestType, QuestCompletionStatus } from '../../../types';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { isQuestAvailableForUser, formatTimeRemaining, toYMD, getQuestLockStatus } from '../../utils/quests';
import { useCommunityState } from '../../context/CommunityContext';
import { useProgressionState } from '../../context/ProgressionContext';

interface QuestWidgetProps {
    quest: Quest;
    handleQuestSelect: (quest: Quest) => void;
}

const QuestWidget: React.FC<QuestWidgetProps> = ({ quest, handleQuestSelect }) => {
    const { settings, scheduledEvents } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { quests, questCompletions, questGroups } = useQuestsState();
    const { ranks, trophies, userTrophies } = useProgressionState();
    const { gameAssets } = useEconomyState();
    const { guilds } = useCommunityState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const now = new Date();

    if (!currentUser) return null;

    const conditionDependencies = useMemo(() => ({
        ranks, trophies, userTrophies, quests, questGroups, questCompletions, gameAssets, guilds, allConditionSets: settings.conditionSets
    }), [ranks, trophies, userTrophies, quests, questGroups, questCompletions, gameAssets, guilds, settings.conditionSets]);

    const lockStatus = useMemo(() => getQuestLockStatus(quest, currentUser, conditionDependencies), [quest, currentUser, conditionDependencies]);
    const isAvailable = useMemo(() => isQuestAvailableForUser(quest, questCompletions.filter(c => c.userId === currentUser.id), now, scheduledEvents, appMode), [quest, questCompletions, currentUser.id, now, scheduledEvents, appMode]);

    const { borderClass, isDimmed } = useMemo(() => {
        let deadline: Date | null = null;
        let incompleteDeadline: Date | null = null;

        if (quest.type === QuestType.Duty) {
            if (quest.startTime) {
                const [h, m] = quest.startTime.split(':').map(Number);
                deadline = new Date(now);
                deadline.setHours(h, m, 0, 0);
            }
            if (quest.endTime) {
                const [h, m] = quest.endTime.split(':').map(Number);
                incompleteDeadline = new Date(now);
                incompleteDeadline.setHours(h, m, 0, 0);
            }
        } else if (quest.type === QuestType.Venture || quest.type === QuestType.Journey) {
            if (quest.endDateTime) {
                deadline = new Date(quest.endDateTime);
            }
        }

        const isIncomplete = incompleteDeadline && now > incompleteDeadline;
        if (isIncomplete) {
            return { borderClass: 'border-black', isDimmed: true };
        }

        const isPastDue = deadline && now > deadline;
        const timeDiff = deadline ? deadline.getTime() - now.getTime() : Infinity;

        let bClass = 'border-stone-700';

        if (deadline) {
            if (isPastDue) {
                bClass = 'border-red-600 animate-slow-pulse';
            } else if (timeDiff < 60 * 60 * 1000) { // Under 1 hour
                bClass = 'border-orange-500 animate-slow-pulse';
            } else if (timeDiff < 2 * 60 * 60 * 1000) { // Under 2 hours
                bClass = 'border-yellow-500';
            } else {
                bClass = 'border-green-600';
            }
        }
        
        const completionsForUserToday = questCompletions.filter(c => 
            c.questId === quest.id && 
            c.userId === currentUser.id && 
            toYMD(new Date(c.completedAt)) === toYMD(now)
        );

        const isCompletedToday = completionsForUserToday.length > 0;
        const finalDimState = isCompletedToday || !isAvailable;

        return { borderClass: bClass, isDimmed: finalDimState };
    }, [quest, now, questCompletions, currentUser.id, isAvailable]);

    const timeStatusText = useMemo(() => {
        let deadline: Date | null = null;
        let incompleteDeadline: Date | null = null;
    
        if (quest.type === QuestType.Duty) {
            if (quest.startTime) {
                const [h, m] = quest.startTime.split(':').map(Number);
                deadline = new Date(now);
                deadline.setHours(h, m, 0, 0);
            }
            if (quest.endTime) {
                const [h, m] = quest.endTime.split(':').map(Number);
                incompleteDeadline = new Date(now);
                incompleteDeadline.setHours(h, m, 0, 0);
            }
        } else if (quest.type === QuestType.Venture || quest.type === QuestType.Journey) {
            if (quest.endDateTime) {
                deadline = new Date(quest.endDateTime);
            }
        }
    
        if (incompleteDeadline && now > incompleteDeadline) {
            return 'Incomplete';
        }
    
        if (deadline) {
            if (now > deadline) { // Past due
                if (incompleteDeadline) {
                    return `Incomplete in: ${formatTimeRemaining(incompleteDeadline, now)}`;
                }
                return 'Past Due';
            }
            return `Due in: ${formatTimeRemaining(deadline, now)}`;
        }
        
        return 'No due date';
    }, [quest, now]);

    const progressText = useMemo(() => {
        if (lockStatus.isLocked) return 'Locked';
        if (quest.type === QuestType.Journey) {
            const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.questId === quest.id);
            const completed = userCompletions.filter(c => c.status === QuestCompletionStatus.Approved).length;
            const pending = userCompletions.some(c => c.status === QuestCompletionStatus.Pending);
            const total = quest.checkpoints?.length || 0;
            if(pending) return `Awaiting Approval (${completed}/${total})`;
            return `Checkpoint ${completed + 1} / ${total}`;
        }
        if (quest.kind === QuestKind.GuildCollaborative) {
            return `Team Progress: ${(quest.contributions?.length || 0)} / ${quest.completionGoal || 1}`;
        }
        if (quest.requiresClaim) {
            const totalApproved = quest.approvedClaims?.length || 0;
            const limit = quest.claimLimit || 1;
            if (quest.pendingClaims?.some(c => c.userId === currentUser.id)) return 'Claim Pending';
            if (quest.approvedClaims?.some(c => c.userId === currentUser.id)) return 'Claimed by You';
            return `Claims: ${totalApproved}/${limit}`;
        }
        return timeStatusText;
    }, [quest, currentUser.id, questCompletions, timeStatusText, lockStatus]);
    
    const getRewardInfo = (id: string) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    
    const isRedemption = quest.kind === QuestKind.Redemption;
    let baseCardClass = 'bg-stone-800/60';
    if (quest.type === QuestType.Duty) baseCardClass = 'bg-sky-900/30';
    if (quest.type === QuestType.Venture) baseCardClass = 'bg-amber-900/30';
    if (quest.type === QuestType.Journey) baseCardClass = 'bg-purple-900/30';
    if (isRedemption) baseCardClass = 'bg-slate-800/50';
    
    const optionalClass = quest.isOptional ? 'border-dashed' : '';
    const finalBorderClass = `${borderClass} ${optionalClass}`;

    const hasPendingCompletion = quest.type === QuestType.Journey && questCompletions.some(c => c.questId === quest.id && c.userId === currentUser.id && c.status === QuestCompletionStatus.Pending);
    const cardIsDimmed = (isDimmed || lockStatus.isLocked) && !hasPendingCompletion;

    return (
        <button
            onClick={() => handleQuestSelect(quest)}
            className={`relative w-full text-left p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 grid grid-cols-1 md:grid-cols-3 gap-2 items-center ${baseCardClass} ${finalBorderClass} ${cardIsDimmed ? 'opacity-50' : ''}`}
        >
             {lockStatus.isLocked && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center z-10">
                    <span className="text-3xl" role="img" aria-label="Locked">🔒</span>
                </div>
            )}
            <div className="md:col-span-1 truncate">
                <p className="font-semibold text-stone-100 flex items-center gap-2 truncate" title={quest.title}>
                    {isRedemption && <span title="Redemption Quest">⚖️</span>}
                    <span className="text-xl">{quest.icon}</span> 
                    <span className="truncate">{quest.title}</span>
                </p>
            </div>
            <p className="text-xs text-stone-400 md:col-span-1 md:text-center truncate">{progressText}</p>
            {quest.rewards.length > 0 ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold md:col-span-1 md:justify-end">
                    {quest.rewards.map(r => {
                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-accent-light flex items-center gap-1" title={name}>+{r.amount} <span className="text-base">{icon}</span></span>
                    })}
                </div>
            ) : <div />}
        </button>
    );
};

export default QuestWidget;
