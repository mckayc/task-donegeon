import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface ForgeMasterGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const STRIKES_LIMIT = 10;

type Particle = { x: number, y: number, vx: number, vy: number, alpha: number, size: number, color: string };
type Feedback = { text: string, color: string, alpha: number, y: number };

export const ForgeMasterGame: React.FC<ForgeMasterGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [strikesLeft, setStrikesLeft] = useState(STRIKES_LIMIT);
    const [quality, setQuality] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const metalTempRef = useRef(0); // 0 to 1
    const tempDirectionRef = useRef<'up' | 'down'>('up');
    const particlesRef = useRef<Particle[]>([]);
    const feedbackRef = useRef<Feedback | null>(null);
    const animationFrameId = useRef<number | null>(null);
    
    const resetGame = useCallback(() => {
        setScore(0);
        setQuality(0);
        setStrikesLeft(STRIKES_LIMIT);
        metalTempRef.current = 0;
        tempDirectionRef.current = 'up';
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
        ctx.fillRect(150, 350, 300, 50);
        ctx.fillRect(250, 400, 100, 50);

        // Sword blank
        const temp = metalTempRef.current;
        const color = `hsl(60, 100%, ${20 + 35 * temp}%)`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(200, 350);
        ctx.lineTo(400, 350);
        ctx.lineTo(380, 330);
        ctx.lineTo(220, 330);
        ctx.closePath();
        ctx.fill();

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
        if (gameState !== 'playing') return;
        // Update temperature
        let temp = metalTempRef.current;
        if (tempDirectionRef.current === 'up') {
            temp += 0.015;
            if (temp >= 1) tempDirectionRef.current = 'down';
        } else {
            temp -= 0.01;
            if (temp <= 0) tempDirectionRef.current = 'up';
        }
        metalTempRef.current = Math.max(0, Math.min(1, temp));

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
        if (gameState !== 'playing') return;
        
        const temp = metalTempRef.current;
        let qualityGain = 0;
        let feedbackText = '';
        let feedbackColor = '';
        let particleColor = '';
        let particleCount = 0;

        if (temp >= 0.9) { // Perfect
            qualityGain = 0.15;
            feedbackText = 'Perfect!';
            feedbackColor = '74, 222, 128';
            particleColor = '255, 255, 180';
            particleCount = 50;
        } else if (temp >= 0.7) { // Good
            qualityGain = 0.1;
            feedbackText = 'Good!';
            feedbackColor = '250, 204, 21';
            particleColor = '255, 180, 0';
            particleCount = 30;
        } else if (temp >= 0.4) { // Okay
            qualityGain = 0.05;
            feedbackText = 'Okay';
            feedbackColor = '148, 163, 184';
            particleColor = '255, 100, 0';
            particleCount = 15;
        } else { // Miss
            qualityGain = 0;
            feedbackText = 'Too Cold!';
            feedbackColor = '156, 163, 175';
            particleColor = '100, 100, 100';
            particleCount = 10;
        }

        const newQuality = Math.min(1, quality + qualityGain);
        setQuality(newQuality);
        
        const newStrikesLeft = strikesLeft - 1;
        setStrikesLeft(newStrikesLeft);
        
        feedbackRef.current = { text: feedbackText, color: feedbackColor, y: 250, alpha: 1 };
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particlesRef.current.push({
                x: GAME_WIDTH / 2, y: 340,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                alpha: 1, size: 2 + Math.random() * 2, color: particleColor
            });
        }
        
        if (newStrikesLeft <= 0) {
            const finalScore = Math.round(newQuality * 5000);
            setScore(finalScore);
            setGameState('game-over');
            submitScore('minigame-forge-master', finalScore);
        }
        
    }, [gameState, quality, strikesLeft, submitScore]);
    
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
            {/* Quality and Temp Bars */}
            <div className="w-full max-w-[600px] space-y-2 mb-2">
                <div className="w-full bg-stone-700 rounded-full h-4"><div className="bg-sky-400 h-4 rounded-full" style={{ width: `${quality * 100}%` }}></div></div>
                <div className="w-full bg-stone-700 rounded-full h-4"><div className="bg-gradient-to-r from-gray-500 via-red-500 to-yellow-300 h-4 rounded-full" style={{ width: `${metalTempRef.current * 100}%` }}></div></div>
            </div>

            <div className="relative cursor-pointer" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} onClick={handleStrike} >
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-900 border-2 border-stone-700 rounded-lg w-full h-full" />
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Forge Master</h2>
                            <p className="mt-2">Click or press Space to strike when the metal is hot!</p>
                            <Button onClick={resetGame} className="mt-6">Start Forging</Button>
                        </>}
                        {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Finished!</h2>
                            <p className="text-xl mt-2">Final Quality: {(quality * 100).toFixed(0)}%</p>
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
