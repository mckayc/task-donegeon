import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSystemDispatch } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface LabyrinthGameProps {
  onClose: () => void;
}

const MAZE_WIDTH = 20;
const MAZE_HEIGHT = 15;
const CELL_SIZE = 30;
const GAME_WIDTH = MAZE_WIDTH * CELL_SIZE;
const GAME_HEIGHT = MAZE_HEIGHT * CELL_SIZE;
const TIME_LIMIT = 90; // 90 seconds

type Cell = { top: boolean, right: boolean, bottom: boolean, left: boolean };

const LabyrinthGame: React.FC<LabyrinthGameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [gameState, setGameState] = useState<'pre-game' | 'playing' | 'game-over' | 'win'>('pre-game');
    const { submitScore } = useSystemDispatch();

    const mazeRef = useRef<Cell[][]>([]);
    const playerRef = useRef({ x: 0, y: 0 });
    const minotaurRef = useRef({ x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 });
    const exitRef = useRef({ x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 });

    const animationFrameId = useRef<number | null>(null);
    const minotaurMoveIntervalRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    const generateMaze = useCallback(() => {
        const maze: Cell[][] = Array.from({ length: MAZE_HEIGHT }, () => 
            Array.from({ length: MAZE_WIDTH }, () => ({ top: true, right: true, bottom: true, left: true }))
        );
        const stack = [{ x: 0, y: 0 }];
        const visited = new Set(['0-0']);

        while (stack.length > 0) {
            const { x, y } = stack[stack.length - 1];
            const neighbors = [];
            if (y > 0 && !visited.has(`${x}-${y - 1}`)) neighbors.push({ x, y: y - 1, dir: 'top', opposite: 'bottom' });
            if (x < MAZE_WIDTH - 1 && !visited.has(`${x + 1}-${y}`)) neighbors.push({ x: x + 1, y, dir: 'right', opposite: 'left' });
            if (y < MAZE_HEIGHT - 1 && !visited.has(`${x}-${y + 1}`)) neighbors.push({ x, y: y + 1, dir: 'bottom', opposite: 'top' });
            if (x > 0 && !visited.has(`${x - 1}-${y}`)) neighbors.push({ x: x - 1, y, dir: 'left', opposite: 'right' });

            if (neighbors.length > 0) {
                const { x: nx, y: ny, dir, opposite } = neighbors[Math.floor(Math.random() * neighbors.length)];
                (maze[y][x] as any)[dir] = false;
                (maze[ny][nx] as any)[opposite] = false;
                visited.add(`${nx}-${ny}`);
                stack.push({ x: nx, y: ny });
            } else {
                stack.pop();
            }
        }
        mazeRef.current = maze;
    }, []);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#1e293b'; // Slate 800
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw maze walls
        ctx.strokeStyle = '#475569'; // Slate 600
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 0; y < MAZE_HEIGHT; y++) {
            for (let x = 0; x < MAZE_WIDTH; x++) {
                if (mazeRef.current[y][x].top) { ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE); ctx.lineTo((x + 1) * CELL_SIZE, y * CELL_SIZE); }
                if (mazeRef.current[y][x].right) { ctx.moveTo((x + 1) * CELL_SIZE, y * CELL_SIZE); ctx.lineTo((x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE); }
                if (mazeRef.current[y][x].bottom) { ctx.moveTo((x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE); ctx.lineTo(x * CELL_SIZE, (y + 1) * CELL_SIZE); }
                if (mazeRef.current[y][x].left) { ctx.moveTo(x * CELL_SIZE, (y + 1) * CELL_SIZE); ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE); }
            }
        }
        ctx.stroke();
        
        // Draw Exit
        ctx.fillStyle = '#facc15'; // Amber 400
        ctx.fillRect(exitRef.current.x * CELL_SIZE, exitRef.current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        // Draw Player
        ctx.fillStyle = '#34d399'; // Emerald 400
        ctx.beginPath();
        ctx.arc(playerRef.current.x * CELL_SIZE + CELL_SIZE / 2, playerRef.current.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 4, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Minotaur
        ctx.fillStyle = '#ef4444'; // Red 500
        ctx.fillRect(minotaurRef.current.x * CELL_SIZE + 5, minotaurRef.current.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    }, []);

    const moveMinotaur = useCallback(() => {
        const minotaur = minotaurRef.current;
        const player = playerRef.current;
        const currentCell = mazeRef.current[minotaur.y][minotaur.x];

        const possibleMoves = [];
        if (!currentCell.top && minotaur.y > 0) possibleMoves.push({ x: 0, y: -1 });
        if (!currentCell.right && minotaur.x < MAZE_WIDTH - 1) possibleMoves.push({ x: 1, y: 0 });
        if (!currentCell.bottom && minotaur.y < MAZE_HEIGHT - 1) possibleMoves.push({ x: 0, y: 1 });
        if (!currentCell.left && minotaur.x > 0) possibleMoves.push({ x: -1, y: 0 });

        if (possibleMoves.length === 0) return;
        
        let bestMove = possibleMoves[0];
        let minDistance = Infinity;

        for (const move of possibleMoves) {
            const newX = minotaur.x + move.x;
            const newY = minotaur.y + move.y;
            const distance = Math.abs(newX - player.x) + Math.abs(newY - player.y);
            if (distance < minDistance) {
                minDistance = distance;
                bestMove = move;
            }
        }
        
        minotaurRef.current.x += bestMove.x;
        minotaurRef.current.y += bestMove.y;
    }, []);

    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing') return;
        const player = playerRef.current;
        const cell = mazeRef.current[player.y][player.x];
        if (dx === 1 && !cell.right) player.x++;
        else if (dx === -1 && !cell.left) player.x--;
        else if (dy === 1 && !cell.bottom) player.y++;
        else if (dy === -1 && !cell.top) player.y--;
    }, [gameState]);

    const gameLoop = useCallback(() => {
        if (playerRef.current.x === minotaurRef.current.x && playerRef.current.y === minotaurRef.current.y) {
            setGameState('game-over');
            submitScore('minigame-labyrinth', 0);
        } else if (playerRef.current.x === exitRef.current.x && playerRef.current.y === exitRef.current.y) {
            const finalScore = score + timeLeft * 10;
            setScore(finalScore);
            setGameState('win');
            submitScore('minigame-labyrinth', finalScore);
        }
        draw();
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [draw, score, timeLeft, submitScore]);
    
    const resetGame = useCallback(() => {
        generateMaze();
        playerRef.current = { x: 0, y: 0 };
        minotaurRef.current = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };
        exitRef.current = { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 };
        setScore(0);
        setTimeLeft(TIME_LIMIT);
        setGameState('playing');
    }, [generateMaze]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'pre-game' || gameState === 'game-over' || gameState === 'win') {
                resetGame();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': movePlayer(0, -1); break;
                case 'ArrowDown': movePlayer(0, 1); break;
                case 'ArrowLeft': movePlayer(-1, 0); break;
                case 'ArrowRight': movePlayer(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, movePlayer, resetGame]);

    useEffect(() => {
        if (gameState === 'playing') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            minotaurMoveIntervalRef.current = window.setInterval(moveMinotaur, 500);
            timerIntervalRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(minotaurMoveIntervalRef.current) clearInterval(minotaurMoveIntervalRef.current);
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
             if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(minotaurMoveIntervalRef.current) clearInterval(minotaurMoveIntervalRef.current);
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState, gameLoop, moveMinotaur]);
    
    useEffect(() => {
        if (timeLeft <= 0 && gameState === 'playing') {
             setGameState('game-over');
             submitScore('minigame-labyrinth', score);
        }
    }, [timeLeft, gameState, score, submitScore]);
    
    return (
         <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[600px] flex justify-between items-center mb-4 text-white font-bold text-lg">
                <span>Score: {score}</span>
                <span className="text-2xl font-medieval text-amber-300">Labyrinth of the Minotaur</span>
                <span>Time: {timeLeft}</span>
            </div>
             <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="bg-stone-800 border-2 border-emerald-500 rounded-lg w-full h-full" />
                 {gameState !== 'playing' && (
                     <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center">
                         {gameState === 'pre-game' && <>
                            <h2 className="text-4xl font-bold font-medieval text-emerald-400">The Labyrinth</h2>
                            <p className="mt-2">Find the exit before time runs out. Avoid the Minotaur!</p>
                            <Button onClick={resetGame} className="mt-6">Start Game</Button>
                         </>}
                         {gameState === 'game-over' && <>
                            <h2 className="text-4xl font-bold font-medieval text-red-500">You Were Caught!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Try Again</Button>
                         </>}
                         {gameState === 'win' && <>
                            <h2 className="text-4xl font-bold font-medieval text-amber-400">You Escaped!</h2>
                            <p className="text-xl mt-2">Final Score: {score}</p>
                            <Button onClick={resetGame} className="mt-6">Play Again</Button>
                         </>}
                     </div>
                 )}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 w-52">
                    <div />
                    <button onClick={() => movePlayer(0, -1)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowUp /></button>
                    <div />
                    <button onClick={() => movePlayer(-1, 0)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowLeft /></button>
                    <button onClick={() => movePlayer(0, 1)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowDown /></button>
                    <button onClick={() => movePlayer(1, 0)} className="w-16 h-16 bg-stone-700/80 text-white rounded-lg flex items-center justify-center text-2xl active:bg-emerald-600"><ArrowRight /></button>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-8">Exit Game</Button>
        </div>
    );
};

export default LabyrinthGame;