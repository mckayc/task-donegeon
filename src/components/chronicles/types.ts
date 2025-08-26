import { QuestType } from '../quests/types';

export enum ChronicleEventType {
    QuestCompletion = 'QuestCompletion',
    QuestAssigned = 'QuestAssigned',
    Purchase = 'Purchase',
    TrophyAwarded = 'TrophyAwarded',
    AdminAdjustment = 'AdminAdjustment',
    GiftReceived = 'GiftReceived',
    Trade = 'Trade',
    Crafting = 'Crafting',
    System = 'System',
    Announcement = 'Announcement',
    ScheduledEvent = 'ScheduledEvent',
    Donation = 'Donation',
    Triumph = 'Triumph',
    Trial = 'Trial',
    Checkpoint = 'Checkpoint',
}

export type ChronicleEvent = {
    id: string;
    originalId: string; // The ID of the source object (e.g., PurchaseRequest)
    date: string;
    type: ChronicleEventType;
    title: string;
    note?: string;
    status: string;
    iconType?: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
    color: string;
    userId?: string; // The primary subject user of the event
    userName?: string; // The name of the subject user
    actorId?: string; // The ID of the user who performed the action (e.g., admin)
    actorName?: string; // Name of the user who performed the action (e.g., admin)
    recipientUserIds?: string[]; // The users this event applies to (for announcements, system logs)
    questType?: QuestType;
    guildId?: string; // The scope of the event
    rewardsText?: string;
};