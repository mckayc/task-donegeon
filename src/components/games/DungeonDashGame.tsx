import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface DungeonDashGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.8;
const JUMP_STRENGTH = -15;

const DungeonDashGame: React.FC<DungeonDashGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const playerRef = useRef({ x: 50, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, dy: 0, isJumping: false });
    const obstaclesRef = useRef<{ x: number, width: number, type: 'pit' }[]>([]);
    const gameSpeedRef = useRef(5);
    const animationFrameId = useRef<number | null>(null);

    const resetGame = useCallback(() => {
        setScore(0);
        playerRef.current = { x: 50, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, dy: 0, isJumping: false };
        obstaclesRef.current = [];
        gameSpeedRef.current = 5;
        setGameState('playing');
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Ground
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

        // Draw Player
        ctx.fillStyle = '#10b981';
        ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

        // Draw Obstacles
        ctx.fillStyle = '#212121';
        obstaclesRef.current.forEach(obstacle => {
            if (obstacle.type === 'pit') {
                ctx.fillRect(obstacle.x, GAME_HEIGHT - GROUND_HEIGHT, obstacle.width, GROUND_HEIGHT);
            }
        });
    }, []);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;

        const player = playerRef.current;
        
        // Apply gravity
        player.dy += GRAVITY;
        player.y += player.dy;

        // Ground collision
        if (player.y + player.height > GAME_HEIGHT - GROUND_HEIGHT) {
            player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
            player.dy = 0;
            player.isJumping = false;
        }
        
        // Update obstacles
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obstacle = obstaclesRef.current[i];
            obstacle.x -= gameSpeedRef.current;

            // Collision detection with pits
            if (
                player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y + player.height > GAME_HEIGHT - GROUND_HEIGHT
            ) {
                setGameState('game-over');
                if (score > highScore) setHighScore(score);
                submitScore('minigame-dungeon-dash', score);
                return;
            }

            if (obstacle.x + obstacle.width < 0) {
                obstaclesRef.current.splice(i, 1);
            }
        }
        
        // Add new obstacles
        if (obstaclesRef.current.length === 0 || obstaclesRef.current[obstaclesRef.current.length - 1].x < GAME_WIDTH - 300 - Math.random() * 200) {
            obstaclesRef.current.push({
                x: GAME_WIDTH,
                width: 50 + Math.random() * 100,
                type: 'pit'
            });
        }
        
        // Increase score and speed
        setScore(s => s + 1);
        gameSpeedRef.current += 0.002;

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, score, highScore, draw, submitScore]);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [gameState, gameLoop]);

    const handleJump = useCallback(() => {
        if (gameState === 'pre-game') {
            resetGame();
        } else if (gameState === 'playing' && !playerRef.current.isJumping) {
            playerRef.current.dy = JUMP_STRENGTH;
            playerRef.current.isJumping = true;
        } else if (gameState === 'game-over') {
            resetGame();
        }
    }, [gameState, resetGame]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                handleJump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleJump]);
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Dungeon Dash</span>
                <span>High Score: {highScore}</span>
            </div>
             <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} onMouseDown={handleJump} onTouchStart={handleJump}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full"></canvas>
                {gameState === 'pre-game' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        <h2 className="text-4xl font-bold font-medieval text-emerald-400">Dungeon Dash</h2>
                        <p className="mt-2">Click, tap, or press Space to jump over the pits!</p>
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
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default DungeonDashGame;
