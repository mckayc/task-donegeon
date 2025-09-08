import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';

interface GemstoneMinesGameProps {
  onClose: () => void;
}

const COLS = 8;
const ROWS = 8;
const GEM_SIZE = 50;
const GAME_WIDTH = COLS * GEM_SIZE;
const GAME_HEIGHT = ROWS * GEM_SIZE;
const TIME_LIMIT = 60; // 60 seconds

const GEM_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const GemstoneMinesGame: React.FC<GemstoneMinesGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();
    
    const boardRef = useRef<number[][]>([]);
    const selectedGemRef = useRef<{ row: number, col: number } | null>(null);

    const createBoard = useCallback(() => {
        const newBoard: number[][] = [];
        for (let r = 0; r < ROWS; r++) {
            newBoard[r] = [];
            for (let c = 0; c < COLS; c++) {
                newBoard[r][c] = Math.floor(Math.random() * GEM_COLORS.length);
            }
        }
        boardRef.current = newBoard;
    }, []);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (boardRef.current[r][c] > -1) {
                    ctx.fillStyle = GEM_COLORS[boardRef.current[r][c]];
                    ctx.fillRect(c * GEM_SIZE, r * GEM_SIZE, GEM_SIZE, GEM_SIZE);
                    ctx.strokeRect(c * GEM_SIZE, r * GEM_SIZE, GEM_SIZE, GEM_SIZE);

                    if (selectedGemRef.current && selectedGemRef.current.row === r && selectedGemRef.current.col === c) {
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(c * GEM_SIZE + 2, r * GEM_SIZE + 2, GEM_SIZE - 4, GEM_SIZE - 4);
                        ctx.lineWidth = 1;
                    }
                }
            }
        }
    }, []);

    const findMatches = useCallback(() => {
        const matches: { row: number, col: number }[] = [];
        const board = boardRef.current;

        // Horizontal matches
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 2; c++) {
                if (board[r][c] > -1 && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2]) {
                    matches.push({ row: r, col: c }, { row: r, col: c + 1 }, { row: r, col: c + 2 });
                }
            }
        }
        // Vertical matches
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS - 2; r++) {
                if (board[r][c] > -1 && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
                    matches.push({ row: r, col: c }, { row: r + 1, col: c }, { row: r + 2, col: c });
                }
            }
        }
        return [...new Set(matches.map(m => `${m.row}-${m.col}`))].map(s => ({ row: parseInt(s.split('-')[0]), col: parseInt(s.split('-')[1]) }));
    }, []);

    const handleMatches = useCallback(() => {
        let matches = findMatches();
        if (matches.length === 0) return false;
        
        setScore(s => s + matches.length * 10);
        setTimeLeft(t => Math.min(TIME_LIMIT, t + matches.length)); // Add 1s per gem
        matches.forEach(match => boardRef.current[match.row][match.col] = -1);
        
        // Drop gems down
        for (let c = 0; c < COLS; c++) {
            let emptyRow = ROWS - 1;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (boardRef.current[r][c] > -1) {
                    [boardRef.current[r][c], boardRef.current[emptyRow][c]] = [boardRef.current[emptyRow][c], boardRef.current[r][c]];
                    emptyRow--;
                }
            }
        }
        
        // Refill board
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (boardRef.current[r][c] === -1) {
                    boardRef.current[r][c] = Math.floor(Math.random() * GEM_COLORS.length);
                }
            }
        }
        
        draw();
        // Check for new matches recursively
        setTimeout(() => handleMatches(), 200);
        return true;
    }, [draw, findMatches]);

    const handleClick = useCallback((e: MouseEvent) => {
        if (gameState !== 'playing') return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / GEM_SIZE);
        const row = Math.floor(y / GEM_SIZE);

        if (selectedGemRef.current) {
            const { row: prevRow, col: prevCol } = selectedGemRef.current;
            const isAdjacent = Math.abs(prevRow - row) + Math.abs(prevCol - col) === 1;

            if (isAdjacent) {
                // Swap
                [boardRef.current[prevRow][prevCol], boardRef.current[row][col]] = [boardRef.current[row][col], boardRef.current[prevRow][prevCol]];
                
                // Check if swap is valid (creates a match)
                if (findMatches().length > 0) {
                    handleMatches();
                } else {
                    // Invalid move, swap back
                    [boardRef.current[prevRow][prevCol], boardRef.current[row][col]] = [boardRef.current[row][col], boardRef.current[prevRow][prevCol]];
                }
            }
            selectedGemRef.current = null;
        } else {
            selectedGemRef.current = { row, col };
        }
        draw();
    }, [gameState, draw, findMatches, handleMatches]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('click', handleClick);
            return () => canvas.removeEventListener('click', handleClick);
        }
    }, [handleClick]);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'playing' && timeLeft <= 0) {
            setGameState('game-over');
            submitScore('minigame-gemstone-mines', score);
        }
    }, [gameState, timeLeft, score, submitScore]);
    
    const resetGame = useCallback(() => {
        createBoard();
        while (findMatches().length > 0) {
            handleMatches();
        }
        setScore(0);
        setTimeLeft(TIME_LIMIT);
        setGameState('playing');
        draw();
    }, [createBoard, draw, findMatches, handleMatches]);

    useEffect(() => {
        if (gameState === 'pre-game') resetGame();
    }, [gameState, resetGame]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Gemstone Mines</span>
                <span>Time: {timeLeft}</span>
            </div>
            <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full" />
                {gameState !== 'playing' && (
                     <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <Button onClick={resetGame}>Start Game</Button>}
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

export default GemstoneMinesGame;
