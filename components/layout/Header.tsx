

import React, { useState, useMemo, useEffect } from 'react';
import { Page, Role, AppMode, User } from '../../types';
import Avatar from '../ui/Avatar';
import { useAuth, useAuthDispatch } from '../../context/AuthContext';
import { useGameData } from '../../context/GameDataContext';
import { useSettings, useSettingsDispatch } from '../../context/SettingsContext';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="hidden lg:block bg-stone-800/50 px-4 py-2 rounded-full border border-stone-700/60 font-mono text-lg font-semibold text-stone-300">
            {time.toLocaleTimeString()}
        </div>
    );
};

const QuickSwitchBar: React.FC = () => {
    const { users, loginHistory } = useAuth();
    const { setIsSwitchingUser, setTargetedUserForLogin } = useAuthDispatch();
    
    const sortedUsers = useMemo(() => {
        return loginHistory
            .map(userId => users.find(u => u.id === userId))
            .filter((u): u is User => !!u);
    }, [loginHistory, users]);

    const handleSwitch = (user: User) => {
        setTargetedUserForLogin(user);
        setIsSwitchingUser(true);
    };

    if (sortedUsers.length < 2) return null;

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-400 uppercase hidden lg:inline">Switch:</span>
            {sortedUsers.slice(0, 5).map(user => (
                 <button key={user.id} onClick={() => handleSwitch(user)} title={`Switch to ${user.gameName}`} className="group flex items-center gap-2 rounded-full hover:bg-stone-700/50 p-1 transition-colors">
                     <Avatar user={user} className="w-9 h-9" />
                     <span className="text-sm font-semibold text-stone-300 group-hover:text-white hidden xl:inline pr-2">{user.gameName}</span>
                 </button>
            ))}
        </div>
    );
}

const Header: React.FC = () => {
  const { currentUser } = useAuth();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked } = useAuthDispatch();
  const { guilds } = useGameData();
  const { appMode, settings } = useSettings();
  const { setAppMode, setActivePage } = useSettingsDispatch();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('lastUserId');
    sessionStorage.removeItem('isAppUnlocked');
    setCurrentUser(null);
    setAppUnlocked(false);
    setProfileDropdownOpen(false);
  };
  
  const handleSwitchUser = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSwitchingUser(true);
    setProfileDropdownOpen(false);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setProfileDropdownOpen(false);
  }
  
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
      {/* Left Group */}
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
      </div>

      {/* Center Group */}
      <div className="hidden md:flex items-center justify-center flex-grow mx-4">
        {settings.security.quickUserSwitchingEnabled && <QuickSwitchBar />}
      </div>
      
      {/* Right Group */}
      <div className="flex items-center gap-4">
        <Clock />
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
      </div>
    </header>
  );
};

export default Header;