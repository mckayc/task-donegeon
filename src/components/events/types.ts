export interface ScheduledEvent {
    id: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    isAllDay: boolean;
    // FIX: Added 'Vacation' to the eventType union to allow its use throughout the application.
    eventType: 'Announcement' | 'BonusXP' | 'MarketSale' | 'Grace Period' | 'Vacation';
    rrule?: string | null;
    guildId?: string;
    icon?: string;
    color?: string;
    modifiers: {
        xpMultiplier?: number;
        affectedRewardIds?: string[]; // Empty means all XP
        marketId?: string;
        assetIds?: string[]; // Empty means all items in market
        discountPercent?: number;
    };
    createdAt?: string;
    updatedAt?: string;
}