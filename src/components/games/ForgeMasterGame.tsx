import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface ForgeMasterGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const STRIKES_LIMIT = 10;
const ANVIL_Y = 350;
const ANVIL_HEIGHT = 50;
const SWORD_Y = ANVIL_Y - 20;
const HAMMER_SIZE = 60;

type Particle = { x: number, y: number, vx: number, vy: number, alpha: number, size: number, color: string };
type Feedback = { text: string, color: string, alpha: number, y: number };

export const ForgeMasterGame: React.FC<ForgeMasterGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [strikesLeft, setStrikesLeft] = useState(STRIKES_LIMIT);
    const [combo, setCombo] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const swordRef = useRef({ x: GAME_WIDTH / 2, speed: 3, amplitude: 150 });
    const hammerRef = useRef({ y: 100, isStriking: false });
    const particlesRef = useRef<Particle[]>([]);
    const feedbackRef = useRef<Feedback | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const gameTimeRef = useRef(0);
    
    const resetGame = useCallback(() => {
        setScore(0);
        setCombo(0);
        setStrikesLeft(STRIKES_LIMIT);
        swordRef.current = { x: GAME_WIDTH / 2, speed: 3, amplitude: 150 };
        gameTimeRef.current = 0;
        particlesRef.current = [];
        feedbackRef.current = null;
        setGameState('playing');
    }, []);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Anvil
        ctx.fillStyle = '#4a4a4a';
        ctx.font = '80px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕳️', GAME_WIDTH / 2, ANVIL_Y + ANVIL_HEIGHT / 2);
        
        // Sword
        ctx.font = '50px sans-serif';
        ctx.fillText('⚔️', swordRef.current.x, SWORD_Y);
        
        // Hammer
        ctx.save();
        ctx.translate(swordRef.current.x, hammerRef.current.y);
        if (hammerRef.current.isStriking) {
            ctx.rotate(Math.PI / 8);
        }
        ctx.font = `${HAMMER_SIZE}px sans-serif`;
        ctx.fillText('🔨', 0, 0);
        ctx.restore();

        // Particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Feedback
        if (feedbackRef.current && feedbackRef.current.alpha > 0) {
            const fb = feedbackRef.current;
            ctx.font = 'bold 32px MedievalSharp';
            ctx.fillStyle = `rgba(${fb.color}, ${fb.alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(fb.text, GAME_WIDTH / 2, fb.y);
        }
    }, []);
    
    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
             if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
             return;
        }
        gameTimeRef.current += 1;
        swordRef.current.x = GAME_WIDTH / 2 + swordRef.current.amplitude * Math.sin(gameTimeRef.current * 0.01 * swordRef.current.speed);

        // Update particles
        particlesRef.current.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) particlesRef.current.splice(i, 1);
        });

        // Update feedback
        if (feedbackRef.current) {
            feedbackRef.current.y -= 1;
            feedbackRef.current.alpha -= 0.02;
        }

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, draw]);
    
    const handleStrike = useCallback(() => {
        if (gameState !== 'playing' || hammerRef.current.isStriking) return;
        
        hammerRef.current.isStriking = true;
        hammerRef.current.y = SWORD_Y - HAMMER_SIZE / 2;
        
        setTimeout(() => {
            hammerRef.current.isStriking = false;
            hammerRef.current.y = 100;
        }, 150);

        const swordPos = swordRef.current.x;
        const hitProximity = Math.abs(swordPos - GAME_WIDTH / 2);
        
        let qualityGain = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let particleColor = '';
        let particleCount = 0;
        let newCombo = combo;

        if (hitProximity < 15) { // Perfect
            qualityGain = 200 * (1 + newCombo * 0.5);
            feedbackText = 'Perfect!';
            feedbackColor = '74, 222, 128';
            particleColor = '255, 255, 180';
            particleCount = 50;
            newCombo++;
            swordRef.current.speed += 0.2; // Speed up on perfect hit
        } else if (hitProximity < 40) { // Good
            qualityGain = 100;
            feedbackText = 'Good!';
            feedbackColor = '250, 204, 21';
            particleColor = '255, 180, 0';
            particleCount = 30;
            newCombo = 0;
        } else { // Miss
            qualityGain = 10;
            feedbackText = 'Miss!';
            feedbackColor = '156, 163, 175';
            particleColor = '100, 100, 100';
            particleCount = 10;
            newCombo = 0;
        }
        
        setCombo(newCombo);
        setScore(s => s + qualityGain);
        
        const newStrikesLeft = strikesLeft - 1;
        setStrikesLeft(newStrikesLeft);
        
        feedbackRef.current = { text: feedbackText, color: feedbackColor, y: 250, alpha: 1 };
        
        for (let i = 0; i < particleCount; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 4;
            particlesRef.current.push({
                x: swordPos, y: SWORD_Y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                alpha: 1, size: 2 + Math.random() * 2, color: particleColor
            });
        }
        
        if (newStrikesLeft <= 0) {
            setGameState('game-over');
            submitScore('minigame-forge-master', score + qualityGain);
        }
        
    }, [gameState, combo, strikesLeft, submitScore, score]);
    
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (gameState === 'pre-game' || gameState === 'game-over') {
                    resetGame();
                } else {
                    handleStrike();
                }
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState, handleStrike, resetGame]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return () => { if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
    }, [gameLoop]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[600px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Strikes Left: {strikesLeft}</span>
                <span className="text-2xl font-medieval text-amber-300">Forge Master</span>
                <span>Score: {score}</span>
            </div>
            <div className="w-full max-w-[600px] text-center mb-2">
                <p className="text-xl font-bold text-yellow-300">Combo: {combo}x</p>
            </div>

            <div className="relative cursor-pointer" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} onClick={handleStrike} >
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-900 border-2 border-stone-700 rounded-lg w-full h-full" />
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Forge Master</h2>
                            <p className="mt-2">Click or press Space to strike when the sword is over the anvil!</p>
                            <Button onClick={resetGame} className="mt-6">Start Forging</Button>
                        </>}
                        {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Finished!</h2>
                            <p className="text-3xl font-bold text-amber-300 mt-2">Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Forge Another</Button>
                        </>}
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-4">Exit Game</Button>
        </div>
    );
};