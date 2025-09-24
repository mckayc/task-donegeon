
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useAuthState } from '../../context/AuthContext';
import { RewardTypeDefinition, Market, RewardItem, RewardCategory } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import Input from '../user-interface/Input';
import { ArrowRightIcon, InfoIcon } from '../user-interface/Icons';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import NumberInput from '../user-interface/NumberInput';
import ToggleSwitch from '../user-interface/ToggleSwitch';

interface ExchangeViewProps {
    market: Market;
}

const RewardButton: React.FC<{
    reward: RewardTypeDefinition;
    balance?: number;
    isSelected: boolean;
    isDisabled: boolean;
    highlightColor?: string;
    onClick: () => void;
}> = ({ reward, balance, isSelected, isDisabled, highlightColor, onClick }) => {
    const borderStyle = isSelected
        ? 'border-emerald-500 ring-2 ring-emerald-500/50'
        : 'border-transparent';

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`p-2 rounded-lg text-center transition-all duration-200 relative border-2 ${borderStyle} ${
                isDisabled 
                ? 'bg-stone-800 opacity-40 cursor-not-allowed'
                : 'bg-stone-900/50 hover:border-emerald-600'
            }`}
            style={{
                borderColor: isSelected ? 'hsl(var(--primary))' : highlightColor,
                boxShadow: isSelected ? '0 0 8px hsl(var(--primary))' : 'none',
            }}
            title={balance !== undefined ? `${reward.name}: ${Math.floor(balance)}` : reward.name}
        >
            <div className="text-3xl">{reward.icon}</div>
            {balance !== undefined && (
                 <p className="text-xs text-stone-300 font-semibold">{Math.floor(balance)}</p>
            )}
        </button>
    );
};


