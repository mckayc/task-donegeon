


import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { Role, Trophy, UserTrophy, TrophyRequirementType, QuestType, QuestCompletionStatus, Quest } from '../../types';
import Card from '../ui/Card';
import { TrophyIcon } from '../ui/Icons';
import { fromYMD } from '../../utils/quests';

const RequirementStatus: React.FC<{ trophy: Trophy }> = ({ trophy }) => {
    const { currentUser, questCompletions, quests, ranks, appMode } = useAppState();
    if (!currentUser || trophy.isManual) return null;

    if (appMode.mode === 'guild') {
        return <p className="mt-2 text-xs italic text-stone-500">Progress for automatic trophies is tracked in your Personal scope.</p>;
    }

    const userCompletedQuests = questCompletions.filter(c => c.userId === currentUser.id && !c.guildId && c.status === QuestCompletionStatus.Approved);
    const totalXp = Object.values(currentUser.personalExperience).reduce((sum: number, amount: number) => sum + amount, 0);
    const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

    return (
        <div className="mt-2 text-xs space-y-1 text-stone-400">
            <p className="font-bold text-stone-300">Requirements:</p>
            {trophy.requirements.map((req, index) => {
                let progressText = '';
                let requirementText = '';

                switch (req.type) {
                    case TrophyRequirementType.CompleteQuestType:
                        const completedCount = userCompletedQuests.filter(c => quests.find(q => q.id === c.questId)?.type === req.value).length;
                        requirementText = `Complete ${req.count} quest(s) of type: ${req.value}.`;
                        progressText = `(${Math.min(completedCount, req.count)}/${req.count})`;
                        break;
                    case TrophyRequirementType.CompleteQuestTag:
                        const completedTagCount = userCompletedQuests.filter(c => quests.find(q => q.id === c.questId)?.tags?.includes(req.value)).length;
                        requirementText = `Complete ${req.count} quest(s) with tag: "${req.value}".`;
                        progressText = `(${Math.min(completedTagCount, req.count)}/${req.count})`;
                        break;
                    case TrophyRequirementType.AchieveRank:
                        const rankName = ranks.find(r => r.id === req.value)?.name || 'Unknown Rank';
                        const hasRank = userRank?.id === req.value;
                        requirementText = `Achieve the rank of: ${rankName}.`;
                        progressText = hasRank ? '(Achieved)' : '(Not yet achieved)';
                        break;
                    default:
                        return null;
                }
                return (
                    <div key={index}>
                       <span>{requirementText}</span>
                       <span className={`font-semibold ml-1 ${progressText.includes('Achieved') ? 'text-green-400' : 'text-emerald-400'}`}>{progressText}</span>
                    </div>
                );
            })}
        </div>
    )
};

const TrophyCard: React.FC<{ trophy: Trophy & { awardedAt?: string }, isEarned: boolean }> = ({ trophy, isEarned }) => (
    <div className={`bg-stone-800/70 p-4 rounded-lg flex flex-col items-center text-center transition-all duration-200 ${!isEarned ? 'opacity-60' : ''}`}>
        <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center ${isEarned ? 'bg-amber-900/50' : 'bg-stone-700'}`}>
            <span className="text-4xl">{trophy.icon}</span>
        </div>
        <h4 className={`font-bold text-lg ${isEarned ? 'text-amber-300' : 'text-stone-300'}`}>{trophy.name}</h4>
        <p className="text-stone-400 text-sm mt-1 flex-grow">{trophy.description}</p>
        {isEarned && trophy.awardedAt && (
             <p className="text-xs text-stone-500 mt-2">Awarded: {fromYMD(trophy.awardedAt).toLocaleDateString()}</p>
        )}
        {!isEarned && <RequirementStatus trophy={trophy} />}
    </div>
);

const TrophiesPage: React.FC = () => {
    const { currentUser, trophies, userTrophies, appMode } = useAppState();

    const [myEarnedTrophyAwards, myEarnedTrophyIds, availableTrophies] = useMemo(() => {
        if (!currentUser) return [[], new Set(), []];

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const earnedAwards = userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId === currentGuildId);
        const earnedIds = new Set(earnedAwards.map(ut => ut.trophyId));
        const available = trophies.filter(t => !earnedIds.has(t.id));
        
        return [earnedAwards, earnedIds, available];
    }, [currentUser, trophies, userTrophies, appMode]);
    
    const earnedTrophiesWithDate = useMemo(() => {
        return myEarnedTrophyAwards.map(award => {
            const trophyDetails = trophies.find(t => t.id === award.trophyId);
            return trophyDetails ? { ...trophyDetails, awardedAt: award.awardedAt } : null;
        }).filter((t): t is Trophy & { awardedAt: string } => t !== null)
          .sort((a, b) => fromYMD(b.awardedAt).getTime() - fromYMD(a.awardedAt).getTime());
    }, [myEarnedTrophyAwards, trophies]);

    if (!currentUser) return null;

    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">Trophy Hall</h1>

            <Card title="My Trophy Case" titleIcon={<TrophyIcon />} className="mb-8">
                {earnedTrophiesWithDate.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {earnedTrophiesWithDate.map(trophy => <TrophyCard key={trophy.id} trophy={trophy} isEarned={true} />)}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center">You haven't earned any trophies in this mode yet. Keep questing!</p>
                )}
            </Card>

             <Card title="Available Trophies">
                {availableTrophies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {availableTrophies.map(trophy => <TrophyCard key={trophy.id} trophy={trophy} isEarned={false} />)}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center">Congratulations! You have earned all available trophies!</p>
                )}
            </Card>
        </div>
    );
};

export default TrophiesPage;