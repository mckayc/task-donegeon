import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface DragonsDiceGameProps {
  onClose: () => void;
}

// --- Scoring Logic ---

interface Combination {
    score: number;
    indices: number[]; // Original indices from the 0-5 dice array
    values: number[];
}

const calculateScoreForDice = (dice: number[]): number => {
    let score = 0;
    const counts: { [key: number]: number } = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);

    if (dice.length === 6) {
        if (new Set(dice).size === 6) return 1500; // Straight 1-6
        if (Object.values(counts).filter(c => c === 2).length === 3) return 1500; // 3 pairs
    }

    for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) {
            let setScore = i === 1 ? 1000 : i * 100;
            score += setScore * Math.pow(2, counts[i] - 3);
            delete counts[i]; // Remove from single consideration
        }
    }

    score += (counts[1] || 0) * 100;
    score += (counts[5] || 0) * 50;
    return score;
};

// Finds all valid scoring combinations from the available dice.
const findScoringCombinations = (dice: (number | null)[], keptDice: boolean[]): { allScoringDiceIndices: Set<number>, combinations: Combination[] } => {
    const availableDice: { value: number, index: number }[] = dice
        .map((value, index) => ({ value, index }))
        .filter((d, i) => d.value !== null && !keptDice[i]) as { value: number, index: number }[];

    const combinations: Combination[] = [];
    const counts: { [key: number]: { value: number, index: number }[] } = {};
    availableDice.forEach(d => {
        if (!counts[d.value]) counts[d.value] = [];
        counts[d.value].push(d);
    });

    if (availableDice.length === 6) {
        const uniqueValues = new Set(availableDice.map(d => d.value));
        if (uniqueValues.size === 6) { // Straight 1-6
            return {
                allScoringDiceIndices: new Set(availableDice.map(d => d.index)),
                combinations: [{ score: 1500, indices: availableDice.map(d => d.index), values: availableDice.map(d => d.value) }]
            };
        }
        if (Object.values(counts).every(group => group.length === 2)) { // 3 pairs
            return {
                allScoringDiceIndices: new Set(availableDice.map(d => d.index)),
                combinations: [{ score: 1500, indices: availableDice.map(d => d.index), values: availableDice.map(d => d.value) }]
            };
        }
    }

    for (let i = 1; i <= 6; i++) {
        if (counts[i] && counts[i].length >= 3) {
            const group = counts[i];
            const baseScore = i === 1 ? 1000 : i * 100;
            const score = baseScore * Math.pow(2, group.length - 3);
            combinations.push({ score, indices: group.map(d => d.index), values: group.map(d => d.value) });
            delete counts[i];
        }
    }

    if (counts[1]) {
        counts[1].forEach(d => combinations.push({ score: 100, indices: [d.index], values: [d.value] }));
    }
    if (counts[5]) {
        counts[5].forEach(d => combinations.push({ score: 50, indices: [d.index], values: [d.value] }));
    }

    const allScoringDiceIndices = new Set(combinations.flatMap(c => c.indices));
    return { allScoringDiceIndices, combinations };
};


// --- UI Components ---

