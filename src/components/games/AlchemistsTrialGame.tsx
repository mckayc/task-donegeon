import React, { useState, useEffect, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface AlchemistsTrialGameProps {
  onClose: () => void;
}

const INGREDIENTS = ['🧪', '🍄', '🌿', '💧', '🔥', '✨'];
const BUTTON_COLORS = [
    'bg-green-500/80 hover:bg-green-600/80',
    'bg-red-500/80 hover:bg-red-600/80',
    'bg-purple-500/80 hover:bg-purple-600/80',
    'bg-sky-500/80 hover:bg-sky-600/80',
    'bg-amber-500/80 hover:bg-amber-600/80',
    'bg-pink-500/80 hover:bg-pink-600/80',
];

const AlchemistsTrialGame: React.FC<AlchemistsTrialGameProps> = ({ onClose }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerInput, setPlayerInput] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'pre-game' | 'watching' | 'playing' | 'game-over'>('pre-game');
    const [score, setScore] = useState(0);
    const [flashingButton, setFlashingButton] = useState<number | null>(null);
    const { submitScore } = useSystemDispatch();
    
    const addNewToSequence = useCallback((currentSequence: number[]) => {
        const nextVal = Math.floor(Math.random() * INGREDIENTS.length);
        const newSequence = [...currentSequence, nextVal];
        setSequence(newSequence);
        setPlayerInput([]);
        setGameState('watching');
    }, []);

    const startNewGame = useCallback(() => {
        setSequence([]);
        setPlayerInput([]);
        setScore(0);
        setTimeout(() => addNewToSequence([]), 500);
    }, [addNewToSequence]);

    const handlePlayerClick = (index: number) => {
        if (gameState !== 'playing') return;
        
        const newPlayerInput = [...playerInput, index];
        
        if (newPlayerInput[newPlayerInput.length - 1] !== sequence[newPlayerInput.length - 1]) {
            setGameState('game-over');
            submitScore('minigame-alchemists-trial', score);
            return;
        }

        setPlayerInput(newPlayerInput);

        if (newPlayerInput.length === sequence.length) {
            setScore(s => s + sequence.length * 10);
            setGameState('watching');
            setTimeout(() => addNewToSequence(sequence), 1000);
        }
    };
    
    useEffect(() => {
        if (gameState === 'watching' && sequence.length > 0) {
            let i = 0;
            const interval = setInterval(() => {
                setFlashingButton(sequence[i]);
                setTimeout(() => setFlashingButton(null), 300);
                i++;
                if (i >= sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => setGameState('playing'), 400);
                }
            }, 600);
            return () => clearInterval(interval);
        }
    }, [gameState, sequence]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Alchemist's Trial</span>
                <span>Level: {sequence.length}</span>
            </div>
            <div className="relative bg-stone-800/70 border-2 border-stone-700/60 rounded-full p-8" style={{ width: 400, height: 400 }}>
                {INGREDIENTS.map((emoji, index) => {
                    const angle = (index / INGREDIENTS.length) * 2 * Math.PI - Math.PI / 2;
                    const x = 150 + 120 * Math.cos(angle);
                    const y = 150 + 120 * Math.sin(angle);
                    return (
                        <button
                            key={index}
                            onClick={() => handlePlayerClick(index)}
                            className={`absolute w-24 h-24 rounded-full flex items-center justify-center text-5xl transition-all duration-200 ${BUTTON_COLORS[index]} ${flashingButton === index ? 'scale-110 ring-4 ring-white' : ''}`}
                            style={{ top: y, left: x }}
                            disabled={gameState !== 'playing'}
                        >
                            {emoji}
                        </button>
                    );
                })}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-32 h-32 bg-stone-900/80 rounded-full flex items-center justify-center text-center text-white p-2">
                        {gameState === 'watching' && <p className="text-lg font-bold">Watch...</p>}
                        {gameState === 'playing' && <p className="text-lg font-bold">Your turn!</p>}
                    </div>
                </div>
                 {(gameState === 'pre-game' || gameState === 'game-over') && (
                     <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Alchemist's Trial</h2>
                            <p className="mt-2">Repeat the sequence!</p>
                            <Button onClick={startNewGame} className="mt-6">Start Game</Button>
                         </>}
                         {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Sequence Failed!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={startNewGame} className="mt-6">Play Again</Button>
                         </>}
                     </div>
                 )}
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default AlchemistsTrialGame;