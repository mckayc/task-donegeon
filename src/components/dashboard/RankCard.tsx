import React from 'react';
import Card from '../user-interface/Card';
import { useUIDispatch } from '../../context/UIContext';
import { Rank } from '../ranks/types';
import { Terminology } from '../../types/app';

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
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const RankCard: React.FC<RankCardProps> = ({ rankData, terminology, ...cardProps }) => {
    const { setActivePage } = useUIDispatch();

    if (!rankData.currentRank) {
        return <Card title="Loading..." {...cardProps}><p>Calculating your rank...</p></Card>;
    }

    return (
        <Card title={terminology.level} {...cardProps}>
            <div className="cursor-pointer text-center" onClick={() => setActivePage('Ranks')}>
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
                <p className="text-sm text-stone-300 mt-2">Total XP: {rankData.totalXp}</p>
            </div>
        </Card>
    );
};

export default RankCard;
