
import React, { useMemo } from 'react';
import { useAuthState, useGameDataState, useUIState } from '../../context/AppContext';
import { Rank } from '../../types';
import Card from '../ui/Card';

const RanksPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { ranks } = useGameDataState();
    const { appMode } = useUIState();

    const { currentRank, nextRank, totalXp, progressPercentage, sortedRanks } = useMemo(() => {
        if (!currentUser || !ranks || ranks.length === 0) {
            return { currentRank: null, nextRank: null, totalXp: 0, progressPercentage: 0, sortedRanks: [] };
        }

        const currentBalances = appMode.mode === 'personal'
            ? currentUser.personalExperience
            : currentUser.guildBalances[appMode.guildId]?.experience || {};
        
        const currentTotalXp = Object.values(currentBalances).reduce((sum: number, amount: number) => sum + amount, 0);
        
        const allRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        let foundRank: Rank | null = null;
        let foundNextRank: Rank | null = null;

        for (let i = allRanks.length - 1; i >= 0; i--) {
            if (currentTotalXp >= allRanks[i].xpThreshold) {
                foundRank = allRanks[i];
                foundNextRank = allRanks[i + 1] || null;
                break;
            }
        }
        
        if (!foundRank && allRanks.length > 0) {
            foundRank = allRanks[0];
            foundNextRank = allRanks[1] || null;
        }

        const xpForNext = (foundRank && foundNextRank) ? foundNextRank.xpThreshold - foundRank.xpThreshold : 0;
        const xpIntoCurrent = foundRank ? currentTotalXp - foundRank.xpThreshold : 0;
        const progress = (foundNextRank && xpForNext > 0) ? Math.min(100, (xpIntoCurrent / xpForNext) * 100) : 100;
        
        return {
            currentRank: foundRank,
            nextRank: foundNextRank,
            totalXp: currentTotalXp,
            progressPercentage: progress,
            sortedRanks: allRanks
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
                    <div className="text-7xl">{currentRank.icon}</div>
                    <div className="flex-grow w-full text-center sm:text-left">
                        <h3 className="text-3xl font-bold text-accent-light">{currentRank.name}</h3>
                        <p className="text-stone-400">Total XP: {totalXp}</p>
                        <div className="w-full bg-stone-700 rounded-full h-4 mt-4 overflow-hidden">
                            <div className="h-4 rounded-full btn-primary" style={{width: `${progressPercentage}%`}}></div>
                        </div>
                        <p className="text-sm text-stone-300 mt-2">
                            {nextRank ? `${totalXp} / ${nextRank.xpThreshold} XP towards ${nextRank.name}` : `You have reached the highest rank!`}
                        </p>
                    </div>
                </div>
            </Card>

            <Card title="All Ranks">
                <ul className="space-y-3">
                    {sortedRanks.map(rank => (
                         <li key={rank.id} className={`flex items-center gap-4 p-3 rounded-lg ${rank.id === currentRank.id ? 'bg-emerald-800/50' : ''}`}>
                            <span className="text-3xl w-10 text-center">{rank.icon}</span>
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-stone-100">{rank.name}</p>
                                <p className="text-sm text-stone-400">Requires: {rank.xpThreshold} XP</p>
                            </div>
                            {rank.id === currentRank.id && <span className="text-xs font-bold text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded-full">CURRENT</span>}
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default RanksPage;
