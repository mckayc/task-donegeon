import React, { useMemo } from 'react';
import { useData } from '../../context/DataProvider';
import { useAuthState } from '../../context/AuthContext';
import { useRewardValue } from '../../hooks/useRewardValue';
import DynamicIcon from './DynamicIcon';
import { useUIState } from '../../context/UIContext';

const RewardDisplay: React.FC = () => {
  const { rewardTypes } = useData();
  const { appMode } = useUIState();
  const { currentUser } = useAuthState();

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
  
  const BalanceItem: React.FC<{balance: typeof balances[0]}> = ({ balance }) => {
    const realValue = useRewardValue(balance.amount, balance.id);
    const title = `${balance.name}: ${balance.amount}${realValue ? ` (~${realValue})` : ''}`;

    return (
      <div title={title} className="flex items-center gap-2 bg-stone-800/50 px-3 py-1.5 rounded-full border border-stone-700/60">
        <DynamicIcon 
          iconType={balance.iconType} 
          icon={balance.icon} 
          imageUrl={balance.imageUrl} 
          className="w-5 h-5 text-lg" 
          altText={balance.name}
        />
        <span className="font-semibold text-stone-200">{balance.amount}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
        {balances.map(balance => (
          <BalanceItem key={balance.id} balance={balance} />
        ))}
    </div>
  );
};

export default RewardDisplay;
