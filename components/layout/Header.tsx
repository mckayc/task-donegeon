import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Page, Role, AppMode, Guild } from '../../types';
import Avatar from '../ui/Avatar';

const Header: React.FC = () => {
  const { currentUser, rewardTypes, appMode, guilds, settings } = useAppState();
  const { setCurrentUser, setIsSwitchingUser, setAppMode, setActivePage } = useAppDispatch();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  const handleLogout = () => {
    setCurrentUser(null);
    setProfileDropdownOpen(false);
  };
  
  const handleSwitchUser = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentUser(null);
    setIsSwitchingUser(true);
    setProfileDropdownOpen(false);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setProfileDropdownOpen(false);
  }

  const balances = useMemo(() => {
    if (!currentUser) return [];

    const coreRewardTypes = rewardTypes.filter(rt => rt.isCore);
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
    
    const userBalances = [ ...Object.entries(currentPurse), ...Object.entries(currentExperience) ];

    return coreRewardTypes.map(rt => {
        const balance = userBalances.find(([id, _]) => id === rt.id);
        return { ...rt, amount: balance ? balance[1] : 0 }
    }).filter(b => b.amount > 0);

  }, [currentUser, rewardTypes, appMode]);
  
  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    setModeDropdownOpen(false);
  };

  const userGuilds = useMemo(() => {
    if (!currentUser) return [];
    return guilds.filter(g => g.memberIds.includes(currentUser.id));
  }, [currentUser, guilds]);

  const currentModeName = useMemo(() => {
    if (appMode.mode === 'guild') {
      return guilds.find(g => g.id === appMode.guildId)?.name || 'Guild View';
    }
    return 'Personal';
  }, [appMode, guilds]);

  if (!currentUser) return null;

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50">
      <div className="flex items-center gap-2 md:gap-4">
         <div className="relative">
            <button onClick={() => setModeDropdownOpen(!modeDropdownOpen)} className="flex items-center gap-2 bg-stone-800/50 px-3 py-1.5 rounded-full border border-stone-700/60 hover:bg-stone-700 transition-colors">
                 <span className="font-semibold text-accent-light">{currentModeName}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
             {modeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                <a href="#" onClick={() => handleModeChange({ mode: 'personal' })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Personal</a>
                <div className="border-t border-stone-700 my-1"></div>
                <div className="px-4 pt-2 pb-1 text-xs text-stone-500 font-semibold uppercase">{settings.terminology.groups}</div>
                {userGuilds.map(guild => (
                     <a href="#" key={guild.id} onClick={() => handleModeChange({ mode: 'guild', guildId: guild.id })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">{guild.name}</a>
                ))}
              </div>
            )}
         </div>
         <div className="hidden md:flex items-center gap-3">
             {balances.map(balance => (
                <div key={balance.id} className="flex items-center gap-2 bg-stone-800/50 px-3 py-1.5 rounded-full border border-stone-700/60" title={`${balance.name}: ${balance.amount}`}>
                    <span className="text-lg">{balance.icon}</span>
                    <span className="font-semibold text-stone-200">{balance.amount}</span>
                </div>
             ))}
         </div>
      </div>
      <div className="relative">
        <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center space-x-3">
          <span className="hidden sm:inline text-stone-200 font-medium">{currentUser.gameName}</span>
          <Avatar user={currentUser} className="w-12 h-12 bg-emerald-800 rounded-full border-2 border-accent overflow-hidden" />
        </button>
        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
            <a href="#" onClick={handleSwitchUser} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Switch User</a>
            <a href="#" onClick={() => navigateTo('Profile')} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Profile</a>
            {currentUser.role === Role.DonegeonMaster && (
                <a href="#" onClick={() => navigateTo('Settings')} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Settings</a>
            )}
            <div className="border-t border-stone-700"></div>
            <a href="#" onClick={handleLogout} className="block px-4 py-2 text-red-400 hover:bg-stone-700">Logout</a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;