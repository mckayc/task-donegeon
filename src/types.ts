


export enum Status {
  LOADING,
  SUCCESS,
  ERROR,
  WARNING,
}

export interface ConnectionStatus {
  db: Status;
  gemini: Status;
  jwt: Status;
}

export interface AdminUser {
    id: number;
    gameName: string;
}

export interface StatusAPIResponse {
    firstRun: boolean;
    admins: AdminUser[];
    db: 'CONNECTED_CUSTOM' | 'CONNECTED_DEFAULT' | 'ERROR';
    dbPath: string | null;
    gemini: 'CONNECTED' | 'NOT_CONFIGURED';
    jwt: 'CONFIGURED' | 'NOT_CONFIGURED';
}

// --- Asset Types ---

export interface RewardItem {
    type: 'currency' | 'xp';
    name: string; // e.g., 'Gold Coins', 'Strength'
    amount: number;
}

export interface SetbackItem extends RewardItem {}

export interface Quest {
    id: number;
    title: string;
    description?: string;
    emoji?: string;
    backgroundColor?: string;
    borderColor?: string;
    type: 'Duty' | 'Venture';
    questGroup: QuestGroup;
    optional: boolean;
    approvalRequired: boolean;
    tags?: string[];
    availability?: {
        perPerson: boolean;
        frequency: number; // 0 for unlimited
    };
    deadlines?: {
        late?: string; // ISO date string
        incomplete?: string; // ISO date string
    };
    rewards: RewardItem[];
    setbacks?: {
        late?: SetbackItem[];
        incomplete?: SetbackItem[];
    };
    assignedUsers: AdminUser[];
}

export interface QuestGroup {
    id: number;
    title: string;
    emoji?: string;
    backgroundColor?: string;
    quests?: Quest[];
}
