
import { QuestType, RewardItem } from '../../types';

export type ChronicleEvent = {
    id: string;
    originalId: string; // The ID of the source object (e.g., PurchaseRequest)
    date: string;
    type: 'Quest' | 'Purchase' | 'Trophy' | 'Adjustment' | 'System' | 'Announcement' | 'ScheduledEvent' | 'Crafting' | 'Donation' | 'Gift' | 'Trade' | 'Triumph' | 'Trial' | 'Checkpoint';
    title: string;
    note?: string;
    status: string;
    iconType?: 'emoji' | 'image';
    icon: string;
    imageUrl?: string;
    color: string;
    userId?: string; // The primary actor/user
    actorName?: string; // Name of the user who acted (e.g., approved/rejected)
    recipientUserIds?: string[]; // The users this event applies to (for announcements, system logs)
    questType?: QuestType;
    guildId?: string; // The scope of the event
    rewards?: RewardItem[];
};
