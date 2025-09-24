
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface MathMuncherGameProps {
  onClose: () => void;
}

const GRID_WIDTH = 11;
const GRID_HEIGHT = 7;
const INITIAL_LIVES = 3;

type Position = { x: number; y: number };
type Cell = { value: number | string; isCorrect: boolean; isEaten: boolean; feedback?: 'correct' | 'incorrect' };
type Troggle = { pos: Position; dir: Position; id: number };

const isPrime = (num: number) => {
  if (num <= 1) return false;
  for (let i = 2; i < num; i++) if (num % i === 0) return false;
  return true;
};

const LEVELS = [
    { grade: '1st Grade', ruleText: 'Eat the Even Numbers', check: (n: number) => n % 2 === 0, numberRange: [1, 20] },
    { grade: '2nd Grade', ruleText: 'Eat Multiples of 5', check: (n: number) => n % 5 === 0, numberRange: [1, 100] },
    { grade: '3rd Grade', ruleText: 'Eat Multiples of 7', check: (n: number) => n % 7 === 0, numberRange: [1, 100] },
    { grade: '4th Grade', ruleText: 'Eat the Prime Numbers', check: isPrime, numberRange: [2, 100] },
];

const MathMuncherGame: React.FC<MathMuncherGameProps> = ({ onClose }) => {
    const [gameState, setGameState] = useState<'select-level' | 'countdown' | 'playing' | 'level-cleared' | 'game-over'>('select-level');
    const [level, setLevel] = useState(LEVELS[0]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [countdown, setCountdown] = useState(3);
    
    const [playerPos, setPlayerPos] = useState<Position>({ x: 5, y: 3 });
    const [troggles, setTroggles] = useState<Troggle[]>([]);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const correctAnswersLeft = useRef(0);

    const { submitScore } = useSystemDispatch();
    const gameLoopRef = useRef<number | null>(null);

    const generateGrid = useCallback((selectedLevel: typeof LEVELS[0]) => {
        const newGrid: Cell[][] = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null).map(() => ({ value: 0, isCorrect: false, isEaten: false })));
        let correctCount = 0;
        const totalCells = GRID_WIDTH * GRID_HEIGHT;
        const targetCorrectAnswers = Math.floor(totalCells * 0.3); // Aim for 30% correct answers

        const usedPositions = new Set<string>();

        while (correctCount < targetCorrectAnswers) {
            const x = Math.floor(Math.random() * GRID_WIDTH);
            const y = Math.floor(Math.random() * GRID_HEIGHT);
            const posKey = `${x}-${y}`;
            if (usedPositions.has(posKey)) continue;

            let num;
            do {
                num = Math.floor(Math.random() * (selectedLevel.numberRange[1] - selectedLevel.numberRange[0] + 1)) + selectedLevel.numberRange[0];
            } while (!selectedLevel.check(num));
            
            newGrid[y][x] = { value: num, isCorrect: true, isEaten: false };
            usedPositions.add(posKey);
            correctCount++;
        }
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (usedPositions.has(`${x}-${y}`)) continue;
                let num;
                do {
                    num = Math.floor(Math.random() * (selectedLevel.numberRange[1] - selectedLevel.numberRange[0] + 1)) + selectedLevel.numberRange[0];
                } while (selectedLevel.check(num));
                newGrid[y][x] = { value: num, isCorrect: false, isEaten: false };
                usedPositions.add(`${x}-${y}`);
            }
        }

        correctAnswersLeft.current = correctCount;
        setGrid(newGrid);
    }, []);

    const resetGame = useCallback((selectedLevel: typeof LEVELS[0]) => {
        setLevel(selectedLevel);
        setScore(0);
        setLives(INITIAL_LIVES);
        setPlayerPos({ x: 5, y: 3 });
        setTroggles([
            { id: 1, pos: { x: 0, y: 0 }, dir: { x: 1, y: 0 } },
            { id: 2, pos: { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 }, dir: { x: -1, y: 0 } },
        ]);
        generateGrid(selectedLevel);
        setCountdown(3);
        setGameState('countdown');
    }, [generateGrid]);
    
    const handlePlayerMove = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing') return;
        setPlayerPos(prev => {
            const newPos = { x: prev.x + dx, y: prev.y + dy };
            if (newPos.x < 0 || newPos.x >= GRID_WIDTH || newPos.y < 0 || newPos.y >= GRID_HEIGHT) {
                return prev;
            }
            return newPos;
        });
    }, [gameState]);
    
    useEffect(() => {
        if (gameState !== 'playing') return;
        
        const cell = grid[playerPos.y]?.[playerPos.x];
        if (cell && !cell.isEaten) {
            const newGrid = [...grid.map(row => [...row])];
            const eatenCell = { ...newGrid[playerPos.y][playerPos.x], isEaten: true };

            if (eatenCell.isCorrect) {
                setScore(s => s + 10);
                correctAnswersLeft.current--;
                eatenCell.feedback = 'correct';
            } else {
                setLives(l => l - 1);
                eatenCell.feedback = 'incorrect';
            }
            newGrid[playerPos.y][playerPos.x] = eatenCell;
            setGrid(newGrid);

            setTimeout(() => {
                setGrid(prevGrid => {
                    const finalGrid = [...prevGrid.map(row => [...row])];
                    finalGrid[playerPos.y][playerPos.x] = { ...finalGrid[playerPos.y][playerPos.x], feedback: undefined };
                    return finalGrid;
                });
            }, 500);
        }
    }, [playerPos, gameState]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            switch (e.key) {
                case 'ArrowUp': handlePlayerMove(0, -1); break;
                case 'ArrowDown': handlePlayerMove(0, 1); break;
                case 'ArrowLeft': handlePlayerMove(-1, 0); break;
                case 'ArrowRight': handlePlayerMove(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePlayerMove]);

    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = window.setInterval(() => {
                setTroggles(prevTroggles => prevTroggles.map(troggle => {
                    let { x, y } = troggle.pos;
                    let { x: dx, y: dy } = troggle.dir;
                    
                    if (Math.random() < 0.2) { // 20% chance to change direction
                        const newDirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
                        troggle.dir = newDirs[Math.floor(Math.random() * newDirs.length)];
                    }

                    let newX = x + dx;
                    let newY = y + dy;
                    if (newX < 0 || newX >= GRID_WIDTH || newY < 0 || newY >= GRID_HEIGHT) {
                        troggle.dir = { x: -dx, y: -dy };
                        newX = x + troggle.dir.x;
                        newY = y + troggle.dir.y;
                    }
                    return { ...troggle, pos: { x: newX, y: newY } };
                }));
            }, 800);
        }
        return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        
        if (lives <= 0) {
            setGameState('game-over');
            submitScore('minigame-math-muncher', score);
        }
        if (correctAnswersLeft.current <= 0) {
            setGameState('level-cleared');
            submitScore('minigame-math-muncher', score + 500);
        }
        troggles.forEach(troggle => {
            if (troggle.pos.x === playerPos.x && troggle.pos.y === playerPos.y) {
                setLives(l => l - 1);
                setPlayerPos({ x: 5, y: 3 }); // Reset player pos
            }
        });

    }, [lives, correctAnswersLeft.current, playerPos, troggles, gameState, score, submitScore]);
    
    useEffect(() => {
        if (gameState === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 700);
            return () => clearTimeout(timer);
        } else if (gameState === 'countdown' && countdown === 0) {
            setGameState('playing');
        }
    }, [gameState, countdown]);

    const renderGrid = () => (
        <div className="grid gap-1 bg-stone-900 p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)` }}>
            {grid.flat().map((cell, index) => {
                const x = index % GRID_WIDTH;
                const y = Math.floor(index / GRID_WIDTH);
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const troggle = troggles.find(t => t.pos.x === x && t.pos.y === y);
                return (
                    <motion.div
                        key={index}
                        className="w-10 h-10 flex items-center justify-center font-bold text-lg rounded bg-sky-800 relative"
                        animate={{
                            backgroundColor: cell.feedback === 'correct' ? '#22c55e' : cell.feedback === 'incorrect' ? '#ef4444' : '#0c4a6e'
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {!cell.isEaten && <span>{cell.value}</span>}
                        <AnimatePresence>
                        {isPlayer && <motion.span initial={{scale:0.5}} animate={{scale:1}} exit={{scale:0.5}} className="absolute text-3xl">😋</motion.span>}
                        {troggle && <motion.span initial={{scale:0.5}} animate={{scale:1}} exit={{scale:0.5}} className="absolute text-3xl">👿</motion.span>}
                        {cell.isEaten && cell.isCorrect && <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute text-3xl text-green-400">✅</motion.span>}
                        {cell.isEaten && !cell.isCorrect && <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute text-3xl text-red-500">❌</motion.span>}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
    
    const ScreenOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center rounded-lg">
            {children}
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {gameState === 'select-level' ? (
                <div className="text-center text-white">
                    <h1 className="text-5xl font-medieval text-emerald-400">Math Muncher</h1>
                    <p className="mt-4 mb-8 text-lg">Select a grade level to begin!</p>
                    <div className="grid grid-cols-2 gap-4">
                        {LEVELS.map(l => (
                            <Button key={l.grade} onClick={() => resetGame(l)} className="text-xl p-6">
                                {l.grade}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-full max-w-[500px] mb-4">
                        <div className="flex justify-between items-center text-white font-bold text-lg p-3 bg-stone-800/50 rounded-lg">
                            <span>Score: {score}</span>
                            <span>Lives: {'❤️'.repeat(lives)}</span>
                        </div>
                         <p className="text-center text-amber-300 font-semibold mt-2">{level.ruleText}</p>
                    </div>
                    <div className="relative">
                        {renderGrid()}
                        {gameState === 'countdown' && <ScreenOverlay><p className="text-8xl font-bold font-medieval text-emerald-400 animate-ping" style={{animationDuration: '0.7s'}}>{countdown > 0 ? countdown : 'GO!'}</p></ScreenOverlay>}
                        {gameState === 'game-over' && <ScreenOverlay>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={() => setGameState('select-level')} className="mt-6">Play Again</Button>
                        </ScreenOverlay>}
                        {gameState === 'level-cleared' && <ScreenOverlay>
                             <h2 className="text-4xl font-bold font-medieval text-amber-400">Level Cleared!</h2>
                            <p className="text-xl mt-2">Score: {score}</p>
                            <Button onClick={() => setGameState('select-level')} className="mt-6">Next Level</Button>
                        </ScreenOverlay>}
                    </div>
                    <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
                </>
            )}
        </div>
    );
};

export default MathMuncherGame;
