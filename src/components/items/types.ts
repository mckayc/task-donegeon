import type { Quest } from '../quests/types';
import { Rank } from '../ranks/types';
import { ConditionSet, Condition } from '../conditions/types';
import { RewardItem } from '../rewards/types';

export interface GameAsset {
  id: string;
  name: string;
  description: string;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  category: string;
  avatarSlot?: string;
  isForSale: boolean;
  isAvailable?: boolean;
  costGroups: RewardItem[][];
  payouts?: RewardItem[];
  marketIds: string[];
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
  purchaseLimit: number | null; // null for infinite
  purchaseLimitType: 'Total' | 'PerUser';
  purchaseCount: number;
  useCount?: number; // How many times a consumable has been used across all users
  requiresApproval: boolean;
  linkedThemeId?: string; // Links this asset to a theme that gets unlocked on purchase
  recipe?: {
    ingredients: {
      assetId: string;
      quantity: number;
    }[];
  };
}

export type MarketStatus =
  | { type: 'open' }
  | { type: 'closed' }
  | { type: 'conditional', conditionSetIds: string[] };

export type MarketOpenStatus = {
    isOpen: true;
    discountPercent?: number;
} | {
    isOpen: false;
    reason: 'SETBACK' | 'CLOSED' | 'CONDITIONAL';
    message: string;
    redemptionQuest?: Quest;
};

export interface Market {
  id:string;
  title: string;
  description: string;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  guildId?: string;
  status: MarketStatus;
  createdAt?: string;
  updatedAt?: string;
}

export enum PurchaseRequestStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  assetId: string;
  marketId?: string;
  requestedAt: string;
  actedAt?: string;
  actedById?: string; // ID of the user who approved, rejected, or cancelled.
  status: PurchaseRequestStatus;
  assetDetails: {
      name: string;
      description: string;
      cost: RewardItem[];
      icon?: string;
      iconType?: 'emoji' | 'image';
      imageUrl?: string;
  };
  guildId?: string;
  createdAt?: string;
  updatedAt?: string;
}