const Die: React.FC<{ value: number; isSelected: boolean; isKept: boolean; isBankable: boolean; onClick: () => void; }> = ({ value, isSelected, isKept, isBankable, onClick }) => {
    const dotPatterns: { [key: number]: string } = {
        1: "justify-center items-center", 2: "justify-between", 3: "justify-between",
        4: "justify-between", 5: "justify-between", 6: "justify-between",
    };
    const baseDot = <div className="w-4 h-4 bg-stone-800 rounded-full" />;

    const stateClasses = isSelected
        ? 'ring-4 ring-emerald-400 scale-105'
        : isBankable
        ? 'ring-2 ring-sky-400'
        : 'ring-2 ring-stone-400';

    return (
        <button
            onClick={onClick}
            disabled={isKept || !isBankable}
            className={`w-20 h-20 rounded-lg p-2 flex flex-col transition-all duration-200
                ${isKept ? 'bg-stone-600 opacity-60' : `bg-stone-200 ${stateClasses}`}
                ${!isKept && isBankable ? 'hover:ring-emerald-500 cursor-pointer' : 'cursor-default'}`}
        >
            {!isKept && (
                <div className={`w-full h-full flex flex-col ${dotPatterns[value]}`}>
                    {value === 1 && <>{baseDot}</>}
                    {value === 2 && <><>{baseDot}</><div className="self-end">{baseDot}</div></>}
                    {value === 3 && <><>{baseDot}</><div className="self-center">{baseDot}</div><div className="self-end">{baseDot}</div></>}
                    {value === 4 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                    {value === 5 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="self-center">{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                    {value === 6 && <><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div><div className="flex justify-between w-full">{baseDot}{baseDot}</div></>}
                </div>
            )}
        </button>
    );
};

const Rules: React.FC<{onClose: () => void}> = ({onClose}) => (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20" onClick={onClose}>
        <div className="bg-stone-800 p-6 rounded-lg max-w-lg w-full border border-stone-600" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-medieval text-amber-300 mb-4">Dragon's Dice Rules</h3>
            <div className="text-left space-y-2 text-stone-300 text-sm max-h-96 overflow-y-auto pr-4">
                <p>The goal is to get the **highest score possible** over 5 rounds.</p>
                <p>On your turn, you roll dice. You **must select at least one scoring die**. Bankable dice will be highlighted. You can then choose to **Bank** your score to end the round, or **Roll Again** with the remaining dice to try and increase your score for the round.</p>
                <p>If you roll and none of the available dice are scoring dice, you **BUST**! You get 0 points for the round and your turn ends.</p>
                <p>If you manage to score with all six dice ("Hot Dice"), you can roll all six again and continue your turn!</p>
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

// --- Main Game Component ---

const DragonsDiceGame: React.FC<DragonsDiceGameProps> = ({ onClose }) => {
    const [dice, setDice] = useState<(number | null)[]>(new Array(6).fill(null));
    const [keptDice, setKeptDice] = useState<boolean[]>(new Array(6).fill(false));
    const [selectedDice, setSelectedDice] = useState<boolean[]>(new Array(6).fill(false));
    const [bankableDice, setBankableDice] = useState<boolean[]>(new Array(6).fill(false));
    const [combinations, setCombinations] = useState<Combination[]>([]);
    
    const [currentRoundScore, setCurrentRoundScore] = useState(0);
    const [bankedRoundScores, setBankedRoundScores] = useState<number[]>([]);
    const [currentRound, setCurrentRound] = useState(1);
    
    const [highScore, setHighScore] = useState(0);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    
    const [gameState, setGameState] = useState<'pre-game' | 'rolling' | 'scoring' | 'round-over' | 'game-over' | 'busted'>('pre-game');
    const [message, setMessage] = useState("Roll the dice to begin!");
    const { submitScore } = useSystemDispatch();

    const startNewRound = useCallback(() => {
        setDice(new Array(6).fill(null));
        setKeptDice(new Array(6).fill(false));
        setSelectedDice(new Array(6).fill(false));
        setBankableDice(new Array(6).fill(false));
        setCombinations([]);
        setCurrentRoundScore(0);
        setCurrentRound(prev => prev + 1);
        setGameState('pre-game');
        setMessage(`Round ${currentRound + 1}: Roll the dice!`);
    }, [currentRound]);

    const resetGame = useCallback(() => {
        setDice(new Array(6).fill(null));
        setKeptDice(new Array(6).fill(false));
        setSelectedDice(new Array(6).fill(false));
        setBankableDice(new Array(6).fill(false));
        setCombinations([]);
        setCurrentRoundScore(0);
        setBankedRoundScores([]);
        setCurrentRound(1);
        setGameState('pre-game');
        setMessage("Roll the dice to begin!");
    }, []);
    
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
                const { allScoringDiceIndices, combinations: foundCombinations } = findScoringCombinations(newDice, keptDice);

                if (allScoringDiceIndices.size === 0) {
                    setMessage(`BUSTED! You get 0 for Round ${currentRound}.`);
                    setGameState('busted');
                } else {
                    const newBankable = new Array(6).fill(false);
                    allScoringDiceIndices.forEach(i => newBankable[i] = true);
                    setBankableDice(newBankable);
                    setCombinations(foundCombinations);
                    setGameState('scoring');
                    setMessage("Select your scoring dice.");
                }
            }
        }, 100);
    }, [dice, keptDice, currentRound]);

    const handleBustAcknowledge = useCallback(() => {
        const newBankedScores = [...bankedRoundScores, 0];
        setBankedRoundScores(newBankedScores);
    
        if (currentRound >= 5) {
            const finalTotal = newBankedScores.reduce((a, b) => a + b, 0);
            if (finalTotal > highScore) setHighScore(finalTotal);
            submitScore('minigame-dragons-dice', finalTotal);
            setMessage(`Busted on the last round! Final Score: ${finalTotal}`);
            setGameState('game-over');
        } else {
            setMessage(`Round ${currentRound} is over. Get ready for the next one!`);
            setGameState('round-over');
        }
    }, [bankedRoundScores, currentRound, highScore, submitScore]);

    const handleDieClick = (index: number) => {
        if (gameState !== 'scoring' || !bankableDice[index]) return;
        
        const newSelected = [...selectedDice];
        const clickedValue = dice[index];
        const clickedCombination = combinations.find(c => c.indices.includes(index));

        if (clickedCombination) {
            const isGroup = clickedCombination.indices.length > 1;
            const isCurrentlySelected = newSelected[index];
            if (isGroup) {
                 clickedCombination.indices.forEach(i => {
                    newSelected[i] = !isCurrentlySelected;
                });
            } else {
                newSelected[index] = !isCurrentlySelected;
            }
            setSelectedDice(newSelected);
        }
    };
    
    const keepAndRoll = () => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        if (selectedValues.length === 0) {
            setMessage("You must select at least one scoring die to continue.");
            return;
        }

        const selectionScore = calculateScoreForDice(selectedValues);
        
        setCurrentRoundScore(prev => prev + selectionScore);
        const newKept = [...keptDice];
        selectedDice.forEach((isSelected, i) => {
            if (isSelected) newKept[i] = true;
        });
        
        if (newKept.every(k => k === true)) {
            // Hot Dice!
            setKeptDice(new Array(6).fill(false));
            setDice(new Array(6).fill(null)); // Clear the dice visually
            setMessage("Hot Dice! You scored with all dice. Roll again!");
            setGameState('pre-game'); // Go to a state that shows the "Roll Dice" button
        } else {
            setKeptDice(newKept);
            rollDice();
        }
        
        setSelectedDice(new Array(6).fill(false));
    };

    const bankScore = () => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        const selectionScore = calculateScoreForDice(selectedValues);
        const finalRoundScore = currentRoundScore + selectionScore;

        const newBankedScores = [...bankedRoundScores, finalRoundScore];
        setBankedRoundScores(newBankedScores);

        if (currentRound >= 5) {
            const finalTotal = newBankedScores.reduce((a, b) => a + b, 0);
            if (finalTotal > highScore) setHighScore(finalTotal);
            submitScore('minigame-dragons-dice', finalTotal);
            setMessage(`Game Over! Final Score: ${finalTotal}`);
            setGameState('game-over');
        } else {
            setMessage(`You banked ${finalRoundScore} for Round ${currentRound}!`);
            setGameState('round-over');
        }
    };
    
    const selectedScore = useMemo(() => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        if (selectedValues.length === 0) return 0;
        return calculateScoreForDice(selectedValues);
    }, [dice, selectedDice]);

    const isSelectionValid = useMemo(() => {
        const selectedValues = dice.filter((d, i) => selectedDice[i]) as number[];
        if (selectedValues.length === 0) return false;
        const nonScoringSelected = selectedDice.some((isSelected, index) => isSelected && !bankableDice[index]);
        if (nonScoringSelected) return false;
        
        return calculateScoreForDice(selectedValues) > 0;
    }, [dice, selectedDice, bankableDice]);
    
    const totalScore = useMemo(() => {
        return bankedRoundScores.reduce((a, b) => a + b, 0);
    }, [bankedRoundScores]);

    return (
        <div className="bg-stone-900 bg-opacity-80 backdrop-blur-sm rounded-2xl border-2 border-stone-700 p-6 flex flex-col items-center justify-center text-white w-full max-w-3xl mx-auto relative">
            {isRulesOpen && <Rules onClose={() => setIsRulesOpen(false)} />}
            <div className="w-full flex justify-between items-center mb-4 font-bold text-lg">
                <span>Total Score: {totalScore}</span>
                <span className="text-2xl font-medieval text-amber-300">Round {currentRound} / 5</span>
                <span>High Score: {highScore}</span>
            </div>
            
            <div className="w-full p-6 bg-stone-800/70 border-2 border-stone-700/60 rounded-xl mb-4 text-center">
                <p className="font-semibold text-xl text-emerald-300 min-h-[28px]">{message}</p>
                <div className="flex justify-center items-baseline gap-8 mt-2">
                    <p className="text-lg">Banked this Round: <span className="font-bold text-2xl text-amber-300">{currentRoundScore}</span></p>
                    {selectedScore > 0 && <p className="text-lg">Selected: <span className="font-bold text-2xl text-sky-300">+{selectedScore}</span></p>}
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
                {dice.map((value, i) => value !== null ? (
                    <Die key={i} value={value} isSelected={selectedDice[i]} isKept={keptDice[i]} isBankable={bankableDice[i]} onClick={() => handleDieClick(i)} />
                ) : (
                    <div key={i} className="w-20 h-20 bg-stone-700/50 rounded-lg" />
                ))}
            </div>

            <div className="w-full flex justify-center gap-4 flex-wrap min-h-[40px]">
                {gameState === 'pre-game' && <Button onClick={rollDice}>Roll Dice</Button>}
                {gameState === 'rolling' && <Button disabled>Rolling...</Button>}
                {gameState === 'scoring' && (
                    <>
                        <Button onClick={keepAndRoll} disabled={!isSelectionValid}>Keep & Roll Again</Button>
                        <Button onClick={bankScore} disabled={!isSelectionValid}>Bank & End Round</Button>
                    </>
                )}
                {gameState === 'busted' && <Button onClick={handleBustAcknowledge}>{currentRound >= 5 ? 'End Game' : 'End Round'}</Button>}
                {gameState === 'round-over' && <Button onClick={startNewRound}>Start Round {currentRound + 1}</Button>}
                {gameState === 'game-over' && <Button onClick={resetGame}>Play Again</Button>}
            </div>

            <div className="w-full flex justify-between items-center mt-8 pt-4 border-t border-stone-700/60">
                 <Button variant="secondary" onClick={() => setIsRulesOpen(true)}>Rules</Button>
                 <Button variant="secondary" onClick={onClose}>Exit Game</Button>
            </div>
        </div>
    );
};

export default DragonsDiceGame;