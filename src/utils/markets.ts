
import { Market, User, QuestCompletionStatus, RewardItem, ScheduledEvent, ModifierEffectType, Quest, AppliedModifier, ModifierDefinition, MarketOpenStatus, Rank, QuestCompletion, Condition, ConditionType } from '../types';
import { toYMD } from './quests';

type MarketDependencies = {
    appliedModifiers: AppliedModifier[];
    modifierDefinitions: ModifierDefinition[];
    quests: Quest[];
    ranks: Rank[];
    questCompletions: QuestCompletion[];
};

export const isMarketOpenForUser = (market: Market, user: User, dependencies: MarketDependencies): MarketOpenStatus => {
    // First, check if an active modifier is closing this market for the user.
    const now = new Date();
    const activeModifier = dependencies.appliedModifiers.find(s => {
        if (s.userId !== user.id || s.status !== 'Active') return false;
        if (s.expiresAt && new Date(s.expiresAt) < now) return false; // Check for expiry

        const definition = dependencies.modifierDefinitions.find(d => d.id === s.modifierDefinitionId);
        const finalEffects = s.overrides?.effects || definition?.effects || [];
        
        return finalEffects.some(effect => 
            effect.type === ModifierEffectType.CloseMarket && effect.marketIds.includes(market.id)
        );
    });

    if (activeModifier) {
        const definition = dependencies.modifierDefinitions.find(d => d.id === activeModifier.modifierDefinitionId);
        const redemptionQuest = dependencies.quests.find(q => q.id === activeModifier.redemptionQuestId);
        
        return {
            isOpen: false,
            reason: 'SETBACK',
            message: `This market is closed due to '${definition?.name || 'a modifier'}'.`,
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

            const checkCondition = (condition: Condition): boolean => {
                switch (condition.type) {
                    case ConditionType.MinRank:
                        const totalXp = Object.values(user.personalExperience).reduce<number>((sum, amount) => sum + Number(amount), 0);
                        const userRank = dependencies.ranks.slice().sort((a, b) => b.xpThreshold - a.xpThreshold).find(r => totalXp >= r.xpThreshold);
                        const requiredRank = dependencies.ranks.find(r => r.id === condition.rankId);
                        if (!userRank || !requiredRank) return false;
                        return userRank.xpThreshold >= requiredRank.xpThreshold;

                    case ConditionType.DayOfWeek:
                        const today = new Date().getDay();
                        return condition.days.includes(today);

                    case ConditionType.DateRange:
                        const todayYMD = toYMD(new Date());
                        return todayYMD >= condition.start && todayYMD <= condition.end;

                    case ConditionType.QuestCompleted:
                        return dependencies.questCompletions.some(c =>
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
