import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { Role, Trophy, UserTrophy, TrophyRequirementType, QuestType, QuestCompletionStatus, Quest, AppMode, User } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fromYMD } from '../../utils/quests';
import EmptyState from '@/components/ui/empty-state';
import DynamicIcon from '@/components/ui/dynamic-icon';
import ImagePreviewDialog from '@/components/ui/image-preview-dialog';

const TrophiesPage: React.FC = () => {
    const { currentUser, trophies, userTrophies, appMode, settings, questCompletions, quests, ranks } = useAppState();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const RequirementStatus: React.FC<{ trophy: Trophy }> = ({ trophy }) => {
        if (!currentUser || trophy.isManual) return null;

        if (appMode.mode === 'guild') {
            return <p className="mt-2 text-xs italic text-muted-foreground">Progress for automatic trophies is tracked in your Personal scope.</p>;
        }

        const userCompletedQuests = questCompletions.filter(c => c.userId === currentUser.id && !c.guildId && c.status === QuestCompletionStatus.Approved);
        const totalXp = Object.values(currentUser.personalExperience).reduce((sum: number, amount: number) => sum + amount, 0);
        const userRank = ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);

        return (
            <div className="mt-2 text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">Requirements:</p>
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
                           <span className={`font-semibold ml-1 ${progressText.includes('Achieved') ? 'text-green-400' : 'text-primary'}`}>{progressText}</span>
                        </div>
                    );
                })}
            </div>
        )
    };

    const TrophyCard: React.FC<{ trophy: Trophy & { awardedAt?: string }, isEarned: boolean }> = ({ trophy, isEarned }) => (
        <div className={`bg-card p-4 rounded-lg flex flex-col items-center text-center transition-all duration-200 ${!isEarned ? 'opacity-60' : ''}`}>
            <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center overflow-hidden ${isEarned ? 'bg-amber-900/50' : 'bg-background'}`}>
                <button
                    onClick={() => trophy.iconType === 'image' && trophy.imageUrl && setPreviewImageUrl(trophy.imageUrl)}
                    disabled={trophy.iconType !== 'image' || !trophy.imageUrl}
                    className="w-full h-full disabled:cursor-default"
                >
                    <DynamicIcon iconType={trophy.iconType} icon={trophy.icon} imageUrl={trophy.imageUrl} className="w-full h-full text-4xl" altText={`${trophy.name} trophy icon`} />
                </button>
            </div>
            <h4 className={`font-bold text-lg ${isEarned ? 'text-amber-300' : 'text-foreground'}`}>{trophy.name}</h4>
            <p className="text-muted-foreground text-sm mt-1 flex-grow">{trophy.description}</p>
            {isEarned && trophy.awardedAt && (
                 <p className="text-xs text-muted-foreground/70 mt-2">Awarded: {fromYMD(trophy.awardedAt).toLocaleDateString()}</p>
            )}
            {!isEarned && <RequirementStatus trophy={trophy} />}
        </div>
    );

    const [myEarnedTrophyAwards, availableTrophies] = useMemo(() => {
        if (!currentUser) return [[], []];

        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        const earnedAwards = userTrophies.filter(ut => ut.userId === currentUser.id && ut.guildId === currentGuildId);
        const earnedIds = new Set(earnedAwards.map(ut => ut.trophyId));
        const available = trophies.filter(t => !earnedIds.has(t.id));
        
        return [earnedAwards, available];
    }, [currentUser, trophies, userTrophies, appMode]);
    
    const earnedTrophiesWithDate = useMemo(() => {
        return myEarnedTrophyAwards.map(award => {
            const trophyDetails = trophies.find(t => t.id === award.trophyId);
            return trophyDetails ? { ...trophyDetails, awardedAt: award.awardedAt } : null;
        }).filter((t): t is Trophy & { awardedAt: string } => t !== null)
          .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
    }, [myEarnedTrophyAwards, trophies]);

    if (!currentUser) return null;

    return (
        <div>
            <Card className="mb-8">
              <CardHeader><CardTitle>My {settings.terminology.award} Case</CardTitle></CardHeader>
              <CardContent>
                {earnedTrophiesWithDate.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {earnedTrophiesWithDate.map(trophy => <TrophyCard key={trophy.id} trophy={trophy} isEarned={true} />)}
                    </div>
                ) : (
                    <EmptyState
                        title={`No ${settings.terminology.awards} Earned Yet`}
                        message={`You haven't earned any ${settings.terminology.awards.toLowerCase()} in this mode yet. Keep questing!`}
                    />
                )}
              </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Available {settings.terminology.awards}</CardTitle></CardHeader>
                <CardContent>
                    {availableTrophies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {availableTrophies.map(trophy => <TrophyCard key={trophy.id} trophy={trophy} isEarned={false} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Congratulations! You have earned all available {settings.terminology.awards.toLowerCase()}!</p>
                    )}
                </CardContent>
            </Card>

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Trophy icon preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default TrophiesPage;