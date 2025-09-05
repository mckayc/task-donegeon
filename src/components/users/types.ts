export enum Role {
  DonegeonMaster = 'Donegeon Master',
  Gatekeeper = 'Gatekeeper',
  Explorer = 'Explorer',
}

// FIX: Moved from items/types.ts to break circular dependency
export enum RewardCategory {
  Currency = 'Currency',
  XP = 'XP',
}

// FIX: Moved from items/types.ts to break circular dependency
export interface RewardItem {
  rewardTypeId: string;
  amount: number;
}

export interface DashboardLayout {
  left: {
    order: string[];
    collapsed: string[];
  };
  right: {
    order: string[];
    collapsed: string[];
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName:string;
  username: string;
  email: string;
  gameName: string;
  birthday: string;
  role: Role;
  profilePictureUrl?: string | null;
  ownedAssetIds: string[];
  pin: string;
  password?: string;
  personalPurse: { [rewardTypeId: string]: number };
  personalExperience: { [rewardTypeId: string]: number };
  guildBalances: {
    [guildId: string]: {
      purse: { [rewardTypeId: string]: number };
      experience: { [rewardTypeId: string]: number };
    }
  };
  theme?: string; // Theme ID
  ownedThemes: string[]; // Array of Theme IDs
  hasBeenOnboarded?: boolean;
  aboutMe?: string;
  adminNotes?: string;
  dashboardLayout?: DashboardLayout;
  createdAt?: string;
  updatedAt?: string;
}

export type UserTemplate = Omit<User, 'personalPurse' | 'personalExperience' | 'guildBalances' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>;

export enum AdminAdjustmentType {
    Reward = 'Reward',
    Setback = 'Setback',
    Trophy = 'Trophy',
    Compound = 'Compound',
}

export interface AdminAdjustment {
    id: string;
    userId: string;
    adjusterId: string;
    type: AdminAdjustmentType;
    rewards: { rewardTypeId: string; amount: number; }[];
    setbacks: { rewardTypeId: string; amount: number; }[];
    trophyId?: string;
    reason: string;
    adjustedAt: string;
    guildId?: string;
    createdAt?: string;
    updatedAt?: string;
}