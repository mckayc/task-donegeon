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
    const diceToScore = [...dice];
    const counts: { [key: number]: number } = {};
    diceToScore.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const scoredDice: number[] = [];

    // Special combinations for 6 dice
    if (diceToScore.length === 6) {
        const uniqueDice = new Set(diceToScore);
        if (uniqueDice.size === 6) return { score: 1500, scoringDice: diceToScore }; // Straight 1-6
        if (Object.values(counts).filter(c => c === 2).length === 3) return { score: 1500, scoringDice: diceToScore }; // 3 pairs
    }

    // 3+ of a kind
    for (let i = 1; i <= 6; i++) {
        const count = counts[i] || 0;
        if (count >= 3) {
            let setScore = i === 1 ? 1000 : i * 100;
            // For 4, 5, or 6 of a kind, double the score for each additional die
            setScore *= Math.pow(2, count - 3);
            score += setScore;
            
            for (let j = 0; j < count; j++) {
                scoredDice.push(i);
                const indexToRemove = diceToScore.indexOf(i);
                if (indexToRemove > -1) {
                    diceToScore.splice(indexToRemove, 1);
                }
            }
        }
    }

    // Singles
    const ones = diceToScore.filter(d => d === 1);
    score += ones.length * 100;
    scoredDice.push(...ones);

    const fives = diceToScore.filter(d => d === 5);
    score += fives.length * 50;
    scoredDice.push(...fives);
    
    return { score, scoringDice: scoredDice };
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
                {value === 1 && <>{baseDot}</>}
                {value === 2 && <><>{baseDot}</><div className="self-end">{baseDot}</div></>}
                {value === 3 && <><>{baseDot}</><div className="self-center">{baseDot}</div><div className="self-end">{baseDot}</div></>}
                {value === 4 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                {value === 5 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="self-center">{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                {value === 6 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
            </div>
        </button>
    );
};

const Rules: React.FC<{onClose: () => void}> = ({onClose}) => (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20" onClick={onClose}>
        <div className="bg-stone-800 p-6 rounded-lg max-w-lg w-full border border-stone-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-medieval text-amber-300 mb-4">Dragon's Dice Rules</h3>
            <div className="text-left space-y-2 text-stone-300 text-sm max-h-96 overflow-y-auto pr-4">
                <p>The goal is to be the first to reach 5000 points.</p>
                <p>On your turn, you roll all six dice. You must select at least one scoring die. You can then choose to **Bank** your score and end your turn, or **Roll Again** with the remaining non-scoring dice.</p>
                <p>If you roll and none of the dice are scoring dice, you **BUST**! You lose all points for that turn.</p>
                <p>If you manage to score with all six dice in a turn ("Hot Dice"), you can roll all six dice again and continue your turn!</p>
                <h4 className="font-bold text-lg text-emerald-300 pt-2">Scoring:</h4>
                 <ul className="list-disc list-inside space-y-1">
                    <li>Single 1: <strong>100</strong> points</li>
                    <li>Single 5: <strong>50</strong> points</li>
                    <li>Three 1s: <strong>1000</strong> points</li>
                    <li>Three 2s: <strong>200</strong> points</li>
                    <li>Three 3s: <strong>300</strong> points</li>
                    <li>Three 4s: <strong>400</strong> points</li>
                    <li>Three 5s: <strong>500</strong> points</li>
                    <li>Three 6s: <strong>600</strong> points</li>
                    <li>4-of-a-kind: <strong>Double</strong> the 3-of-a-kind score</li>
                    <li>5-of-a-kind: <strong>4x</strong> the 3-of-a-kind score</li>
                    <li>6-of-a-kind: <strong>8x</strong> the 3-of-a-kind score</li>
                    <li>1-6 Straight: <strong>1500</strong> points</li>
                    <li>Three Pairs: <strong>1500</strong> points</li>
                </ul>
            </div>
            <div className="text-right mt-6">
                <Button onClick={onClose}>Got It</Button>
            </div>
        </div>
    </div>
);


const DragonsDiceGame: React.FC<DragonsDiceGameProps> = ({ onClose }) => {
    const [dice, setDice] = useState<(number | null)[]>(new Array(6).fill(null));
    const [keptDice, setKeptDice] = useState<boolean[]>(new Array(6).fill(false));
    const [selectedDice, setSelectedDice] = useState<boolean[]>(new Array(6).fill(false));
    
    const [turnScore, setTurnScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    
    const [gameState, setGameState] = useState<'pre-game' | 'rolling' | 'scoring' | 'busted' | 'won'>('pre-game');
    const [message, setMessage] = useState("Roll the dice to begin!");
    const { submitScore } = useSystemDispatch();

    const resetTurn = useCallback(() => {
        setDice(new Array(6).fill(null));
        setKeptDice(new Array(6).fill(false));
        setSelectedDice(new Array(6).fill(false));
        setTurnScore(0);
    }, []);

    const resetGame = useCallback(() => {
        resetTurn();
        setTotalScore(0);
        setGameState('pre-game');
        setMessage("Roll the dice to begin!");
    }, [resetTurn]);
    
    const rollDice = useCallback(() => {
        setGameState('rolling');
        setSelectedDice(new Array(6).fill(false));
        setMessage("Rolling...");

        let rollCount = 0;
        const interval = setInterval(() => {
            const newDice = dice.map((d, i) => keptDice[i] ? d : Math.floor(Math.random() * 6) + 1);
            setDice(newDice as number[]);
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(interval);
                const availableDice = newDice.filter((d, i) => !keptDice[i]) as number[];
                const { score } = calculateScore(availableDice);
                if (score === 0) {
                    setGameState('busted');
                    setMessage("BUSTED! No scoring dice. Turn over.");
                    setTurnScore(0);
                } else {
                    setGameState('scoring');
                    setMessage("Select your scoring dice.");
                }
            }
        }, 100);
    }, [dice, keptDice]);

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
        <div className="bg-stone-900 bg-opacity-80 backdrop-blur-sm rounded-2xl border-2 border-stone-700 p-6 flex flex-col items-center justify-center text-white w-full max-w-3xl mx-auto relative">
            {isRulesOpen && <Rules onClose={() => setIsRulesOpen(false)} />}
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

            <div className="w-full flex justify-center gap-4 flex-wrap">
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

            <div className="w-full flex justify-between items-center mt-8 pt-4 border-t border-stone-700/60">
                 <Button variant="secondary" onClick={() => setIsRulesOpen(true)}>Rules</Button>
                 <Button variant="secondary" onClick={onClose}>Exit Game</Button>
            </div>
        </div>
    );
};

export default DragonsDiceGame;