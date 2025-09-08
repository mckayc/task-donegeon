import { useSystemState } from '../context/SystemContext';
import { useEconomyState } from '../context/EconomyContext';

/**
 * Formats a number into a currency string based on a currency code.
 */
const formatCurrency = (amount: number, currencyCode: string): string => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (e) {
        // Fallback for invalid currency codes
        return `${amount.toFixed(2)} ${currencyCode}`;
    }
};

/**
 * Calculates the value of a given amount of a reward type in terms of the selected real-world currency.
 * @returns A formatted currency string like "$5.00" or null if valuation is disabled or not applicable.
 */
export const useRewardValue = (amount: number, rewardTypeId: string): string | null => {
    const { settings } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { rewardValuation } = settings;

    if (!rewardValuation.enabled) return null;

    const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!reward || !reward.baseValue || reward.baseValue <= 0) return null;

    const realWorldValue = amount * reward.baseValue;
    
    return formatCurrency(realWorldValue, rewardValuation.realWorldCurrency);
};


/**
 * Calculates the value of a single unit of a reward type in terms of the selected real-world currency.
 * @returns A formatted currency string like "$0.20" or null.
 */
export const useRewardValuePerUnit = (rewardTypeId: string): string | null => {
    return useRewardValue(1, rewardTypeId);
};

/**
 * Creates a helper string showing the real-world currency equivalent for a reward amount.
 * @returns A string like "(equals $5.00)" or null.
 */
export const useAnchorEquivalent = (amount: number, rewardTypeId: string): string | null => {
    const valueString = useRewardValue(amount, rewardTypeId);
    if (!valueString) return null;
    return `(equals ${valueString})`;
};
