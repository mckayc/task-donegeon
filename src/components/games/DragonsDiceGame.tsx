import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface DragonsDiceGameProps {
  onClose: () => void;
}

const WINNING_SCORE = 5000;

// Helper to calculate score of a set of dice
const calculateScore = (dice: number[]): { score: number, scoringDice: number[] } => {
    let score = 0;
    const counts: { [key: number]: number } = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

    const scoringDice: number[] = [];

    // Check for special combinations first
    const sortedDice = [...new Set(dice)].sort();
    if (sortedDice.length === 6 && sortedDice.join(',') === '1,2,3,4,5,6') {
        return { score: 1500, scoringDice: dice };
    }
    const pairs = Object.values(counts).filter(c => c === 2).length;
    if (pairs === 3) {
        return { score: 1500, scoringDice: dice };
    }

    // Three of a kind
    for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) {
            score += i === 1 ? 1000 : i * 100;
            counts[i] -= 3;
            for(let j=0; j<3; j++) scoringDice.push(i);
        }
    }

    // Singles
    if (counts[1]) {
        score += counts[1] * 100;
        for(let j=0; j<counts[1]; j++) scoringDice.push(1);
    }
    if (counts[5]) {
        score += counts[5] * 50;
        for(let j=0; j<counts[5]; j++) scoringDice.push(5);
    }

    return { score, scoringDice };
};


