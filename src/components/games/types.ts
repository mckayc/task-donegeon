
export interface Minigame {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
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