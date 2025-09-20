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

const GEM_EMOJIS = ['🍓', '🍊', '🍋', '🍏', '🍇', '🍒'];

type Particle = { x: number; y: number; vx: number; vy: number; alpha: number; emoji: string };

const GemstoneMinesGame: React.FC<GemstoneMinesGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const { submitScore } = useSystemDispatch();
    
    const boardRef = useRef<number[][]>([]);
    const selectedGemRef = useRef<{ row: number, col: number } | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameId = useRef<number | null>(null);

    const createBoard = useCallback(() => {
        const newBoard: number[][] = [];
        for (let r = 0; r < ROWS; r++) {
            newBoard[r] = [];
            for (let c = 0; c < COLS; c++) {
                newBoard[r][c] = Math.floor(Math.random() * GEM_EMOJIS.length);
            }
        }
        boardRef.current = newBoard;
    }, []);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.font = `${GEM_SIZE * 0.7}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (boardRef.current[r][c] > -1) {
                    const x = c * GEM_SIZE + GEM_SIZE / 2;
                    const y = r * GEM_SIZE + GEM_SIZE / 2;
                    ctx.fillText(GEM_EMOJIS[boardRef.current[r][c]], x, y);
                    
                    if (selectedGemRef.current && selectedGemRef.current.row === r && selectedGemRef.current.col === c) {
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(c * GEM_SIZE + 2, r * GEM_SIZE + 2, GEM_SIZE - 4, GEM_SIZE - 4);
                        ctx.lineWidth = 1;
                    }
                }
            }
        }

        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillText(p.emoji, p.x, p.y);
            ctx.globalAlpha = 1.0;
        });
    }, []);

    const findMatches = useCallback(() => {
        const matches: { row: number, col: number }[] = [];
        const board = boardRef.current;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 2; c++) {
                if (board[r][c] > -1 && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2]) {
                    matches.push({ row: r, col: c }, { row: r, col: c + 1 }, { row: r, col: c + 2 });
                }
            }
        }
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
        setTimeLeft(t => Math.min(TIME_LIMIT, t + matches.length));
        matches.forEach(match => {
            const emoji = GEM_EMOJIS[boardRef.current[match.row][match.col]];
            for (let i = 0; i < 5; i++) {
                 particlesRef.current.push({
                    x: match.col * GEM_SIZE + GEM_SIZE / 2,
                    y: match.row * GEM_SIZE + GEM_SIZE / 2,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    alpha: 1,
                    emoji
                });
            }
            boardRef.current[match.row][match.col] = -1;
        });
        
        setTimeout(() => {
            for (let c = 0; c < COLS; c++) {
                let emptyRow = ROWS - 1;
                for (let r = ROWS - 1; r >= 0; r--) {
                    if (boardRef.current[r][c] > -1) {
                        [boardRef.current[r][c], boardRef.current[emptyRow][c]] = [boardRef.current[emptyRow][c], boardRef.current[r][c]];
                        emptyRow--;
                    }
                }
            }
            
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (boardRef.current[r][c] === -1) {
                        boardRef.current[r][c] = Math.floor(Math.random() * GEM_EMOJIS.length);
                    }
                }
            }
            
            setTimeout(() => handleMatches(), 100);
        }, 200);
        return true;
    }, [findMatches]);

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
                [boardRef.current[prevRow][prevCol], boardRef.current[row][col]] = [boardRef.current[row][col], boardRef.current[prevRow][prevCol]];
                if (!handleMatches()) {
                    setTimeout(() => { // Swap back animation
                        [boardRef.current[prevRow][prevCol], boardRef.current[row][col]] = [boardRef.current[row][col], boardRef.current[prevRow][prevCol]];
                    }, 200);
                }
            }
            selectedGemRef.current = null;
        } else {
            selectedGemRef.current = { row, col };
        }
    }, [gameState, handleMatches]);

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
    }, [createBoard, findMatches, handleMatches]);
    
    useEffect(() => {
        let isMounted = true;
        const renderLoop = () => {
            if (!isMounted) return;
            particlesRef.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;
                if (p.alpha <= 0) particlesRef.current.splice(i, 1);
            });
            draw();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };
        renderLoop();
        return () => {
            isMounted = false;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw]);

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