const Die: React.FC<{ value: number; isSelected: boolean; isKept: boolean; onClick: () => void; }> = ({ value, isSelected, isKept, onClick }) => {
    const dotPatterns: { [key: number]: string } = {
        1: "justify-center items-center",
        2: "justify-between",
        3: "justify-between",
        4: "justify-between",
        5: "justify-between",
        6: "justify-between",
    };
    const baseDot = <div className="w-4 h-4 bg-stone-800 rounded-full" />;

    return (
        <button
            onClick={onClick}
            disabled={isKept}
            className={`w-20 h-20 bg-stone-200 rounded-lg p-2 flex flex-col transition-all duration-200
                ${isKept ? 'opacity-40' : ''}
                ${isSelected ? 'ring-4 ring-emerald-400 scale-105' : 'ring-2 ring-stone-400'}
                ${!isKept ? 'hover:ring-emerald-500' : ''}`}
        >
            <div className={`w-full h-full flex flex-col ${dotPatterns[value]}`}>
                {value === 1 && baseDot}
                {value === 2 && <>{baseDot}<div className="self-end">{baseDot}</div></>}
                {value === 3 && <>{baseDot}<div className="self-center">{baseDot}</div><div className="self-end">{baseDot}</div></>}
                {value === 4 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                {value === 5 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="self-center">{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                {value === 6 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
            </div>
        </button>
    );
};


const DragonsDiceGame: React.FC<DragonsDiceGameProps> = ({ onClose }) => {
    const [dice, setDice] = useState<(number | null)[]>(new Array(6).fill(null));
    const [keptDice, setKeptDice] = useState<boolean[]>(new Array(6).fill(false));
    const [selectedDice, setSelectedDice] = useState<boolean[]>(new Array(6).fill(false));
    
    const [turnScore, setTurnScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    
    const [gameState, setGameState] = useState<'pre-game' | 'rolling' | 'scoring' | 'busted' | 'won'>('pre-game');
    const [message, setMessage] = useState("Roll the dice to begin!");
    const { submitScore } = useSystemDispatch();

    const resetTurn = () => {
        setDice(new Array(6).fill(null));
        setKeptDice(new Array(6).fill(false));
        setSelectedDice(new Array(6).fill(false));
        setTurnScore(0);
    };

    const resetGame = () => {
        resetTurn();
        setTotalScore(0);
        setGameState('pre-game');
        setMessage("Roll the dice to begin!");
    };
    
    const rollDice = () => {
        setGameState('rolling');
        setSelectedDice(new Array(6).fill(false));
        setMessage("Rolling...");

        let rollCount = 0;
        const interval = setInterval(() => {
            const newDice = dice.map((_, i) => keptDice[i] ? dice[i] : Math.floor(Math.random() * 6) + 1);
            setDice(newDice as number[]);
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(interval);
                const availableDice = newDice.filter((d, i) => !keptDice[i]);
                const { scoringDice } = calculateScore(availableDice as number[]);
                if (scoringDice.length === 0) {
                    setGameState('busted');
                    setMessage("BUSTED! No scoring dice. Turn over.");
                    setTurnScore(0);
                } else {
                    setGameState('scoring');
                    setMessage("Select your scoring dice.");
                }
            }
        }, 100);
    };

    const handleDieClick = (index: number) => {
        if (gameState !== 'scoring' || keptDice[index]) return;
        const newSelected = [...selectedDice];
        newSelected[index] = !newSelected[index];
        setSelectedDice(newSelected);
    };
    
    const lockInSelection = () => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        if (selectedValues.length === 0) {
            setMessage("You must select at least one scoring die.");
            return;
        }

        const { score: selectionScore, scoringDice } = calculateScore(selectedValues);
        
        if (scoringDice.length !== selectedValues.length) {
            setMessage("Invalid selection. Please only select scoring dice.");
            return;
        }

        setTurnScore(prev => prev + selectionScore);
        const newKept = [...keptDice];
        selectedDice.forEach((isSelected, i) => {
            if (isSelected) newKept[i] = true;
        });

        // Hot dice!
        if (newKept.every(k => k === true)) {
            setKeptDice(new Array(6).fill(false));
            setMessage("Hot Dice! You can roll all 6 again.");
        } else {
            setKeptDice(newKept);
            setMessage("Roll again or bank your score.");
        }
        
        setSelectedDice(new Array(6).fill(false));
    };

    const bankScore = () => {
        const newTotal = totalScore + turnScore;
        setTotalScore(newTotal);

        if (newTotal >= WINNING_SCORE) {
            setGameState('won');
            setMessage(`YOU WON! Final Score: ${newTotal}`);
            if (newTotal > highScore) {
                setHighScore(newTotal);
            }
            submitScore('minigame-dragons-dice', newTotal);
        } else {
            resetTurn();
            setGameState('pre-game');
            setMessage("Score banked! Roll to start next turn.");
        }
    };
    
    const selectedScore = useMemo(() => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        if (selectedValues.length === 0) return 0;
        return calculateScore(selectedValues).score;
    }, [dice, selectedDice]);

    return (
        <div className="flex flex-col items-center justify-center p-4 text-white w-full max-w-2xl mx-auto">
            <div className="w-full flex justify-between items-center mb-4 font-bold text-lg">
                <span>Total: {totalScore}</span>
                <span className="text-2xl font-medieval text-amber-300">Dragon's Dice</span>
                <span>High Score: {highScore}</span>
            </div>
            
            <div className="w-full p-6 bg-stone-800/70 border-2 border-stone-700/60 rounded-xl mb-4 text-center">
                <p className="font-semibold text-xl text-emerald-300 min-h-[28px]">{message}</p>
                <div className="flex justify-center items-baseline gap-8 mt-2">
                    <p className="text-lg">Turn Score: <span className="font-bold text-2xl text-amber-300">{turnScore}</span></p>
                    {selectedScore > 0 && <p className="text-lg">Selected: <span className="font-bold text-2xl text-sky-300">+{selectedScore}</span></p>}
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                {dice.map((value, i) => value !== null ? (
                    <Die key={i} value={value} isSelected={selectedDice[i]} isKept={keptDice[i]} onClick={() => handleDieClick(i)} />
                ) : (
                    <div key={i} className="w-20 h-20 bg-stone-700/50 rounded-lg" />
                ))}
            </div>

            <div className="w-full flex justify-center gap-4">
                {gameState === 'pre-game' && <Button onClick={rollDice}>Roll Dice</Button>}
                {gameState === 'rolling' && <Button disabled>Rolling...</Button>}
                {gameState === 'scoring' && (
                    <>
                        <Button onClick={lockInSelection} disabled={selectedScore === 0}>Lock in Selection (+{selectedScore})</Button>
                        <Button onClick={rollDice} variant="secondary">Roll Again</Button>
                        <Button onClick={bankScore} disabled={turnScore === 0}>Bank Score</Button>
                    </>
                )}
                 {gameState === 'busted' && <Button onClick={() => { resetTurn(); setGameState('pre-game'); setMessage("Roll to start next turn.")}}>Next Turn</Button>}
                 {(gameState === 'won' || gameState === 'busted') && <Button onClick={resetGame} variant="secondary">Play Again</Button>}
            </div>

            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default DragonsDiceGame;
