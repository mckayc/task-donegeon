


import { RewardItem } from '../items/types';
import { Page } from '../../types/app';

// FIX: Defined and exported the 'SystemStatus' interface to provide a clear data structure for system health checks, resolving a missing type error.
export interface SystemStatus {
    geminiConnected: boolean;
    database: {
        connected: boolean;
        isCustomPath: boolean;
    };
    jwtSecretSet: boolean;
}

export interface SystemLog {
    id: string;
    timestamp: string;
    type: 'QUEST_LATE' | 'QUEST_INCOMPLETE';
    questId: string;
    userIds: string[];
    setbacksApplied: RewardItem[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'trophy';
  iconType?: 'emoji' | 'image';
  icon?: string;
  imageUrl?: string;
  duration?: number;
}

export enum SystemNotificationType {
    Announcement = 'Announcement',
    QuestAssigned = 'QuestAssigned',
    TrophyAwarded = 'TrophyAwarded',
    ApprovalRequired = 'ApprovalRequired',
    GiftReceived = 'GiftReceived',
    TradeRequestReceived = 'TradeRequestReceived',
    TradeAccepted = 'TradeAccepted',
    TradeCancelled = 'TradeCancelled',
    TradeRejected = 'TradeRejected',
}

export interface SystemNotification {
    id: string;
    senderId?: string;
    message: string;
    type: SystemNotificationType;
    timestamp: string;
    recipientUserIds: string[];
    readByUserIds: string[];
    link?: Page;
    guildId?: string;
    iconType?: 'emoji' | 'image';
    icon?: string;
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}