import React from 'react';
import Card from '../user-interface/Card';
import { useUIDispatch } from '../../context/UIContext';
import { Trophy } from '../trophies/types';
import { Terminology } from '../../types/app';

interface TrophyCardProps {
    mostRecentTrophy: Trophy | null;
    terminology: Terminology;
}

const TrophyCard: React.FC<TrophyCardProps> = ({ mostRecentTrophy, terminology }) => {
    const { setActivePage } = useUIDispatch();

    if (!mostRecentTrophy) {
        return null; // Don't render anything if there's no trophy
    }

    return (
        <Card title={`Latest ${terminology.award}`}>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActivePage('Trophies')}>
                <div className="text-5xl">{mostRecentTrophy.icon}</div>
                <div>
                    <h4 className="font-bold text-lg text-amber-300">{mostRecentTrophy.name}</h4>
                    <p className="text-stone-400 text-sm">{mostRecentTrophy.description}</p>
                </div>
            </div>
        </Card>
    );
};

export default TrophyCard;