const ExchangeView: React.FC<ExchangeViewProps> = ({ market }) => {
    const { settings } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { appMode } = useUIState();
    const { currentUser } = useAuthState();
    const { executeExchange } = useEconomyDispatch();
    const { setActiveMarketId } = useUIDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [fromRewardId, setFromRewardId] = useState<string>('');
    const [pooledPayIds, setPooledPayIds] = useState<Set<string>>(new Set());
    const [toRewardId, setToRewardId] = useState<string>('');
    const [toAmount, setToAmount] = useState<number>(0);
    const [isCombineModeEnabled, setIsCombineModeEnabled] = useState<boolean>(false);

    useEffect(() => {
        if (!isCombineModeEnabled) {
            setPooledPayIds(new Set());
        }
    }, [isCombineModeEnabled]);

    const exchangeableRewardTypes = useMemo(() => {
        return rewardTypes.filter(rt => rt.baseValue > 0 && rt.isExchangeable !== false);
    }, [rewardTypes]);

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

    const valueGroups = useMemo(() => {
        const groups: Map<number, RewardTypeDefinition[]> = new Map();
        exchangeableRewardTypes.forEach(rt => {
            if (rt.baseValue > 0) {
                if (!groups.has(rt.baseValue)) {
                    groups.set(rt.baseValue, []);
                }
                groups.get(rt.baseValue)!.push(rt);
            }
        });
        return groups;
    }, [exchangeableRewardTypes]);

    const groupColors = useMemo(() => {
        const colors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899']; // blue, red, green, yellow, purple, pink
        const colorMap = new Map<number, string>();
        let colorIndex = 0;
        for (const value of valueGroups.keys()) {
            if ((valueGroups.get(value)?.length || 0) > 1) {
                colorMap.set(value, colors[colorIndex % colors.length]);
                colorIndex++;
            }
        }
        return colorMap;
    }, [valueGroups]);
    
    const fromReward = useMemo(() => rewardTypes.find(rt => rt.id === fromRewardId), [fromRewardId, rewardTypes]);
    const toReward = useMemo(() => rewardTypes.find(rt => rt.id === toRewardId), [toRewardId, rewardTypes]);

    const handleFromSelect = (id: string) => {
        const newReward = exchangeableRewardTypes.find(rt => rt.id === id);
        if (!newReward) return;

        if (!isCombineModeEnabled) {
            setFromRewardId(fromRewardId === id ? '' : id);
            setPooledPayIds(new Set());
            setToAmount(0);
            return;
        }

        const currentPrimaryReward = fromRewardId ? exchangeableRewardTypes.find(rt => rt.id === fromRewardId) : null;

        if (!currentPrimaryReward || newReward.baseValue !== currentPrimaryReward.baseValue) {
            setFromRewardId(id);
            setPooledPayIds(new Set());
        } else {
            if (id === fromRewardId) {
                setFromRewardId('');
                setPooledPayIds(new Set());
            } else {
                setPooledPayIds(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                    return newSet;
                });
            }
        }
        setToAmount(0);
    };

    const handleToSelect = (id: string) => { setToRewardId(id); setToAmount(0); };

    const { currentFromBalance, pooledItems } = useMemo(() => {
        if (!fromRewardId) return { currentFromBalance: 0, pooledItems: [] };

        const fromBalance = balances.get(fromRewardId) || 0;
        const pooledBalances = Array.from(pooledPayIds).reduce((sum, id) => sum + (balances.get(id) || 0), 0);

        const primaryItem = rewardTypes.find(rt => rt.id === fromRewardId);
        const pooled = Array.from(pooledPayIds).map(id => rewardTypes.find(rt => rt.id === id)).filter(Boolean) as RewardTypeDefinition[];

        const allItems = primaryItem ? [primaryItem, ...pooled] : pooled;
        const itemsWithBalances = allItems.map(item => ({
            name: item.name,
            icon: item.icon,
            amount: balances.get(item.id) || 0,
        }));

        return {
            currentFromBalance: fromBalance + pooledBalances,
            pooledItems: itemsWithBalances
        };
    }, [fromRewardId, pooledPayIds, balances, rewardTypes]);
    
    const exchangeRate = useMemo(() => {
        if (!fromReward || !toReward || !fromReward.baseValue || !toReward.baseValue) {
            return null;
        }
        const rate = fromReward.baseValue / toReward.baseValue;
        return {
            forward: rate, // 1 from = X to
            inverse: 1 / rate, // 1 to = Y from
        };
    }, [fromReward, toReward]);

    const calculation = useMemo(() => {
        const toAmountNum = toAmount || 0;
        const defaultCalc = { fromAmountBase: 0, fee: 0, roundingFee: 0, totalCost: 0, maxToAmount: 0 };
        if (!fromReward || !toReward || fromReward.baseValue <= 0 || toReward.baseValue <= 0) {
            return defaultCalc;
        }

        const { currencyExchangeFeePercent, xpExchangeFeePercent } = settings.rewardValuation;
        const feePercent = fromReward.category === RewardCategory.Currency ? currencyExchangeFeePercent : xpExchangeFeePercent;
        const feeMultiplier = 1 + (Number(feePercent) / 100);

        const fromValueAfterFee = (currentFromBalance / feeMultiplier) * fromReward.baseValue;
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

    }, [toAmount, fromReward, toReward, settings.rewardValuation, currentFromBalance]);
    
    const recommendedAmounts = useMemo(() => {
        if (!fromReward || !toReward || calculation.maxToAmount <= 0) return [];

        const suggestions: { amount: number; loss: number }[] = [];
        const limit = Math.min(calculation.maxToAmount, 250);

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
    
    const handleExchange = () => {
        if (!currentUser || !fromReward || !toReward) return;
        if (toAmount <= 0) {
            addNotification({ type: 'error', message: 'Please enter a valid amount.' });
            return;
        }

        const payItemPayload = {
            rewardTypeId: fromRewardId,
            amount: calculation.totalCost,
            pooledRewardTypeIds: Array.from(pooledPayIds)
        };
        const receiveItem: RewardItem = { rewardTypeId: toRewardId, amount: toAmount };
        const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

        executeExchange(currentUser.id, payItemPayload, receiveItem, guildId);
        setToAmount(0);
        setFromRewardId('');
        setPooledPayIds(new Set());
    };

    const selectedPaySet = new Set([fromRewardId, ...pooledPayIds]);

    return (
        <div>
            <Button variant="secondary" onClick={() => setActiveMarketId(null)} className="mb-6">
                &larr; Back to the {settings.terminology.shoppingCenter}
            </Button>
            <Card title="Currency & XP Exchange">
                <div className="flex justify-end mb-4 -mt-2">
                     <ToggleSwitch enabled={isCombineModeEnabled} setEnabled={setIsCombineModeEnabled} label="Combine Same-Value Items" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3 flex items-center gap-2">
                                You Pay
                                {isCombineModeEnabled && selectedPaySet.size > 1 && (
                                    <div className="relative group">
                                        <InfoIcon className="w-4 h-4 text-sky-400 cursor-help" />
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 text-xs bg-stone-900 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-stone-700">
                                            <p className="font-bold mb-1">Pooled Items:</p>
                                            <ul className="space-y-1">
                                                {pooledItems.map(item => (
                                                    <li key={item.name} className="flex justify-between">
                                                        <span>{item.icon} {item.name}</span>
                                                        <span>{Math.floor(item.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="font-bold mt-1 pt-1 border-t border-stone-700 flex justify-between">
                                                <span>Total Available:</span>
                                                <span>{Math.floor(currentFromBalance)}</span>
                                            </p>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900 transform rotate-45 border-r border-b border-stone-700"></div>
                                        </div>
                                    </div>
                                )}
                            </h3>
                             <div className="grid grid-cols-4 gap-2">
                                {exchangeableRewardTypes.map(r => {
                                    const highlightColor = isCombineModeEnabled ? groupColors.get(r.baseValue) : undefined;
                                    return (
                                        <RewardButton key={r.id} reward={r} balance={balances.get(r.id) || 0} isSelected={selectedPaySet.has(r.id)} isDisabled={toRewardId === r.id} highlightColor={highlightColor} onClick={() => handleFromSelect(r.id)} />
                                    )
                                })}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-bold text-lg text-stone-200 mb-3">You Receive</h3>
                             <div className="grid grid-cols-4 gap-2">
                                {exchangeableRewardTypes.map(r => <RewardButton key={r.id} reward={r} isSelected={toRewardId === r.id} isDisabled={selectedPaySet.has(r.id)} onClick={() => handleToSelect(r.id)} />)}
                            </div>
                        </div>
                    </div>
                    <div className="bg-stone-900/40 p-6 rounded-lg flex flex-col justify-center">
                        {fromReward && toReward ? (
                             <div className="space-y-6 text-center">
                                <div className="flex justify-around items-center">
                                    <div className="text-6xl">{fromReward.icon}</div>
                                    <ArrowRightIcon className="w-10 h-10 text-stone-500"/>
                                    <div className="text-6xl">{toReward.icon}</div>
                                </div>

                                {exchangeRate && (
                                    <div className="text-center text-stone-400 text-sm -mt-4 bg-stone-800/50 p-2 rounded-md">
                                        <p className="font-semibold text-emerald-300">
                                            1 {fromReward.name} {fromReward.icon} = {exchangeRate.forward.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toReward.name} {toReward.icon}
                                        </p>
                                        <p className="text-xs mt-1">
                                            (1 {toReward.name} {toReward.icon} = {exchangeRate.inverse.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromReward.name} {fromReward.icon})
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <NumberInput 
                                        label="Receive Amount"
                                        value={toAmount}
                                        onChange={setToAmount}
                                        min={0}
                                        max={calculation.maxToAmount}
                                        step={1}
                                        className="max-w-xs mx-auto"
                                    />
                                    <div className="flex justify-center gap-2 mt-2">
                                        {recommendedAmounts.map(amount => (
                                            <Button key={amount} onClick={() => setToAmount(amount)} variant="secondary" className="text-xs !py-1">
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
                                            <p className="text-stone-200">{Math.floor(currentFromBalance)} &rarr; <span className="text-red-400">{Math.floor(currentFromBalance - calculation.totalCost)}</span></p>
                                            <p className="text-stone-200">{Math.floor(balances.get(toRewardId) || 0)} &rarr; <span className="text-green-400">{Math.floor((balances.get(toRewardId) || 0) + toAmount)}</span></p>
                                            <p className="text-stone-300">{calculation.fee.toFixed(2)} {fromReward.icon}</p>
                                            <p className="text-stone-300">{calculation.roundingFee.toFixed(2)} {fromReward.icon}</p>
                                            <p className="text-stone-100 font-bold border-t border-stone-600/50 mt-1 pt-1">{calculation.totalCost} {fromReward.icon}</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleExchange} disabled={calculation.totalCost <= 0 || calculation.totalCost > currentFromBalance}>
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
