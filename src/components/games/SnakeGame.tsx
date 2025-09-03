import React, { useRef, useEffect, useState, useCallback } from 'react';
// FIX: Corrected import path for useSystemDispatch hook.
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface SnakeGameProps {
  onClose: () => void;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const { submitScore } = useSystemDispatch();

    const gameLoopRef = useRef<number>();
    const directionRef = useRef({ x: 1, y: 0 });
    const snakeRef = useRef([{ x: 10, y: 10 }]);
    const foodRef = useRef({ x: 15, y: 15 });
    const gridSize = 20;

    const generateFood = useCallback(() => {
        if (canvasRef.current) {
            const x = Math.floor(Math.random() * (canvasRef.current.width / gridSize));
            const y = Math.floor(Math.random() * (canvasRef.current.height / gridSize));
            foodRef.current = { x, y };
        }
    }, [gridSize]);

    const gameOver = useCallback(() => {
        setIsGameOver(true);
        if (score > highScore) {
            setHighScore(score);
        }
        // FIX: Passed the 'gameId' and 'score' to the `submitScore` function call within the `gameOver` handler to resolve the "Expected arguments" error.
        submitScore('minigame-snake', score);
        if (gameLoopRef.current) {
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
    
    useEffect(() => {
        const gameLoop = () => {
            if (isGameOver) return;
            
            const snake = snakeRef.current;
            const head = { x: snake[0].x + directionRef.current.x, y: snake[0].y + directionRef.current.y };
            
            if (
                !canvasRef.current ||
                head.x < 0 || head.x >= canvasRef.current.width / gridSize ||
                head.y < 0 || head.y >= canvasRef.current.height / gridSize ||
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

            const ctx = canvasRef.current!.getContext('2d');
            if (ctx) {
                draw(ctx);
            }

            gameLoopRef.current = window.setTimeout(gameLoop, 100);
        };
        
        if (!isGameOver) {
          generateFood();
          gameLoop();
        }

        return () => {
            if (gameLoopRef.current) {
                clearTimeout(gameLoopRef.current);
            }
        };
    }, [isGameOver, draw, generateFood, gameOver]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const { x, y } = directionRef.current;
        switch (e.key) {
            case 'ArrowUp': if (y === 0) directionRef.current = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (y === 0) directionRef.current = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (x === 0) directionRef.current = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (x === 0) directionRef.current = { x: 1, y: 0 }; break;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const resetGame = useCallback(() => {
        setScore(0);
        snakeRef.current = [{ x: 10, y: 10 }];
        directionRef.current = { x: 1, y: 0 };
        setIsGameOver(false);
    }, []);

    const DPadButton: React.FC<{ dir: 'up' | 'down' | 'left' | 'right', children: React.ReactNode }> = ({ dir, children }) => {
        const handleClick = () => {
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

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span>High Score: {highScore}</span>
            </div>
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
                 <canvas ref={canvasRef} width={400} height={400} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full"></canvas>
                {isGameOver && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                        <p className="text-xl mt-2">Final Score: {score}</p>
                        <Button onClick={resetGame} className="mt-6">Play Again</Button>
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