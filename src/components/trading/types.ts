import { RewardItem } from '../rewards/types';

export enum TradeStatus {
    Pending = 'Pending',
    OfferUpdated = 'OfferUpdated',
    AcceptedByInitiator = 'AcceptedByInitiator',
    AcceptedByRecipient = 'AcceptedByRecipient',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    Rejected = 'Rejected',
}

export interface TradeOffer {
    id: string;
    initiatorId: string;
    recipientId: string;
    guildId: string;
    status: TradeStatus;
    initiatorOffer: {
        assetIds: string[];
        rewards: RewardItem[];
    };
    recipientOffer: {
        assetIds: string[];
        rewards: RewardItem[];
    };
    initiatorLocked: boolean;
    recipientLocked: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface Gift {
    id: string;
    senderId: string;
    recipientId: string;
    assetId: string;
    guildId: string;
    sentAt: string;
    createdAt?: string;
    updatedAt?: string;
}
