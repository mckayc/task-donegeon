import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { RewardTypeDefinition, RewardCategory, Market, RewardItem } from '../../frontendTypes';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { ArrowRightIcon } from '../ui/Icons';

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
    const { currentUser, rewardTypes, settings, appMode } = useAppState();
    const { executeExchange, addNotification, setActiveMarketId } = useAppDispatch();

    const [fromRewardId, setFromRewardId] = useState<string>('');
    const [toRewardId, setToRewardId] = useState<string>('');
    const [toAmountString, setToAmountString] = useState<string>('');

    const exchangeableRewardIds = useMemo(() => {
        const { anchorRewardId, exchangeRates } = settings.rewardValuation;
        return new Set([anchorRewardId, ...Object.keys(exchangeRates)]);
    }, [settings.rewardValuation]);

    const { currencies, experience, receiveCurrencies } = useMemo(() => {
        const receiveIds = new Set(['core-gems', 'core-gold', 'core-crystal']);
        return {
            currencies: rewardTypes.filter(rt => rt.category === RewardCategory.Currency && exchangeableRewardIds.has(rt.id)),
            experience: rewardTypes.filter(rt => rt.category === RewardCategory.XP && exchangeableRewardIds.has(rt.id)),
            receiveCurrencies: rewardTypes.filter(rt => receiveIds.has(rt.id)),
        }
    }, [rewardTypes, exchangeableRewardIds]);
    
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
        if (!fromReward || !toReward) {
            return { fromAmountBase: 0, fee: 0, totalCost: 0, maxToAmount: 0 };
        }

        const { anchorRewardId, exchangeRates, currencyExchangeFeePercent, xpExchangeFeePercent } = settings.rewardValuation;
        
        const fromAnchorRate = fromReward.id === anchorRewardId ? 1 : (exchangeRates[fromReward.id] || 0);
        const toAnchorRate = toReward.id === anchorRewardId ? 1 : (exchangeRates[toReward.id] || 0);

        if (fromAnchorRate === 0 || toAnchorRate === 0) return { fromAmountBase: 0, fee: 0, totalCost: 0, maxToAmount: 0 };
        
        // Calculate max amount purchasable
        const fromBalance = balances.get(fromReward.id) || 0;
        const feePercent = fromReward.category === 'Currency' ? currencyExchangeFeePercent : xpExchangeFeePercent;
        const feeMultiplier = 1 + (feePercent / 100);
        const maxFromBase = fromBalance / feeMultiplier;
        const maxFromInAnchor = maxFromBase / fromAnchorRate;
        const maxToAmount = maxFromInAnchor * toAnchorRate;

        // Calculate cost based on current input
        const cappedToAmount = Math.min(toAmountNum, maxToAmount);
        const toValueInAnchor = cappedToAmount / toAnchorRate;
        const fromAmountBase = toValueInAnchor * fromAnchorRate;
        const fee = fromAmountBase * (feePercent / 100);
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
        const { rewardValuation } = settings;
        const { anchorRewardId, exchangeRates, currencyExchangeFeePercent, xpExchangeFeePercent } = rewardValuation;
        const anchorReward = rewardTypes.find(rt => rt.id === anchorRewardId);

        if (!anchorReward) return null;
        
        const rates = Object.entries(exchangeRates)
            .map(([rewardId, rate]) => {
                const reward = rewardTypes.find(rt => rt.id === rewardId);
                if (!reward || rate === 0) return null;
                
                // This logic needs to match what is paid.
                // If I pay 1 anchor, what do I get?
                // The fee is on what I pay.
                // If I want to BUY strength with gold (anchor), I pay gold. Fee is on gold.
                // The rate should show: how many X do I get for 1 anchor.
                // If rate is 10, 1 anchor gets 10 strength.
                // But if I want to BUY gold (anchor) with strength, I pay strength.
                // 10 strength has a base value of 1 gold. I pay a 10% fee on strength, so I pay 11 strength to get 1 gold.
                // The rate shown should reflect what the user receives.
                // If buying X with anchor: rate is how many X you get for 1 anchor.
                // If buying anchor with X: rate is how many X it costs for 1 anchor.
                
                const feePercent = reward.category === RewardCategory.Currency ? currencyExchangeFeePercent : xpExchangeFeePercent;
                const costMultiplier = 1 + (feePercent / 100);
                
                // How many of this reward equals 1 anchor?
                const amountForOneAnchor = Math.floor(rate * (1 - (currencyExchangeFeePercent / 100)));
                
                // How much of this reward does it cost to buy 1 anchor?
                const costForOneAnchor = Math.ceil(rate * costMultiplier);


                return {
                    reward,
                    amountForOneAnchor,
                    costForOneAnchor,
                };
            })
            .filter((item): item is { reward: RewardTypeDefinition, amountForOneAnchor: number, costForOneAnchor: number } => !!item);

        return (
            <div className="mt-8 pt-6 border-t border-stone-700/60">
                <h3 className="font-bold text-lg text-stone-200 mb-3 text-center">Exchange Rates</h3>
                <p className="text-sm text-stone-400 text-center mb-4">Rates include transaction fees and are rounded.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-lg mx-auto">
                    {rates.map(({ reward, amountForOneAnchor, costForOneAnchor }) => (
                        <React.Fragment key={reward.id}>
                             <div className="flex items-center justify-center text-lg">
                                <span className="font-semibold text-stone-200">1 {anchorReward.icon}</span>
                                <span className="mx-2 text-stone-400">=</span>
                                <span className="font-bold text-accent-light">{amountForOneAnchor} {reward.icon}</span>
                            </div>
                             <div className="flex items-center justify-center text-lg">
                                <span className="font-bold text-accent-light">{costForOneAnchor} {reward.icon}</span>
                                <span className="mx-2 text-stone-400">=</span>
                                <span className="font-semibold text-stone-200">1 {anchorReward.icon}</span>
                            </div>
                        </React.Fragment>
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
                                            <Input value={toAmountString} onChange={e => handleAmountChange(e.target.value)} type="text" className="text-center text-lg h-11 rounded-none" />
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