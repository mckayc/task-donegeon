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
const NEXT_BOX_SIZE = 4 * BLOCK_SIZE;

const SHAPES = [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[1,1], [1,1]], // O
    [[0,1,0], [1,1,1], [0,0,0]], // T
    [[0,0,1], [1,1,1], [0,0,0]], // L
    [[1,0,0], [1,1,1], [0,0,0]], // J
    [[0,1,1], [1,1,0], [0,0,0]], // S
    [[1,1,0], [0,1,1], [0,0,0]], // Z
];

const COLORS = ['#0c0a09', '#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

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

type Piece = { x: number; y: number; shape: number[][]; color: number };

const TetrisGame: React.FC<TetrisGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nextCanvasRef = useRef<HTMLCanvasElement>(null);
    const holdCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(0);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over'>('pre-game');
    const [isTabletMode, setIsTabletMode] = useState(false);
    const { submitScore } = useSystemDispatch();

    const boardRef = useRef(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    const pieceRef = useRef<Piece | null>(null);
    const nextPieceRef = useRef<Piece | null>(null);
    const holdPieceRef = useRef<Piece | null>(null);
    const canSwapRef = useRef(true);
    const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, alpha: number }[]>([]);
    // FIX: Correctly use the .current property of the animationFrameId ref for assignment and cleanup.
    // This prevents errors where the ref object itself is used instead of the value it holds.
    const animationFrameId = useRef<number | null>(null);

    const generatePiece = useCallback((): Piece => {
        const typeId = Math.floor(Math.random() * SHAPES.length);
        const shape = SHAPES[typeId];
        return {
            shape: shape,
            color: typeId + 1,
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0,
        };
    }, []);
    
    const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece, offsetX = 0, offsetY = 0, size = BLOCK_SIZE) => {
        ctx.fillStyle = COLORS[piece.color];
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    ctx.fillRect(offsetX + (piece.x + dx) * size, offsetY + (piece.y + dy) * size, size, size);
                }
            });
        });
    };

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
            // Draw Ghost Piece
            let ghost = { ...pieceRef.current };
            while (isValidMove({ ...ghost, y: ghost.y + 1 })) {
                ghost.y++;
            }
            ctx.globalAlpha = 0.3;
            drawPiece(ctx, ghost);
            ctx.globalAlpha = 1.0;
            
            // Draw actual piece
            drawPiece(ctx, pieceRef.current);
        }

        // Draw particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, 3, 3);
        });

    }, [isValidMove]);
    
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
        let clearedRowsY: number[] = [];
        for (let y = ROWS - 1; y >= 0; y--) {
            if (boardRef.current[y].every(value => value > 0)) {
                linesCleared++;
                clearedRowsY.push(y);
                const [removed] = boardRef.current.splice(y, 1);
                boardRef.current.unshift(Array(COLS).fill(0));
                y++; 
            }
        }
        if (linesCleared > 0) {
            clearedRowsY.forEach(y => {
                for (let i = 0; i < 30; i++) {
                     particlesRef.current.push({
                        x: Math.random() * GAME_WIDTH,
                        y: y * BLOCK_SIZE + Math.random() * BLOCK_SIZE,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        alpha: 1
                    });
                }
            });
            const linePoints = [0, 100, 300, 500, 800];
            setScore(s => s + linePoints[linesCleared] * (level + 1));
            setLines(l => l + linesCleared);
        }
    };
    
    const spawnNewPiece = useCallback(() => {
        pieceRef.current = nextPieceRef.current!;
        nextPieceRef.current = generatePiece();
        canSwapRef.current = true;
        if (!isValidMove(pieceRef.current)) {
            setGameState('game-over');
            submitScore('minigame-tetris', score);
        }
    }, [generatePiece, score, submitScore, isValidMove]);
    
    const moveDown = useCallback(() => {
        if (!pieceRef.current) return;
        const newPiece = { ...pieceRef.current, y: pieceRef.current.y + 1 };
        if (isValidMove(newPiece)) {
            pieceRef.current = newPiece;
        } else {
            mergeToBoard();
            clearLines();
            spawnNewPiece();
        }
        draw();
    }, [draw, spawnNewPiece, isValidMove]);
    
    const gameSpeed = useMemo(() => Math.max(100, 1000 - level * 50), [level]);
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
        let newPiece = { ...pieceRef.current, shape: newShape };
        
        // Wall kick logic
        if (!isValidMove(newPiece)) {
            // Try moving 1 to the right
            if (isValidMove({ ...newPiece, x: newPiece.x + 1 })) {
                newPiece.x += 1;
            } // Try moving 1 to the left
            else if (isValidMove({ ...newPiece, x: newPiece.x - 1 })) {
                newPiece.x -= 1;
            } // Try moving 2 to the right
             else if (isValidMove({ ...newPiece, x: newPiece.x + 2 })) {
                newPiece.x += 2;
            } // Try moving 2 to the left
            else if (isValidMove({ ...newPiece, x: newPiece.x - 2 })) {
                newPiece.x -= 2;
            }
        }
        
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
        mergeToBoard();
        clearLines();
        spawnNewPiece();
        draw();
    };

    const handleHold = () => {
        if (!canSwapRef.current || !pieceRef.current) return;
        canSwapRef.current = false;

        if (holdPieceRef.current) {
            const temp = pieceRef.current;
            pieceRef.current = { ...holdPieceRef.current, x: Math.floor(COLS / 2) - 1, y: 0 };
            holdPieceRef.current = { ...temp, x: 0, y: 0 }; // Reset position for display
        } else {
            holdPieceRef.current = { ...pieceRef.current, x: 0, y: 0 };
            spawnNewPiece();
        }
    };

    const resetGame = useCallback(() => {
        boardRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        pieceRef.current = generatePiece();
        nextPieceRef.current = generatePiece();
        holdPieceRef.current = null;
        canSwapRef.current = true;
        setScore(0);
        setLines(0);
        setLevel(0);
        setGameState('playing');
    }, [generatePiece]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') {
                if (gameState === 'game-over') resetGame();
                return;
            };
            switch (e.key) {
                case 'ArrowLeft': moveHorizontal(-1); break;
                case 'ArrowRight': moveHorizontal(1); break;
                case 'ArrowDown': moveDown(); break;
                case 'ArrowUp': rotate(); break;
                case ' ': case 'Spacebar': e.preventDefault(); hardDrop(); break;
                case 'c': case 'C': handleHold(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, moveDown, resetGame]);

    useEffect(() => setLevel(Math.floor(lines / 10)), [lines]);
    
    // Game render loop for animations
    useEffect(() => {
        const renderLoop = () => {
            // Update particles
            particlesRef.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.02;
                if (p.alpha <= 0) particlesRef.current.splice(i, 1);
            });

            draw();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };
        animationFrameId.current = requestAnimationFrame(renderLoop);
        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw]);
    
    // Draw side panels
    useEffect(() => {
        const drawSidePanel = (canvas: HTMLCanvasElement | null, piece: Piece | null) => {
            if (!canvas || !piece) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, NEXT_BOX_SIZE, NEXT_BOX_SIZE);
            const centeredPiece = {
                ...piece,
                x: piece.shape.length === 2 ? 1 : 0.5,
                y: piece.shape.length === 2 ? 1 : 0.5,
            }
            drawPiece(ctx, centeredPiece, 0, 0, BLOCK_SIZE);
        }
        drawSidePanel(nextCanvasRef.current, nextPieceRef.current);
        drawSidePanel(holdCanvasRef.current, holdPieceRef.current);
    }, [nextPieceRef.current, holdPieceRef.current]);

    return (
        <div className="w-full h-full p-6 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="order-2 md:order-1 relative">
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-900 border-2 border-emerald-500 rounded-lg"/>
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
            </div>
            <div className="order-1 md:order-2 flex flex-row md:flex-col items-center gap-8">
                <div className="flex gap-4">
                    <div className="text-white text-center p-4 bg-stone-800/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-300">HOLD (C)</h3>
                        <canvas ref={holdCanvasRef} width={NEXT_BOX_SIZE} height={NEXT_BOX_SIZE} className="mt-2 bg-stone-900/50 rounded" />
                    </div>
                    <div className="text-white text-center p-4 bg-stone-800/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-300">NEXT</h3>
                        <canvas ref={nextCanvasRef} width={NEXT_BOX_SIZE} height={NEXT_BOX_SIZE} className="mt-2 bg-stone-900/50 rounded" />
                    </div>
                </div>
                 <div className="text-white text-lg font-semibold space-y-2 p-4 bg-stone-800/50 rounded-lg w-full max-w-[230px]">
                    <p>Score: <span className="font-bold text-amber-300">{score}</span></p>
                    <p>Lines: <span className="font-bold text-sky-300">{lines}</span></p>
                    <p>Level: <span className="font-bold text-emerald-300">{level}</span></p>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <ToggleSwitch enabled={isTabletMode} setEnabled={setIsTabletMode} label="Tablet Mode" />
                    <Button variant="secondary" onClick={onClose}>Exit Game</Button>
                </div>
            </div>
            {isTabletMode && (
                 <>
                    <div className="fixed bottom-10 left-10 flex flex-col gap-4">
                        <Button onClick={() => moveHorizontal(-1)} className="w-20 h-20 rounded-full"><ArrowLeft size={40}/></Button>
                        <Button onClick={() => moveHorizontal(1)} className="w-20 h-20 rounded-full"><ArrowRight size={40}/></Button>
                        <Button onClick={moveDown} className="w-20 h-20 rounded-full"><ArrowDown size={40}/></Button>
                    </div>
                    <div className="fixed bottom-10 right-10 flex flex-col gap-4">
                         <Button onClick={rotate} className="w-24 h-24 rounded-full"><RotateCcw size={50}/></Button>
                         <Button onClick={hardDrop} className="w-24 h-24 rounded-full"><ChevronsDown size={50}/></Button>
                         <Button onClick={handleHold} className="w-24 h-24 rounded-full font-bold text-2xl">HOLD</Button>
                    </div>
                 </>
            )}
        </div>
    );
};

export default TetrisGame;
