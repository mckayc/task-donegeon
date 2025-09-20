import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface RiverCrossingGameProps {
  onClose: () => void;
}

const COLS = 13;
const ROWS = 13;
const CELL_SIZE = 40;
const GAME_WIDTH = COLS * CELL_SIZE;
const GAME_HEIGHT = ROWS * CELL_SIZE;
const TIME_LIMIT = 60;

type Lane = {
    type: 'road' | 'river' | 'grass' | 'home';
    direction: -1 | 1;
    speed: number;
    obstacles: { x: number, width: number, emoji: string }[];
};

const RiverCrossingGame: React.FC<RiverCrossingGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over' | 'win'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const playerRef = useRef({ x: 6, y: 12, onLog: false });
    const lanesRef = useRef<Lane[]>([]);
    const homesRef = useRef([false, false, false, false, false]);
    
    const animationFrameId = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    const createLanes = useCallback(() => {
        const newLanes: Lane[] = [];
        newLanes[12] = { type: 'grass', direction: 1, speed: 0, obstacles: [] };
        for (let i = 7; i <= 11; i++) {
            newLanes[i] = { type: 'road', direction: i % 2 === 0 ? 1 : -1, speed: 1 + Math.random(), obstacles: Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => ({ x: Math.random() * GAME_WIDTH, width: (2 + Math.floor(Math.random() * 2)) * CELL_SIZE, emoji: Math.random() > 0.5 ? '🚗' : '🚚' })) };
        }
        newLanes[6] = { type: 'grass', direction: 1, speed: 0, obstacles: [] };
        for (let i = 1; i <= 5; i++) {
            newLanes[i] = { type: 'river', direction: i % 2 === 0 ? 1 : -1, speed: 0.5 + Math.random(), obstacles: Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => ({ x: Math.random() * GAME_WIDTH, width: (2 + Math.floor(Math.random() * 3)) * CELL_SIZE, emoji: '🪵' })) };
        }
        newLanes[0] = { type: 'home', direction: 1, speed: 0, obstacles: [] };
        lanesRef.current = newLanes;
    }, []);

    const resetLevel = useCallback(() => {
        playerRef.current = { x: 6, y: 12, onLog: false };
        setTimeLeft(TIME_LIMIT);
    }, []);

    const resetGame = useCallback(() => {
        createLanes();
        homesRef.current = [false, false, false, false, false];
        setScore(0);
        setLives(3);
        resetLevel();
        setGameState('playing');
    }, [createLanes, resetLevel]);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        lanesRef.current.forEach((lane, y) => {
            if (lane.type === 'road') ctx.fillStyle = '#4a4a4a';
            else if (lane.type === 'river') ctx.fillStyle = '#3b82f6';
            else if (lane.type === 'home') ctx.fillStyle = '#166534';
            else ctx.fillStyle = '#16a34a';
            ctx.fillRect(0, y * CELL_SIZE, GAME_WIDTH, CELL_SIZE);
        });
        
        homesRef.current.forEach((filled, i) => {
            if(filled) ctx.fillText('🦸', (i * 2 + 1.5) * CELL_SIZE, 0.5 * CELL_SIZE);
        });

        lanesRef.current.forEach(lane => {
            lane.obstacles.forEach(obs => {
                ctx.font = `${CELL_SIZE * 0.9}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(obs.emoji, obs.x + obs.width / 2, lanesRef.current.indexOf(lane) * CELL_SIZE + CELL_SIZE / 2);
            });
        });
        
        const player = playerRef.current;
        ctx.font = `${CELL_SIZE * 0.9}px sans-serif`;
        ctx.fillText('🦸', player.x * CELL_SIZE + CELL_SIZE / 2, player.y * CELL_SIZE + CELL_SIZE / 2);

    }, []);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;
        const player = playerRef.current;

        lanesRef.current.forEach(lane => {
            lane.obstacles.forEach(obs => {
                obs.x += lane.speed * lane.direction;
                if (lane.direction === 1 && obs.x > GAME_WIDTH) obs.x = -obs.width;
                if (lane.direction === -1 && obs.x < -obs.width) obs.x = GAME_WIDTH;
            });
        });
        
        // Collision Detection
        const currentLane = lanesRef.current[player.y];
        if (currentLane.type === 'road') {
            for (const obs of currentLane.obstacles) {
                if (player.x * CELL_SIZE < obs.x + obs.width && (player.x + 1) * CELL_SIZE > obs.x) {
                    setLives(l => l - 1);
                    resetLevel();
                    return;
                }
            }
        } else if (currentLane.type === 'river') {
            let onLog = false;
            for (const obs of currentLane.obstacles) {
                if (player.x * CELL_SIZE < obs.x + obs.width && (player.x + 1) * CELL_SIZE > obs.x) {
                    onLog = true;
                    // FIX: Changed `lane` to `currentLane` to use the variable in the correct scope.
                    player.x += currentLane.speed * currentLane.direction / CELL_SIZE;
                    break;
                }
            }
            if (!onLog) {
                setLives(l => l - 1);
                resetLevel();
                return;
            }
        }
        
        if (player.x < 0 || player.x >= COLS) {
             setLives(l => l - 1);
             resetLevel();
             return;
        }

        if (player.y === 0) { // Reached home row
            const homeIndex = Math.floor(player.x / 2);
            if(player.x % 2 === 1 && !homesRef.current[homeIndex]) {
                homesRef.current[homeIndex] = true;
                setScore(s => s + 50 + timeLeft);
                resetLevel();
                if(homesRef.current.every(h => h)) {
                    setGameState('win');
                    submitScore('minigame-river-crossing', score + 50 + timeLeft + 1000);
                }
            } else {
                 setLives(l => l - 1);
                 resetLevel();
            }
        }

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, score, timeLeft, resetLevel, draw, submitScore]);
    
    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing') return;
        const player = playerRef.current;
        const newX = player.x + dx;
        const newY = player.y + dy;
        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
            player.x = newX;
            player.y = newY;
            if (dy < 0) setScore(s => s + 10);
        }
    }, [gameState]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'pre-game' || gameState === 'game-over' || gameState === 'win') {
                resetGame();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': movePlayer(0, -1); break;
                case 'ArrowDown': movePlayer(0, 1); break;
                case 'ArrowLeft': movePlayer(-1, 0); break;
                case 'ArrowRight': movePlayer(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, movePlayer, resetGame]);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            timerIntervalRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
             if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState, gameLoop]);
    
    useEffect(() => {
        if ((timeLeft <= 0 || lives <= 0) && gameState === 'playing') {
             setGameState('game-over');
             submitScore('minigame-river-crossing', score);
        }
    }, [timeLeft, lives, gameState, score, submitScore]);
    
    return (
         <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-stone-900">
            <div className="w-full max-w-[520px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">River Crossing</span>
                <div className="flex gap-4">
                  <span>Lives: {lives}</span>
                  <span>Time: {timeLeft}</span>
                </div>
            </div>
            <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full" />
                {gameState !== 'playing' && (
                     <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">River Crossing</h2>
                            <p className="mt-2">Get your hero to an empty home at the top!</p>
                            <Button onClick={resetGame} className="mt-6">Start Game</Button>
                         </>}
                         {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Play Again</Button>
                         </>}
                         {gameState === 'win' && <>
                            <h2 className="text-4xl font-bold font-medieval text-amber-400">You Win!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Play Again</Button>
                         </>}
                     </div>
                )}
            </div>
             <div className="mt-8 grid grid-cols-3 gap-2 w-52">
                <div />
                <button onClick={() => movePlayer(0, -1)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowUp /></button>
                <div />
                <button onClick={() => movePlayer(-1, 0)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowLeft /></button>
                <button onClick={() => movePlayer(0, 1)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowDown /></button>
                <button onClick={() => movePlayer(1, 0)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowRight /></button>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default RiverCrossingGame;
