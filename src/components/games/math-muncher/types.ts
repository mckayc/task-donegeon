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
  // FIX: The game is implemented with a 5x5 grid. The type was incorrectly set to 6.
  gridSize: 5;
  generateGrid: () => Cell[][];
}

export interface GameGrade {
    name: string;
    challenges: MathChallenge[];
}

export type GameGrades = Record<string, GameGrade>;