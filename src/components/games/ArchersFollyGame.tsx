import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface ArchersFollyGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GRAVITY = 0.2;
const MAX_ARROWS = 10;

type Arrow = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
};

type Target = {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    points: number;
};

const ArchersFollyGame: React.FC<ArchersFollyGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [arrowsLeft, setArrowsLeft] = useState(MAX_ARROWS);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const arrowsRef = useRef<Arrow[]>([]);
    const targetsRef = useRef<Target[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const isDrawingRef = useRef(false);
    const drawStartPosRef = useRef<{ x: number, y: number } | null>(null);
    const currentMousePosRef = useRef<{ x: number, y: number } | null>(null);

    const bowPosition = { x: 80, y: GAME_HEIGHT / 2 };

    const spawnTarget = useCallback(() => {
        const speed = 1.5 + (score / 500) + Math.random() * 1.5; // Starts at 1.5-3, gets faster
        const height = Math.max(30, 120 - (score / 100)); // Starts at 120, gets smaller
        const y = Math.random() * (GAME_HEIGHT - height - 20) + 10;
        const points = Math.floor(150 - height); // Smaller targets worth more

        targetsRef.current.push({
            x: GAME_WIDTH,
            y,
            width: 20,
            height,
            speed,
            points
        });
    }, [score]);

    const resetGame = useCallback(() => {
        setScore(0);
        setArrowsLeft(MAX_ARROWS);
        arrowsRef.current = [];
        targetsRef.current = [];
        spawnTarget(); // Initial target
        setGameState('playing');
    }, [spawnTarget]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw background
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#228B22'; // Forest green
        ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);

        // Draw Bow
        ctx.strokeStyle = '#8B4513'; // Saddle brown
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(bowPosition.x, bowPosition.y, 50, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        // Draw aiming line and power meter
        if (isDrawingRef.current && drawStartPosRef.current && currentMousePosRef.current) {
            const start = drawStartPosRef.current;
            const end = currentMousePosRef.current;
            const dx = start.x - end.x;
            const dy = start.y - end.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const power = Math.min(distance, 100) / 100;

            // Draw Bowstring
            ctx.beginPath();
            ctx.moveTo(bowPosition.x, bowPosition.y - 50);
            ctx.lineTo(bowPosition.x - power * 30, bowPosition.y);
            ctx.lineTo(bowPosition.x, bowPosition.y + 50);
            ctx.stroke();
            
            // Draw power meter
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(20, GAME_HEIGHT - 120, 20, 100);
            ctx.fillStyle = `hsl(${(1-power)*120}, 100%, 50%)`; // Green to Red
            ctx.fillRect(20, GAME_HEIGHT - 20 - (100 * power), 20, 100 * power);

            // Draw Trajectory line
            const angle = Math.atan2(dy, dx);
            const velocity = power * 100 * 0.2;
            let arrowX = bowPosition.x;
            let arrowY = bowPosition.y;
            let vx = velocity * Math.cos(angle);
            let vy = velocity * Math.sin(angle);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let t = 0; t < 60; t++) { // Simulate 60 frames
                vy += GRAVITY;
                arrowX += vx;
                arrowY += vy;
                if (t % 4 === 0) {
                     ctx.beginPath();
                     ctx.arc(arrowX, arrowY, 2, 0, Math.PI * 2);
                     ctx.fill();
                }
            }

        } else {
             // Draw resting bowstring
            ctx.beginPath();
            ctx.moveTo(bowPosition.x, bowPosition.y - 50);
            ctx.lineTo(bowPosition.x, bowPosition.y + 50);
            ctx.stroke();
        }

        // Draw targets
        targetsRef.current.forEach(target => {
            ctx.fillStyle = '#D2B48C'; // Tan
            ctx.fillRect(target.x, target.y, target.width, target.height);
            ctx.fillStyle = '#FF0000'; // Red
            ctx.fillRect(target.x, target.y + target.height/2 - 5, target.width, 10);
        });

        // Draw arrows
        arrowsRef.current.forEach(arrow => {
            ctx.save();
            ctx.translate(arrow.x, arrow.y);
            ctx.rotate(arrow.rotation);
            ctx.strokeStyle = '#A0522D'; // Sienna
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(0, 0);
            ctx.stroke();
            // Arrow fletching
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-20, -2);
            ctx.lineTo(-15, -2);
            ctx.lineTo(-15, 2);
            ctx.lineTo(-20, 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }, [bowPosition]);

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;

        const ball = arrowsRef.current; // Rename for clarity
        
        // Update arrows
        ball.forEach((arrow, arrowIndex) => {
            arrow.vy += GRAVITY;
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.rotation = Math.atan2(arrow.vy, arrow.vx);

            // Collision with targets
            for (let targetIndex = targetsRef.current.length - 1; targetIndex >= 0; targetIndex--) {
                const target = targetsRef.current[targetIndex];
                 if (
                    arrow.x >= target.x && arrow.x <= target.x + target.width &&
                    arrow.y >= target.y && arrow.y <= target.y + target.height
                ) {
                    setScore(s => s + target.points);
                    // Remove both arrow and target
                    arrowsRef.current.splice(arrowIndex, 1);
                    targetsRef.current.splice(targetIndex, 1);
                    // Spawn a new target
                    spawnTarget();
                    return; // Stop checking this arrow against other targets
                }
            }
            
            // Remove off-screen arrows
            if (arrow.x > GAME_WIDTH || arrow.y > GAME_HEIGHT) {
                arrowsRef.current.splice(arrowIndex, 1);
            }
        });

        // Update targets
        for (let index = targetsRef.current.length - 1; index >= 0; index--) {
            const target = targetsRef.current[index];
            target.x -= target.speed;
            if (target.x + target.width < 0) {
                targetsRef.current.splice(index, 1);
                spawnTarget();
            }
        }
        
        // Check for end of game
        if (arrowsLeft <= 0 && arrowsRef.current.length === 0) {
            setGameState('game-over');
            if (score > highScore) {
                setHighScore(score);
            }
            submitScore('minigame-archers-folly', score);
        }

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [draw, spawnTarget, arrowsLeft, score, highScore, submitScore, gameState]);
    
    // Start/Stop game loop
    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState, gameLoop]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (gameState !== 'playing' || arrowsLeft <= 0) return;
        isDrawingRef.current = true;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        drawStartPosRef.current = pos;
        currentMousePosRef.current = pos;
    }, [gameState, arrowsLeft]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || gameState !== 'playing') return;
        const rect = e.currentTarget.getBoundingClientRect();
        currentMousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, [gameState]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || gameState !== 'playing') return;
        isDrawingRef.current = false;

        const start = drawStartPosRef.current;
        const end = currentMousePosRef.current;

        if (start && end) {
            const dx = start.x - end.x;
            const dy = start.y - end.y;
            const power = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
            const angle = Math.atan2(dy, dx);
            
            const velocity = power * 0.2; // Scale power to velocity

            arrowsRef.current.push({
                x: bowPosition.x,
                y: bowPosition.y,
                vx: velocity * Math.cos(angle),
                vy: velocity * Math.sin(angle),
                rotation: angle,
            });
            
            setArrowsLeft(prev => prev - 1);
        }

        drawStartPosRef.current = null;
        currentMousePosRef.current = null;

    }, [gameState, bowPosition, arrowsLeft]);
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Archer's Folly</span>
                <span>Arrows: {arrowsLeft}</span>
            </div>
            <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas 
                    ref={canvasRef} 
                    width={GAME_WIDTH} 
                    height={GAME_HEIGHT} 
                    className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp} // Fire on leave as well
                />
                {gameState === 'pre-game' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        <h2 className="text-4xl font-bold font-medieval text-emerald-400">Archer's Folly</h2>
                        <p className="mt-2">Click and drag to aim, release to fire. Hit the targets!</p>
                        <Button onClick={resetGame} className="mt-6">Start Game</Button>
                    </div>
                )}
                {gameState === 'game-over' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-red-500">Out of Arrows!</h2>
                        <p className="text-xl mt-2">Final Score: {score}</p>
                        <p className="text-lg mt-1">High Score: {highScore}</p>
                        <Button onClick={resetGame} className="mt-6">Play Again</Button>
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default ArchersFollyGame;