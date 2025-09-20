import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface GoblinAmbushGameProps {
  onClose: () => void;
}

const HOLE_COUNT = 9;
const TIME_LIMIT = 30; // seconds

type HoleState = {
    type: 'empty' | 'goblin' | 'gnome' | 'golden';
    timer: number;
};

const GoblinAmbushGame: React.FC<GoblinAmbushGameProps> = ({ onClose }) => {
    const [holes, setHoles] = useState<HoleState[]>(() => Array(HOLE_COUNT).fill({ type: 'empty', timer: 0 }));
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const gameTickRef = useRef<number | null>(null);
    
    const popUp = useCallback(() => {
        setHoles(prevHoles => {
            const emptyHoles = prevHoles.map((h, i) => h.type === 'empty' ? i : -1).filter(i => i !== -1);
            if (emptyHoles.length === 0) return prevHoles;
            
            const newHoles = [...prevHoles];
            const randomIndex = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
            const random = Math.random();
            let type: HoleState['type'] = 'goblin';
            if (random < 0.2) type = 'gnome'; // 20% chance for a gnome
            else if (random < 0.25) type = 'golden'; // 5% chance for a golden goblin
            
            newHoles[randomIndex] = { type, timer: 1000 + Math.random() * 1000 };
            return newHoles;
        });
    }, []);

    const gameLoop = useCallback(() => {
        setHoles(prevHoles => {
            return prevHoles.map(hole => {
                if (hole.type === 'empty') return hole;
                const newTimer = hole.timer - 50;
                return newTimer <= 0 ? { type: 'empty', timer: 0 } : { ...hole, timer: newTimer };
            });
        });

        if (Math.random() < 0.15) { // Chance to pop up a new one
            popUp();
        }

    }, [popUp]);

    const resetGame = useCallback(() => {
        setHoles(Array(HOLE_COUNT).fill({ type: 'empty', timer: 0 }));
        setScore(0);
        setTimeLeft(TIME_LIMIT);
        setGameState('playing');
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            gameTickRef.current = window.setInterval(gameLoop, 50);
            const timer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setGameState('game-over');
                        submitScore('minigame-goblin-ambush', score);
                        clearInterval(timer);
                        if (gameTickRef.current) clearInterval(gameTickRef.current);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);

            return () => {
                clearInterval(timer);
                if (gameTickRef.current) clearInterval(gameTickRef.current);
            };
        }
    }, [gameState, gameLoop, score, submitScore]);

    const handleWhack = (index: number) => {
        if (gameState !== 'playing' || holes[index].type === 'empty') return;

        const whackedHole = holes[index];
        if (whackedHole.type === 'goblin') setScore(s => s + 100);
        else if (whackedHole.type === 'golden') setScore(s => s + 500);
        else if (whackedHole.type === 'gnome') setScore(s => Math.max(0, s - 200));

        setHoles(prevHoles => {
            const newHoles = [...prevHoles];
            newHoles[index] = { type: 'empty', timer: 0 };
            return newHoles;
        });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-green-900/50">
            <div className="w-full max-w-lg flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Goblin Ambush</span>
                <span>Time: {timeLeft}</span>
            </div>
            <div className="relative bg-amber-800/60 border-4 border-amber-900 rounded-lg p-4 grid grid-cols-3 gap-4">
                {holes.map((hole, index) => (
                    <div key={index} className="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center" onClick={() => handleWhack(index)}>
                        <span className={`text-6xl transition-transform duration-100 ${hole.type !== 'empty' ? 'scale-100' : 'scale-0'}`}>
                            {hole.type === 'goblin' && '👺'}
                            {hole.type === 'gnome' && '🧑‍🌾'}
                            {hole.type === 'golden' && '🤑'}
                        </span>
                    </div>
                ))}
                 {(gameState === 'pre-game' || gameState === 'game-over') && (
                     <div className="absolute inset-0 bg-black/70 rounded-md flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">Goblin Ambush</h2>
                            <p className="mt-2">Whack the goblins, not the gnomes!</p>
                            <Button onClick={resetGame} className="mt-6">Start Game</Button>
                         </>}
                         {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">Time's Up!</h2>
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

export default GoblinAmbushGame;