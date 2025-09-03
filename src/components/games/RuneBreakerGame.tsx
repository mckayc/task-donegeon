import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface RuneBreakerGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;

type PowerUp = { x: number, y: number, type: 'widen_paddle' };

const RuneBreakerGame: React.FC<RuneBreakerGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over' | 'level-cleared'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const ballRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 4, dy: -4, radius: 8 });
    const paddleRef = useRef({ x: GAME_WIDTH / 2 - 50, y: GAME_HEIGHT - 15, width: 100, height: 10 });
    const runesRef = useRef<any[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const animationFrameId = useRef<number | null>(null);

    const runeRowCount = 5;
    const runeColumnCount = 8;
    const runeWidth = 60;
    const runeHeight = 20;
    const runePadding = 10;
    const runeOffsetTop = 30;
    const runeOffsetLeft = 30;

    const createRunes = useCallback((currentLevel: number) => {
        const newRunes = [];
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1', '#818cf8'];
        for (let c = 0; c < runeColumnCount; c++) {
            for (let r = 0; r < runeRowCount; r++) {
                // Level variations
                if (currentLevel === 2 && (c + r) % 2 === 0) continue; // Checkerboard
                if (currentLevel === 3 && (c === 0 || c === runeColumnCount - 1)) continue; // Gaps at sides
                
                const runeX = (c * (runeWidth + runePadding)) + runeOffsetLeft;
                const runeY = (r * (runeHeight + runePadding)) + runeOffsetTop + (currentLevel > 1 ? 20 : 0); // Shift down for higher levels
                newRunes.push({ x: runeX, y: runeY, status: 1, color: colors[r] });
            }
        }
        runesRef.current = newRunes;
    }, []);

    const resetLevel = useCallback((nextLevel: number) => {
        setLevel(nextLevel);
        ballRef.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 4 * (1 + (nextLevel - 1) * 0.1), dy: -4 * (1 + (nextLevel - 1) * 0.1), radius: 8 };
        paddleRef.current.x = GAME_WIDTH / 2 - paddleRef.current.width / 2;
        createRunes(nextLevel);
        setGameState('playing');
    }, [createRunes]);
    
    const resetGame = useCallback(() => {
        setScore(0);
        setLives(3);
        resetLevel(1);
    }, [resetLevel]);


    useEffect(() => {
        createRunes(level);
    }, [createRunes, level]);

    const handleMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        }
    };
    
     const handleTouchMove = (e: TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || e.touches.length === 0) return;
        const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, relativeX - paddleRef.current.width / 2));
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove);
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const collisionDetection = useCallback(() => {
        runesRef.current.forEach(rune => {
            if (rune.status === 1) {
                const ball = ballRef.current;
                if (ball.x > rune.x && ball.x < rune.x + runeWidth && ball.y > rune.y && ball.y < rune.y + runeHeight) {
                    ball.dy = -ball.dy;
                    rune.status = 0;
                    setScore(prev => prev + 10 * level);
                    
                    // Power-up spawn chance
                    if (Math.random() < 0.2) { // 20% chance
                        powerUpsRef.current.push({ x: rune.x + runeWidth / 2, y: rune.y, type: 'widen_paddle' });
                    }
                }
            }
        });
    }, [level]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw paddle
        ctx.beginPath();
        ctx.rect(paddleRef.current.x, paddleRef.current.y, paddleRef.current.width, paddleRef.current.height);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.closePath();

        // Draw runes
        runesRef.current.forEach(rune => {
            if (rune.status === 1) {
                ctx.beginPath();
                ctx.rect(rune.x, rune.y, runeWidth, runeHeight);
                ctx.fillStyle = rune.color;
                ctx.fill();
                ctx.closePath();
            }
        });
        
        // Draw power-ups
        powerUpsRef.current.forEach(powerUp => {
            ctx.beginPath();
            ctx.rect(powerUp.x - 10, powerUp.y, 20, 20);
            ctx.fillStyle = '#facc15'; // Yellow for widen
            ctx.fill();
            ctx.closePath();
        });
        
        // Draw ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.closePath();
    }, []);
    
    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;

        const ball = ballRef.current;
        const paddle = paddleRef.current;
        
        // Wall collision
        if (ball.x + ball.dx > GAME_WIDTH - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > GAME_HEIGHT - ball.radius) {
            // Paddle collision
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                ball.dy = -ball.dy;
            } else {
                setLives(prev => prev - 1);
                if (lives -1 <= 0) {
                    setGameState('game-over');
                    submitScore('minigame-rune-breaker', score);
                } else {
                    ball.x = GAME_WIDTH / 2;
                    ball.y = GAME_HEIGHT - 30;
                    ball.dx = 4 * (1 + (level - 1) * 0.1);
                    ball.dy = -4 * (1 + (level - 1) * 0.1);
                    paddle.x = GAME_WIDTH / 2 - paddle.width / 2;
                }
            }
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Update and check power-ups
        for(let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            const powerUp = powerUpsRef.current[i];
            powerUp.y += 2; // Power-up fall speed
            
            // Paddle collision with power-up
            if (powerUp.x > paddle.x && powerUp.x < paddle.x + paddle.width && powerUp.y > paddle.y && powerUp.y < paddle.y + paddle.height) {
                 if (powerUp.type === 'widen_paddle') {
                    paddle.width = 150;
                    setTimeout(() => { paddle.width = 100; }, 5000); // Effect lasts 5 seconds
                }
                powerUpsRef.current.splice(i, 1);
            } else if (powerUp.y > GAME_HEIGHT) {
                powerUpsRef.current.splice(i, 1);
            }
        }

        collisionDetection();
        draw();
        
        if (runesRef.current.every(rune => rune.status === 0)) {
            setScore(s => s + 500);
            setGameState('level-cleared');
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, lives, score, draw, collisionDetection, submitScore, level]);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [gameState, gameLoop]);
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-[600px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Rune Breaker - Level {level}</span>
                <span>Lives: {lives}</span>
            </div>
             <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full"></canvas>
                {gameState === 'pre-game' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-emerald-400">Rune Breaker</h2>
                        <p className="mt-2">Break all the runes to win!</p>
                        <Button onClick={resetGame} className="mt-6">Start Game</Button>
                    </div>
                )}
                {gameState === 'game-over' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                        <p className="text-xl mt-2">Final Score: {score}</p>
                        <Button onClick={resetGame} className="mt-6">Play Again</Button>
                    </div>
                )}
                {gameState === 'level-cleared' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-amber-400">Level {level} Cleared!</h2>
                        <p className="text-xl mt-2">Score: {score}</p>
                        <Button onClick={() => resetLevel(level + 1)} className="mt-6">Next Level</Button>
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default RuneBreakerGame;