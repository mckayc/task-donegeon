import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface DungeonDashGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT_NORMAL = 60;
const PLAYER_HEIGHT_CROUCH = 30;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.8;
const JUMP_STRENGTH = -15;

const DungeonDashGame: React.FC<DungeonDashGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const playerRef = useRef({ x: 50, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT_NORMAL, width: PLAYER_WIDTH, height: PLAYER_HEIGHT_NORMAL, dy: 0, isJumping: false, isCrouching: false });
    const obstaclesRef = useRef<{ x: number, y: number, width: number, height: number, type: 'pit' | 'flyer' }[]>([]);
    const backgroundLayersRef = useRef([
        { x: 0, speed: 0.2, color: 'hsl(224 39% 10%)', height: 200, y: GAME_HEIGHT - GROUND_HEIGHT - 200 },
        { x: 0, speed: 0.5, color: 'hsl(224 39% 15%)', height: 150, y: GAME_HEIGHT - GROUND_HEIGHT - 150 }
    ]);
    const gameSpeedRef = useRef(5);
    const animationFrameId = useRef<number | null>(null);

    const resetGame = useCallback(() => {
        setScore(0);
        playerRef.current = { x: 50, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT_NORMAL, width: PLAYER_WIDTH, height: PLAYER_HEIGHT_NORMAL, dy: 0, isJumping: false, isCrouching: false };
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
        ctx.fillStyle = 'hsl(224 71% 4%)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        backgroundLayersRef.current.forEach(layer => {
            ctx.fillStyle = layer.color;
            layer.x -= gameSpeedRef.current * layer.speed;
            if (layer.x < -GAME_WIDTH) layer.x = 0;
            ctx.fillRect(layer.x, layer.y, GAME_WIDTH, layer.height);
            ctx.fillRect(layer.x + GAME_WIDTH, layer.y, GAME_WIDTH, layer.height);
        });

        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

        const player = playerRef.current;
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(-1, 1); // Flip the runner emoji
        ctx.font = `${player.height * 0.9}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const playerEmoji = player.isCrouching ? '🧎' : '🏃';
        ctx.fillText(playerEmoji, 0, 0);
        ctx.restore();

        obstaclesRef.current.forEach(obstacle => {
            ctx.font = `${obstacle.height}px sans-serif`;
            const obstacleEmoji = obstacle.type === 'pit' ? '🔥' : '👻';
            ctx.fillText(obstacleEmoji, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        });
    }, []);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;
        const player = playerRef.current;
        
        player.dy += GRAVITY;
        player.y += player.dy;

        if (player.y + player.height > GAME_HEIGHT - GROUND_HEIGHT) {
            player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
            player.dy = 0;
            player.isJumping = false;
        }
        
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
            const obstacle = obstaclesRef.current[i];
            obstacle.x -= gameSpeedRef.current;
            
            if (
                player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y
            ) {
                setGameState('game-over');
                if (score > highScore) setHighScore(score);
                submitScore('minigame-dungeon-dash', score);
                return;
            }
            if (obstacle.x + obstacle.width < 0) obstaclesRef.current.splice(i, 1);
        }
        
        if (obstaclesRef.current.length === 0 || obstaclesRef.current[obstaclesRef.current.length - 1].x < GAME_WIDTH - 250 - Math.random() * 250) {
            const type = Math.random() > 0.5 ? 'pit' : 'flyer';
            if (type === 'pit') {
                obstaclesRef.current.push({ x: GAME_WIDTH, y: GAME_HEIGHT - GROUND_HEIGHT - 30, width: 40, height: 40, type: 'pit' });
            } else {
                obstaclesRef.current.push({ x: GAME_WIDTH, y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT_NORMAL - 30, width: 40, height: 40, type: 'flyer' });
            }
        }
        
        setScore(s => s + 1);
        gameSpeedRef.current += 0.002;

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, score, highScore, draw, submitScore]);

    useEffect(() => {
        if (gameState === 'playing') animationFrameId.current = requestAnimationFrame(gameLoop);
        return () => { if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
    }, [gameState, gameLoop]);

    const handleAction = useCallback((action: 'jump' | 'crouch_start' | 'crouch_end') => {
        const player = playerRef.current;
        if (gameState === 'playing') {
            if (action === 'jump' && !player.isJumping && !player.isCrouching) {
                player.dy = JUMP_STRENGTH;
                player.isJumping = true;
            } else if (action === 'crouch_start' && !player.isJumping) {
                player.isCrouching = true;
                player.height = PLAYER_HEIGHT_CROUCH;
                player.y += PLAYER_HEIGHT_NORMAL - PLAYER_HEIGHT_CROUCH;
            } else if (action === 'crouch_end') {
                player.isCrouching = false;
                player.height = PLAYER_HEIGHT_NORMAL;
                player.y -= PLAYER_HEIGHT_NORMAL - PLAYER_HEIGHT_CROUCH;
            }
        } else {
            resetGame();
        }
    }, [gameState, resetGame]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') handleAction('jump');
            if (e.key === 'ArrowDown') handleAction('crouch_start');
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') handleAction('crouch_end');
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleAction]);
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Dungeon Dash</span>
                <span>High Score: {highScore}</span>
            </div>
             <div className="relative cursor-pointer" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} onMouseDown={() => handleAction('jump')} onTouchStart={() => handleAction('jump')}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full"></canvas>
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Dungeon Dash</h2>
                            <p className="mt-2">Tap/Space to Jump. Down Arrow to Slide.</p>
                            <Button onClick={resetGame} className="mt-6">Start Game</Button>
                        </>}
                        {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Play Again</Button>
                        </>}
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default DungeonDashGame;