import React from 'react';
import Card from '../user-interface/Card';
import { useUIDispatch } from '../../context/UIContext';
import { Rank } from '../ranks/types';
import { Terminology } from '../../types/app';
import { RewardTypeDefinition } from '../items/types';

type Currency = RewardTypeDefinition & { amount: number };

interface RankCardProps {
    rankData: {
        currentRank: Rank | null;
        currentLevel: number;
        progressPercentage: number;
        nextRank: Rank | null;
        xpIntoCurrentRank: number;
        xpForNextRank: number;
        totalXp: number;
    };
    terminology: Terminology;
    totalEarnedCurrencies: Currency[];
    totalEarnedXp: number;
    userCurrencies: Currency[];
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const RankCard: React.FC<RankCardProps> = ({ rankData, terminology, totalEarnedCurrencies, totalEarnedXp, userCurrencies, ...cardProps }) => {
    const { setActivePage } = useUIDispatch();

    if (!rankData.currentRank) {
        return <Card title="Loading..." {...cardProps}><p>Calculating your rank...</p></Card>;
    }

    return (
        <Card title={terminology.level} {...cardProps}>
            <div className="cursor-pointer" onClick={() => setActivePage('Ranks')}>
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-6xl border-4 border-accent">
                        {rankData.currentRank.icon}
                    </div>
                    <p className="text-2xl font-bold text-accent-light">{rankData.currentRank.name}</p>
                    <p className="text-stone-400">Level {rankData.currentLevel}</p>
                    <div className="relative w-full bg-stone-700 rounded-full h-5 mt-4 overflow-hidden text-white">
                        <div className="absolute inset-0 h-full rounded-full transition-all duration-500" style={{width: `${rankData.progressPercentage}%`, backgroundColor: 'hsl(var(--primary))'}}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {rankData.nextRank ? (
                                <span className="text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                                    {rankData.xpIntoCurrentRank} / {rankData.xpForNextRank} XP
                                </span>
                            ) : (
                                <span className="text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
                                    Max Rank!
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-700/60 space-y-2 text-sm">
                    <div className="flex justify-between font-semibold">
                        <span className="text-stone-300">Current Total XP:</span>
                        <span className="text-sky-400">{rankData.totalXp}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-400">Lifetime Total XP:</span>
                        <span className="text-sky-400">{totalEarnedXp}</span>
                    </div>
                     {userCurrencies.map(currency => {
                        const lifetime = totalEarnedCurrencies.find(c => c.id === currency.id)?.amount || 0;
                        return (
                             <div key={currency.id} className="flex justify-between items-center">
                                <span className="text-stone-300 flex items-center gap-2">{currency.icon} {currency.name}:</span>
                                <span className="font-semibold text-accent-light">{currency.amount} <span className="text-xs text-stone-500">({lifetime} lifetime)</span></span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    );
};

export default RankCard;