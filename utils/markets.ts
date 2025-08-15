import { Market, User, IAppData, MarketConditionType, MarketCondition, QuestCompletionStatus, RewardItem, ScheduledEvent, GameAsset } from '../types';
import { toYMD } from './quests';

export const isMarketOpenForUser = (market: Market, user: User, allData: IAppData): boolean => {
    switch (market.status.type) {
        case 'open':
            return true;
        case 'closed':
            return false;
        case 'conditional':
            const { conditions, logic } = market.status;
            if (conditions.length === 0) return false; // No conditions means it's not open

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

            if (logic === 'all') {
                return conditions.every(checkCondition);
            } else { // 'any'
                return conditions.some(checkCondition);
            }
        default:
            return false;
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
