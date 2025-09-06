
import React, { useMemo } from 'react';
import { Quest, User, ConditionSet, QuestCompletionStatus, QuestType } from '../../types';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';
import { checkCondition, getConditionDescription, ConditionDependencies } from '../../utils/conditions';
import { toYMD } from '../../utils/quests';
import { isQuestVisibleToUserInMode } from '../../utils/conditions';
import { useUIState } from '../../context/UIContext';

interface QuestConditionStatusDialogProps {
  quest: Quest;
  user: User;
  onClose: () => void;
}

const QuestConditionStatusDialog: React.FC<QuestConditionStatusDialogProps> = ({ quest, user, onClose }) => {
    const { settings } = useSystemState();
    const { quests, questGroups, questCompletions } = useQuestsState();
    const { ranks, userTrophies, trophies } = useProgressionState();
    const { gameAssets } = useEconomyState();
    const { guilds } = useCommunityState();
    const { appMode } = useUIState();
    const todayYMD = toYMD(new Date());

    const dependencies: ConditionDependencies = {
        ranks, questCompletions, quests, questGroups, userTrophies, trophies, gameAssets, guilds, appMode
    };
    
    const conditionSets = useMemo(() => {
        const questSetIds = new Set(quest.conditionSetIds || []);
        const globalSetIds = new Set(settings.conditionSets.filter(cs => cs.isGlobal).map(cs => cs.id));
        
        const allApplicableSetIds = new Set([...questSetIds, ...globalSetIds]);
        
        return settings.conditionSets.filter(cs => allApplicableSetIds.has(cs.id));
    }, [settings.conditionSets, quest.conditionSetIds]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-amber-400">Quest Locked</h2>
                    <p className="text-stone-300">You must meet the following requirements to access "{quest.title}":</p>
                </div>

                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide space-y-4">
                    {conditionSets.map(set => (
                        <div key={set.id} className="p-3 bg-stone-900/50 rounded-lg">
                            <h3 className="font-bold text-lg text-stone-200">{set.name}</h3>
                            <p className="text-xs text-stone-500 mb-2">
                                You must meet {set.logic === 'ALL' ? 'ALL' : 'ANY'} of these conditions:
                            </p>
                            <ul className="space-y-3">
                                {set.conditions.map(condition => {
                                    const isMet = checkCondition(condition, user, dependencies, quest.id);
                                    const description = getConditionDescription(condition, dependencies);
                                    
                                    let subList: React.ReactNode = null;
                                    if (condition.type === 'QUEST_GROUP_COMPLETED') {
                                        const group = dependencies.questGroups.find(g => g.id === condition.questGroupId);
                                        if (group) {
                                            const questsInGroup = dependencies.quests.filter(q => 
                                                q.groupIds?.includes(group.id) &&
                                                // FIX: Pass user.id instead of the full user object to isQuestVisibleToUserInMode.
                                                isQuestVisibleToUserInMode(q, user.id, appMode)
                                            );
                                            subList = (
                                                <ul className="pl-8 mt-1 space-y-1">
                                                    {questsInGroup.map(q => {
                                                        const completion = dependencies.questCompletions
                                                            .slice()
                                                            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                                                            .find(c => {
                                                                if (c.userId !== user.id || c.questId !== q.id || c.status !== QuestCompletionStatus.Approved) {
                                                                    return false;
                                                                }
                                                                // For a recurring quest (Duty), it must be completed today.
                                                                if (q.type === QuestType.Duty) {
                                                                    return toYMD(new Date(c.completedAt)) === todayYMD;
                                                                }
                                                                // For a one-time quest (Venture/Journey), any completion is sufficient.
                                                                return true;
                                                            });

                                                        const isQuestCompleted = !!completion;

                                                        return (
                                                            <li key={q.id} className="flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    {isQuestCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XCircleIcon className="w-4 h-4 text-red-500" />}
                                                                    <span className={isQuestCompleted ? 'text-stone-500 line-through' : 'text-stone-300'}>{q.title}</span>
                                                                </div>
                                                                {isQuestCompleted && (
                                                                    <span className="text-stone-500">
                                                                        {new Date(completion.completedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            );
                                        }
                                    }
                                    
                                    return (
                                        <li key={condition.id}>
                                            <div className="flex items-start gap-3 text-sm">
                                                {isMet ? (
                                                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                )}
                                                <span className={isMet ? 'text-stone-400 line-through' : 'text-stone-200'}>
                                                    {description}
                                                </span>
                                            </div>
                                            {subList}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 bg-black/20 rounded-b-xl flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default QuestConditionStatusDialog;
