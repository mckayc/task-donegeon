

import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { Rank } from '../../types';
import Card from '../ui/Card';
import { RankIcon } from '../ui/Icons';

const RanksPage: React.FC = () => {
    const { currentUser, ranks, appMode } = useAppState();

    const { currentRank, nextRank, totalXp, progressPercentage, sortedRanks } = useMemo(() => {
        if (!currentUser || !ranks || ranks.length === 0) {
            return { currentRank: null, nextRank: null, totalXp: 0, progressPercentage: 0, sortedRanks: [] };
        }

        const currentBalances = appMode.mode === 'personal'
            ? currentUser.personalExperience
            : currentUser.guildBalances[appMode.guildId]?.experience || {};
        
        const currentTotalXp = Object.values(currentBalances).reduce((sum: number, amount: number) => sum + amount, 0);
        
        const allRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        let foundRank: Rank = allRanks[0];
        let foundNextRank: Rank | null = allRanks[1] || null;

        for (let i = allRanks.length - 1; i >= 0; i--) {
            if (currentTotalXp >= allRanks[i].xpThreshold) {
                foundRank = allRanks[i];
                foundNextRank = allRanks[i + 1] || null;
                break;
            }
        }
        
        const xpForNext = foundNextRank ? foundNextRank.xpThreshold - foundRank.xpThreshold : 0;
        const xpIntoCurrent = currentTotalXp - foundRank.xpThreshold;
        const progress = (foundNextRank && xpForNext > 0) ? Math.min(100, (xpIntoCurrent / xpForNext) * 100) : 100;
        
        return { 
            currentRank: foundRank, 
            nextRank: foundNextRank, 
            totalXp: currentTotalXp, 
            progressPercentage: progress,
            sortedRanks: allRanks
        };
    }, [currentUser, ranks, appMode]);

    if (!currentUser || !currentRank) return null;

    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">Ranks of the Donegeon</h1>

            <Card className="mb-8" title="Your Current Rank" titleIcon={<RankIcon />}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-stone-700/50 rounded-full flex items-center justify-center text-5xl flex-shrink-0">
                        {currentRank.icon}
                    </div>
                    <div className="flex-grow w-full">
                        <h3 className="text-3xl font-bold text-emerald-300">{currentRank.name}</h3>
                        <p className="text-stone-300">Total XP: {totalXp}</p>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-stone-400 mb-1">
                                <span>Lvl {sortedRanks.findIndex(r => r.id === currentRank.id) + 1}</span>
                                {nextRank && <span>Next: {nextRank.name}</span>}
                            </div>
                            <div className="w-full bg-stone-700 rounded-full h-4 overflow-hidden">
                                <div className="bg-emerald-500 h-4 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                            </div>
                             <div className="flex justify-between text-sm text-stone-400 mt-1">
                                <span>{currentRank.xpThreshold} XP</span>
                                {nextRank && <span>{nextRank.xpThreshold} XP</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="All Ranks">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedRanks.map((rank, index) => {
                        const isAchieved = totalXp >= rank.xpThreshold;
                        const isCurrent = rank.id === currentRank.id;

                        let cardClass = 'bg-stone-800/50 opacity-50';
                        if (isCurrent) cardClass = 'bg-emerald-900/40 border-2 border-emerald-500';
                        else if (isAchieved) cardClass = 'bg-stone-700/60 opacity-80';

                        return (
                             <div key={rank.id} className={`p-4 rounded-lg flex items-center gap-4 transition-all duration-300 ${cardClass}`}>
                                <div className="text-3xl">{rank.icon}</div>
                                <div>
                                    <p className="font-bold text-stone-100">{rank.name} (Lvl {index + 1})</p>
                                    <p className="text-xs text-stone-400">{rank.xpThreshold} XP Required</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
        </div>
    );
};

export default RanksPage;
