import { RewardItem } from '../items/types';

export enum ModifierEffectType {
  DeductRewards = 'DEDUCT_REWARDS',
  CloseMarket = 'CLOSE_MARKET',
  GrantRewards = 'GRANT_REWARDS',
  OpenMarket = 'OPEN_MARKET',
  MarketDiscount = 'MARKET_DISCOUNT',
}

export type ModifierEffect = 
  | { type: ModifierEffectType.DeductRewards; rewards: RewardItem[] }
  | { type: ModifierEffectType.CloseMarket; marketIds: string[]; durationHours: number }
  | { type: ModifierEffectType.GrantRewards; rewards: RewardItem[] }
  | { type: ModifierEffectType.OpenMarket; marketIds: string[]; durationHours: number }
  | { type: ModifierEffectType.MarketDiscount; marketId: string; discountPercent: number; durationHours: number };

export interface ModifierDefinition {
  id: string;
  category: 'Triumph' | 'Trial';
  name: string;
  description: string;
  icon: string;
  effects: ModifierEffect[];
  defaultRedemptionQuestId?: string; // Quest ID for automatic assignment (Trials only)
  createdAt?: string;
  updatedAt?: string;
}

export interface AppliedModifier {
  id: string;
  userId: string;
  modifierDefinitionId: string;
  appliedAt: string;
  expiresAt?: string; // For temporary effects like market closures/openings/discounts
  status: 'Active' | 'Completed' | 'Dismissed';
  redemptionQuestId?: string; // The ID of the specific quest instance created for this bane
  resolvedAt?: string;
  resolvedById?: string;
  resolutionNote?: string;
  overrides?: Partial<ModifierDefinition>;
  reason: string;
  appliedById: string;
  createdAt?: string;
  updatedAt?: string;
}