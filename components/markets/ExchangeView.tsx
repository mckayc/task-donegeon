import React, { useState, useMemo } from 'react';
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

    const { currencies, experience, receiveCurrencies } = useMemo(() => {
        return {
            currencies: exchangeableRewardTypes.filter(rt => rt.category === RewardCategory.Currency),
            experience: exchangeableRewardTypes.filter(rt => rt.category === RewardCategory.XP),
            receiveCurrencies: exchangeableRewardTypes.filter(rt => rt.category === RewardCategory.Currency),
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
        const toAmountNum = parseInt(toAmountString) || 0;
        if (!fromReward || !toReward || fromReward.baseValue <= 0 || toReward.baseValue <= 0) {
            return { fromAmountBase: 0, fee: 0, totalCost: 0, maxToAmount: 0 };
        }

        const { currencyExchangeFeePercent, xpExchangeFeePercent } = settings.rewardValuation;
        
        // Calculate max amount purchasable
        const fromBalance = balances.get(fromReward.id) || 0;
        const feePercent = fromReward.category === 'Currency' ? currencyExchangeFeePercent : xpExchangeFeePercent;
        const feeMultiplier = 1 + (Number(feePercent) / 100);
        
        const fromBalanceAfterFee = fromBalance / feeMultiplier;
        const fromValueInReal = fromBalanceAfterFee / fromReward.baseValue;
        const maxToAmount = fromValueInReal * toReward.baseValue;

        // Calculate cost based on current input
        const cappedToAmount = Math.min(toAmountNum, maxToAmount);
        const toValueInReal = cappedToAmount / toReward.baseValue;
        const fromAmountBase = toValueInReal * fromReward.baseValue;
        const fee = fromAmountBase * (Number(feePercent) / 100);
        const totalCost = fromAmountBase + fee;

        return { fromAmountBase, fee, totalCost, maxToAmount };

    }, [toAmountString, fromReward, toReward, settings.rewardValuation, balances]);

    const handleFromSelect = (id: string) => { setFromRewardId(id); setToAmountString(''); };
    const handleToSelect = (id: string) => { setToRewardId(id); setToAmountString(''); };

    const handleAmountChange = (value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        const cappedValue = Math.min(num, Math.floor(calculation.maxToAmount));
        setToAmountString(cappedValue > 0 ? cappedValue.toString() : '');
    };
    
    const handleAmountStep = (step: number) => {
        const currentAmount = parseInt(toAmountString) || 0;
        handleAmountChange(String(currentAmount + step));
    };

    const handleMax = () => {
        handleAmountChange(String(Math.floor(calculation.maxToAmount)));
    };

    const handleExchange = () => {
        if (!currentUser || !fromReward || !toReward) return;
        const toAmount = parseInt(toAmountString) || 0;
        if (toAmount <= 0) {
            addNotification({ type: 'error', message: 'Please enter a valid amount.' });
            return;
        }

        const totalCost = Math.ceil(calculation.totalCost);

        const payItem: RewardItem = { rewardTypeId: fromRewardId, amount: totalCost };
        const receiveItem: RewardItem = { rewardTypeId: toRewardId, amount: toAmount };
        const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        executeExchange(currentUser.id, payItem, receiveItem, guildId);
        addNotification({type: 'success', message: `Exchanged successfully!`});
        setToAmountString('');
    };

    const ExchangeRateChart: React.FC = () => {
        const { realWorldCurrency } = settings.rewardValuation;
        
        return (
            <div className="mt-8 pt-6 border-t border-stone-700/60">
                <h3 className="font-bold text-lg text-stone-200 mb-3 text-center">Base Values</h3>
                <p className="text-sm text-stone-400 text-center mb-4">Values do not include transaction fees.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-lg mx-auto">
                    {exchangeableRewardTypes.map(reward => (
                        <div key={reward.id} className="flex items-center justify-center text-lg">
                            <span className="font-bold text-accent-light">{reward.baseValue} {reward.icon}</span>
                            <span className="mx-2 text-stone-400">=</span>
                            <span className="font-semibold text-stone-200">1 {realWorldCurrency}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                                {currencies.map(c => <RewardButton key={c.id} reward={c} balance={balances.get(c.id) || 0} isSelected={fromRewardId === c.id} isDisabled={toRewardId === c.id} onClick={() => handleFromSelect(c.id)} />)}
                                {experience.map(xp => <RewardButton key={xp.id} reward={xp} balance={balances.get(xp.id) || 0} isSelected={fromRewardId === xp.id} isDisabled={toRewardId === xp.id} onClick={() => handleFromSelect(xp.id)} />)}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3">You Receive</h3>
                             <div className="grid grid-cols-4 gap-2">
                                {receiveCurrencies.map(c => <RewardButton key={c.id} reward={c} isSelected={toRewardId === c.id} isDisabled={fromRewardId === c.id} onClick={() => handleToSelect(c.id)} />)}
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
                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div>
                                        <p className="text-sm font-semibold text-stone-400">Cost</p>
                                        <p className="font-bold text-2xl text-amber-400">{Math.ceil(calculation.totalCost)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-400 mb-1">Amount</label>
                                        <div className="flex items-center">
                                            <Button onClick={() => handleAmountStep(-1)} size="sm" variant="secondary" className="!px-3 !py-2 rounded-r-none">-</Button>
                                            <Input value={toAmountString} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange(e.target.value)} type="text" className="text-center text-lg h-11 rounded-none" />
                                            <Button onClick={() => handleAmountStep(1)} size="sm" variant="secondary" className="!px-3 !py-2 rounded-l-none">+</Button>
                                        </div>
                                        <Button onClick={handleMax} variant="secondary" className="text-xs !py-1 mt-2">Max: {Math.floor(calculation.maxToAmount)}</Button>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-stone-700/60 space-y-3">
                                    <h4 className="font-bold text-stone-200">Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="text-right">
                                            <p className="text-stone-400">Your {fromReward.name}:</p>
                                            <p className="text-stone-400">Your {toReward.name}:</p>
                                        </div>
                                        <div className="text-left font-semibold">
                                            <p className="text-stone-200">{Math.floor(balances.get(fromRewardId) || 0)} &rarr; <span className="text-red-400">{Math.floor((balances.get(fromRewardId) || 0) - calculation.totalCost)}</span></p>
                                            <p className="text-stone-200">{Math.floor(balances.get(toRewardId) || 0)} &rarr; <span className="text-green-400">{Math.floor((balances.get(toRewardId) || 0) + (parseInt(toAmountString) || 0))}</span></p>
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

                <ExchangeRateChart />
            </Card>
        </div>
    );
};

export default ExchangeView;