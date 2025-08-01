import React, { useMemo, useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { Rank } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { RankIcon } from '@/components/ui/Icons';
import DynamicIcon from '../ui/DynamicIcon';
import ImagePreviewDialog from '../ui/ImagePreviewDialog';

const RanksPage: React.FC = () => {
    const { currentUser, ranks, appMode } = useAppState();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const { totalXp, sortedRanks } = useMemo(() => {
        if (!currentUser || !ranks) {
            return { totalXp: 0, sortedRanks: [] };
        }

        const currentBalances = appMode.mode === 'personal'
            ? currentUser.personalExperience
            : currentUser.guildBalances[appMode.guildId]?.experience || {};
        
        const currentTotalXp = (Object.values(currentBalances) as number[]).reduce((sum, amount) => sum + amount, 0);
        
        const allRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        return { totalXp: currentTotalXp, sortedRanks: allRanks };

    }, [currentUser, ranks, appMode]);

    const { currentRank, nextRank } = useMemo(() => {
        if (sortedRanks.length === 0) {
            return { currentRank: null, nextRank: null };
        }

        let foundRank: Rank | null = null;
        let foundNextRank: Rank | null = null;

        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                foundRank = sortedRanks[i];
                foundNextRank = sortedRanks[i + 1] || null;
                break;
            }
        }
        
        if (!foundRank && sortedRanks.length > 0) {
          foundRank = sortedRanks[0];
          foundNextRank = sortedRanks[1] || null;
        }
        
        return { currentRank: foundRank, nextRank: foundNextRank };
    }, [totalXp, sortedRanks]);

    const progressPercentage = useMemo(() => {
        if (!nextRank || !currentRank) return 100;
        const xpForNextRank = nextRank.xpThreshold - currentRank.xpThreshold;
        const xpIntoCurrentRank = totalXp - currentRank.xpThreshold;
        const progress = xpForNextRank > 0 ? Math.min(100, (xpIntoCurrentRank / xpForNextRank) * 100) : 100;
        return progress;
    }, [totalXp, currentRank, nextRank]);


    if (!currentUser) return null;

    return (
        <div>
            {currentRank && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Your Current Rank</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 bg-card rounded-full flex items-center justify-center text-6xl border-4 border-accent">
                          <DynamicIcon iconType={currentRank.iconType} icon={currentRank.icon} imageUrl={currentRank.imageUrl} />
                        </div>
                        <p className="text-3xl font-bold text-accent-light">{currentRank.name}</p>
                        <div className="w-full bg-background rounded-full h-4 mt-4 overflow-hidden">
                            <div className="h-4 rounded-full bg-primary" style={{width: `${progressPercentage}%`}}></div>
                        </div>
                        <p className="text-sm text-foreground mt-2">
                            {nextRank 
                                ? `${totalXp} / ${nextRank.xpThreshold} XP` 
                                : `You have reached the highest rank! (${totalXp} XP)`
                            }
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Ranks</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {sortedRanks.map((rank: Rank) => {
                            const isCurrent = rank.id === currentRank?.id;
                            const isNext = rank.id === nextRank?.id;
                            const isAchieved = totalXp >= rank.xpThreshold;

                            let ringClass = '';
                            if (isCurrent) ringClass = 'ring-2 ring-accent';
                            else if (isNext) ringClass = 'ring-2 ring-primary';

                            return (
                                <li key={rank.id} className={`bg-card p-4 rounded-lg flex justify-between items-center transition-opacity ${!isAchieved && !isCurrent ? 'opacity-50' : ''} ${ringClass}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">
                                            <button
                                                onClick={() => rank.iconType === 'image' && rank.imageUrl && setPreviewImageUrl(rank.imageUrl)}
                                                disabled={rank.iconType !== 'image' || !rank.imageUrl}
                                                className="disabled:cursor-default"
                                            >
                                                <DynamicIcon iconType={rank.iconType} icon={rank.icon} imageUrl={rank.imageUrl} />
                                            </button>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-foreground">{rank.name}</h4>
                                            <p className="text-muted-foreground text-sm">Requires {rank.xpThreshold} total XP</p>
                                        </div>
                                    </div>
                                    {isAchieved && !isCurrent && (
                                        <div className="text-green-400 font-bold text-sm">ACHIEVED</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </CardContent>
            </Card>

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Rank icon preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default RanksPage;