

import React, { useMemo, useState } from 'react';
import { useUIState } from '../../context/UIContext';
import { Rank } from '../../../types';
import Card from '../user-interface/Card';
import { RankIcon } from '../user-interface/Icons';
import DynamicIcon from '../user-interface/DynamicIcon';
import ImagePreviewDialog from '../user-interface/ImagePreviewDialog';
import { useAuthState } from '../../context/AuthContext';
import { useProgressionState } from '../../context/ProgressionContext';

const RanksPage: React.FC = () => {
    const { ranks } = useProgressionState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const { currentRank, nextRank, totalXp, progressPercentage, sortedRanks, xpIntoCurrent, xpForNext } = useMemo(() => {
        if (!currentUser || !ranks || ranks.length === 0) {
            return { currentRank: null, nextRank: null, totalXp: 0, progressPercentage: 0, sortedRanks: [], xpIntoCurrent: 0, xpForNext: 0 };
        }

        const currentBalances = appMode.mode === 'personal'
            ? currentUser.personalExperience
            : currentUser.guildBalances[appMode.guildId]?.experience || {};
        
        const currentTotalXp = Object.values(currentBalances).reduce<number>((sum: number, amount: number) => sum + Number(amount), 0);
        
        const allRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        let foundRank: Rank | null = allRanks[0] || null;
        let foundNextRank: Rank | null = null;

        for (let i = allRanks.length - 1; i >= 0; i--) {
            if (currentTotalXp >= allRanks[i].xpThreshold) {
                foundRank = allRanks[i];
                foundNextRank = allRanks[i + 1] || null;
                break;
            }
        }
        
        const xpForNextRank = (foundRank && foundNextRank) ? foundNextRank.xpThreshold - foundRank.xpThreshold : 0;
        const xpIntoCurrentRank = foundRank ? currentTotalXp - foundRank.xpThreshold : 0;
        
        // Clamp for display
        const clampedXpIntoRank = Math.max(0, xpIntoCurrentRank);
        const progress = (foundNextRank && xpForNextRank > 0) ? Math.min(100, (clampedXpIntoRank / xpForNextRank) * 100) : 100;
        
        return {
            currentRank: foundRank,
            nextRank: foundNextRank,
            totalXp: currentTotalXp,
            progressPercentage: progress,
            sortedRanks: allRanks,
            xpIntoCurrent: clampedXpIntoRank,
            xpForNext: xpForNextRank,
        };
    }, [currentUser, ranks, appMode]);

    if (!currentUser || !ranks || ranks.length === 0) {
        return <Card><p>No ranks have been configured for this game yet.</p></Card>;
    }
    
    if (!currentRank) {
         return <Card><p>Your rank could not be determined.</p></Card>;
    }

    return (
        <div className="space-y-8">
            <Card title="Your Current Rank">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 flex items-center justify-center rounded-full overflow-hidden border-4 border-accent bg-stone-700">
                        <button
                            onClick={() => currentRank.iconType === 'image' && currentRank.imageUrl && setPreviewImageUrl(currentRank.imageUrl)}
                            disabled={currentRank.iconType !== 'image' || !currentRank.imageUrl}
                            className="w-full h-full disabled:cursor-default"
                        >
                            <DynamicIcon 
                                iconType={currentRank.iconType} 
                                icon={currentRank.icon} 
                                imageUrl={currentRank.imageUrl} 
                                className="w-full h-full text-7xl" 
                                altText={`${currentRank.name} rank icon`}
                            />
                        </button>
                    </div>
                    <div className="flex-grow w-full text-center sm:text-left">
                        <h3 className="text-3xl font-bold text-accent-light">{currentRank.name}</h3>
                        <p className="text-stone-400">Total XP: {totalXp}</p>
                         <div className="relative w-full bg-stone-700 rounded-full h-5 mt-4 overflow-hidden text-white">
                            <div className="absolute inset-0 h-full rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`, backgroundColor: 'hsl(var(--primary))'}}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                {nextRank ? (
                                    <span className="text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                                        {xpIntoCurrent} / {xpForNext} XP towards {nextRank.name}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                                        Max Rank Achieved!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="All Ranks">
                <ul className="space-y-3">
                    {sortedRanks.map(rank => (
                        <li key={rank.id} className={`p-4 rounded-lg flex items-center gap-4 ${rank.id === currentRank.id ? 'bg-emerald-900/50 border-l-4 border-emerald-400' : 'bg-stone-800/60'}`}>
                            <div className="w-12 h-12 flex items-center justify-center rounded-full overflow-hidden bg-stone-700/50">
                               <button
                                    onClick={() => rank.iconType === 'image' && rank.imageUrl && setPreviewImageUrl(rank.imageUrl)}
                                    disabled={rank.iconType !== 'image' || !rank.imageUrl}
                                    className="w-full h-full disabled:cursor-default"
                                >
                                   <DynamicIcon 
                                       iconType={rank.iconType} 
                                       icon={rank.icon} 
                                       imageUrl={rank.imageUrl} 
                                       className="w-full h-full text-4xl" 
                                       altText={`${rank.name} rank icon`}
                                    />
                                </button>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-stone-100">{rank.name}</h4>
                                <p className="text-sm text-stone-400">Requires: {rank.xpThreshold} XP</p>
                            </div>
                        </li>
                    ))}
                </ul>
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
