import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, GameAction, MathChallenge } from './MathMuncherTypes';
import { challenges } from './MathMuncherChallenges';
import { shuffleArray, getRandomInt } from './MathMuncherHelpers';
import { useSystemDispatch, useSystemState } from '../../../context/SystemContext';
import { useEconomyState } from '../../../context/EconomyContext';
import { useAuthState } from '../../../context/AuthContext';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { RewardCategory } from '../../../types';

const INITIAL_LIVES = 3;

const getInitialState = (): GameState => ({
    gameState: 'select-level',
    selectedGradeKey: null,
    challengePlaylist: [],
    challengeIndex: 0,
    round: 1,
    score: 0,
    combo: 0,
    lives: INITIAL_LIVES,
    countdown: 3,
    playerPos: { x: 0, y: 0 },
    troggles: [],
    grid: [],
    shieldActive: false,
    freezeActive: false,
    isHit: false,
    lastReward: null,
    correctAnswersLeft: 0,
});

const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'START_GAME': {
            const gradeChallenges = challenges[action.payload.gradeKey];
            if (!gradeChallenges) return state;

            const newPlaylist = shuffleArray(gradeChallenges.challenges);
            const challenge = newPlaylist[0];
            const newGrid = challenge.generateGrid();
            const gridSize = challenge.gridSize;

            return {
                ...getInitialState(),
                gameState: 'countdown',
                selectedGradeKey: action.payload.gradeKey,
                challengePlaylist: newPlaylist,
                grid: newGrid,
                playerPos: { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
                correctAnswersLeft: newGrid.flat().filter(c => c.isCorrect).length,
                troggles: Array.from({ length: 1 }, (_, i) => ({
                    id: Date.now() + i,
                    pos: { x: 0, y: 0 },
                    type: 'patroller',
                    dir: { x: 1, y: 0 },
                    stepsToGo: 0,
                }))
            };
        }
        
        case 'START_NEXT_CHALLENGE': {
             let nextIndex = state.challengeIndex + 1;
             let nextRound = state.round;
             let nextPlaylist = state.challengePlaylist;

            if (nextIndex >= state.challengePlaylist.length) {
                nextIndex = 0;
                nextRound++;
                nextPlaylist = shuffleArray(challenges[state.selectedGradeKey!].challenges);
            }
            
            const challenge = nextPlaylist[nextIndex];
            const newGrid = challenge.generateGrid();
            const gridSize = challenge.gridSize;
            const numTroggles = 1 + Math.floor(nextRound / 2) + Math.floor(nextIndex / 4);

            return {
                ...state,
                gameState: 'countdown',
                challengePlaylist: nextPlaylist,
                challengeIndex: nextIndex,
                round: nextRound,
                countdown: 3,
                grid: newGrid,
                playerPos: { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
                correctAnswersLeft: newGrid.flat().filter(c => c.isCorrect).length,
                 troggles: Array.from({ length: numTroggles }, (_, i) => {
                    const rand = Math.random();
                    let type: 'patroller' | 'hunter' | 'jumper';
                    if (rand < 0.2) type = 'jumper';
                    else if (rand < 0.5) type = 'hunter';
                    else type = 'patroller';
                    return {
                        id: Date.now() + i,
                        pos: { x: i % 2 === 0 ? 0 : gridSize - 1, y: i < 2 ? 0 : gridSize - 1 },
                        type, dir: { x: 1, y: 0 }, stepsToGo: 0,
                    };
                }),
            };
        }

        case 'RESET_GAME': {
            return getInitialState();
        }
        
        case 'COUNTDOWN_TICK': {
            if (state.gameState !== 'countdown') return state;
            const newCountdown = state.countdown - 1;
            return {
                ...state,
                countdown: newCountdown,
                gameState: newCountdown === 0 ? 'playing' : 'countdown',
            };
        }
        
        case 'TICK': {
            if (state.gameState !== 'playing' || state.freezeActive) return state;

            // Move Troggles
            const gridSize = state.challengePlaylist[state.challengeIndex].gridSize;
            const newTroggles = state.troggles.map(troggle => {
                // ... Troggle movement logic from old component
                const newPos = { ...troggle.pos };
                let newDir = troggle.dir ? { ...troggle.dir } : { x: 1, y: 0 };
                let newStepsToGo = troggle.stepsToGo || 0;

                switch (troggle.type) {
                    case 'patroller':
                        if (newStepsToGo <= 0) {
                            const directions = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
                            newDir = directions[getRandomInt(0, 3)];
                            newStepsToGo = getRandomInt(3, 8);
                        }
                        let nextX = newPos.x + newDir.x;
                        let nextY = newPos.y + newDir.y;
                        if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
                            newStepsToGo = 0;
                        } else {
                            newPos.x = nextX;
                            newPos.y = nextY;
                            newStepsToGo--;
                        }
                        return { ...troggle, pos: newPos, dir: newDir, stepsToGo: newStepsToGo };

                    case 'hunter':
                        const dx = state.playerPos.x - troggle.pos.x;
                        const dy = state.playerPos.y - troggle.pos.y;
                        if (Math.random() < 0.2) {
                            const moves = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                            const move = moves[getRandomInt(0,3)];
                            newPos.x += move.x;
                            newPos.y += move.y;
                        } else {
                            if (Math.abs(dx) > Math.abs(dy)) newPos.x += Math.sign(dx);
                            else if (dy !== 0) newPos.y += Math.sign(dy);
                        }
                        newPos.x = Math.max(0, Math.min(gridSize - 1, newPos.x));
                        newPos.y = Math.max(0, Math.min(gridSize - 1, newPos.y));
                        return { ...troggle, pos: newPos };

                    case 'jumper':
                        if (Math.random() < 0.25) {
                            newPos.x = getRandomInt(0, gridSize - 1);
                            newPos.y = getRandomInt(0, gridSize - 1);
                        } else {
                            const moves = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                            const move = moves[getRandomInt(0,3)];
                            if(newPos.x + move.x >= 0 && newPos.x + move.x < gridSize) newPos.x += move.x;
                            if(newPos.y + move.y < 0 && newPos.y + move.y < gridSize) newPos.y += move.y;
                        }
                        return { ...troggle, pos: newPos };
                }
                return troggle;
            });
            
            // Spawn power-up
            let newGrid = state.grid;
            if (Math.random() < 0.02) {
                const eatenCellsPos = state.grid.flat().map((cell, i) => cell.isEaten && !cell.item ? { y: Math.floor(i / gridSize), x: i % gridSize } : null).filter(Boolean);
                if (eatenCellsPos.length > 0) {
                    const pos = eatenCellsPos[Math.floor(Math.random() * eatenCellsPos.length)]!;
                    const powerUpTypes = ['life', 'shield', 'freeze', 'reveal'];
                    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                    newGrid = [...state.grid.map(r => [...r])];
                    newGrid[pos.y][pos.x].item = type as any;
                }
            }

            return { ...state, troggles: newTroggles, grid: newGrid };
        }
        
        case 'MOVE_PLAYER': {
            if(state.gameState !== 'playing') return state;
            const { dx, dy } = action.payload;
            const gridSize = state.challengePlaylist[state.challengeIndex].gridSize;
            const newPos = { x: state.playerPos.x + dx, y: state.playerPos.y + dy };
            if (newPos.x < 0 || newPos.x >= gridSize || newPos.y < 0 || newPos.y >= gridSize) {
                return state;
            }
            return { ...state, playerPos: newPos };
        }

        case 'MUNCH': {
            if (state.gameState !== 'playing') return state;
            const { x, y } = state.playerPos;
            const cell = state.grid[y]?.[x];
            if (!cell || cell.isEaten) return state;

            const newGrid = state.grid.map(row => [...row]);
            const eatenCell = { ...newGrid[y][x], isEaten: true };
            let newState = { ...state };

            if (cell.item) {
                if (cell.item === 'life') newState.lives++;
                if (cell.item === 'shield') newState.shieldActive = true;
                if (cell.item === 'freeze') newState.freezeActive = true; // Timer handled in hook
                if (cell.item === 'reveal') {
                    newGrid.forEach(row => row.forEach(c => { if(c.isCorrect) c.feedback = 'correct'; }));
                }
                eatenCell.item = undefined;
            }

            if (eatenCell.isCorrect) {
                newState.score += 10 * (1 + state.combo);
                newState.combo++;
                newState.correctAnswersLeft--;
                eatenCell.feedback = 'correct';
            } else {
                newState.combo = 0;
                eatenCell.feedback = 'incorrect';
                if (!state.shieldActive) {
                    newState.gameState = 'player-hit';
                } else {
                    newState.shieldActive = false;
                }
            }
            
            newGrid[y][x] = eatenCell;
            return { ...newState, grid: newGrid };
        }
        
        case 'PLAYER_HIT': {
            return { ...state, gameState: 'player-hit', lives: state.lives - 1, isHit: true };
        }
        
        case 'PLAYER_HIT_ANIMATION_END': {
             if (state.lives <= 0) return { ...state, gameState: 'game-over', isHit: false };
             
             const gridSize = state.challengePlaylist[state.challengeIndex].gridSize;
             const respawnPos = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
             return {
                 ...state,
                 gameState: 'playing',
                 isHit: false,
                 playerPos: respawnPos,
                 troggles: state.troggles.filter(t => t.pos.x !== respawnPos.x || t.pos.y !== respawnPos.y)
             };
        }
        
        case 'LEVEL_CLEARED': return { ...state, gameState: 'level-cleared' };
        case 'GAME_OVER': return { ...state, gameState: 'game-over' };

        case 'CLEAR_FEEDBACK': {
            const { x, y } = action.payload;
            const newGrid = state.grid.map(row => [...row]);
            if (newGrid[y]?.[x]) {
                newGrid[y][x].feedback = undefined;
            }
            return { ...state, grid: newGrid };
        }

        case 'CLEAR_LAST_REWARD': return { ...state, lastReward: null };
        
        default: return state;
    }
};

