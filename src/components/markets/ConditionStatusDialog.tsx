import React from 'react';
import { Market, User, ConditionSet } from '../../../types';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';
import { checkCondition, getConditionDescription, ConditionDependencies } from '../../utils/conditions';

interface ConditionStatusDialogProps {
  market: Market;
  user: User;
  onClose: () => void;
}

const ConditionStatusDialog: React.FC<ConditionStatusDialogProps> = ({ market, user, onClose }) => {
    const { settings } = useSystemState();
    const { quests, questGroups, questCompletions } = useQuestsState();
    const { ranks, userTrophies, trophies } = useProgressionState();
    const { gameAssets } = useEconomyState();
    const { guilds } = useCommunityState();

    const dependencies: ConditionDependencies = {
        ranks, questCompletions, quests, questGroups, userTrophies, trophies, gameAssets, guilds
    };

    const conditionSets = settings.conditionSets.filter(cs => market.status.type === 'conditional' && market.status.conditionSetIds.includes(cs.id));

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-amber-400">Market Locked</h2>
                    <p className="text-stone-300">You must meet the following requirements to access "{market.title}":</p>
                </div>

                <div className="p-6 flex-grow overflow-y-auto scrollbar-hide space-y-4">
                    {conditionSets.map(set => (
                        <div key={set.id} className="p-3 bg-stone-900/50 rounded-lg">
                            <h3 className="font-bold text-lg text-stone-200">{set.name}</h3>
                            <p className="text-xs text-stone-500 mb-2">
                                You must meet {set.logic === 'ALL' ? 'ALL' : 'ANY'} of these conditions:
                            </p>
                            <ul className="space-y-2">
                                {set.conditions.map(condition => {
                                    const isMet = checkCondition(condition, user, dependencies);
                                    const description = getConditionDescription(condition, dependencies);
                                    return (
                                        <li key={condition.id} className="flex items-center gap-3 text-sm">
                                            {isMet ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                                            ) : (
                                                <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            )}
                                            <span className={isMet ? 'text-stone-400 line-through' : 'text-stone-200'}>
                                                {description}
                                            </span>
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

export default ConditionStatusDialog;
