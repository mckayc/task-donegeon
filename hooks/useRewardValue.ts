
import { useAppState } from '../context/AppContext';
import { RewardCategory, RewardTypeDefinition } from '../types';

/**
 * Calculates the value of a given amount of a reward type in terms of the anchor currency.
 * @returns A string like "10 💰" or null if valuation is disabled or not applicable.
 */
export const useRewardValue = (amount: number, rewardTypeId: string): string | null => {
    const { settings, rewardTypes } = useAppState();
    const { rewardValuation } = settings;

    if (!rewardValuation.enabled) return null;

    const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!reward) return null;

    const { anchorRewardId, exchangeRates } = rewardValuation;
    const anchorReward = rewardTypes.find(rt => rt.id === anchorRewardId);
    if (!anchorReward) return null;

    let valueInAnchor: number;
    if (rewardTypeId === anchorRewardId) {
        valueInAnchor = amount;
    } else {
        const rate = exchangeRates[rewardTypeId];
        if (!rate || rate === 0) return null; // Avoid division by zero and handle unconfigured rates
        // The rate is how many of this currency 1 anchor buys. So we divide to get back to the anchor value.
        valueInAnchor = amount / rate;
    }
    
    const formattedValue = valueInAnchor % 1 === 0 ? valueInAnchor : valueInAnchor.toFixed(2);
    
    return `${formattedValue} ${anchorReward.icon || ''}`;
};


/**
 * Calculates the value of a single unit of a reward type in terms of the anchor currency.
 * @returns A string like "10 💰" or null.
 */
export const useRewardValuePerUnit = (rewardTypeId: string): string | null => {
    return useRewardValue(1, rewardTypeId);
};

/**
 * Creates a helper string showing the anchor currency equivalent for a reward amount.
 * @returns A string like "(equals 10 💰)" or null.
 */
export const useAnchorEquivalent = (amount: number, rewardTypeId: string): string | null => {
    const valueString = useRewardValue(amount, rewardTypeId);
    if (!valueString) return null;
    return `(equals ${valueString})`;
};