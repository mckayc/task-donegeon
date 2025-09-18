

// FIX: Corrected type imports to use the main types barrel file.
import { Market, RewardItem, MarketOpenStatus, User, Quest, ScheduledEvent, ModifierEffectType, AppliedModifier, ModifierDefinition, ConditionSet } from '../../../types';
import { toYMD } from '../../../utils/quests';
import { checkAllConditionSetsMet, ConditionDependencies, checkGlobalConditionsMet } from '../../../utils/conditions';

export type MarketDependencies = ConditionDependencies & {
    appliedModifiers: AppliedModifier[];
    modifierDefinitions: ModifierDefinition[];
    allConditionSets: ConditionSet[];
};

export const isMarketOpenForUser = (market: Market, user: User, dependencies: MarketDependencies): MarketOpenStatus => {
    // 1. Check global conditions first. They are the most restrictive.
    const globalCheck = checkGlobalConditionsMet(user, dependencies, { marketId: market.id });
    if (!globalCheck.allMet) {
        return {
            isOpen: false,
            reason: 'CONDITIONAL',
            message: `Globally locked by: ${globalCheck.failingSetName || 'a global rule'}.`
        };
    }

    // 2. Check if an active modifier is closing this market for the user.
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

    // 3. If not closed by a modifier or global rule, check the market's own status.
    switch (market.status.type) {
        case 'open':
            return { isOpen: true };
        case 'closed':
            return { isOpen: false, reason: 'CLOSED', message: 'This market is currently closed by an administrator.' };
        case 'conditional': {
            const { conditionSetIds } = market.status;
            if (!conditionSetIds || conditionSetIds.length === 0) {
                return { isOpen: false, reason: 'CONDITIONAL', message: 'Market has no conditions to open.' };
            }
            
            const { allMet, failingSetName } = checkAllConditionSetsMet(conditionSetIds, user, dependencies);

            if (allMet) {
                 return { isOpen: true };
            } else {
                 return { isOpen: false, reason: 'CONDITIONAL', message: `You do not meet the requirements for: ${failingSetName || 'this market'}.` };
            }
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