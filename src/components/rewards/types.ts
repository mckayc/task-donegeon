export enum RewardCategory {
  Currency = 'Currency',
  XP = 'XP',
}

export interface RewardItem {
  rewardTypeId: string;
  amount: number;
}

export interface RewardTypeDefinition {
  id: string;
  name: string;
  category: RewardCategory;
  description: string;
  isCore: boolean;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  baseValue: number;
  isExchangeable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
