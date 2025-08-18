import { Market, User, IAppData, MarketConditionType, MarketCondition, QuestCompletionStatus, RewardItem, ScheduledEvent, GameAsset, SetbackEffectType, Quest, AppliedSetback, SetbackDefinition, MarketOpenStatus } from '../types';
import { toYMD } from './quests';

export const isMarketOpenForUser = (market: Market, user: User, allData: IAppData): MarketOpenStatus => {
    // First, check if an active setback is closing this market for the user.
    const now = new Date();
    const activeSetback = allData.appliedSetbacks.find(s => {
        if (s.userId !== user.id || s.status !== 'Active') return false;
        if (s.expiresAt && new Date(s.expiresAt) < now) return false; // Check for expiry

        const definition = allData.setbackDefinitions.find(d => d.id === s.setbackDefinitionId);
        const finalEffects = s.overrides?.effects || definition?.effects || [];
        
        return finalEffects.some(effect => 
            effect.type === SetbackEffectType.CloseMarket && effect.marketIds.includes(market.id)
        );
    });

    if (activeSetback) {
        const definition = allData.setbackDefinitions.find(d => d.id === activeSetback.setbackDefinitionId);
        const redemptionQuest = allData.quests.find(q => q.id === activeSetback.redemptionQuestId);
        
        return {
            isOpen: false,
            reason: 'SETBACK',
            message: `This market is closed due to the '${definition?.name || 'a setback'}'.`,
            redemptionQuest: redemptionQuest
        };
    }

    // If not closed by a setback, check the market's own status.
    switch (market.status.type) {
        case 'open':
            return { isOpen: true };
        case 'closed':
            return { isOpen: false, reason: 'CLOSED', message: 'This market is currently closed by an administrator.' };
        case 'conditional':
            const { conditions, logic } = market.status;
            if (conditions.length === 0) return { isOpen: false, reason: 'CONDITIONAL', message: 'Market has no conditions to open.' };

            const checkCondition = (condition: MarketCondition): boolean => {
                switch (condition.type) {
                    case MarketConditionType.MinRank:
                        const totalXp = Object.values(user.personalExperience).reduce((sum, amount) => sum + amount, 0);
                        const userRank = allData.ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);
                        const requiredRank = allData.ranks.find(r => r.id === condition.rankId);
                        if (!userRank || !requiredRank) return false;
                        return userRank.xpThreshold >= requiredRank.xpThreshold;

                    case MarketConditionType.DayOfWeek:
                        const today = new Date().getDay();
                        return condition.days.includes(today);

                    case MarketConditionType.DateRange:
                        const todayYMD = toYMD(new Date());
                        return todayYMD >= condition.start && todayYMD <= condition.end;

                    case MarketConditionType.QuestCompleted:
                        return allData.questCompletions.some(c =>
                            c.userId === user.id &&
                            c.questId === condition.questId &&
                            c.status === QuestCompletionStatus.Approved
                        );
                    default:
                        return false;
                }
            };

            const conditionsMet = logic === 'all' ? conditions.every(checkCondition) : conditions.some(checkCondition);
            
            if (conditionsMet) {
                return { isOpen: true };
            } else {
                return { isOpen: false, reason: 'CONDITIONAL', message: 'You do not meet the requirements to enter this market.' };
            }
        default:
             return { isOpen: false, reason: 'CLOSED', message: 'Market status is unknown.' };
    }
};

export const getFinalCostGroups = (
    costGroups: RewardItem[][],
    marketId: string,
    assetId: string,
    scheduledEvents: ScheduledEvent[]
): RewardItem[][] => {
    const todayYMD = toYMD(new Date());
    const activeSaleEvent = scheduledEvents.find(event =>
        event.eventType === 'MarketSale' &&
        event.modifiers.marketId === marketId &&
        todayYMD >= event.startDate &&
        todayYMD <= event.endDate &&
        (!event.modifiers.assetIds || event.modifiers.assetIds.length === 0 || event.modifiers.assetIds.includes(assetId))
    );

    if (activeSaleEvent && activeSaleEvent.modifiers.discountPercent) {
        const discount = activeSaleEvent.modifiers.discountPercent / 100;
        return costGroups.map(group =>
            group.map(c => ({ ...c, amount: Math.max(0, Math.ceil(c.amount * (1 - discount))) }))
        );
    }
    return costGroups;
};
