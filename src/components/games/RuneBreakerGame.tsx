
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface RuneBreakerGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;

const RuneBreakerGame: React.FC<RuneBreakerGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over' | 'level-cleared'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const ballRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 4, dy: -4, radius: 8 });
    const paddleRef = useRef({ x: GAME_WIDTH / 2 - 50, y: GAME_HEIGHT - 15, width: 100, height: 10 });
    const runesRef = useRef<any[]>([]);
    // FIX: Initialize useRef with null to provide a valid initial value.
    const animationFrameId = useRef<number | null>(null);

    const runeRowCount = 5;
    const runeColumnCount = 8;
    const runeWidth = 60;
    const runeHeight = 20;
    const runePadding = 10;
    const runeOffsetTop = 30;
    const runeOffsetLeft = 30;

    const createRunes = useCallback(() => {
        const newRunes = [];
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1', '#818cf8'];
        for (let c = 0; c < runeColumnCount; c++) {
            for (let r = 0; r < runeRowCount; r++) {
                const runeX = (c * (runeWidth + runePadding)) + runeOffsetLeft;
                const runeY = (r * (runeHeight + runePadding)) + runeOffsetTop;
                newRunes.push({ x: runeX, y: runeY, status: 1, color: colors[r] });
            }
        }
        runesRef.current = newRunes;
    }, []);

    const resetGame = useCallback(() => {
        setScore(0);
        setLives(3);
        ballRef.current = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, dx: 4, dy: -4, radius: 8 };
        paddleRef.current.x = GAME_WIDTH / 2 - paddleRef.current.width / 2;
        createRunes();
        setGameState('playing');
    }, [createRunes]);

    useEffect(() => {
        createRunes();
    }, [createRunes]);

    const handleMouseMove = (e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            paddleRef.current.x = relativeX - paddleRef.current.width / 2;
        }
    };
    
     const handleTouchMove = (e: TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || e.touches.length === 0) return;
        const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < GAME_WIDTH) {
            paddleRef.current.x = relativeX - paddleRef.current.width / 2;
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
                    setScore(prev => prev + 10);
                }
            }
        });
    }, []);

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
        
        // Wall collision
        if (ball.x + ball.dx > GAME_WIDTH - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > GAME_HEIGHT - ball.radius) {
            // Paddle collision
            if (ball.x > paddleRef.current.x && ball.x < paddleRef.current.x + paddleRef.current.width) {
                ball.dy = -ball.dy;
            } else {
                setLives(prev => prev - 1);
                if (lives -1 <= 0) {
                    setGameState('game-over');
                    submitScore('minigame-rune-breaker', score);
                } else {
                    ball.x = GAME_WIDTH / 2;
                    ball.y = GAME_HEIGHT - 30;
                    ball.dx = 4;
                    ball.dy = -4;
                    paddleRef.current.x = GAME_WIDTH / 2 - paddleRef.current.width / 2;
                }
            }
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;

        collisionDetection();
        draw();
        
        if (runesRef.current.every(rune => rune.status === 0)) {
            setGameState('level-cleared');
            submitScore('minigame-rune-breaker', score + 500); // Bonus for clearing
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, lives, score, draw, collisionDetection, submitScore]);

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
                <span className="text-2xl font-medieval text-amber-300">Rune Breaker</span>
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
                        <h2 className="text-4xl font-bold font-medieval text-amber-400">Level Cleared!</h2>
                        <p className="text-xl mt-2">Final Score: {score + 500}</p>
                        <Button onClick={resetGame} className="mt-6">Play Again</Button>
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default RuneBreakerGame;
