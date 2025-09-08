import React, { useState, useMemo } from 'react';
import { Market, Minigame } from '../../../types';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIDispatch } from '../../context/UIContext';
import Button from '../user-interface/Button';
import ConfirmPlayDialog from './ConfirmPlayDialog';
import GameStatsDialog from '../games/GameStatsDialog';

interface ArcadeViewProps {
    market: Market;
}

const ArcadeView: React.FC<ArcadeViewProps> = ({ market }) => {
    const { settings, minigames, gameScores } = useSystemState();
    const { currentUser, users } = useAuthState();
    const { setActiveMarketId } = useUIDispatch();
    const [gameToPlay, setGameToPlay] = useState<Minigame | null>(null);
    const [gameForStats, setGameForStats] = useState<Minigame | null>(null);

    // Calculate scores for each game
    const scoresByGame = useMemo(() => {
        const scores: { 
            [gameId: string]: { 
                userHighScore: number, 
                globalHighScore: number,
                globalHighScoreHolder: string | null 
            } 
        } = {};

        minigames.forEach(game => {
            const gameSpecificScores = gameScores.filter(s => s.gameId === game.id);
            let userHighScore = 0;
            if(currentUser) {
                userHighScore = Math.max(0, ...gameSpecificScores
                    .filter(s => s.userId === currentUser.id)
                    .map(s => s.score));
            }

            let globalHighScore = 0;
            let globalHighScoreHolder = null;

            if (gameSpecificScores.length > 0) {
                globalHighScore = Math.max(0, ...gameSpecificScores.map(s => s.score));
                const topScoreEntry = gameSpecificScores.find(s => s.score === globalHighScore);
                if (topScoreEntry) {
                    const holder = users.find(u => u.id === topScoreEntry.userId);
                    globalHighScoreHolder = holder ? holder.gameName : 'Unknown Hero';
                }
            }
            
            scores[game.id] = { userHighScore, globalHighScore, globalHighScoreHolder };
        });
        return scores;
    }, [minigames, gameScores, currentUser, users]);

    // Calculate overall leaderboard
    const arcadeLegends = useMemo(() => {
        // 1. Find the highest score for each user for each game
        const userHighScoresByGame: { [userId: string]: { [gameId: string]: number } } = {};
        gameScores.forEach(score => {
            if (!userHighScoresByGame[score.userId]) {
                userHighScoresByGame[score.userId] = {};
            }
            const currentHighScore = userHighScoresByGame[score.userId][score.gameId] || 0;
            if (score.score > currentHighScore) {
                userHighScoresByGame[score.userId][score.gameId] = score.score;
            }
        });

        // 2. Sum up the high scores for each user
        const userTotalScores: { userId: string, totalScore: number }[] = [];
        Object.keys(userHighScoresByGame).forEach(userId => {
            const totalScore = Object.values(userHighScoresByGame[userId]).reduce((sum, score) => sum + score, 0);
            userTotalScores.push({ userId, totalScore });
        });
        
        // 3. Sort and get top 5, adding user names
        return userTotalScores
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5)
            .map(scoreEntry => {
                const user = users.find(u => u.id === scoreEntry.userId);
                return {
                    name: user ? user.gameName : 'Unknown Hero',
                    score: scoreEntry.totalScore
                };
            });
    }, [gameScores, users]);

    if (!currentUser) return null;

    return (
        <>
            <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                &larr; Back to the {settings.terminology.shoppingCenter}
            </Button>
            <Card title={market.title} titleIcon={<span className="text-2xl">{market.icon}</span>}>
                <p className="text-stone-400 mb-6 -mt-2">{market.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <Card title="All-Time Arcade Legends" titleIcon={<span className="text-2xl">👑</span>} className="mb-2 col-span-1 md:col-span-2 lg:col-span-3">
                        {arcadeLegends.length > 0 ? (
                            <ol className="space-y-2">
                                {arcadeLegends.map((player, index) => (
                                    <li key={index} className={`flex justify-between items-center text-lg p-2 rounded-md ${index < 3 ? 'bg-amber-900/40' : ''}`}>
                                        <span className="font-bold text-stone-200">{index + 1}. {player.name}</span>
                                        <span className="font-semibold text-amber-300">{player.score.toLocaleString()} pts</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-stone-400 text-center">No scores recorded yet. Be the first to become a legend!</p>
                        )}
                    </Card>

                    {minigames.map(game => {
                        const scores = scoresByGame[game.id] || { userHighScore: 0, globalHighScore: 0, globalHighScoreHolder: null };
                        return (
                            <div key={game.id} className="bg-indigo-900/30 border-2 border-indigo-700/60 rounded-xl shadow-lg flex flex-col h-full">
                                <div className="p-4 border-b border-white/10">
                                    <div className="text-6xl text-center mb-3">{game.icon}</div>
                                    <h4 className="font-bold text-lg text-stone-100 text-center">{game.name}</h4>
                                    <p className="text-stone-300 text-sm mt-1 text-center">{game.description}</p>
                                </div>
                                <div className="p-4 flex-grow space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-stone-400">Your High Score:</span>
                                        <span className="font-bold text-amber-300">{scores.userHighScore}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-stone-400">Global High Score:</span>
                                         <span className="font-bold text-emerald-300 text-right">
                                            {scores.globalHighScore} {scores.globalHighScoreHolder && <span className="text-xs text-stone-400 font-normal block">({scores.globalHighScoreHolder})</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 mt-auto bg-black/20 border-t border-white/10 flex items-center justify-center gap-2">
                                    <Button onClick={() => setGameToPlay(game)}>
                                        Play for 1 🪙
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => setGameForStats(game)}>Stats</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            {gameToPlay && (
                <ConfirmPlayDialog game={gameToPlay} onClose={() => setGameToPlay(null)} />
            )}
            {gameForStats && (
                <GameStatsDialog game={gameForStats} onClose={() => setGameForStats(null)} />
            )}
        </>
    );
};

export default ArcadeView;