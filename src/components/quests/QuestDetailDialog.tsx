import React, { useEffect, useMemo, useState } from 'react';
import { Quest, RewardCategory, RewardItem, QuestType, QuestCompletionStatus, User, QuestMediaType } from '../../types';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import { CheckCircleIcon, SparklesIcon } from '../user-interface/Icons';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import AiTeacherPanel from '../chat/AiTeacherPanel';
import AiStoryPanel from '../chat/AiStoryPanel';
import VideoPlayerOverlay from '../video/VideoPlayerOverlay';
import { useUIDispatch, useUIState } from '../../context/UIContext';

interface QuestDetailDialogProps {
  quest: Quest;
  onClose: () => void;
  onComplete?: (duration?: number) => void;
  onToggleTodo?: () => void;
  isTodo?: boolean;
  dialogTitle?: string;
  userForView?: User;
}

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const QuestDetailDialog: React.FC<QuestDetailDialogProps> = ({ quest, onClose, onComplete, onToggleTodo, isTodo, dialogTitle, userForView }) => {
    const { settings } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { questCompletions } = useQuestsState();
    const { currentUser: loggedInUser } = useAuthState();
    const { completeCheckpoint, claimQuest, unclaimQuest } = useQuestsDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { setReadingPdfQuest, startTimer, stopTimer, pauseTimer, resumeTimer } = useUIDispatch();
    const { activeTimer } = useUIState();
    
    const [isAiTeacherOpen, setIsAiTeacherOpen] = useState(false);
    const [isAiStoryOpen, setIsAiStoryOpen] = useState(false);
    const [isQuizPassed, setIsQuizPassed] = useState(false);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
    const [displaySeconds, setDisplaySeconds] = useState(0);

    const currentUser = userForView || loggedInUser;

    const thisQuestsTimer = useMemo(() => {
        if (!currentUser) return null;
        return (activeTimer && activeTimer.questId === quest.id && activeTimer.userId === currentUser.id) ? activeTimer : null;
    }, [activeTimer, quest.id, currentUser]);

    useEffect(() => {
        if (!quest.timerConfig) return;

        const isCountdown = quest.timerConfig.mode === 'countdown';
        const duration = quest.timerConfig.durationSeconds || 0;

        if (thisQuestsTimer && !thisQuestsTimer.isPaused) {
            const interval = setInterval(() => {
                const elapsed = (Date.now() - thisQuestsTimer.startTime + thisQuestsTimer.pausedTime) / 1000;
                const remaining = duration - elapsed;
                setDisplaySeconds(isCountdown ? Math.max(0, remaining) : elapsed);
            }, 1000);
            return () => clearInterval(interval);
        } else if (thisQuestsTimer && thisQuestsTimer.isPaused) {
            const elapsed = (thisQuestsTimer.pauseStartTime! - thisQuestsTimer.startTime + thisQuestsTimer.pausedTime) / 1000;
            const remaining = duration - elapsed;
            setDisplaySeconds(isCountdown ? Math.max(0, remaining) : elapsed);
        } else {
            setDisplaySeconds(isCountdown ? duration : 0);
        }
    }, [thisQuestsTimer, quest.timerConfig]);

    useEffect(() => {
        if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Opened Quest Detail dialog for "${quest.title}".` });
        }
    }, [quest.title]);

    const handleClose = () => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Closed Quest Detail dialog for "${quest.title}".` });
        }
        onClose();
    };

    const handleComplete = () => {
        if (quest.type === QuestType.Journey && currentUser) {
            const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.questId === quest.id);
            const approvedCount = userCompletions.filter(c => c.status === QuestCompletionStatus.Approved).length;
            const currentCheckpoint = quest.checkpoints?.[approvedCount];

            if (currentCheckpoint) {
                 completeCheckpoint(quest.id, currentUser.id);
                 addNotification({ type: 'success', message: 'Checkpoint submitted!' });
            }
            onClose();
        } else if (onComplete) {
            if (bugLogger.isRecording()) {
                bugLogger.add({ type: 'ACTION', message: `Clicked 'Complete' in Quest Detail dialog for "${quest.title}".` });
            }
            onComplete();
        }
    };
    
    const getRewardInfo = (id: string) => {
        const rewardDef = rewardTypes.find(rt => rt.id === id);
        return { name: rewardDef?.name || 'Unknown Reward', icon: rewardDef?.icon || '❓' };
    };

    const renderRewardList = (rewards: RewardItem[], title: string, colorClass: string, isObfuscated: boolean = false) => {
        if (!rewards || rewards.length === 0) return null;
        return (
            <div>
                <p className={`text-xs font-semibold ${colorClass} uppercase tracking-wider`}>{title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold mt-1">
                    {rewards.map(r => {
                        const { name, icon } = getRewardInfo(r.rewardTypeId);
                        const prefix = title.toLowerCase().includes(settings.terminology.negativePoint.toLowerCase()) ? '- ' : '+ ';
                        return <span key={`${r.rewardTypeId}-${r.amount}`} className="text-stone-300 flex items-center gap-1" title={name}>
                            {isObfuscated ? `??` : `${prefix}${r.amount}`} <span className="text-base">{icon}</span>
                        </span>
                    })}
                </div>
            </div>
        );
    }
    
    const { completedCount, hasPendingCompletion } = useMemo(() => {
        if (!currentUser || quest.type !== QuestType.Journey) return { completedCount: 0, hasPendingCompletion: false };
        const userCompletions = questCompletions.filter(c => c.userId === currentUser.id && c.questId === quest.id);
        const approved = userCompletions.filter(c => c.status === QuestCompletionStatus.Approved).length;
        const pending = userCompletions.some(c => c.status === QuestCompletionStatus.Pending);
        return { completedCount: approved, hasPendingCompletion: pending };
    }, [quest.id, quest.type, currentUser, questCompletions]);

    const journeyProgress = useMemo(() => {
        if (quest.type !== QuestType.Journey || !currentUser) return { completed: 0, total: 0, currentIdx: 0 };
        const total = quest.checkpoints?.length || 0;
        return { completed: completedCount, total, currentIdx: completedCount };
    }, [quest.type, quest.checkpoints, currentUser, completedCount]);
    
    const handleStopAndComplete = () => {
        if (thisQuestsTimer && onComplete) {
            const now = Date.now();
            const elapsed = thisQuestsTimer.isPaused
                ? thisQuestsTimer.pauseStartTime! - thisQuestsTimer.startTime + thisQuestsTimer.pausedTime
                : now - thisQuestsTimer.startTime + thisQuestsTimer.pausedTime;
            
            const finalDurationSeconds = Math.round(elapsed / 1000);
            stopTimer();
            onComplete(finalDurationSeconds);
        }
    };

    const handleClaim = () => {
        if (!currentUser) return;
        claimQuest(quest.id, currentUser.id);
        onClose();
    };
    const handleUnclaim = () => {
        if (!currentUser) return;
        unclaimQuest(quest.id, currentUser.id);
        onClose();
    };
    const handleCancelClaim = () => {
        if (!currentUser) return;
        unclaimQuest(quest.id, currentUser.id);
        onClose();
    };
    const handleOpenPdfReader = () => {
        setReadingPdfQuest(quest);
        onClose();
    };

    const renderActionButtons = () => {
        if (onComplete) {
            if (quest.timerConfig) {
                // Logic for TIMED quests that can be completed
                if (thisQuestsTimer) {
                    // Timer is active: Button should stop timer and complete.
                    // Countdown quests can now be completed at any time.
                    return (
                        <Button onClick={handleStopAndComplete}>
                            Stop & Complete
                        </Button>
                    );
                } else {
                    // Timer is NOT active: Button for manual completion.
                    // We need to check for Journey/AI logic here too.
                    const isJourney = quest.type === QuestType.Journey;
                    const isAiQuest = quest.mediaType === QuestMediaType.AITeacher;
                    const canCompleteAiQuest = isAiQuest && isQuizPassed;
                    const disabled = (isJourney && hasPendingCompletion) || (isAiQuest && !canCompleteAiQuest);
                    
                    let buttonText = 'Complete Manually';
                    if (isJourney) {
                        buttonText = disabled ? 'Awaiting Approval' : `Complete Checkpoint ${journeyProgress.completed + 1}`;
                    } else if (isAiQuest) {
                        buttonText = canCompleteAiQuest ? 'Submit Completion' : 'Pass Quiz to Complete';
                    }
    
                    return <Button onClick={handleComplete} disabled={disabled}>{buttonText}</Button>;
                }
            } else {
                // Logic for NON-TIMED quests that can be completed
                const isJourney = quest.type === QuestType.Journey;
                const isAiQuest = quest.mediaType === QuestMediaType.AITeacher;
                const canCompleteAiQuest = isAiQuest && isQuizPassed;
                const disabled = (isJourney && hasPendingCompletion) || (isAiQuest && !canCompleteAiQuest);
                
                let buttonText = 'Complete';
                if (isJourney) {
                    buttonText = disabled ? 'Awaiting Approval' : `Complete Checkpoint ${journeyProgress.completed + 1}`;
                } else if (isAiQuest) {
                    buttonText = canCompleteAiQuest ? 'Submit Completion' : 'Pass Quiz to Complete';
                }
    
                return <Button onClick={handleComplete} disabled={disabled}>{buttonText}</Button>;
            }
        }
    
        // Logic for claimable quests (when onComplete is not provided)
        if (!currentUser || userForView) return null;
        const isClaimableType = quest.type === QuestType.Venture || quest.type === QuestType.Journey;
        if (quest.requiresClaim && isClaimableType) {
            const userPendingClaim = quest.pendingClaims?.find(c => c.userId === currentUser.id);
            const userApprovedClaim = quest.approvedClaims?.find(c => c.userId === currentUser.id);
            const isClaimLimitReached = (quest.approvedClaims?.length || 0) >= (quest.claimLimit || 1);
    
            if (userPendingClaim) return <><Button variant="secondary" onClick={handleCancelClaim}>Cancel Claim</Button><Button disabled>Claim Pending</Button></>;
            if (userApprovedClaim) return <><Button variant="secondary" onClick={handleUnclaim}>Unclaim</Button><Button onClick={handleComplete}>Complete Quest</Button></>;
            if (isClaimLimitReached && !userApprovedClaim) return <Button disabled>Claim Limit Reached</Button>;
            return <Button onClick={handleClaim}>Claim Quest</Button>;
        }
        
        return null;
    };

    const themeClasses = quest.type === QuestType.Duty ? 'bg-sky-950 border-sky-800' : quest.type === QuestType.Journey ? 'bg-purple-950 border-purple-800' : 'bg-amber-950 border-amber-800';
    const todoClass = isTodo ? '!border-purple-500 ring-2 ring-purple-500/50' : '';
    
    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]" onClick={handleClose}>
                <div className={`backdrop-blur-sm border rounded-xl shadow-2xl max-w-lg w-full ${themeClasses} ${todoClass}`} onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-white/10">{dialogTitle && <p className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">{dialogTitle}</p>}
                        <div className="flex items-start gap-4"><div className="text-4xl mt-1">{quest.icon || '📝'}</div>
                            <div><h2 className="text-2xl font-medieval text-accent">{quest.title}</h2>
                                {quest.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{quest.tags.map(tag => <span key={tag} className="text-xs bg-black/20 text-stone-300 px-2 py-0.5 rounded-full">{tag}</span>)}</div>}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">
                        {quest.timerConfig && currentUser && (
                            <div className="p-4 bg-black/30 rounded-lg text-center space-y-3">
                                <div className="font-mono text-5xl font-bold text-emerald-300">
                                    {formatTime(Math.round(displaySeconds))}
                                </div>
                                <div className="flex justify-center gap-3">
                                    {!thisQuestsTimer && <Button onClick={() => startTimer(quest.id, currentUser.id)}>Start Timer</Button>}
                                    {thisQuestsTimer && !thisQuestsTimer.isPaused && <Button onClick={pauseTimer}>Pause</Button>}
                                    {thisQuestsTimer && thisQuestsTimer.isPaused && <Button onClick={resumeTimer}>Resume</Button>}
                                </div>
                            </div>
                        )}
                        <p className="text-stone-300 whitespace-pre-wrap">{quest.description || 'No description provided.'}</p>
                        {(quest.startDateTime || quest.startTime || quest.endDateTime || quest.endTime) && <div className="space-y-2 pt-4 border-t border-white/10"><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Deadlines</p><div className="text-sm space-y-1 text-stone-200">{quest.startDateTime && <p><span className="font-semibold text-green-400">Starts:</span> {new Date(quest.startDateTime).toLocaleString()}</p>}{quest.startTime && <p><span className="font-semibold text-green-400">Due:</span> Daily at {new Date(`1970-01-01T${quest.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>}{quest.endDateTime && <p><span className="font-semibold text-red-400">Due:</span> {new Date(quest.endDateTime).toLocaleString()}</p>}{quest.endTime && <p><span className="font-semibold text-amber-400">Incomplete at:</span> Daily at {new Date(`1970-01-01T${quest.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</p>}</div></div>}
                        {quest.type === QuestType.Journey && quest.checkpoints && <div className="space-y-3 pt-4 border-t border-white/10"><h3 className="font-bold text-lg text-stone-200">Checkpoints ({journeyProgress.completed}/{journeyProgress.total})</h3>{quest.checkpoints.map((cp, idx) => { const isCompleted = idx < journeyProgress.completed; const isCurrent = idx === journeyProgress.currentIdx; const isObfuscated = isCurrent && hasPendingCompletion; return <div key={cp.id} className={`p-3 rounded-lg border-l-4 transition-all duration-300 ${isCompleted ? 'bg-green-950/50 border-green-600' : isCurrent ? 'bg-blue-950/50 border-blue-500' : 'bg-stone-800/50 border-stone-600'}`}><div className="flex items-center gap-2">{isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />}<p className={`font-semibold ${isCompleted ? 'text-stone-400 line-through' : 'text-stone-200'}`}>Checkpoint {idx + 1}</p></div><p className={`text-sm text-stone-300 mt-1 transition-all duration-300 ${isObfuscated ? 'filter blur-sm select-none' : ''}`}>{isObfuscated ? 'Awaiting approval...' : cp.description}</p><div className="mt-2">{renderRewardList(cp.rewards, `Checkpoint ${settings.terminology.points}`, 'text-sky-400', isObfuscated)}</div></div>; })}</div>}
                        <div className="space-y-3 pt-4 border-t border-white/10">{renderRewardList(quest.rewards, `Final ${settings.terminology.points}`, 'text-green-400')}{renderRewardList(quest.lateSetbacks, `Late ${settings.terminology.negativePoints}`, 'text-yellow-400')}{renderRewardList(quest.incompleteSetbacks, `Incomplete ${settings.terminology.negativePoints}`, 'text-red-400')}</div>
                    </div>
                    <div className="p-4 bg-black/20 rounded-b-xl flex justify-between items-center gap-2 flex-wrap">
                        <Button variant="secondary" onClick={handleClose}>Close</Button>
                        <div className="flex items-center gap-4">
                            {quest.mediaType === QuestMediaType.AITeacher && <Button variant="secondary" onClick={() => setIsAiTeacherOpen(true)}><SparklesIcon className="w-5 h-5 mr-2" />AI Teacher</Button>}
                            {quest.mediaType === QuestMediaType.AIStory && <Button variant="secondary" onClick={() => setIsAiStoryOpen(true)}><SparklesIcon className="w-5 h-5 mr-2" />Read AI Story</Button>}
                            {quest.mediaType === QuestMediaType.Video && quest.videoUrl && <Button variant="secondary" onClick={() => setIsVideoPlayerOpen(true)}>▶️ Watch Video</Button>}
                            {quest.pdfUrl && <Button variant="secondary" onClick={handleOpenPdfReader}>📖 Read PDF</Button>}
                            {onToggleTodo && quest.type === QuestType.Venture && <ToggleSwitch enabled={!!isTodo} setEnabled={() => onToggleTodo()} label="To-Do"/>}
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>
            </div>
            {isAiTeacherOpen && currentUser && <AiTeacherPanel quest={quest} user={currentUser} onClose={() => setIsAiTeacherOpen(false)} onQuizPassed={() => setIsQuizPassed(true)}/>}
            {isAiStoryOpen && currentUser && <AiStoryPanel quest={quest} user={currentUser} onClose={() => setIsAiStoryOpen(false)} onStoryFinished={handleComplete}/>}
            {isVideoPlayerOpen && quest.videoUrl && <VideoPlayerOverlay videoUrl={quest.videoUrl} onClose={() => setIsVideoPlayerOpen(false)}/>}
        </>
    );
};

export default QuestDetailDialog;
