// FIX: Removed re-export of AdminAdjustmentType to resolve a name clash in the main types barrel file.
// The type is correctly sourced from `users/types.ts` via the main barrel file.
import { AdminAdjustmentType as GlobalAdminAdjustmentType } from '../../users/types';

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
  gridSize: 6;
  generateGrid: () => Cell[][];
}

export interface GameGrade {
    name: string;
    challenges: MathChallenge[];
}

export type GameGrades = Record<string, GameGrade>;

// Re-exporting for local use to avoid circular dependency issues.
// This was causing a duplicate export error in the main barrel file.
export const AdminAdjustmentType = GlobalAdminAdjustmentType;
