
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSystemDispatch, useSystemState } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Cell, Troggle, PowerUpType } from './MathMuncherTypes';
import { challenges } from './MathMuncherChallenges';
import { shuffleArray } from './MathMuncherHelpers';
import { useAuthState } from '../../context/AuthContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { RewardCategory } from '../../types';
import { useEconomyState } from '../../context/EconomyContext';

interface MathMuncherGameProps {
  onClose: () => void;
}

const INITIAL_LIVES = 3;

const MathMuncherGame: React.FC<MathMuncherGameProps> = ({ onClose }) => {
    const { minigames } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { submitScore } = useSystemDispatch();
    
    const [gameState, setGameState] = useState<'select-level' | 'countdown' | 'playing' | 'level-cleared' | 'game-over'>('select-level');
    const [selectedGradeKey, setSelectedGradeKey] = useState<string | null>(null);
    
    const [challengePlaylist, setChallengePlaylist] = useState<any[]>([]);
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
    
    const gameLoopRef = useRef<number | null>(null);
    const correctAnswersLeft = useRef(0);
    
    const gameSpeed = useMemo(() => 800 - (round - 1) * 50, [round]);
    const currentChallenge = useMemo(() => challengePlaylist[challengeIndex], [challengePlaylist, challengeIndex]);

    const startChallenge = useCallback((index: number, playlist: any[]) => {
        const challenge = playlist[index];
        const newGrid = challenge.generateGrid();
        setGrid(newGrid);
        
        const gridSize = challenge.gridSize;
        const newPlayerPos = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
        setPlayerPos(newPlayerPos);

        correctAnswersLeft.current = newGrid.flat().filter((c: Cell) => c.isCorrect).length;

        const numTroggles = 1 + Math.floor(round / 2) + Math.floor(index / 4);
        const newTroggles: Troggle[] = [];
        for(let i = 0; i < numTroggles; i++) {
            const type = Math.random() < 0.2 ? 'jumper' : Math.random() < 0.4 ? 'hunter' : 'patroller';
            newTroggles.push({
                id: Date.now() + i,
                pos: { x: i % 2 === 0 ? 0 : gridSize - 1, y: i < 2 ? 0 : gridSize - 1 },
                type,
                dir: { x: 1, y: 0 }
            });
        }
        setTroggles(newTroggles);

        setCountdown(3);
        setGameState('countdown');
    }, [round]);

    const startGame = useCallback((gradeKey: string) => {
        const gradeChallenges = challenges[gradeKey];
        if (!gradeChallenges) return;

        setSelectedGradeKey(gradeKey);
        setChallengePlaylist(shuffleArray(gradeChallenges.challenges));
        setChallengeIndex(0);
        setRound(1);
        setScore(0);
        setCombo(0);
        setLives(INITIAL_LIVES);
        setShieldActive(false);
        setFreezeActive(false);
        startChallenge(0, shuffleArray(gradeChallenges.challenges));
    }, [startChallenge]);
    
    const startNextChallenge = useCallback(() => {
        let nextIndex = challengeIndex + 1;
        let nextRound = round;
        let nextPlaylist = challengePlaylist;

        if (nextIndex >= challengePlaylist.length) {
            nextIndex = 0;
            nextRound++;
            nextPlaylist = shuffleArray(challenges[selectedGradeKey!].challenges);
            setRound(nextRound);
            setChallengePlaylist(nextPlaylist);
        }
        setChallengeIndex(nextIndex);
        startChallenge(nextIndex, nextPlaylist);
    }, [challengeIndex, round, challengePlaylist, selectedGradeKey, startChallenge]);

    const handleMunch = useCallback(() => {
        if (gameState !== 'playing') return;

        const cell = grid[playerPos.y]?.[playerPos.x];
        if (!cell || cell.isEaten) return;

        if (cell.item) {
            // Collect power-up
            if (cell.item === 'life') setLives(l => l + 1);
            if (cell.item === 'shield') setShieldActive(true);
            if (cell.item === 'freeze') {
                setFreezeActive(true);
                setTimeout(() => setFreezeActive(false), 5000);
            }
            if (cell.item === 'reveal') {
                const revealedGrid = grid.map(row => row.map(c => c.isCorrect ? { ...c, feedback: 'correct' as const } : c));
                setGrid(revealedGrid);
                setTimeout(() => {
                     setGrid(prev => prev.map(row => row.map(c => ({...c, feedback: undefined}))));
                }, 1000);
            }
        }
        
        const newGrid = grid.map(row => [...row]);
        const eatenCell = { ...newGrid[playerPos.y][playerPos.x], isEaten: true, item: undefined };

        if (eatenCell.isCorrect) {
            setScore(s => s + 10 * (1 + combo));
            setCombo(c => c + 1);
            correctAnswersLeft.current--;
            eatenCell.feedback = 'correct';
        } else {
            setLives(l => l - 1);
            setCombo(0);
            eatenCell.feedback = 'incorrect';
        }

        newGrid[playerPos.y][playerPos.x] = eatenCell;
        setGrid(newGrid);

        setTimeout(() => {
            setGrid(prevGrid => {
                const finalGrid = [...prevGrid.map(row => [...row])];
                if(finalGrid[playerPos.y]?.[playerPos.x]) {
                    finalGrid[playerPos.y][playerPos.x] = { ...finalGrid[playerPos.y][playerPos.x], feedback: undefined };
                }
                return finalGrid;
            });
        }, 300);
    }, [gameState, grid, playerPos, combo]);

    const spawnPowerUp = useCallback(() => {
        const eatenCellsPos = grid.flat().map((cell, i) => cell.isEaten && !cell.item ? { y: Math.floor(i / currentChallenge.gridSize), x: i % currentChallenge.gridSize } : null).filter(Boolean);
        if (eatenCellsPos.length > 0) {
            const pos = eatenCellsPos[Math.floor(Math.random() * eatenCellsPos.length)]!;
            const powerUpTypes: PowerUpType[] = ['life', 'shield', 'freeze', 'reveal'];
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            setGrid(prev => {
                const newGrid = [...prev.map(r => [...r])];
                newGrid[pos.y][pos.x].item = type;
                return newGrid;
            });
        }
    }, [grid, currentChallenge]);
    
    const moveTroggles = useCallback(() => {
        setTroggles(prev => prev.map(troggle => {
            // ... (troggle movement logic from previous implementation)
            return troggle; // Placeholder for new logic
        }));
    }, []);

    const handlePlayerMove = useCallback((dx: number, dy: number) => {
        setPlayerPos(prev => {
            const newPos = { x: prev.x + dx, y: prev.y + dy };
            if (newPos.x < 0 || newPos.x >= currentChallenge.gridSize || newPos.y < 0 || newPos.y >= currentChallenge.gridSize) {
                return prev;
            }
            return newPos;
        });
    }, [currentChallenge?.gridSize]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'select-level') return;

            if (gameState === 'game-over' || gameState === 'level-cleared') {
                if(e.key === 'Enter') gameState === 'game-over' ? setGameState('select-level') : startNextChallenge();
                return;
            }

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
    }, [gameState, handlePlayerMove, handleMunch, startNextChallenge]);
    
    // Countdown
    useEffect(() => {
        if (gameState === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 700);
            return () => clearTimeout(timer);
        } else if (gameState === 'countdown' && countdown === 0) {
            setGameState('playing');
        }
    }, [gameState, countdown]);

    // Game Loop
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
    
    // Check win/loss conditions
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (lives <= 0) {
            setGameState('game-over');
            submitScore('minigame-math-muncher', score);
        } else if (correctAnswersLeft.current <= 0) {
            setGameState('level-cleared');
            
            const gameConfig = minigames.find(g => g.id === 'minigame-math-muncher');
            const rewardSettings = gameConfig?.rewardSettings;
            if (currentUser && rewardSettings && rewardSettings.rewardTypeId && (challengeIndex + 1) % rewardSettings.levelFrequency === 0) {
                const rewardDef = rewardTypes.find(rt => rt.id === rewardSettings.rewardTypeId);
                if (rewardDef) {
                    addNotification({
                        type: 'success',
                        message: `+${rewardSettings.amount} ${rewardDef.name}`,
                        icon: rewardDef.icon
                    });
                }
            }
        }
    }, [lives, correctAnswersLeft.current, gameState, score, submitScore, minigames, rewardTypes, addNotification, currentUser, challengeIndex]);
    
    const gridSize = currentChallenge?.gridSize || 12;
    const cellSizeClass = gridSize === 12 ? 'w-10 h-10 text-lg' : 'w-20 h-20 text-2xl';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
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
                </div>
            )}

            {gameState !== 'select-level' && (
                 <>
                    <div className="w-full max-w-[900px] mb-4">
                        <div className="flex justify-between items-center text-white font-bold text-lg p-3 bg-stone-800/50 rounded-lg">
                            <span>Score: {score}</span>
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
                                return (
                                    <div key={index} className={`flex items-center justify-center font-bold rounded bg-sky-800 relative transition-colors duration-200 ${cellSizeClass}`}
                                         style={{ backgroundColor: cell.feedback === 'correct' ? '#22c55e' : cell.feedback === 'incorrect' ? '#ef4444' : '#0c4a6e' }}>
                                        {!cell.isEaten && <span>{cell.value}</span>}
                                        {isPlayer && <span className="absolute text-3xl">😋</span>}
                                        {troggle && <span className="absolute text-3xl">👿</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Overlays */}
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
