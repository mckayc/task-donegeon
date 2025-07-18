

import React, { useMemo } from 'react';
import { useAuthState, useGameDataState, useUIState } from '../../context/AppContext';

const RewardDisplay: React.FC = () => {
  const { currentUser } = useAuthState();
  const { rewardTypes } = useGameDataState();
  const { appMode } = useUIState();

  const balances = useMemo(() => {
    if (!currentUser) return [];

    let currentPurse: { [key: string]: number } = {};
    let currentExperience: { [key: string]: number } = {};

    if (appMode.mode === 'personal') {
        currentPurse = currentUser.personalPurse;
        currentExperience = currentUser.personalExperience;
    } else if (appMode.mode === 'guild') {
        const guildBalance = currentUser.guildBalances[appMode.guildId];
        if (guildBalance) {
            currentPurse = guildBalance.purse;
            currentExperience = guildBalance.experience;
        }
    }
    
    return rewardTypes.map(rt => {
        const amount = (rt.category === 'Currency' ? currentPurse[rt.id] : currentExperience[rt.id]) || 0;
        return { ...rt, amount };
    }).filter(b => b.amount > 0);

  }, [currentUser, rewardTypes, appMode]);
  
  if (balances.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
        {balances.map(balance => (
        <div key={balance.id} className="flex items-center gap-2 bg-stone-800/50 px-3 py-1.5 rounded-full border border-stone-700/60" title={`${balance.name}: ${balance.amount}`}>
            <span className="text-lg">{balance.icon}</span>
            <span className="font-semibold text-stone-200">{balance.amount}</span>
        </div>
        ))}
    </div>
  );
};

export default RewardDisplay;
