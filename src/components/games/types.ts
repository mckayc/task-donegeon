import { RewardItem } from "../rewards/types";
import { Cell, Troggle, PowerUpType, GameState, GameAction, MathChallenge, GameGrade, GameGrades } from './math-muncher/MathMuncherTypes';

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

// Re-export for convenience in other files
export type { Cell, Troggle, PowerUpType, GameState, GameAction, MathChallenge, GameGrade, GameGrades };