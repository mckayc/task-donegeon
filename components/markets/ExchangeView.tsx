

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';
import { RewardTypeDefinition, RewardCategory, Market, RewardItem } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import Input from '../user-interface/Input';
import { ArrowRightIcon } from '../user-interface/Icons';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useEconomyDispatch, useEconomyState } from '../../context/EconomyContext';

interface ExchangeViewProps {
    market: Market;
}

const RewardButton: React.FC<{
    reward: RewardTypeDefinition;
    balance?: number;
    isSelected: boolean;
    isDisabled: boolean;
    onClick: () => void;
}> = ({ reward, balance, isSelected, isDisabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={`p-2 rounded-lg text-center transition-all duration-200 relative ${
            isSelected 
                ? 'bg-emerald-800/60 border-2 border-emerald-500 ring-2 ring-emerald-500/50 scale-105' 
                : isDisabled 
                ? 'bg-stone-800 opacity-40 cursor-not-allowed'
                : 'bg-stone-900/50 border-2 border-transparent hover:border-emerald-600'
        }`}
        title={balance !== undefined ? `${reward.name}: ${Math.floor(balance)}` : reward.name}
    >
        <div className="text-3xl">{reward.icon}</div>
        {balance !== undefined && (
             <p className="text-xs text-stone-300 font-semibold">{Math.floor(balance)}</p>
        )}
    </button>
);


const ExchangeView: React.FC<ExchangeViewProps> = ({ market }) => {
    const { settings } = useAppState();
    const { rewardTypes } = useEconomyState();
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const { executeExchange } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();
    const { setActiveMarketId } = useUIDispatch();

    const [fromRewardId, setFromRewardId] = useState<string>('');
    const [toRewardId, setToRewardId] = useState<string>('');
    const [toAmountString, setToAmountString] = useState<string>('');

    const exchangeableRewardTypes = useMemo(() => {
        return rewardTypes.filter(rt => rt.baseValue > 0);
    }, [rewardTypes]);

    const { payWithRewards, receiveRewards } = useMemo(() => {
        return {
            payWithRewards: exchangeableRewardTypes,
            receiveRewards: exchangeableRewardTypes
        }
    }, [exchangeableRewardTypes]);
    
    const balances = useMemo(() => {
        if (!currentUser) return new Map<string, number>();
        const purse = appMode.mode === 'personal' ? currentUser.personalPurse : currentUser.guildBalances[appMode.guildId]?.purse || {};
        const xp = appMode.mode === 'personal' ? currentUser.personalExperience : currentUser.guildBalances[appMode.guildId]?.experience || {};
        const combined = new Map<string, number>();
        rewardTypes.forEach(rt => {
            const balance = (rt.category === RewardCategory.Currency ? purse[rt.id] : xp[rt.id]) || 0;
            combined.set(rt.id, balance);
        });
        return combined;
    }, [currentUser, appMode, rewardTypes]);
    
    const fromReward = useMemo(() => rewardTypes.find(rt => rt.id === fromRewardId), [fromRewardId, rewardTypes]);
    const toReward = useMemo(() => rewardTypes.find(rt => rt.id === toRewardId), [toRewardId, rewardTypes]);

    const calculation = useMemo(() => {
        const toAmountNum = parseInt(toAmountString, 10) || 0;
        const defaultCalc = { fromAmountBase: 0, fee: 0, roundingFee: 0, totalCost: 0, maxToAmount: 0 };
        if (!fromReward || !toReward || fromReward.baseValue <= 0 || toReward.baseValue <= 0) {
            return defaultCalc;
        }

        const { currencyExchangeFeePercent, xpExchangeFeePercent } = settings.rewardValuation;
        const fromBalance = balances.get(fromReward.id) || 0;
        const feePercent = fromReward.category === RewardCategory.Currency ? currencyExchangeFeePercent : xpExchangeFeePercent;
        const feeMultiplier = 1 + (Number(feePercent) / 100);

        // Calculate maximum possible receive amount based on balance
        const fromValueAfterFee = (fromBalance / feeMultiplier) * fromReward.baseValue;
        const maxToAmount = Math.floor(fromValueAfterFee / toReward.baseValue);

        if (toAmountNum === 0) {
            return { ...defaultCalc, maxToAmount };
        }

        const cappedToAmount = Math.min(toAmountNum, maxToAmount);
        
        const toValueInReal = cappedToAmount * toReward.baseValue;
        const fromAmountBase = toValueInReal / fromReward.baseValue;
        const fee = fromAmountBase * (Number(feePercent) / 100);
        const provisionalTotalCost = fromAmountBase + fee;
        const totalCost = Math.ceil(provisionalTotalCost);
        const roundingFee = totalCost - provisionalTotalCost;

        return { fromAmountBase, fee, roundingFee, totalCost, maxToAmount };

    }, [toAmountString, fromReward, toReward, settings.rewardValuation, balances]);
    
    const recommendedAmounts = useMemo(() => {
        if (!fromReward || !toReward || calculation.maxToAmount <= 0) return [];

        const suggestions: { amount: number; loss: number }[] = [];
        const limit = Math.min(calculation.maxToAmount, 250); // Scan a reasonable range

        for (let i = 1; i <= limit; i++) {
            const toValueInReal = i * toReward.baseValue;
            const fromAmountBase = toValueInReal / fromReward.baseValue;
            const feePercent = fromReward.category === RewardCategory.Currency ? settings.rewardValuation.currencyExchangeFeePercent : settings.rewardValuation.xpExchangeFeePercent;
            const feeMultiplier = 1 + (Number(feePercent) / 100);
            const provisionalTotalCost = fromAmountBase * feeMultiplier;
            const totalCost = Math.ceil(provisionalTotalCost);
            const roundingLoss = totalCost - provisionalTotalCost;
            
            const effectiveLoss = Math.min(roundingLoss, 1 - roundingLoss);

            suggestions.push({ amount: i, loss: effectiveLoss });
        }

        suggestions.sort((a, b) => {
            if (a.loss < b.loss) return -1;
            if (a.loss > b.loss) return 1;
            return b.amount - a.amount;
        });

        const bestAmounts = [...new Set(suggestions.slice(0, 3).map(s => s.amount))];
        
        if (calculation.maxToAmount > 0 && !bestAmounts.includes(calculation.maxToAmount)) {
            bestAmounts.push(calculation.maxToAmount);
        }

        return bestAmounts.filter(a => a > 0).sort((a, b) => a - b).slice(0, 4);

    }, [fromReward, toReward, calculation.maxToAmount, settings.rewardValuation]);

    const handleFromSelect = (id: string) => { setFromRewardId(id); setToAmountString(''); };
    const handleToSelect = (id: string) => { setToRewardId(id); setToAmountString(''); };

    const handleAmountChange = (value: string) => {
        if (/^\d*$/.test(value)) { // integers only
            const num = parseInt(value, 10) || 0;
            const cappedValue = Math.min(num, calculation.maxToAmount);
            setToAmountString(value === '' ? '' : String(cappedValue));
        }
    };
    
    const handleExchange = () => {
        if (!currentUser || !fromReward || !toReward) return;
        const toAmount = parseInt(toAmountString, 10) || 0;
        if (toAmount <= 0) {
            addNotification({ type: 'error', message: 'Please enter a valid amount.' });
            return;
        }

        const totalCost = calculation.totalCost;

        const payItem: RewardItem = { rewardTypeId: fromRewardId, amount: totalCost };
        const receiveItem: RewardItem = { rewardTypeId: toRewardId, amount: toAmount };
        const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        executeExchange(currentUser.id, payItem, receiveItem, guildId);
        setToAmountString('');
    };
    
    // --- Stepper Logic ---
    const intervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const handleAmountStep = useCallback((step: number) => {
        setToAmountString(currentValStr => {
            const currentVal = parseInt(currentValStr, 10) || 0;
            const newVal = Math.max(0, Math.min(calculation.maxToAmount, currentVal + step));
            return String(newVal);
        });
    }, [calculation.maxToAmount]);
    
    const startStepping = useCallback((step: number) => {
        handleAmountStep(step); // Fire once immediately on mousedown
        // Then, after a delay, start the rapid stepping
        timeoutRef.current = window.setTimeout(() => {
            intervalRef.current = window.setInterval(() => {
                handleAmountStep(step);
            }, 80); // Speed of repetition
        }, 400); // Initial delay before repetition starts
    }, [handleAmountStep]);

    const stopStepping = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => stopStepping();
    }, [stopStepping]);


    return (
        <div>
            <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                &larr; Back to the {settings.terminology.shoppingCenter}
            </Button>
            <Card title="Currency & XP Exchange">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Selection */}
                    <div className="space-y-6">
                         <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3">You Pay</h3>
                             <div className="grid grid-cols-4 gap-2">
                                {payWithRewards.map(r => <RewardButton key={r.id} reward={r} balance={balances.get(r.id) || 0} isSelected={fromRewardId === r.id} isDisabled={toRewardId === r.id} onClick={() => handleFromSelect(r.id)} />)}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3">You Receive</h3>
                             <div className="grid grid-cols-4 gap-2">
                                {receiveRewards.map(r => <RewardButton key={r.id} reward={r} isSelected={toRewardId === r.id} isDisabled={fromRewardId === r.id} onClick={() => handleToSelect(r.id)} />)}
                            </div>
                        </div>
                    </div>
                    {/* Right Column: Calculator */}
                    <div className="bg-stone-900/40 p-6 rounded-lg flex flex-col justify-center">
                        {fromReward && toReward ? (
                             <div className="space-y-6 text-center">
                                <div className="flex justify-around items-center">
                                    <div className="text-6xl">{fromReward.icon}</div>
                                    <ArrowRightIcon className="w-10 h-10 text-stone-500"/>
                                    <div className="text-6xl">{toReward.icon}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-stone-400 mb-1">Receive Amount</label>
                                    <div className="flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-10 h-11 rounded-r-none"
                                            onMouseDown={() => startStepping(-1)}
                                            onMouseUp={stopStepping} onMouseLeave={stopStepping}
                                            aria-label="Decrease amount"
                                        >-</Button>
                                        <Input
                                            value={toAmountString}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange(e.target.value)}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            className="text-center text-lg h-11 w-28 rounded-none no-spinner"
                                            aria-label="Receive amount"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-10 h-11 rounded-l-none"
                                            onMouseDown={() => startStepping(1)}
                                            onMouseUp={stopStepping} onMouseLeave={stopStepping}
                                            aria-label="Increase amount"
                                        >+</Button>
                                    </div>
                                    <div className="flex justify-center gap-2 mt-2">
                                        {recommendedAmounts.map(amount => (
                                            <Button key={amount} onClick={() => handleAmountChange(String(amount))} variant="secondary" className="text-xs !py-1">
                                                {amount}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-stone-700/60 space-y-3">
                                    <h4 className="font-bold text-stone-200">Summary</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-w-sm mx-auto">
                                        <div className="text-right">
                                            <p className="text-stone-400">Your {fromReward.name}:</p>
                                            <p className="text-stone-400">Your {toReward.name}:</p>
                                            <p className="text-stone-400">Exchange Fee:</p>
                                            <p className="text-stone-400">Rounding Loss:</p>
                                            <p className="text-stone-400 font-bold border-t border-stone-600/50 mt-1 pt-1">Total Cost:</p>
                                        </div>
                                        <div className="text-left font-semibold">
                                            <p className="text-stone-200">{Math.floor(balances.get(fromRewardId) || 0)} &rarr; <span className="text-red-400">{Math.floor((balances.get(fromRewardId) || 0) - calculation.totalCost)}</span></p>
                                            <p className="text-stone-200">{Math.floor(balances.get(toRewardId) || 0)} &rarr; <span className="text-green-400">{Math.floor((balances.get(toRewardId) || 0) + (parseInt(toAmountString) || 0))}</span></p>
                                            <p className="text-stone-300">{calculation.fee.toFixed(2)} {fromReward.icon}</p>
                                            <p className="text-stone-300">{calculation.roundingFee.toFixed(2)} {fromReward.icon}</p>
                                            <p className="text-stone-100 font-bold border-t border-stone-600/50 mt-1 pt-1">{calculation.totalCost} {fromReward.icon}</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleExchange} disabled={calculation.totalCost <= 0 || calculation.totalCost > (balances.get(fromRewardId) || 0)}>
                                        Confirm Exchange
                                    </Button>
                                </div>
                             </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-stone-400">
                                <p>Select what to pay with and what to receive to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ExchangeView;