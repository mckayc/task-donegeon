import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface WizardsVortexGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const VORTEX_RADIUS = 30;

type Monster = { x: number, y: number, vx: number, vy: number, size: number, health: number, emoji: string };
type Bullet = { x: number, y: number, vx: number, vy: number, size: number };
type Particle = { x: number, y: number, vx: number, vy: number, alpha: number, size: number, color: string };

const MONSTER_TYPES = [
    { emoji: '👺', health: 1, size: 20 },
    { emoji: '👹', health: 3, size: 30 },
    { emoji: '👻', health: 2, size: 25 },
    { emoji: '💀', health: 5, size: 35 },
];

const WizardsVortexGame: React.FC<WizardsVortexGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const monstersRef = useRef<Monster[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const mousePosRef = useRef({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    const animationFrameId = useRef<number | null>(null);
    const spawnIntervalRef = useRef<number | null>(null);

    const resetGame = useCallback(() => {
        setScore(0);
        monstersRef.current = [];
        bulletsRef.current = [];
        particlesRef.current = [];
        setGameState('playing');
    }, []);

    const spawnMonster = useCallback(() => {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * GAME_WIDTH; y = -30; break; // Top
            case 1: x = GAME_WIDTH + 30; y = Math.random() * GAME_HEIGHT; break; // Right
            case 2: x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 30; break; // Bottom
            default: x = -30; y = Math.random() * GAME_HEIGHT; break; // Left
        }

        const angleToCenter = Math.atan2(GAME_HEIGHT / 2 - y, GAME_WIDTH / 2 - x);
        const speed = 0.5 + Math.random() * 1.5 + (score / 5000);
        const type = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
        
        monstersRef.current.push({
            ...type,
            x, y,
            vx: Math.cos(angleToCenter) * speed,
            vy: Math.sin(angleToCenter) * speed,
        });
    }, [score]);

    const createParticles = (x: number, y: number, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particlesRef.current.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1, size: 1 + Math.random() * 2, color
            });
        }
    };

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Vortex
        const vortexGradient = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 5, GAME_WIDTH / 2, GAME_HEIGHT / 2, VORTEX_RADIUS);
        vortexGradient.addColorStop(0, '#a855f7');
        vortexGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = vortexGradient;
        ctx.beginPath();
        ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, VORTEX_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Player (Wizard)
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧙', GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Aim line
        const angle = Math.atan2(mousePosRef.current.y - GAME_HEIGHT / 2, mousePosRef.current.x - GAME_WIDTH / 2);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.lineTo(GAME_WIDTH / 2 + Math.cos(angle) * 50, GAME_HEIGHT / 2 + Math.sin(angle) * 50);
        ctx.stroke();

        // Monsters
        monstersRef.current.forEach(monster => {
            ctx.font = `${monster.size}px sans-serif`;
            ctx.fillText(monster.emoji, monster.x, monster.y);
        });

        // Bullets
        ctx.fillStyle = '#facc15';
        bulletsRef.current.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    const gameLoop = useCallback(() => {
        // Update bullets
        bulletsRef.current.forEach((bullet, bIndex) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                bulletsRef.current.splice(bIndex, 1);
            }
        });

        // Update monsters and check collisions
        for (let mIndex = monstersRef.current.length - 1; mIndex >= 0; mIndex--) {
            const monster = monstersRef.current[mIndex];
            monster.x += monster.vx;
            monster.y += monster.vy;

            // Bullet collision
            for (let bIndex = bulletsRef.current.length - 1; bIndex >= 0; bIndex--) {
                const bullet = bulletsRef.current[bIndex];
                const dist = Math.hypot(bullet.x - monster.x, bullet.y - monster.y);
                if (dist < monster.size / 2 + bullet.size) {
                    bulletsRef.current.splice(bIndex, 1);
                    monster.health--;
                    createParticles(monster.x, monster.y, 5, '250, 204, 21'); // Yellow hit
                    if (monster.health <= 0) {
                        setScore(s => s + monster.size * 5);
                        createParticles(monster.x, monster.y, 20, '239, 68, 68'); // Red death
                        monstersRef.current.splice(mIndex, 1);
                        break;
                    }
                }
            }

            // Vortex collision
            const distToCenter = Math.hypot(monster.x - GAME_WIDTH / 2, monster.y - GAME_HEIGHT / 2);
            if (distToCenter < VORTEX_RADIUS + monster.size / 2) {
                setGameState('game-over');
                submitScore('minigame-wizards-vortex', score);
                return;
            }
        }
        
         // Update particles
        particlesRef.current.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            if (p.alpha <= 0) particlesRef.current.splice(i, 1);
        });

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [draw, score, submitScore]);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            spawnIntervalRef.current = window.setInterval(spawnMonster, 2000);
        }
        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        };
    }, [gameState, gameLoop, spawnMonster]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        const handleMouseClick = () => {
            if (gameState !== 'playing') return;
            const angle = Math.atan2(mousePosRef.current.y - GAME_HEIGHT / 2, mousePosRef.current.x - GAME_WIDTH / 2);
            bulletsRef.current.push({
                x: GAME_WIDTH / 2 + Math.cos(angle) * 40,
                y: GAME_HEIGHT / 2 + Math.sin(angle) * 40,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                size: 5
            });
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleMouseClick);
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleMouseClick);
        };
    }, [gameState]);

    return (
         <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[800px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Wizard's Vortex</span>
            </div>
            <div className="relative cursor-crosshair" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full" />
                {gameState !== 'playing' && (
                     <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Wizard's Vortex</h2>
                            <p className="mt-2">Defend the vortex! Aim with your mouse and click to fire.</p>
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

export default WizardsVortexGame;