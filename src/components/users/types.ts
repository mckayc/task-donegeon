export enum Role {
  DonegeonMaster = 'Donegeon Master',
  Gatekeeper = 'Gatekeeper',
  Explorer = 'Explorer',
}

export interface DashboardLayout {
  layoutType: 'single-column' | 'two-column-main-left' | 'two-column-main-right';
  columns: {
    main: {
      order: string[];
      collapsed: string[];
    };
    side: {
      order: string[];
      collapsed: string[];
    };
  };
  hidden: string[];
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
  wishlistAssetIds?: string[];
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
  vault?: {
    purse: { [rewardTypeId: string]: number }; // Can be decimal
    experience: { [rewardTypeId: string]: number }; // Can be decimal
  };
  lastVaultInterestAccrued?: string; // ISO date string
  theme?: string; // Theme ID
  ownedThemes: string[]; // Array of Theme IDs
  hasBeenOnboarded?: boolean;
  aboutMe?: string;
  adminNotes?: string;
  dashboardLayout?: DashboardLayout;
  createdAt?: string;
  updatedAt?: string;
}

export type UserTemplate = Omit<User, 'personalPurse' | 'personalExperience' | 'guildBalances' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded' | 'wishlistAssetIds'>;

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