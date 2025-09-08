import React, { useMemo } from 'react';
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
        totalXp: number; // This is now total EARNED xp
    };
    terminology: Terminology;
    currentXp: number;
    totalEarnedXp: number;
    currentUserCurrencies: Currency[];
    totalEarnedCurrencies: Currency[];
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const RankCard: React.FC<RankCardProps> = ({ rankData, terminology, currentXp, totalEarnedXp, currentUserCurrencies, totalEarnedCurrencies, ...cardProps }) => {
    const { setActivePage } = useUIDispatch();

    const allCurrencyDefs = useMemo(() => {
        const currencyMap = new Map<string, Currency>();
        [...currentUserCurrencies, ...totalEarnedCurrencies].forEach(c => {
            if (!currencyMap.has(c.id)) {
                currencyMap.set(c.id, c);
            }
        });
        return Array.from(currencyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [currentUserCurrencies, totalEarnedCurrencies]);

    if (!rankData.currentRank) {
        return <Card title="Loading..." {...cardProps}><p>Calculating your rank...</p></Card>;
    }

    return (
        <Card title={terminology.level} {...cardProps}>
            <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-stone-700 rounded-full flex items-center justify-center text-6xl border-4 border-accent cursor-pointer" onClick={() => setActivePage('Ranks')}>
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

                <div className="mt-4 pt-4 border-t border-stone-700/60 text-sm text-left">
                    <div className="grid grid-cols-3 gap-x-4">
                        <div className="font-semibold text-stone-400"></div>
                        <div className="font-bold text-stone-200 text-center">Current</div>
                        <div className="font-bold text-stone-200 text-center">Total Earned</div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 mt-1 items-center">
                        <div className="font-semibold text-stone-300">XP</div>
                        <div className="text-stone-100 text-center font-mono font-semibold text-base">{currentXp.toLocaleString()}</div>
                        <div className="text-stone-100 text-center font-mono font-semibold text-base">{totalEarnedXp.toLocaleString()}</div>
                    </div>
                    {allCurrencyDefs.map(currencyDef => {
                        const currentAmount = currentUserCurrencies.find(c => c.id === currencyDef.id)?.amount || 0;
                        const totalEarned = totalEarnedCurrencies.find(c => c.id === currencyDef.id)?.amount || 0;
                        if (currentAmount === 0 && totalEarned === 0) return null;
                        
                        return (
                            <div key={currencyDef.id} className="grid grid-cols-3 gap-x-4 mt-1 items-center">
                                <div className="font-semibold text-stone-300 flex items-center gap-1.5 truncate">
                                    <span className="text-lg">{currencyDef.icon}</span>
                                    <span className="truncate">{currencyDef.name}</span>
                                </div>
                                <div className="text-stone-100 text-center font-mono">{currentAmount.toLocaleString()}</div>
                                <div className="text-stone-100 text-center font-mono">{totalEarned.toLocaleString()}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    );
};

export default RankCard;