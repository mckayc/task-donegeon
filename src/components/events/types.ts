export interface ScheduledEvent {
    id: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    isAllDay: boolean;
    // FIX: Add 'Vacation' to the eventType union to support vacation/grace period events.
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
