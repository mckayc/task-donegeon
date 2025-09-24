export type PowerUpType = 'life' | 'shield' | 'freeze' | 'reveal';

export type CellValue = string | number;

export type Cell = {
    value: CellValue;
    isCorrect: boolean; // Pre-calculated
    isEaten: boolean;
    feedback?: 'correct' | 'incorrect';
    item?: PowerUpType;
};

export type Troggle = {
    pos: { x: number; y: number };
    id: number;
    type: 'patroller' | 'hunter' | 'jumper';
    dir?: { x: number; y: number };
    stepsToGo?: number;
};

export interface MathChallenge {
  title: string;
  gridSize: 6 | 12;
  generateGrid: () => Cell[][];
}

export interface GameGrade {
    name: string;
    challenges: MathChallenge[];
}

export type GameGrades = Record<string, GameGrade>;


// --- Reducer Types ---

export interface GameState {
    gameState: 'select-level' | 'countdown' | 'playing' | 'player-hit' | 'level-cleared' | 'game-over';
    selectedGradeKey: string | null;
    challengePlaylist: MathChallenge[];
    challengeIndex: number;
    round: number;
    score: number;
    combo: number;
    lives: number;
    countdown: number;
    playerPos: { x: number; y: number };
    troggles: Troggle[];
    grid: Cell[][];
    shieldActive: boolean;
    freezeActive: boolean;
    isHit: boolean;
    lastReward: { amount: number; icon: string } | null;
    correctAnswersLeft: number;
}

export type GameAction =
    | { type: 'START_GAME'; payload: { gradeKey: string } }
    | { type: 'START_NEXT_CHALLENGE' }
    | { type: 'RESET_GAME' }
    | { type: 'TICK' }
    | { type: 'COUNTDOWN_TICK' }
    | { type: 'MOVE_PLAYER'; payload: { dx: number; dy: number } }
    | { type: 'MUNCH' }
    | { type: 'PLAYER_HIT' }
    | { type: 'PLAYER_HIT_ANIMATION_END' }
    | { type: 'LEVEL_CLEARED' }
    | { type: 'GAME_OVER' }
    | { type: 'CLEAR_FEEDBACK'; payload: { x: number; y: number } }
    | { type: 'CLEAR_LAST_REWARD' };