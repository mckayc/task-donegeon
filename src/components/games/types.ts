import { RewardItem } from "../users/types";

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