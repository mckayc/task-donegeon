export interface Guild {
  id: string;
  name: string;
  purpose: string;
  memberIds: string[];
  isDefault?: boolean;
  themeId?: string;
  treasury: {
    purse: { [rewardTypeId: string]: number };
    ownedAssetIds: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}