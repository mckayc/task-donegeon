
import { RewardItem } from "../rewards/types";
import { Cell, Troggle, PowerUpType } from './MathMuncherTypes';

export interface PrizeThreshold {
    score: number;
    rewards: RewardItem[];
}

export interface Minigame {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    isActive?: boolean;
    playsPerToken?: number;
    prizesEnabled?: boolean;
    prizeThresholds?: PrizeThreshold[];
    rewardSettings?: {
        rewardTypeId: string;
        amount: number;
        levelFrequency: number;
    };
}

export interface GameScore {
    id: string;
    gameId: string;
    userId: string;
    score: number;
    playedAt: string; // ISO Date string
    createdAt?: string;
    updatedAt?: string;
}

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
export type { Cell, Troggle, PowerUpType };