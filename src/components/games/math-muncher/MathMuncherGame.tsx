import React, { useEffect } from 'react';
import Button from '../../user-interface/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { challenges } from './MathMuncherChallenges';
import { useMathMuncherGame } from './useMathMuncherGame';

interface MathMuncherGameProps {
  onClose: () => void;
}

const getDynamicFontSize = (value: string | number, gridSize: 6 | 12): string => {
    const text = String(value);
    const len = text.length;

    if (gridSize === 12) { // ~40px box
        if (len > 7) return 'text-[10px] leading-tight';
        if (len > 5) return 'text-xs';
        if (len > 3) return 'text-sm';
        return 'text-lg';
    } else { // gridSize === 6, ~80px box
        if (len > 9) return 'text-lg';
        if (len > 6) return 'text-xl';
        return 'text-2xl';
    }
};

const MathMuncherGame: React.FC<MathMuncherGameProps> = ({ onClose }) => {
    const { state, dispatch, startGame, rewardDef, userBalance } = useMathMuncherGame(onClose);
    const {
        gameState,
        challengePlaylist,
        challengeIndex,
        round,
        score,
        lives,
        countdown,
        playerPos,
        troggles,
        grid,
        shieldActive,
        isHit,
        lastReward
    } = state;

    const currentChallenge = challengePlaylist[challengeIndex];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'game-over' || gameState === 'level-cleared') {
                if (e.key === 'Enter') {
                    dispatch({ type: gameState === 'game-over' ? 'RESET_GAME' : 'START_NEXT_CHALLENGE' });
                }
                return;
            }

            if (gameState !== 'playing') return;

            switch (e.key) {
                case 'ArrowUp': dispatch({ type: 'MOVE_PLAYER', payload: { dx: 0, dy: -1 } }); break;
                case 'ArrowDown': dispatch({ type: 'MOVE_PLAYER', payload: { dx: 0, dy: 1 } }); break;
                case 'ArrowLeft': dispatch({ type: 'MOVE_PLAYER', payload: { dx: -1, dy: 0 } }); break;
                case 'ArrowRight': dispatch({ type: 'MOVE_PLAYER', payload: { dx: 1, dy: 0 } }); break;
                case ' ': e.preventDefault(); dispatch({ type: 'MUNCH' }); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, dispatch]);
    
    const gridSize = currentChallenge?.gridSize || 6;
    const cellSizeClass = gridSize === 12 ? 'w-10 h-10' : 'w-20 h-20';

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${isHit ? 'animate-shake' : ''}`}>
             {gameState === 'select-level' && (
                <div className="text-center text-white">
                    <h1 className="text-5xl font-medieval text-emerald-400">Math Muncher</h1>
                    <p className="mt-4 mb-8 text-lg">Select a grade level to begin!</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(challenges).map(([gradeKey, gradeData]) => (
                            <Button key={gradeKey} onClick={() => startGame(gradeKey)} className="text-xl p-6">
                                {gradeData.name}
                            </Button>
                        ))}
                    </div>
                     <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
                </div>
            )}

            {gameState !== 'select-level' && (
                 <>
                    <div className="w-full max-w-[550px] mb-4">
                        <div className="flex justify-between items-center text-white font-bold text-lg p-3 bg-stone-800/50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span>Score: {score}</span>
                                {rewardDef && (
                                    <div className="relative flex items-center gap-1 font-semibold text-stone-200">
                                        <span>{rewardDef.icon}</span>
                                        <span>{userBalance}</span>
                                        <AnimatePresence>
                                        {lastReward && (
                                            <motion.span
                                                initial={{ y: 0, opacity: 1 }}
                                                animate={{ y: -20, opacity: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute left-full ml-1 text-emerald-400 font-bold"
                                            >
                                                +{lastReward.amount}
                                            </motion.span>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                             <span>Round {round} - Level {challengeIndex + 1}</span>
                             <span>Lives: {'❤️'.repeat(lives)}</span>
                        </div>
                         <p className="text-center text-amber-300 font-semibold mt-2">{currentChallenge?.title}</p>
                    </div>

                    <div className="relative">
                        <div className="grid gap-1 bg-stone-900 p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                            {grid.flat().map((cell, index) => {
                                const x = index % gridSize;
                                const y = Math.floor(index / gridSize);
                                const isPlayer = playerPos.x === x && playerPos.y === y;
                                const troggle = troggles.find(t => t.pos.x === x && t.pos.y === y);
                                const fontSizeClass = getDynamicFontSize(cell.value, gridSize);
                                return (
                                    <div key={index} className={`flex items-center justify-center font-bold rounded bg-sky-800 relative transition-colors duration-200 ${cellSizeClass}`}
                                         style={{ backgroundColor: cell.feedback === 'correct' ? '#22c55e' : cell.feedback === 'incorrect' ? '#ef4444' : '#0c4a6e' }}>
                                        {!cell.isEaten && <span className={fontSizeClass}>{cell.value}</span>}
                                        {isPlayer && <span className={`absolute text-3xl ${shieldActive ? 'animate-pulse' : ''}`}>{isHit ? '😵' : shieldActive ? '🛡️' : '😋'}</span>}
                                        {troggle && <span className="absolute text-3xl">{troggle.type === 'hunter' ? '👹' : troggle.type === 'jumper' ? '👺' : '👻'}</span>}
                                        {cell.item && <span className="absolute text-3xl">{cell.item === 'life' ? '❤️' : cell.item === 'shield' ? '🛡️' : cell.item === 'freeze' ? '❄️' : '❓'}</span>}
                                        <AnimatePresence>
                                            {cell.feedback && (
                                            <motion.div
                                                key={`${x}-${y}-feedback`}
                                                initial={{ scale: 0, y: 0, opacity: 1 }}
                                                animate={{ scale: 2, y: -20, opacity: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className="absolute text-3xl pointer-events-none z-10"
                                            >
                                                {cell.feedback === 'correct' ? '✅' : '❌'}
                                            </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                        <AnimatePresence>
                            {(gameState === 'countdown' || gameState === 'game-over' || gameState === 'level-cleared' || gameState === 'player-hit') && (
                                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-black/70 rounded-md flex flex-col items-center justify-center text-white">
                                    {gameState === 'countdown' && <p className="text-6xl font-bold font-medieval text-emerald-400 animate-ping" style={{animationDuration: '0.7s'}}>{countdown > 0 ? countdown : 'GO!'}</p>}
                                    {gameState === 'game-over' && <>
                                        <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                                        <p className="text-xl mt-2">Final Score: {score}</p>
                                        <Button onClick={() => dispatch({type: 'RESET_GAME'})} className="mt-6">Back to Levels</Button>
                                    </>}
                                    {gameState === 'level-cleared' && <>
                                        <h2 className="text-4xl font-bold font-medieval text-amber-300">Level Cleared!</h2>
                                        <Button onClick={() => dispatch({type: 'START_NEXT_CHALLENGE'})} className="mt-6">Next Level</Button>
                                    </>}
                                     {gameState === 'player-hit' && (
                                        <>
                                            <span className="text-8xl">💥</span>
                                            <p className="text-4xl font-medieval text-red-400 mt-4">Life Lost!</p>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                     <div className="flex items-center gap-8 mt-4">
                        <div className="grid grid-cols-3 gap-2 w-40">
                            <div></div>
                            <Button onClick={() => dispatch({ type: 'MOVE_PLAYER', payload: { dx: 0, dy: -1 } })} className="w-12 h-12"><ArrowUp /></Button>
                            <div></div>
                            <Button onClick={() => dispatch({ type: 'MOVE_PLAYER', payload: { dx: -1, dy: 0 } })} className="w-12 h-12"><ArrowLeft /></Button>
                            <Button onClick={() => dispatch({ type: 'MOVE_PLAYER', payload: { dx: 0, dy: 1 } })} className="w-12 h-12"><ArrowDown /></Button>
                            <Button onClick={() => dispatch({ type: 'MOVE_PLAYER', payload: { dx: 1, dy: 0 } })} className="w-12 h-12"><ArrowRight /></Button>
                        </div>
                        <Button onClick={() => dispatch({ type: 'MUNCH' })} className="w-32 h-32 rounded-full text-2xl font-bold">Munch!</Button>
                    </div>
                    <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
                </>
            )}
        </div>
    );
};

export default MathMuncherGame;