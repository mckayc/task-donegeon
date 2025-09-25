
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSystemDispatch, useSystemState } from '../../../context/SystemContext';
import Button from '../../user-interface/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Cell, Troggle, PowerUpType, MathChallenge } from './types';
import { gradeManifest } from './challenges';
import { shuffleArray, getRandomInt } from './helpers';
import { useAuthState } from '../../../context/AuthContext';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { RewardCategory, RewardTypeDefinition, AdminAdjustmentType } from '../../../types';
import { useEconomyState } from '../../../context/EconomyContext';

interface MathMuncherGameProps {
  onClose: () => void;
}

const INITIAL_LIVES = 3;
const GRID_SIZE = 5;

const getDynamicFontSize = (value: string | number): string => {
    const text = String(value);
    const len = text.length;
    if (len > 9) return 'text-lg';
    if (len > 6) return 'text-xl';
    return 'text-2xl';
};

const MathMuncherGame: React.FC<MathMuncherGameProps> = ({ onClose }) => {
    const { minigames } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { submitScore, applyManualAdjustment } = useSystemDispatch();
    
    const [gameState, setGameState] = useState<'select-level' | 'loading-challenges' | 'countdown' | 'playing' | 'get-ready' | 'level-cleared' | 'game-over'>('select-level');
    const [selectedGradeKey, setSelectedGradeKey] = useState<string | null>(null);
    
    const [challengePlaylist, setChallengePlaylist] = useState<MathChallenge[]>([]);
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [round, setRound] = useState(1);
    
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [countdown, setCountdown] = useState(3);
    
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [troggles, setTroggles] = useState<Troggle[]>([]);
    const [grid, setGrid] = useState<Cell[][]>([]);
    
    const [shieldActive, setShieldActive] = useState(false);
    const [freezeActive, setFreezeActive] = useState(false);
    const [isHit, setIsHit] = useState(false);
    const [lastReward, setLastReward] = useState<{ amount: number, icon: string } | null>(null);
    const [isProcessingLevelClear, setIsProcessingLevelClear] = useState(false);
    
    const gameLoopRef = useRef<number | null>(null);
    const correctAnswersLeft = useRef(0);
    const nextLevelTimerRef = useRef<number | null>(null);
    
    const gameSpeed = useMemo(() => Math.max(200, 800 - (round - 1) * 50), [round]);
    const currentChallenge = useMemo(() => challengePlaylist[challengeIndex], [challengePlaylist, challengeIndex]);
    
    const gameConfig = useMemo(() => minigames.find(g => g.id === 'minigame-math-muncher'), [minigames]);
    const rewardSettings = useMemo(() => gameConfig?.rewardSettings, [gameConfig]);
    const rewardDef = useMemo(() => rewardTypes.find(rt => rt.id === rewardSettings?.rewardTypeId), [rewardTypes, rewardSettings]);

    const userBalance = useMemo(() => {
        if (!currentUser || !rewardSettings || !rewardDef) return 0;
        const balanceSource = rewardDef.category === RewardCategory.Currency ? currentUser.personalPurse : currentUser.personalExperience;
        return balanceSource[rewardSettings.rewardTypeId] || 0;
    }, [currentUser, rewardSettings, rewardDef]);

    const startChallenge = useCallback((index: number, playlist: MathChallenge[]) => {
        const challenge = playlist[index];
        const newGrid = challenge.generateGrid();
        setGrid(newGrid);
        
        const newPlayerPos = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
        setPlayerPos(newPlayerPos);

        correctAnswersLeft.current = newGrid.flat().filter((c: Cell) => c.isCorrect).length;

        const numTroggles = 1 + Math.floor(round / 2) + Math.floor(index / 4);
        const newTroggles: Troggle[] = [];
        for(let i = 0; i < numTroggles; i++) {
            const rand = Math.random();
            let type: 'patroller' | 'hunter' | 'jumper';
            if (rand < 0.2) {
                type = 'jumper';
            } else if (rand < 0.5) {
                type = 'hunter';
            } else {
                type = 'patroller';
            }
            newTroggles.push({
                id: Date.now() + i,
                pos: { x: i % 2 === 0 ? 0 : GRID_SIZE - 1, y: i < 2 ? 0 : GRID_SIZE - 1 },
                type,
                dir: { x: 1, y: 0 },
                stepsToGo: 0,
            });
        }
        setTroggles(newTroggles);

        setCountdown(3);
        setGameState('countdown');
    }, [round]);

    const startGame = useCallback(async (gradeKey: string) => {
        setGameState('loading-challenges');
        try {
            const gradeModule = await gradeManifest[gradeKey].import();
            const gradeChallenges = gradeModule.challenges;
            
            const newPlaylist = shuffleArray(gradeChallenges);
            setSelectedGradeKey(gradeKey);
            setChallengePlaylist(newPlaylist);
            setChallengeIndex(0);
            setRound(1);
            setScore(0);
            setCombo(0);
            setLives(INITIAL_LIVES);
            setShieldActive(false);
            setFreezeActive(false);
            startChallenge(0, newPlaylist);
        } catch (error) {
            console.error("Failed to load challenges:", error);
            addNotification({type: 'error', message: 'Could not load math challenges.'});
            setGameState('select-level');
        }
    }, [startChallenge, addNotification]);
    
    const startNextChallenge = useCallback(async () => {
        if (nextLevelTimerRef.current) {
            clearTimeout(nextLevelTimerRef.current);
        }

        let nextIndex = challengeIndex + 1;
        let nextRound = round;
        let nextPlaylist = challengePlaylist;

        if (nextIndex >= challengePlaylist.length) {
            nextIndex = 0;
            nextRound++;
            try {
                const gradeModule = await gradeManifest[selectedGradeKey!].import();
                const newChallenges = gradeModule.challenges;
                nextPlaylist = shuffleArray(newChallenges);
                setRound(nextRound);
                setChallengePlaylist(nextPlaylist);
            } catch(error) {
                console.error("Failed to load next level challenges:", error);
                addNotification({type: 'error', message: 'Could not load next level.'});
                setGameState('select-level');
                return;
            }
        }
        setChallengeIndex(nextIndex);
        setLastReward(null);
        startChallenge(nextIndex, nextPlaylist);
    }, [challengeIndex, round, challengePlaylist, selectedGradeKey, startChallenge, addNotification]);

    const handleLifeLost = useCallback(() => {
        if (isHit || gameState === 'game-over' || gameState === 'get-ready') return;
    
        setIsHit(true);
    
        setTimeout(() => {
            const newLives = lives - 1;
            setLives(newLives);
            setIsHit(false);
    
            if (newLives <= 0) {
                setGameState('game-over');
                submitScore('minigame-math-muncher', score);
            } else {
                setGameState('get-ready');
            }
        }, 1000);
    }, [isHit, gameState, lives, score, submitScore]);

    const continueAfterHit = useCallback(() => {
        const respawnPos = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
        setPlayerPos(respawnPos);
        setTroggles(prev => prev.filter(t => t.pos.x !== respawnPos.x || t.pos.y !== respawnPos.y));
        setGameState('countdown');
        setCountdown(3);
    }, []);

    const handleLevelCleared = useCallback(async () => {
        setGameState('level-cleared');
        setIsProcessingLevelClear(true);
        try {
            if (currentUser && rewardSettings && rewardDef && (challengeIndex + 1) % rewardSettings.levelFrequency === 0) {
                const success = await applyManualAdjustment({
                    userId: currentUser.id,
                    adjusterId: 'system',
                    reason: `Reward for clearing round ${round}, level ${challengeIndex + 1} in Math Muncher.`,
                    type: AdminAdjustmentType.Reward,
                    rewards: [{
                        rewardTypeId: rewardSettings.rewardTypeId,
                        amount: rewardSettings.amount
                    }],
                    setbacks: []
                });

                if (success) {
                    addNotification({
                        type: 'success',
                        message: `+${rewardSettings.amount} ${rewardDef.name}`,
                        icon: rewardDef.icon
                    });
                    setLastReward({ amount: rewardSettings.amount, icon: rewardDef.icon });
                } else {
                    throw new Error("Server failed to grant reward.");
                }
            }
        } catch (error) {
            console.error("Failed to apply level clear reward:", error);
            addNotification({
                type: 'error',
                message: 'There was a problem granting your reward. Please contact support.'
            });
            setLastReward(null);
        } finally {
            setIsProcessingLevelClear(false);
        }
    }, [currentUser, rewardSettings, rewardDef, challengeIndex, round, addNotification, applyManualAdjustment]);

    const handleMunch = useCallback(() => {
        if (gameState !== 'playing') return;
    
        const cell = grid[playerPos.y]?.[playerPos.x];
        if (!cell) return;
    
        if (cell.isEaten && !cell.item) return;
    
        let newGrid = grid.map(row => [...row]);
        const cellToUpdate = { ...newGrid[playerPos.y][playerPos.x] };
        let wasCorrectMunch = false;
    
        if (cellToUpdate.item) {
            if (cellToUpdate.item === 'life') setLives(l => l + 1);
            if (cellToUpdate.item === 'shield') setShieldActive(true);
            if (cellToUpdate.item === 'freeze') {
                setFreezeActive(true);
                setTimeout(() => setFreezeActive(false), 5000);
            }
            if (cellToUpdate.item === 'reveal') {
                newGrid = newGrid.map(row => row.map(c => c.isCorrect ? { ...c, feedback: 'correct' as const } : c));
                setTimeout(() => {
                    setGrid(prev => prev.map(row => row.map(c => ({...c, feedback: undefined}))));
                }, 1000);
            }
            cellToUpdate.item = undefined;
        }
    
        if (!cell.isEaten) {
            cellToUpdate.isEaten = true;
            if (cellToUpdate.isCorrect) {
                setScore(s => s + 10 * (1 + combo));
                setCombo(c => c + 1);
                correctAnswersLeft.current--;
                cellToUpdate.feedback = 'correct';
                wasCorrectMunch = true;
            } else {
                if (!shieldActive) {
                    handleLifeLost();
                } else {
                    setShieldActive(false);
                }
                setCombo(0);
                cellToUpdate.feedback = 'incorrect';
            }
        }
    
        newGrid[playerPos.y][playerPos.x] = cellToUpdate;
        setGrid(newGrid);
    
        if (wasCorrectMunch && correctAnswersLeft.current <= 0) {
            handleLevelCleared();
        }
    
        setTimeout(() => {
            setGrid(prevGrid => {
                const finalGrid = [...prevGrid.map(row => [...row])];
                const targetCell = finalGrid[playerPos.y]?.[playerPos.x];
                if(targetCell && (targetCell.feedback === 'correct' || targetCell.feedback === 'incorrect')) {
                     targetCell.feedback = undefined;
                }
                return finalGrid;
            });
        }, 300);
    }, [gameState, grid, playerPos, combo, shieldActive, handleLifeLost, handleLevelCleared]);

    const spawnPowerUp = useCallback(() => {
        const eatenCellsPos = grid.flat().map((cell, i) => cell.isEaten && !cell.item ? { y: Math.floor(i / GRID_SIZE), x: i % GRID_SIZE } : null).filter(Boolean);
        if (eatenCellsPos.length > 0) {
            const pos = eatenCellsPos[Math.floor(Math.random() * eatenCellsPos.length)]!;
            const powerUpTypes: PowerUpType[] = ['life', 'shield', 'freeze', 'reveal'];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            setGrid(prev => {
                const newGrid = [...prev.map(r => [...r])];
                if(newGrid[pos.y]?.[pos.x]) {
                    newGrid[pos.y][pos.x].item = type;
                }
                return newGrid;
            });
        }
    }, [grid]);
    
    const moveTroggles = useCallback(() => {
        setTroggles(prev => prev.map(troggle => {
            const newPos = { ...troggle.pos };
            let newDir = troggle.dir ? { ...troggle.dir } : { x: 1, y: 0 };
            let newStepsToGo = troggle.stepsToGo || 0;

            switch (troggle.type) {
                case 'patroller':
                    if (newStepsToGo <= 0) {
                        const directions = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
                        newDir = directions[getRandomInt(0, 3)];
                        newStepsToGo = getRandomInt(3, 8);
                    }
                    let nextX = newPos.x + newDir.x;
                    let nextY = newPos.y + newDir.y;
                    if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                        newStepsToGo = 0; // Hit a wall, force direction change next tick
                    } else {
                        newPos.x = nextX;
                        newPos.y = nextY;
                        newStepsToGo--;
                    }
                    return { ...troggle, pos: newPos, dir: newDir, stepsToGo: newStepsToGo };

                case 'hunter':
                    const dx = playerPos.x - troggle.pos.x;
                    const dy = playerPos.y - troggle.pos.y;
                    if (Math.random() < 0.2) {
                        const moves = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                        const move = moves[getRandomInt(0,3)];
                        newPos.x += move.x;
                        newPos.y += move.y;
                    } else {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newPos.x += Math.sign(dx);
                        } else if (dy !== 0) {
                            newPos.y += Math.sign(dy);
                        }
                    }
                    newPos.x = Math.max(0, Math.min(GRID_SIZE - 1, newPos.x));
                    newPos.y = Math.max(0, Math.min(GRID_SIZE - 1, newPos.y));
                    return { ...troggle, pos: newPos };

                case 'jumper':
                    if (Math.random() < 0.25) {
                        newPos.x = getRandomInt(0, GRID_SIZE - 1);
                        newPos.y = getRandomInt(0, GRID_SIZE - 1);
                    } else {
                        const moves = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                        const move = moves[getRandomInt(0,3)];
                        const potentialX = newPos.x + move.x;
                        const potentialY = newPos.y + move.y;
                        if (potentialX >= 0 && potentialX < GRID_SIZE && potentialY >= 0 && potentialY < GRID_SIZE) {
                            newPos.x = potentialX;
                            newPos.y = potentialY;
                        }
                    }
                    return { ...troggle, pos: newPos };
            }
            return troggle;
        }));
    }, [playerPos]);


    const handlePlayerMove = useCallback((dx: number, dy: number) => {
        setPlayerPos(prev => {
            const newPos = { x: prev.x + dx, y: prev.y + dy };
            if (newPos.x < 0 || newPos.x >= GRID_SIZE || newPos.y < 0 || newPos.y >= GRID_SIZE) {
                return prev;
            }
            return newPos;
        });
    }, []);
    
    const resetGame = useCallback(() => {
        setSelectedGradeKey(null);
        setChallengePlaylist([]);
        setChallengeIndex(0);
        setRound(1);
        setScore(0);
        setCombo(0);
        setLives(INITIAL_LIVES);
        setShieldActive(false);
        setFreezeActive(false);
        setGameState('select-level');
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'game-over' && e.key === 'Enter') {
                resetGame();
            } else if (gameState === 'level-cleared' && e.key === 'Enter') {
                startNextChallenge();
            } else if (gameState === 'get-ready' && e.key === 'Enter') {
                continueAfterHit();
            }

            if (gameState !== 'playing') return;

            switch (e.key) {
                case 'ArrowUp': handlePlayerMove(0, -1); break;
                case 'ArrowDown': handlePlayerMove(0, 1); break;
                case 'ArrowLeft': handlePlayerMove(-1, 0); break;
                case 'ArrowRight': handlePlayerMove(1, 0); break;
                case ' ': e.preventDefault(); handleMunch(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handlePlayerMove, handleMunch, startNextChallenge, resetGame, continueAfterHit]);
    
    useEffect(() => {
        if (gameState === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 700);
            return () => clearTimeout(timer);
        } else if (gameState === 'countdown' && countdown === 0) {
            setGameState('playing');
        }
    }, [gameState, countdown]);

    useEffect(() => {
        if (gameState !== 'playing') {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            return;
        }

        gameLoopRef.current = window.setInterval(() => {
            if(!freezeActive) moveTroggles();
            if(Math.random() < 0.02) spawnPowerUp();
        }, gameSpeed);
        
        return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
    }, [gameState, gameSpeed, freezeActive, spawnPowerUp, moveTroggles]);
    
    useEffect(() => {
        if (gameState === 'playing' && !isHit) {
            if (troggles.some(t => t.pos.x === playerPos.x && t.pos.y === playerPos.y)) {
                if (shieldActive) {
                    setTroggles(prevTroggles => prevTroggles.filter(t => t.pos.x !== playerPos.x || t.pos.y !== playerPos.y));
                    setShieldActive(false);
                } else {
                    handleLifeLost();
                }
            }
        }
    }, [playerPos, troggles, shieldActive, gameState, isHit, handleLifeLost]);

    useEffect(() => {
        if (gameState === 'level-cleared' && !isProcessingLevelClear) {
            nextLevelTimerRef.current = window.setTimeout(() => {
                startNextChallenge();
            }, 4000); // 4 seconds
        }

        return () => {
            if (nextLevelTimerRef.current) {
                clearTimeout(nextLevelTimerRef.current);
            }
        };
    }, [gameState, isProcessingLevelClear, startNextChallenge]);

    const cellSizeClass = 'w-20 h-20';

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${isHit ? 'animate-shake' : ''}`}>
             {(gameState === 'select-level' || gameState === 'loading-challenges') && (
                <div className="text-center text-white relative z-20">
                    <h1 className="text-5xl font-medieval text-emerald-400">Math Muncher</h1>
                    
                    {gameState === 'loading-challenges' ? (
                         <div className="flex flex-col items-center justify-center h-full text-center mt-8">
                            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-emerald-400"></div>
                            <p className="mt-4 text-stone-300">Loading Challenges...</p>
                        </div>
                    ) : (
                        <>
                            <p className="mt-4 mb-8 text-lg">Select a grade level to begin!</p>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(gradeManifest).map(([gradeKey, gradeData]) => (
                                    <Button key={gradeKey} onClick={() => startGame(gradeKey)} className="text-xl p-6">
                                        {gradeData.name}
                                    </Button>
                                ))}
                            </div>
                            <div className="mt-8">
                                <Button variant="secondary" onClick={onClose}>Exit Game</Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {gameState !== 'select-level' && gameState !== 'loading-challenges' && (
                 <>
                    <div className="w-full max-w-[450px] mb-4">
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
                        <div className="grid gap-1 bg-stone-900 p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                            {grid.flat().map((cell, index) => {
                                const x = index % GRID_SIZE;
                                const y = Math.floor(index / GRID_SIZE);
                                const isPlayer = playerPos.x === x && playerPos.y === y;
                                const troggle = troggles.find(t => t.pos.x === x && t.pos.y === y);
                                const fontSizeClass = getDynamicFontSize(cell.value);
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
                            {(gameState === 'countdown' || gameState === 'game-over' || gameState === 'level-cleared' || gameState === 'get-ready') && (
                                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-black/70 rounded-md flex flex-col items-center justify-center text-white">
                                    {gameState === 'countdown' && <p className="text-6xl font-bold font-medieval text-emerald-400 animate-ping" style={{animationDuration: '0.7s'}}>{countdown > 0 ? countdown : 'GO!'}</p>}
                                    {gameState === 'game-over' && <>
                                        <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                                        <p className="text-xl mt-2">Final Score: {score}</p>
                                        <Button onClick={resetGame} className="mt-6">Back to Levels</Button>
                                    </>}
                                    {gameState === 'level-cleared' && <>
                                        {lastReward ? (
                                            <>
                                                <h2 className="text-4xl font-bold font-medieval text-green-400">Reward Won!</h2>
                                                <div className="text-9xl my-4 animate-bounce">{lastReward.icon}</div>
                                                <p className="text-2xl font-bold">+ {lastReward.amount}</p>
                                            </>
                                        ) : (
                                            <h2 className="text-4xl font-bold font-medieval text-amber-300">Level Cleared!</h2>
                                        )}
                                        <Button
                                            onClick={() => {
                                                if (nextLevelTimerRef.current) clearTimeout(nextLevelTimerRef.current);
                                                startNextChallenge();
                                            }}
                                            className="mt-6"
                                            disabled={isProcessingLevelClear}
                                        >
                                            {isProcessingLevelClear ? 'Processing...' : 'Next Level'}
                                        </Button>
                                    </>}
                                    {gameState === 'get-ready' && <>
                                        <h2 className="text-4xl font-bold font-medieval text-red-500">Life Lost!</h2>
                                        <p className="text-xl mt-2">{lives} {lives === 1 ? 'life' : 'lives'} left.</p>
                                        <Button onClick={continueAfterHit} className="mt-6">Continue</Button>
                                    </>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                     <div className="flex items-center gap-8 mt-4">
                        <div className="grid grid-cols-3 gap-2 w-40">
                            <div></div>
                            <Button onClick={() => handlePlayerMove(0, -1)} className="w-12 h-12"><ArrowUp /></Button>
                            <div></div>
                            <Button onClick={() => handlePlayerMove(-1, 0)} className="w-12 h-12"><ArrowLeft /></Button>
                            <Button onClick={() => handlePlayerMove(0, 1)} className="w-12 h-12"><ArrowDown /></Button>
                            <Button onClick={() => handlePlayerMove(1, 0)} className="w-12 h-12"><ArrowRight /></Button>
                        </div>
                        <Button onClick={handleMunch} className="w-32 h-32 rounded-full text-2xl font-bold">Munch!</Button>
                    </div>
                    <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
                </>
            )}
        </div>
    );
};

export default MathMuncherGame;
