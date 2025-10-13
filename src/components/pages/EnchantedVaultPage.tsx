import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useDashboardData } from '../dashboard/hooks/useDashboardData';
import { accrueInterestAPI } from '../../api';
import { RewardCategory, RewardTypeDefinition, ChronicleEventType, ChronicleEvent, User } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import NumberInput from '../user-interface/NumberInput';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIDispatch } from '../../context/UIContext';
import Input from '../user-interface/Input';

type TransactionMode = 'deposit' | 'withdraw';
type RewardAmounts = { [rewardTypeId: string]: number };

// Helper to get all reward types a user interacts with (wallet or vault)
const getRelevantRewardTypes = (user: User, allRewardTypes: RewardTypeDefinition[]): RewardTypeDefinition[] => {
    const relevantIds = new Set<string>();
    const wallets = [user.personalPurse, user.personalExperience, user.vault?.purse, user.vault?.experience];
    wallets.forEach(wallet => {
        if (wallet) {
            Object.keys(wallet).forEach(id => relevantIds.add(id));
        }
    });
    return allRewardTypes.filter(rt => relevantIds.has(rt.id));
};

const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(2)).toLocaleString();
}

const calculateProjections = (vault: User['vault'], settings: any, days: number): { [key: string]: number } => {
    if (!vault) return {};
    
    let projectedPurse = { ...(vault.purse || {}) };
    let projectedXP = { ...(vault.experience || {}) };

    const tiers = settings.enchantedVault.tiers.sort((a: any, b: any) => a.upTo - b.upTo);

    for (let d = 0; d < days; d++) {
        const totalValue = Object.values(projectedPurse).reduce((s, a) => s + a, 0) + Object.values(projectedXP).reduce((s, a) => s + a, 0);
        const tier = tiers.find((t: any) => totalValue <= t.upTo) || tiers[tiers.length - 1];

        if (!tier) continue;

        const processWallet = (wallet: RewardAmounts) => {
            for (const rewardTypeId in wallet) {
                const annualRate = tier.rewardOverrides?.[rewardTypeId] ?? tier.baseInterestRate;
                const dailyRate = Math.pow(1 + annualRate / 100, 1 / 365) - 1;
                wallet[rewardTypeId] *= (1 + dailyRate);
            }
        };

        processWallet(projectedPurse);
        processWallet(projectedXP);
    }
    return { ...projectedPurse, ...projectedXP };
};


const EnchantedVaultPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { updateUser, depositToVault, withdrawFromVault } = useAuthDispatch();
    const { settings, chronicleEvents } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { myGoal } = useDashboardData();
    const { addNotification } = useNotificationsDispatch();
    const { setActivePage, setActiveMarketId } = useUIDispatch();
    
    const [mode, setMode] = useState<TransactionMode>('deposit');
    const [amounts, setAmounts] = useState<RewardAmounts>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const [projectionTime, setProjectionTime] = useState(1);
    const [projectionUnit, setProjectionUnit] = useState<'weeks' | 'months' | 'years'>('months');
    const [projections, setProjections] = useState<Record<string, number> | null>(null);
    
    useEffect(() => {
        if (!currentUser) return;
        const checkInterest = async () => {
            try {
                const result = await accrueInterestAPI(currentUser.id);
                if (result.updatedUser) {
                    updateUser(currentUser.id, result.updatedUser);
                    if (result.interestApplied > 0) {
                       addNotification({ type: 'success', message: `You earned interest while you were away!` });
                    }
                }
            } catch (error) {
                console.error("Failed to accrue interest:", error);
            }
        };
        checkInterest();
    }, []);

    if (!currentUser || !settings.enchantedVault.enabled) {
        return (
            <Card title="The Enchanted Vault">
                <p className="text-stone-400">The Enchanted Vault is not currently enabled by the Donegeon Master.</p>
            </Card>
        );
    }
    
    const relevantRewardTypes = getRelevantRewardTypes(currentUser, rewardTypes);

    const getBalance = (rewardTypeId: string, source: 'wallet' | 'vault') => {
        const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
        if (!reward) return 0;
        
        if (source === 'wallet') {
            const wallet = reward.category === RewardCategory.Currency ? currentUser.personalPurse : currentUser.personalExperience;
            return wallet[rewardTypeId] || 0;
        } else {
            const vaultWallet = reward.category === RewardCategory.Currency ? currentUser.vault?.purse : currentUser.vault?.experience;
            return vaultWallet?.[rewardTypeId] || 0;
        }
    };
    
    const handleAmountChange = (rewardTypeId: string, value: number) => {
        setAmounts(prev => ({ ...prev, [rewardTypeId]: value }));
    };
    
    const handleMax = (rewardTypeId: string) => {
        const balance = getBalance(rewardTypeId, mode === 'deposit' ? 'wallet' : 'vault');
        const maxAmount = Math.floor(balance);
        handleAmountChange(rewardTypeId, maxAmount);
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        const transactionAmounts: { purse: RewardAmounts, experience: RewardAmounts } = { purse: {}, experience: {} };
        let totalAmount = 0;
        
        Object.entries(amounts).forEach(([rewardTypeId, amount]) => {
            if (amount > 0) {
                const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
                if (reward) {
                    const target = reward.category === RewardCategory.Currency ? transactionAmounts.purse : transactionAmounts.experience;
                    target[rewardTypeId] = amount;
                    totalAmount += amount;
                }
            }
        });

        if (totalAmount === 0) {
            addNotification({ type: 'error', message: 'Please enter an amount.' });
            setIsProcessing(false);
            return;
        }

        try {
            const apiCall = mode === 'deposit' ? depositToVault : withdrawFromVault;
            const result = await apiCall(currentUser.id, transactionAmounts);
            if (result && result.updatedUser) {
                updateUser(currentUser.id, result.updatedUser);
                addNotification({ type: 'success', message: `Transaction successful!` });
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Transaction failed.' });
        } finally {
            setAmounts({});
            setIsProcessing(false);
        }
    };
    
    const handleViewInMarket = () => {
        if (myGoal.item?.marketIds?.[0]) {
            setActiveMarketId(myGoal.item.marketIds[0]);
        }
        setActivePage('Marketplace');
    };

    const handleCalculateProjections = () => {
        const days = projectionTime * { weeks: 7, months: 30, years: 365 }[projectionUnit];
        const result = calculateProjections(currentUser.vault, settings, days);
        setProjections(result);
    };
    
    const transactionHistory = chronicleEvents
        ?.filter(e => 
            e.userId === currentUser.id &&
            [ChronicleEventType.VaultDeposit, ChronicleEventType.VaultWithdrawal, ChronicleEventType.VaultInterest].includes(e.type)
        )
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {showConfetti && (
                    // FIX: Removed 'initial', 'animate', and 'exit' props from motion.div to fix type errors.
                    <motion.div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                             // FIX: Removed 'initial', 'animate', and 'transition' props from motion.div to fix type errors.
                             <motion.div
                                key={i}
                                className="absolute top-0 text-2xl"
                                style={{ left: `${Math.random() * 100}%`}}
                            >
                                {['💰', '💎', '⭐', '✨'][i % 4]}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <Card title="The Enchanted Vault" titleIcon={<span className="text-2xl">🏦</span>}>
                <p className="text-stone-300">Welcome, brave adventurer, to a place of safekeeping and growth. Store your hard-earned rewards here, and watch as they magically multiply over time. The longer they remain, the greater they shall become!</p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-lg text-stone-200 mb-2">My Balances</h3>
                                <div className="space-y-4">
                                    <div className="p-3 bg-stone-900/50 rounded-lg">
                                        <h4 className="font-semibold text-stone-300">Wallet</h4>
                                        <div className="space-y-1 mt-2">
                                            {relevantRewardTypes.map(rt => {
                                                const balance = getBalance(rt.id, 'wallet');
                                                if (balance === 0) return null;
                                                return <div key={rt.id} className="flex justify-between items-center text-sm"><span className="flex items-center gap-2">{rt.icon} {rt.name}</span> <span className="font-mono font-semibold text-stone-200">{formatNumber(balance)}</span></div>
                                            })}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-sky-900/30 rounded-lg">
                                        <h4 className="font-semibold text-sky-300">Vault</h4>
                                        <div className="space-y-1 mt-2">
                                            {relevantRewardTypes.map(rt => {
                                                const balance = getBalance(rt.id, 'vault');
                                                if (balance === 0) return null;
                                                return <div key={rt.id} className="flex justify-between items-center text-sm"><span className="flex items-center gap-2">{rt.icon} {rt.name}</span> <span className="font-mono font-semibold text-sky-200">{formatNumber(balance)}</span></div>
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-stone-200 mb-2">New Transaction</h3>
                                <div className="p-3 bg-stone-900/50 rounded-lg">
                                    <div className="flex space-x-1 p-1 bg-stone-700/50 rounded-lg mb-4">
                                        <button onClick={() => setMode('deposit')} className={`flex-1 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'deposit' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>Deposit</button>
                                        <button onClick={() => setMode('withdraw')} className={`flex-1 py-1 rounded-md font-semibold text-sm transition-colors ${mode === 'withdraw' ? 'bg-sky-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>Withdraw</button>
                                    </div>
                                    <div className="space-y-3">
                                        {relevantRewardTypes.map(rt => {
                                            const balance = getBalance(rt.id, mode === 'deposit' ? 'wallet' : 'vault');
                                            if (balance < 1 && mode === 'withdraw') return null;
                                            if (balance < 0.01 && mode === 'deposit') return null;
                                            return (
                                                <div key={rt.id} className="flex items-center gap-2">
                                                    <span className="text-2xl w-8 text-center">{rt.icon}</span>
                                                    <NumberInput value={amounts[rt.id] || 0} onChange={val => handleAmountChange(rt.id, val)} min={0} max={Math.floor(balance)} step={1} className="flex-grow" />
                                                    <Button variant="secondary" size="sm" onClick={() => handleMax(rt.id)}>Max</Button>
                                                </div>
                                            );
                                        })}
                                        <Button onClick={handleSubmit} disabled={isProcessing} className="w-full capitalize !mt-4">{isProcessing ? 'Processing...' : mode}</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Transaction History">
                         <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {transactionHistory && transactionHistory.length > 0 ? (
                                transactionHistory.map(event => (
                                    <div key={event.id} className="grid grid-cols-3 gap-2 items-center text-sm p-2 bg-stone-900/40 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{event.icon}</span>
                                            <span className="font-semibold text-stone-300">{event.title}</span>
                                        </div>
                                        <div className="text-center font-mono font-semibold" style={{ color: event.color }}>{event.rewardsText}</div>
                                        <div className="text-right text-xs text-stone-400">{new Date(event.date).toLocaleString()}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-stone-400 text-center">No transactions yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    {myGoal.hasGoal && myGoal.item && (
                         <Card title="My Savings Goal">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 mb-3 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    <DynamicIcon iconType={myGoal.item.iconType} icon={myGoal.item.icon} imageUrl={myGoal.item.imageUrl} className="w-full h-full object-contain text-5xl" />
                                </div>
                                <h4 className="font-bold text-lg text-amber-300">{myGoal.item.name}</h4>
                                <div className="w-full space-y-3 mt-4 text-left">
                                    {myGoal.progress.map((p: any) => {
                                        const percentage = Math.min(100, (p.current / p.amount) * 100);
                                        return (
                                            <div key={p.rewardTypeId}>
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="font-semibold text-stone-300 flex items-center gap-1">{p.icon} {p.name}</span>
                                                    <span className="font-mono">{formatNumber(p.current)} / {formatNumber(p.amount)}</span>
                                                </div>
                                                <div className="w-full bg-stone-700 rounded-full h-2.5">
                                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button onClick={handleViewInMarket} size="sm" className="mt-4">View in Market</Button>
                            </div>
                        </Card>
                    )}
                     <Card title="Projected Earnings">
                        <div className="space-y-4">
                            <div className="flex items-end gap-2">
                                <NumberInput label="Time" value={projectionTime} onChange={setProjectionTime} min={1} />
                                <Input as="select" label="" value={projectionUnit} onChange={(e) => setProjectionUnit(e.target.value as any)}>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </Input>
                            </div>
                            <Button onClick={handleCalculateProjections} className="w-full">Calculate</Button>
                            {projections && (
                                <div className="pt-4 border-t border-stone-700/60 space-y-2">
                                    <h4 className="font-semibold text-stone-200">After {projectionTime} {projectionUnit}:</h4>
                                    {Object.entries(projections).map(([rewardTypeId, amount]) => {
                                        const reward = rewardTypes.find(rt => rt.id === rewardTypeId);
                                        const initialAmount = getBalance(rewardTypeId, 'vault');
                                        if (!reward || amount <= initialAmount) return null;
                                        return (
                                             <div key={rewardTypeId} className="flex justify-between items-center text-sm">
                                                <span className="flex items-center gap-2">{reward.icon} {reward.name}</span> 
                                                <div className="font-mono font-semibold text-right">
                                                    <span className="text-green-400">{formatNumber(amount)}</span>
                                                    <span className="text-xs text-stone-400 ml-1">(+{formatNumber(amount - initialAmount)})</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EnchantedVaultPage;