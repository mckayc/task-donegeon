import React, { useMemo } from 'react';
import Card from '../user-interface/Card';
import { User, Rank, RewardTypeDefinition, RewardCategory } from '../../types';
import { useProgressionState } from '../../context/ProgressionContext';
import { useEconomyState } from '../../context/EconomyContext';
import Avatar from '../user-interface/Avatar';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useRewardValue } from '../rewards/hooks/useRewardValue';

interface SharedUserLeaderboardCardProps {
    user: User;
}

const SharedUserLeaderboardCard: React.FC<SharedUserLeaderboardCardProps> = ({ user }) => {
    const { ranks } = useProgressionState();
    const { rewardTypes } = useEconomyState();

    const { currentRank, totalXp, progressPercentage, xpIntoCurrentRank, xpForNextRank } = useMemo(() => {
        if (!ranks || ranks.length === 0) {
            return { currentRank: null, totalXp: 0, progressPercentage: 0, xpIntoCurrentRank: 0, xpForNextRank: 0 };
        }
        const totalXp = Object.values(user.personalExperience).reduce<number>((sum, amount) => sum + Number(amount), 0);
        const sortedRanks = [...ranks].sort((a, b) => a.xpThreshold - b.xpThreshold);
        
        let currentRank: Rank | null = sortedRanks[0] || null;
        let nextRank: Rank | null = sortedRanks[1] || null;

        for (let i = sortedRanks.length - 1; i >= 0; i--) {
            if (totalXp >= sortedRanks[i].xpThreshold) {
                currentRank = sortedRanks[i];
                nextRank = sortedRanks[i + 1] || null;
                break;
            }
        }
        
        const xpForNext = (currentRank && nextRank) ? nextRank.xpThreshold - currentRank.xpThreshold : 0;
        const xpIntoCurrent = currentRank ? totalXp - currentRank.xpThreshold : 0;
        const progress = (nextRank && xpForNext > 0) ? Math.min(100, (xpIntoCurrent / xpForNext) * 100) : 0;
        
        return { currentRank, totalXp, progressPercentage: progress, xpIntoCurrentRank: xpIntoCurrent, xpForNextRank: xpForNext };
    }, [user, ranks]);

    const userCurrencies = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === RewardCategory.Currency && (user.personalPurse[rt.id] || 0) > 0)
            .map(c => ({ ...c, amount: user.personalPurse[c.id] || 0 }));
    }, [user.personalPurse, rewardTypes]);

    const userExperience = useMemo(() => {
        return rewardTypes
            .filter(rt => rt.category === RewardCategory.XP)
            .map(xp => ({ ...xp, amount: user.personalExperience[xp.id] || 0 }))
            .filter(xp => xp.amount > 0);
    }, [user.personalExperience, rewardTypes]);

    const CurrencyDisplay: React.FC<{currency: typeof userCurrencies[0]}> = ({ currency }) => {
        const realValue = useRewardValue(currency.amount, currency.id);
        const title = `${currency.name}: ${currency.amount}${realValue ? ` (${realValue})` : ''}`;
    
        return (
            <div title={title} className="flex items-baseline justify-between text-sm">
                <span className="text-stone-200 flex items-center gap-2">
                    <DynamicIcon iconType={currency.iconType} icon={currency.icon} imageUrl={currency.imageUrl} className="w-5 h-5 text-lg" />
                    <span>{currency.name}</span>
                </span>
                <span className="font-semibold text-accent-light">{currency.amount}</span>
            </div>
        );
    }
    
    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
                <Avatar user={user} className="w-16 h-16 rounded-full border-2 border-accent" />
                <div>
                    <h2 className="text-xl font-bold text-stone-100">{user.gameName}</h2>
                    <p className="text-sm text-stone-400">{user.role}</p>
                </div>
            </div>
            
            {currentRank && (
                <div className="text-center mb-4">
                    <div className="w-20 h-20 mx-auto mb-2 bg-stone-700 rounded-full flex items-center justify-center text-4xl border-4 border-stone-600">
                        {currentRank.icon}
                    </div>
                    <p className="text-lg font-bold text-accent-light">{currentRank.name}</p>
                    <div className="relative w-full bg-stone-700 rounded-full h-4 mt-2 overflow-hidden text-white">
                        <div className="absolute inset-0 h-full rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`, backgroundColor: 'hsl(var(--primary))'}}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-xs font-bold" style={{textShadow: '1px 1px 1px rgba(0,0,0,0.5)'}}>
                                {xpIntoCurrentRank} / {xpForNextRank} XP
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">Total XP: {totalXp}</p>
                </div>
            )}
            
            <div className="flex-grow space-y-4 pt-4 border-t border-stone-700/60">
                 <div>
                    <h4 className="font-semibold text-stone-300 mb-2">Currencies</h4>
                    <div className="space-y-1">
                        {userCurrencies.length > 0 ? userCurrencies.map(c => <CurrencyDisplay key={c.id} currency={c} />) : <p className="text-stone-400 text-xs italic">None</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-stone-300 mb-2">Experience Types</h4>
                     <div className="space-y-1">
                        {userExperience.length > 0 ? userExperience.map(xp => 
                            <div key={xp.id} className="flex items-baseline justify-between text-sm">
                                <span className="text-stone-200 flex items-center gap-2">
                                    <DynamicIcon iconType={xp.iconType} icon={xp.icon} imageUrl={xp.imageUrl} className="w-5 h-5 text-lg" />
                                    <span>{xp.name}</span>
                                </span>
                                <span className="font-semibold text-sky-400">{xp.amount}</span>
                            </div>
                        ) : <p className="text-stone-400 text-xs italic">None</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default SharedUserLeaderboardCard;