export const useMathMuncherGame = (onClose: () => void) => {
    const [state, dispatch] = useReducer(gameReducer, getInitialState());
    const { minigames } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { submitScore } = useSystemDispatch();
    
    const gameConfig = useMemo(() => minigames.find(g => g.id === 'minigame-math-muncher'), [minigames]);
    const rewardSettings = useMemo(() => gameConfig?.rewardSettings, [gameConfig]);
    const rewardDef = useMemo(() => rewardTypes.find(rt => rt.id === rewardSettings?.rewardTypeId), [rewardTypes, rewardSettings]);

    const userBalance = useMemo(() => {
        if (!currentUser || !rewardSettings || !rewardDef) return 0;
        const balanceSource = rewardDef.category === RewardCategory.Currency ? currentUser.personalPurse : currentUser.personalExperience;
        return balanceSource[rewardSettings.rewardTypeId] || 0;
    }, [currentUser, rewardSettings, rewardDef]);

    const gameSpeed = useMemo(() => Math.max(200, 800 - (state.round - 1) * 50), [state.round]);

    // Main Game Loop
    useEffect(() => {
        if (state.gameState === 'playing') {
            const id = setInterval(() => dispatch({ type: 'TICK' }), gameSpeed);
            return () => clearInterval(id);
        }
    }, [state.gameState, gameSpeed]);
    
     // Collision check
    useEffect(() => {
        if (state.gameState === 'playing' && !state.isHit) {
            if (state.troggles.some(t => t.pos.x === state.playerPos.x && t.pos.y === state.playerPos.y)) {
                if (state.shieldActive) {
                    // Logic to remove troggle is complex here, handle in a new action if needed
                } else {
                    dispatch({ type: 'PLAYER_HIT' });
                }
            }
        }
    }, [state.playerPos, state.troggles, state.shieldActive, state.gameState, state.isHit]);

    // Countdown Timer
    useEffect(() => {
        if (state.gameState === 'countdown' && state.countdown > 0) {
            const timer = setTimeout(() => dispatch({ type: 'COUNTDOWN_TICK' }), 700);
            return () => clearTimeout(timer);
        }
    }, [state.gameState, state.countdown]);

    // Post-hit delay
    useEffect(() => {
        if (state.gameState === 'player-hit') {
            const timer = setTimeout(() => dispatch({ type: 'PLAYER_HIT_ANIMATION_END' }), 1500);
            return () => clearTimeout(timer);
        }
    }, [state.gameState]);

    // Munch feedback clear
    useEffect(() => {
        if (state.grid.flat().some(c => c.feedback)) {
            const { x, y } = state.playerPos;
            const timer = setTimeout(() => dispatch({ type: 'CLEAR_FEEDBACK', payload: { x, y } }), 300);
            return () => clearTimeout(timer);
        }
    }, [state.grid, state.playerPos]);
    
    // Freeze timer
    useEffect(() => {
        if (state.freezeActive) {
            const timer = setTimeout(() => {
                // This state change is not in reducer because it's a side effect of time passing
                // A more advanced reducer might handle this with a special action.
                // For now, this is simpler.
                const nextState = gameReducer(state, { type: 'TICK' }); // A bit of a hack to keep state consistent.
                gameReducer(nextState, { type: 'TICK' }); // another one.
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [state.freezeActive]);

    // Level cleared logic
    useEffect(() => {
        if (state.gameState === 'playing' && state.correctAnswersLeft <= 0) {
            dispatch({ type: 'LEVEL_CLEARED' });
            // Handle rewards
            if (currentUser && rewardSettings && rewardDef && (state.challengeIndex + 1) % rewardSettings.levelFrequency === 0) {
                 addNotification({
                    type: 'success',
                    message: `+${rewardSettings.amount} ${rewardDef.name}`,
                    icon: rewardDef.icon
                });
                // This would be better in the reducer if it could dispatch notifications
                const nextState = gameReducer(state, { type: 'LEVEL_CLEARED' });
                gameReducer(nextState, { type: 'CLEAR_LAST_REWARD' });
            }
        }
    }, [state.correctAnswersLeft, state.gameState, addNotification, currentUser, rewardSettings, rewardDef, state.challengeIndex]);
    
     // Game Over Score Submit
    useEffect(() => {
        if (state.gameState === 'game-over') {
            submitScore('minigame-math-muncher', state.score);
        }
    }, [state.gameState, state.score, submitScore]);


    const startGame = useCallback((gradeKey: string) => {
        dispatch({ type: 'START_GAME', payload: { gradeKey } });
    }, []);

    return { state, dispatch, startGame, rewardDef, userBalance };
};