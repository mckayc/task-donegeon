
import React, { useState, useMemo } from 'react';
import { Market, Minigame } from '../../../types';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIDispatch } from '../../context/UIContext';
import Button from '../user-interface/Button';
import ConfirmPlayDialog from './ConfirmPlayDialog';

interface ArcadeViewProps {
    market: Market;
}

const ArcadeView: React.FC<ArcadeViewProps> = ({ market }) => {
    const { settings, minigames, gameScores } = useSystemState();
    const { currentUser } = useAuthState();
    const { setActiveMarketId } = useUIDispatch();
    const [gameToPlay, setGameToPlay] = useState<Minigame | null>(null);

    const scoresByUserAndGame = useMemo(() => {
        if (!currentUser) return {};
        const scores: { [gameId: string]: { userHighScore: number, globalHighScore: number } } = {};
        minigames.forEach(game => {
            const gameSpecificScores = gameScores.filter(s => s.gameId === game.id);
            if (gameSpecificScores.length === 0) {
                scores[game.id] = { userHighScore: 0, globalHighScore: 0 };
                return;
            }
            const userHighScore = Math.max(0, ...gameSpecificScores
                .filter(s => s.userId === currentUser.id)
                .map(s => s.score));
            const globalHighScore = Math.max(0, ...gameSpecificScores.map(s => s.score));
            scores[game.id] = { userHighScore, globalHighScore };
        });
        return scores;
    }, [minigames, gameScores, currentUser]);

    if (!currentUser) return null;

    return (
        <>
            <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                &larr; Back to the {settings.terminology.shoppingCenter}
            </Button>
            <Card title={market.title} titleIcon={<span className="text-2xl">{market.icon}</span>}>
                <p className="text-stone-400 mb-6 -mt-2">{market.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {minigames.map(game => {
                        const scores = scoresByUserAndGame[game.id] || { userHighScore: 0, globalHighScore: 0 };
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
                                        <span className="font-bold text-emerald-300">{scores.globalHighScore}</span>
                                    </div>
                                </div>
                                <div className="p-3 mt-auto bg-black/20 border-t border-white/10 flex items-center justify-center gap-2">
                                    <Button onClick={() => setGameToPlay(game)}>
                                        Play for 1 🪙
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            {gameToPlay && (
                <ConfirmPlayDialog game={gameToPlay} onClose={() => setGameToPlay(null)} />
            )}
        </>
    );
};

export default ArcadeView;