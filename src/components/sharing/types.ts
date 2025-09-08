import { Quest, QuestGroup } from '../quests/types';
import { RewardTypeDefinition, GameAsset, Market } from '../items/types';
import { Rank } from '../ranks/types';
import { Trophy } from '../trophies/types';
import { UserTemplate, Role } from '../users/types';
import { Rotation } from '../rotations/types';
import { ModifierDefinition } from '../modifiers/types';
import { ChronicleEvent } from '../chronicles/types';

export type ShareableAssetType = 'quests' | 'questGroups' | 'rewardTypes' | 'ranks' | 'trophies' | 'markets' | 'gameAssets' | 'users' | 'rotations' | 'modifierDefinitions' | 'chronicles';

export interface AssetPackAssets {
  quests?: Quest[];
  questGroups?: QuestGroup[];
  rewardTypes?: RewardTypeDefinition[];
  ranks?: Rank[];
  trophies?: Trophy[];
  markets?: Market[];
  gameAssets?: GameAsset[];
  users?: UserTemplate[];
  rotations?: Rotation[];
  modifierDefinitions?: ModifierDefinition[];
  chronicles?: ChronicleEvent[];
}

export interface AssetPackManifest {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  emoji?: string;
  category?: string;
}

export interface AssetPack {
  manifest: AssetPackManifest;
  assets: AssetPackAssets;
}

export interface AssetPackSummary {
    quests: { title: string; icon: string; description: string; emoji?: string; }[];
    gameAssets: { name: string; icon?: string; description: string; emoji?: string; }[];
    trophies: { name: string; icon: string; description: string; emoji?: string; }[];
    users: { gameName: string; role: Role; }[];
    markets: { title: string; icon: string; description: string; emoji?: string; }[];
    ranks: { name: string; icon: string }[];
    rewardTypes: { name: string; icon: string; description: string; emoji?: string; }[];
    questGroups: { name: string; icon: string; description: string; emoji?: string; }[];
}


export interface AssetPackManifestInfo {
  manifest: AssetPackManifest;
  filename: string;
  summary: AssetPackSummary;
}

export interface ImportResolution {
  type: ShareableAssetType;
  id: string; // Original ID from blueprint
  name: string;
  status: 'new' | 'conflict';
  resolution: 'skip' | 'rename' | 'keep';
  newName?: string;
  selected?: boolean;
}

export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string; // file mod time
    parsed: {
        date: string; // ISO string from filename
        version: string;
        type: string; // 'manual' or 'auto-[schedule_id]'
        format: 'json' | 'sqlite';
    } | null;
}