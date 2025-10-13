import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useDashboardData } from '../dashboard/hooks/useDashboardData';
import { depositToVaultAPI, withdrawFromVaultAPI, accrueInterestAPI } from '../../api';
import { RewardCategory, RewardTypeDefinition, ChronicleEventType, ChronicleEvent, GameAsset, RewardItem } from '../../types';
import Card from '../user-interface/Card';
import Button from '../user-interface/Button';
import NumberInput from '../user-interface/NumberInput';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIDispatch } from '../../context/UIContext';

type TransactionMode = 'deposit' | 'withdraw';
type RewardAmounts = { [rewardTypeId: string]: number };

// Helper to get all reward types a user interacts with (wallet or vault)
const getRelevantRewardTypes = (user: any, allRewardTypes: RewardTypeDefinition[]): RewardTypeDefinition[] => {
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

const EnchantedVaultPage: React.FC = () => {
    const { currentUser } = useAuthState();
    const { updateUser } = useAuthDispatch();
    // FIX: Destructure `chronicleEvents` from `useSystemState` instead of trying to access it from `currentUser` where it does not exist.
    const { settings, chronicleEvents } = useSystemState();
    const { rewardTypes } = useEconomyState();
    const { myGoal } = useDashboardData();
    const { addNotification } = useNotificationsDispatch();
    const { setActivePage, setActiveMarketId } = useUIDispatch();
    
    const [mode, setMode] = useState<TransactionMode>('deposit');
    const [amounts, setAmounts] = useState<RewardAmounts>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
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
    }, []); // Run only on component mount

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
        } else { // vault
            const vaultWallet = reward.category === RewardCategory.Currency ? currentUser.vault?.purse : currentUser.vault?.experience;
            return vaultWallet?.[rewardTypeId] || 0;
        }
    };
    
    const handleAmountChange = (rewardTypeId: string, value: number) => {
        setAmounts(prev => ({ ...prev, [rewardTypeId]: value }));
    };
    
    const handleMax = (rewardTypeId: string) => {
        const balance = getBalance(rewardTypeId, mode === 'deposit' ? 'wallet' : 'vault');
        const maxAmount = mode === 'withdraw' ? Math.floor(balance) : balance;
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
            const apiCall = mode === 'deposit' ? depositToVaultAPI : withdrawFromVaultAPI;
            const result = await apiCall(currentUser.id, transactionAmounts);
            if (result.updatedUser) {
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {Array.from({ length: 50 }).map((_, i) => (
                             <motion.div
                                key={i}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ 
                                    y: '100vh', 
                                    x: `${Math.random() * 100 - 50}vw`,
                                    rotate: Math.random() * 360,
                                    opacity: [0.7, 1, 0]
                                }}
                                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5 }}
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
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Balances */}
                            <div>
                                <h3 className="font-bold text-lg text-stone-200 mb-2">My Balances</h3>
                                <div className="space-y-4">
                                    {/* Wallet */}
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
                                    {/* Vault */}
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
                            {/* Transaction */}
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
                                            if (balance === 0) return null;
                                            return (
                                                <div key={rt.id} className="flex items-center gap-2">
                                                    <span className="text-2xl w-8 text-center">{rt.icon}</span>
                                                    <NumberInput value={amounts[rt.id] || 0} onChange={val => handleAmountChange(rt.id, val)} min={0} max={Math.floor(balance)} step={mode === 'withdraw' ? 1 : 0.01} className="flex-grow" />
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
                
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Savings Goal */}
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
                </div>
            </div>
        </div>
    );
};

export default EnchantedVaultPage;
