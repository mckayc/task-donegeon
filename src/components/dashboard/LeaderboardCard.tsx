
import React from 'react';
import Card from '../user-interface/Card';

interface LeaderboardCardProps {
    leaderboard: { name: string; xp: number; }[];
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ leaderboard }) => {
    return (
        <Card title="Leaderboard">
             {leaderboard.length > 0 ? (
                <ul className="space-y-2">
                    {leaderboard.map((player, index) => (
                        <li key={player.name} className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-stone-200">{index + 1}. {player.name}</span>
                            <span className="text-sky-400">{player.xp} XP</span>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-stone-400 text-sm italic">No players to rank.</p>}
        </Card>
    );
};

export default LeaderboardCard;
