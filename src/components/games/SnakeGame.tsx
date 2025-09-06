

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface SnakeGameProps {
  onClose: () => void;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const [countdown, setCountdown] = useState(3);
    const { submitScore } = useSystemDispatch();

    const gameLoopRef = useRef<number | null>(null);
    const directionRef = useRef({ x: 1, y: 0 });
    const snakeRef = useRef([{ x: 10, y: 10 }]);
    const foodRef = useRef({ x: 15, y: 15 });
    const gridSize = 20;

    const generateFood = useCallback(() => {
        if (canvasRef.current) {
            const widthInGrids = canvasRef.current.width / gridSize;
            const heightInGrids = canvasRef.current.height / gridSize;
            const x = Math.floor(Math.random() * widthInGrids);
            const y = Math.floor(Math.random() * heightInGrids);
            foodRef.current = { x, y };
        }
    }, [gridSize]);

    const gameOver = useCallback(() => {
        setGameState('game-over');
        if (score > highScore) {
            setHighScore(score);
        }
        submitScore('minigame-snake', score);
        if (gameLoopRef.current !== null) {
            clearTimeout(gameLoopRef.current);
        }
    }, [score, highScore, submitScore]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        snakeRef.current.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? 'hsl(158, 84%, 39%)' : 'hsl(158, 84%, 59%)';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });

        ctx.fillStyle = 'red';
        ctx.fillRect(foodRef.current.x * gridSize, foodRef.current.y * gridSize, gridSize, gridSize);

    }, [gridSize]);
    
    // Main game loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const gameLoop = () => {
            const snake = snakeRef.current;
            const head = { x: snake[0].x + directionRef.current.x, y: snake[0].y + directionRef.current.y };
            
            const canvas = canvasRef.current;
            if (!canvas) return;

            if (
                head.x < 0 || head.x >= canvas.width / gridSize ||
                head.y < 0 || head.y >= canvas.height / gridSize ||
                snake.some(segment => segment.x === head.x && segment.y === head.y)
            ) {
                gameOver();
                return;
            }

            const newSnake = [head, ...snake];
            
            if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
                setScore(s => s + 10);
                generateFood();
            } else {
                newSnake.pop();
            }

            snakeRef.current = newSnake;

            const ctx = canvas.getContext('2d');
            if (ctx) draw(ctx);

            gameLoopRef.current = window.setTimeout(gameLoop, 150); // Slower speed
        };
        
        gameLoopRef.current = window.setTimeout(gameLoop, 150);

        return () => {
            if (gameLoopRef.current !== null) clearTimeout(gameLoopRef.current);
        };
    }, [gameState, draw, generateFood, gameOver, gridSize]);
    
    // Countdown timer
    useEffect(() => {
        if (gameState !== 'pre-game') return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 700);
            return () => clearTimeout(timer);
        } else {
            setGameState('playing');
        }
    }, [gameState, countdown]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const { x, y } = directionRef.current;
        switch (e.key) {
            case 'ArrowUp': if (y === 0) directionRef.current = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (y === 0) directionRef.current = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (x === 0) directionRef.current = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (x === 0) directionRef.current = { x: 1, y: 0 }; break;
        }
    }, []);

    const resetGame = useCallback(() => {
        setScore(0);
        snakeRef.current = [{ x: 10, y: 10 }];
        directionRef.current = { x: 1, y: 0 };
        setCountdown(3);
        setGameState('pre-game');
        generateFood();
    }, [generateFood]);
    
    // Restart on key press from game over
    useEffect(() => {
        if (gameState === 'game-over') {
            const handleRestart = (e: KeyboardEvent) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    resetGame();
                }
            };
            window.addEventListener('keydown', handleRestart);
            return () => window.removeEventListener('keydown', handleRestart);
        }
    }, [gameState, resetGame]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const DPadButton: React.FC<{ dir: 'up' | 'down' | 'left' | 'right', children: React.ReactNode }> = ({ dir, children }) => {
        const handleClick = () => {
             if (gameState === 'game-over') {
                resetGame();
                return;
            }
             const { x, y } = directionRef.current;
             switch(dir) {
                case 'up': if (y === 0) directionRef.current = { x: 0, y: -1 }; break;
                case 'down': if (y === 0) directionRef.current = { x: 0, y: 1 }; break;
                case 'left': if (x === 0) directionRef.current = { x: -1, y: 0 }; break;
                case 'right': if (x === 0) directionRef.current = { x: 1, y: 0 }; break;
             }
        };
        return <button onClick={handleClick} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600">{children}</button>;
    }
    
    const CountdownDisplay: React.FC = () => {
        if (gameState !== 'pre-game') return null;
        return (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                 <p className="text-6xl font-bold font-medieval text-emerald-400 animate-ping" style={{animationDuration: '0.7s'}}>
                    {countdown > 0 ? countdown : 'GO!'}
                 </p>
            </div>
        )
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span>High Score: {highScore}</span>
            </div>
            <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]">
                 <canvas ref={canvasRef} width={500} height={500} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full"></canvas>
                <CountdownDisplay />
                {gameState === 'game-over' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                        <p className="text-xl mt-2">Final Score: {score}</p>
                        <Button onClick={resetGame} className="mt-6">Play Again</Button>
                        <p className="text-sm mt-4 text-stone-400">(or press any arrow key)</p>
                    </div>
                )}
            </div>
             <div className="mt-8 grid grid-cols-3 gap-2 w-52 md:hidden">
                <div />
                <DPadButton dir="up">↑</DPadButton>
                <div />
                <DPadButton dir="left">←</DPadButton>
                <DPadButton dir="down">↓</DPadButton>
                <DPadButton dir="right">→</DPadButton>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default SnakeGame;
