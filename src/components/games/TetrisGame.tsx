import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { RotateCcw, ArrowDown, ArrowLeft, ArrowRight, ChevronsDown } from 'lucide-react';

interface TetrisGameProps {
  onClose: () => void;
}

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25;
const GAME_WIDTH = COLS * BLOCK_SIZE;
const GAME_HEIGHT = ROWS * BLOCK_SIZE;

const SHAPES = [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[1,1], [1,1]], // O
    [[0,1,0], [1,1,1], [0,0,0]], // T
    [[0,0,1], [1,1,1], [0,0,0]], // L
    [[1,0,0], [1,1,1], [0,0,0]], // J
    [[0,1,1], [1,1,0], [0,0,0]], // S
    [[1,1,0], [0,1,1], [0,0,0]], // Z
];

const COLORS = ['#000000', '#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

// FIX: Updated useGameLoop to be more robust by initializing useRef with the callback, ensuring it's never undefined.
const useGameLoop = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      if (delay !== null) {
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
      }
    }, [delay]);
};

const TetrisGame: React.FC<TetrisGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const [isTabletMode, setIsTabletMode] = useState(false);
    const { submitScore } = useSystemDispatch();

    const boardRef = useRef(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    const pieceRef = useRef<{ x: number, y: number, shape: number[][], color: number } | null>(null);
    // FIX: Corrected the type of `nextPieceRef` to include x and y coordinates, aligning it with the `pieceRef` type and fixing assignment errors.
    const nextPieceRef = useRef<{ x: number; y: number; shape: number[][]; color: number; } | null>(null);

    const generatePiece = useCallback(() => {
        const typeId = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[typeId],
            color: typeId + 1,
            x: Math.floor(COLS / 2) - 1,
            y: 0,
        };
    }, []);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw board
        boardRef.current.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        
        // Draw current piece
        if (pieceRef.current) {
            const { shape, color, x, y } = pieceRef.current;
            ctx.fillStyle = COLORS[color];
            shape.forEach((row, dy) => {
                row.forEach((value, dx) => {
                    if (value) {
                        ctx.fillRect((x + dx) * BLOCK_SIZE, (y + dy) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
        }
    }, []);
    
    const isValidMove = (piece: { x: number, y: number, shape: number[][] }) => {
        return piece.shape.every((row, dy) => {
            return row.every((value, dx) => {
                if (value === 0) return true;
                const newX = piece.x + dx;
                const newY = piece.y + dy;
                return (
                    newX >= 0 && newX < COLS && newY < ROWS &&
                    (boardRef.current[newY] && boardRef.current[newY][newX] === 0)
                );
            });
        });
    };
    
    const mergeToBoard = () => {
        if (!pieceRef.current) return;
        const { shape, color, x, y } = pieceRef.current;
        shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    boardRef.current[y + dy][x + dx] = color;
                }
            });
        });
    };
    
    const clearLines = () => {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (boardRef.current[y].every(value => value > 0)) {
                linesCleared++;
                boardRef.current.splice(y, 1);
                boardRef.current.unshift(Array(COLS).fill(0));
                y++; // Re-check the same row index
            }
        }
        if (linesCleared > 0) {
            const linePoints = [0, 100, 300, 500, 800];
            setScore(s => s + linePoints[linesCleared] * (level + 1));
            setLines(l => l + linesCleared);
        }
    };
    
    const moveDown = useCallback(() => {
        if (!pieceRef.current) return;
        const newPiece = { ...pieceRef.current, y: pieceRef.current.y + 1 };
        if (isValidMove(newPiece)) {
            pieceRef.current = newPiece;
        } else {
            mergeToBoard();
            clearLines();
            const newPiece = nextPieceRef.current!;
            pieceRef.current = newPiece;
            nextPieceRef.current = generatePiece();
            if (!isValidMove(newPiece)) {
                setGameState('game-over');
                submitScore('minigame-tetris', score);
            }
        }
        draw();
    }, [draw, generatePiece, score, level, submitScore]);
    
    const gameSpeed = useMemo(() => 1000 - level * 50, [level]);
    useGameLoop(moveDown, gameState === 'playing' ? gameSpeed : null);
    
    const moveHorizontal = (dir: -1 | 1) => {
        if (!pieceRef.current) return;
        const newPiece = { ...pieceRef.current, x: pieceRef.current.x + dir };
        if (isValidMove(newPiece)) {
            pieceRef.current = newPiece;
            draw();
        }
    };
    
    const rotate = () => {
        if (!pieceRef.current) return;
        const { shape } = pieceRef.current;
        const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        const newPiece = { ...pieceRef.current, shape: newShape };
        if (isValidMove(newPiece)) {
            pieceRef.current = newPiece;
            draw();
        }
    };
    
    const hardDrop = () => {
        if (!pieceRef.current) return;
        let p = { ...pieceRef.current };
        while (isValidMove(p)) {
            pieceRef.current = p;
            p = { ...p, y: p.y + 1 };
        }
        moveDown();
    };

    const resetGame = useCallback(() => {
        boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        pieceRef.current = generatePiece();
        nextPieceRef.current = generatePiece();
        setScore(0);
        setLines(0);
        setLevel(0);
        setGameState('playing');
        draw();
    }, [draw, generatePiece]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            switch (e.key) {
                case 'ArrowLeft': moveHorizontal(-1); break;
                case 'ArrowRight': moveHorizontal(1); break;
                case 'ArrowDown': moveDown(); break;
                case 'ArrowUp': rotate(); break;
                case ' ': hardDrop(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, moveDown]);

    useEffect(() => {
        setLevel(Math.floor(lines / 10));
    }, [lines]);

    return (
        <div className="w-full h-full p-6 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="order-2 md:order-1">
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg relative">
                    {gameState !== 'playing' && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                            {gameState === 'pre-game' && <>
                                <h2 className="text-4xl font-bold font-medieval text-emerald-400">Tetris</h2>
                                <Button onClick={resetGame} className="mt-6">Start Game</Button>
                            </>}
                             {gameState === 'game-over' && <>
                                <h2 className="text-4xl font-bold font-medieval text-red-500">Game Over</h2>
                                <p className="text-xl mt-2">Final Score: {score}</p>
                                <Button onClick={resetGame} className="mt-6">Play Again</Button>
                            </>}
                        </div>
                    )}
                </canvas>
            </div>
            <div className="order-1 md:order-2 flex flex-row md:flex-col items-center gap-8">
                <div className="text-white text-center p-4 bg-stone-800/50 rounded-lg">
                    <h3 className="font-bold text-lg text-stone-300">NEXT</h3>
                    <div className="w-24 h-24 mt-2">
                        {/* Placeholder for Next Piece Canvas */}
                    </div>
                </div>
                 <div className="text-white text-lg font-semibold space-y-2 p-4 bg-stone-800/50 rounded-lg">
                    <p>Score: <span className="font-bold text-amber-300">{score}</span></p>
                    <p>Lines: <span className="font-bold text-sky-300">{lines}</span></p>
                    <p>Level: <span className="font-bold text-emerald-300">{level}</span></p>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <ToggleSwitch enabled={isTabletMode} setEnabled={setIsTabletMode} label="Tablet Mode" />
                    <Button variant="secondary" onClick={onClose}>Exit Game</Button>
                </div>
            </div>
            {/* On-screen controls */}
            {isTabletMode ? (
                 <>
                    <div className="fixed bottom-10 left-10 flex flex-col gap-4">
                        <Button onClick={() => moveHorizontal(-1)} className="w-20 h-20 rounded-full"><ArrowLeft size={40}/></Button>
                        <Button onClick={() => moveHorizontal(1)} className="w-20 h-20 rounded-full"><ArrowRight size={40}/></Button>
                        <Button onClick={moveDown} className="w-20 h-20 rounded-full"><ArrowDown size={40}/></Button>
                    </div>
                    <div className="fixed bottom-10 right-10 flex flex-col gap-4">
                         <Button onClick={rotate} className="w-24 h-24 rounded-full"><RotateCcw size={50}/></Button>
                         <Button onClick={hardDrop} className="w-24 h-24 rounded-full"><ChevronsDown size={50}/></Button>
                    </div>
                 </>
            ) : (
                <div className="fixed bottom-4 right-4 grid grid-cols-3 gap-2 w-52">
                    <div/>
                    <Button onClick={rotate} className="h-16"><RotateCcw/></Button>
                    <div/>
                    <Button onClick={() => moveHorizontal(-1)} className="h-16"><ArrowLeft/></Button>
                    <Button onClick={moveDown} className="h-16"><ArrowDown/></Button>
                    <Button onClick={() => moveHorizontal(1)} className="h-16"><ArrowRight/></Button>
                    <div className="col-span-3">
                         <Button onClick={hardDrop} className="h-16 w-full"><ChevronsDown/></Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TetrisGame;
