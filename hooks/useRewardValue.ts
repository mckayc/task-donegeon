
import { useAppState } from '../context/AppContext';
import { RewardCategory } from '../types';

export const useRewardValue = (amount: number, rewardTypeId: string): string | null => {
    const { settings, rewardTypes } = useAppState();

    const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!reward) return null;

    const valuationConfig = reward.category === RewardCategory.Currency
        ? settings.rewardValuation.currency
        : settings.rewardValuation.experience;
    
    if (!valuationConfig.enabled) return null;

    const { anchorRewardId, anchorRewardValue, exchangeRates, baseUnitSymbol } = valuationConfig;
    
    let valueInAnchor;
    if (rewardTypeId === anchorRewardId) {
        valueInAnchor = amount;
    } else {
        const rate = exchangeRates[rewardTypeId];
        if (!rate || rate === 0) return null;
        valueInAnchor = amount / rate;
    }
    
    const finalValue = valueInAnchor * anchorRewardValue;
    
    // Simple formatting
    const formattedValue = finalValue % 1 === 0 ? finalValue : finalValue.toFixed(2);

    return `${baseUnitSymbol}${formattedValue}`;
};

export const useRewardValuePerUnit = (rewardTypeId: string): string | null => {
    return useRewardValue(1, rewardTypeId);
};

export const useAnchorEquivalent = (amount: number, rewardTypeId: string): string | null => {
    const { settings, rewardTypes } = useAppState();

    const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
    if (!reward) return null;

    const valuationConfig = reward.category === RewardCategory.Currency 
        ? settings.rewardValuation.currency 
        : settings.rewardValuation.experience;

    if (!valuationConfig.enabled) return null;
    
    const { anchorRewardId, exchangeRates, baseUnitSymbol, anchorRewardValue } = valuationConfig;
    const anchorReward = rewardTypes.find(rt => rt.id === anchorRewardId);
    if (!anchorReward) return null;

    let valueInAnchor;
    if (rewardTypeId === anchorRewardId) {
        valueInAnchor = amount;
    } else {
        const rate = exchangeRates[rewardTypeId];
        if (!rate || rate === 0) return null;
        valueInAnchor = amount / rate;
    }
    
    const formattedAnchorValue = valueInAnchor % 1 === 0 ? valueInAnchor : valueInAnchor.toFixed(2);
    const anchorString = `${formattedAnchorValue} ${anchorReward.icon}`;
    
    const finalRealValue = valueInAnchor * anchorRewardValue;
    const formattedRealValue = finalRealValue % 1 === 0 ? finalRealValue : finalRealValue.toFixed(2);
    const realValueString = `${baseUnitSymbol}${formattedRealValue}`;

    return `(equals ${anchorString} or ${realValueString})`;
};
