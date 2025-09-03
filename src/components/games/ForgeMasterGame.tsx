
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface ForgeMasterGameProps {
  onClose: () => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const FORGE_BAR_Y = 150;
const FORGE_BAR_HEIGHT = 30;
const INDICATOR_WIDTH = 10;
const INDICATOR_HEIGHT = 40;
const ANVIL_Y = 300;

export const ForgeMasterGame: React.FC<ForgeMasterGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [strikes, setStrikes] = useState(3);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const [feedback, setFeedback] = useState<{ text: string, color: string, x: number, y: number, alpha: number } | null>(null);
    const { submitScore } = useSystemDispatch();

    const indicatorRef = useRef({ x: 50, speed: 4 });
    const animationFrameId = useRef<number | null>(null);
    
    // Define target zones
    const forgeBarWidth = GAME_WIDTH - 100;
    const [targetZoneWidth, setTargetZoneWidth] = useState(100);
    const [perfectZoneWidth, setPerfectZoneWidth] = useState(20);
    const [targetZoneX, setTargetZoneX] = useState((GAME_WIDTH - targetZoneWidth) / 2);
    const perfectZoneX = targetZoneX + (targetZoneWidth - perfectZoneWidth) / 2;
    
    const resetGame = useCallback(() => {
        setScore(0);
        setCombo(0);
        setStrikes(3);
        indicatorRef.current = { x: 50, speed: 4 };
        setTargetZoneX((GAME_WIDTH - 100) / 2);
        setGameState('playing');
        setFeedback(null);
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw Anvil (simple rect)
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(GAME_WIDTH / 2 - 75, ANVIL_Y, 150, 50);
        ctx.fillRect(GAME_WIDTH / 2 - 40, ANVIL_Y + 50, 80, 50);

        // Draw Forge Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(50, FORGE_BAR_Y, forgeBarWidth, FORGE_BAR_HEIGHT);

        // Draw Target Zones
        // Good zone
        ctx.fillStyle = 'rgba(234, 179, 8, 0.5)';
        ctx.fillRect(targetZoneX, FORGE_BAR_Y, targetZoneWidth, FORGE_BAR_HEIGHT);
        // Perfect zone
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.fillRect(perfectZoneX, FORGE_BAR_Y, perfectZoneWidth, FORGE_BAR_HEIGHT);

        // Draw Indicator
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(indicatorRef.current.x, FORGE_BAR_Y - (INDICATOR_HEIGHT - FORGE_BAR_HEIGHT) / 2, INDICATOR_WIDTH, INDICATOR_HEIGHT);
        
        // Draw Feedback Text
        if (feedback && feedback.alpha > 0) {
            ctx.font = 'bold 24px MedievalSharp';
            ctx.fillStyle = `rgba(${feedback.color}, ${feedback.alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(feedback.text, feedback.x, feedback.y);
            setFeedback(f => f ? { ...f, y: f.y - 0.5, alpha: f.alpha - 0.01 } : null);
        }

    }, [feedback, perfectZoneX, targetZoneX, forgeBarWidth, perfectZoneWidth, targetZoneWidth]);
    
    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') return;

        const indicator = indicatorRef.current;
        indicator.x += indicator.speed;
        
        if (indicator.x <= 50 || indicator.x >= 50 + forgeBarWidth - INDICATOR_WIDTH) {
            indicator.speed *= -1;
        }

        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState, draw, forgeBarWidth]);
    
    const handleStrike = useCallback(() => {
        if (gameState !== 'playing') return;

        const indicatorX = indicatorRef.current.x;
        
        let strikeScore = 0;
        let feedbackText = 'Miss!';
        let feedbackColor = '239, 68, 68'; // Red for miss
        let comboBonus = 0;
        let newStrikes = strikes;

        if (indicatorX >= perfectZoneX && indicatorX <= perfectZoneX + perfectZoneWidth) {
            strikeScore = 100;
            feedbackText = 'Perfect!';
            feedbackColor = '74, 222, 128'; // Green
            setCombo(c => {
                comboBonus = (c + 1) * 10;
                return c + 1;
            });
        } else if (indicatorX >= targetZoneX && indicatorX <= targetZoneX + targetZoneWidth) {
            strikeScore = 50;
            feedbackText = 'Good!';
            feedbackColor = '250, 204, 21'; // Yellow
            setCombo(0);
        } else {
            setCombo(0);
            newStrikes = strikes - 1;
            setStrikes(newStrikes);
        }
        
        const finalScore = score + strikeScore + comboBonus;
        setScore(finalScore);
        setFeedback({ text: `${feedbackText}${comboBonus > 0 ? ` +${comboBonus} combo` : ''}`, color: feedbackColor, x: indicatorX, y: FORGE_BAR_Y - 20, alpha: 1 });

        if (newStrikes <= 0) {
            setGameState('game-over');
            submitScore('minigame-forge-master', finalScore);
        }
        
    }, [gameState, combo, perfectZoneX, perfectZoneWidth, targetZoneX, targetZoneWidth, score, strikes, submitScore]);
    
    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [gameState, gameLoop]);
    
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

    return (
        <div className="flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-[600px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Forge Master</span>
                <span>Strikes: {strikes}</span>
            </div>
             <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} onClick={handleStrike} >
                <canvas 
                    ref={canvasRef} 
                    width={GAME_WIDTH} 
                    height={GAME_HEIGHT} 
                    className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full cursor-pointer"
                />
                {gameState === 'pre-game' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                        <h2 className="text-4xl font-bold font-medieval text-emerald-400">Forge Master</h2>
                        <p className="mt-2">Click or press Space when the indicator is in the target zone!</p>
                        <Button onClick={resetGame} className="mt-6">Start Forging</Button>
                    </div>
                )}
                {gameState === 'game-over' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <h2 className="text-4xl font-bold font-medieval text-red-500">Forge Broken!</h2>
                        <p className="text-xl mt-2">Final Score: {score}</p>
                        <Button onClick={resetGame} className="mt-6">Try Again</Button>
                    </div>
                )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};
