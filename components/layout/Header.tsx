import React, { useState, useMemo, useEffect } from 'react';
import { Page, Role, AppMode, User } from '../../types';
import Avatar from '../ui/Avatar';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import FullscreenToggle from '../ui/FullscreenToggle';
import { ChevronDownIcon } from '../ui/Icons';
import RewardDisplay from '../ui/RewardDisplay';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { syncStatus, syncError } = useAppState();

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const statusConfig = useMemo(() => ({
        idle: { color: 'text-stone-400', pulse: false, text: 'Ready', title: 'Ready.' },
        syncing: { color: 'text-blue-400', pulse: true, text: 'Syncing...', title: 'Syncing data...' },
        success: { color: 'text-green-400', pulse: false, text: 'Synced', title: 'Data is up to date.' },
        error: { color: 'text-red-400', pulse: false, text: 'Connection Error', title: `Sync Error: ${syncError || 'An unknown error occurred.'}` },
    }), [syncError]);

    const currentStatus = statusConfig[syncStatus];

    return (
        <div
            title={currentStatus.title}
            className={`hidden lg:flex items-center gap-3 bg-stone-800/50 px-4 py-2 rounded-full border-2 transition-colors duration-500 border-transparent`}
        >
            <span className={`text-xs font-semibold uppercase flex items-center gap-1.5 ${currentStatus.color}`}>
                <span className={`w-2 h-2 rounded-full ${currentStatus.pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }}></span>
                {currentStatus.text}
            </span>
            <span className="font-mono text-lg font-semibold text-stone-300">{time.toLocaleTimeString()}</span>
        </div>
    );
};

const Header: React.FC = () => {
  const { currentUser, guilds, appMode, settings } = useAppState();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked, exitToSharedView, setAppMode, setActivePage } = useAppDispatch();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [guildDropdownOpen, setGuildDropdownOpen] = useState(false);

  const isSharedModeEnabledForDevice = useMemo(() => {
    const deviceMode = localStorage.getItem('deviceMode');
    if (deviceMode === 'shared') return true;
    if (deviceMode === 'personal') return false;
    return settings.sharedMode.enabled;
  }, [settings.sharedMode.enabled]);

  const handleLogout = () => {
    localStorage.removeItem('lastUserId');
    localStorage.removeItem('isAppUnlocked');
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
    setGuildDropdownOpen(false);
  };

  const userGuilds = useMemo(() => {
    if (!currentUser) return [];
    return guilds.filter(g => g.memberIds.includes(currentUser.id));
  }, [currentUser, guilds]);
  
  const currentGuildName = useMemo(() => {
      if (appMode.mode === 'guild') {
          return guilds.find(g => g.id === appMode.guildId)?.name || 'Guild';
      }
      return 'Guild';
  }, [appMode, guilds]);

  if (!currentUser) return null;

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50 flex-shrink-0">
      {/* Left Group */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="flex bg-stone-800/50 p-1 rounded-full border border-stone-700/60">
            <button onClick={() => handleModeChange({ mode: 'personal' })} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${appMode.mode === 'personal' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
                Personal
            </button>
            <div className="relative">
                <button
                    onClick={() => {
                        if (userGuilds.length === 1) {
                            handleModeChange({ mode: 'guild', guildId: userGuilds[0].id });
                        } else {
                            setGuildDropdownOpen(p => !p);
                        }
                    }}
                    disabled={userGuilds.length === 0}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-1 ${appMode.mode === 'guild' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700 disabled:opacity-50'}`}
                >
                    <span>{currentGuildName}</span>
                    {userGuilds.length > 1 && <ChevronDownIcon className="w-4 h-4" />}
                </button>
                 {guildDropdownOpen && userGuilds.length > 1 && (
                    <div className="absolute left-0 mt-2 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                        <div className="px-4 pt-2 pb-1 text-xs text-stone-500 font-semibold uppercase">Select a {settings.terminology.group}</div>
                         {userGuilds.map(guild => (
                            <a href="#" key={guild.id} onClick={() => handleModeChange({ mode: 'guild', guildId: guild.id })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">{guild.name}</a>
                        ))}
                    </div>
                 )}
            </div>
        </div>
      </div>

      {/* Center Group - Scrollable Rewards */}
      <div className="flex-1 flex justify-center items-center overflow-hidden mx-2 md:mx-4">
          <div className="flex items-center gap-3 border-l border-r border-stone-700/60 px-4 overflow-x-auto scrollbar-hide py-2">
              <RewardDisplay />
          </div>
      </div>
      
      {/* Right Group */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <Clock />
        {isSharedModeEnabledForDevice && (
            <button
                onClick={exitToSharedView}
                className="bg-amber-600 text-white px-4 py-1.5 rounded-full font-bold text-lg hover:bg-amber-500 transition-colors"
            >
                Exit User
            </button>
        )}
        <FullscreenToggle />
        <div className="relative">
          <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center space-x-3">
            <span className="hidden md:inline text-stone-200 font-medium">{currentUser.gameName}</span>
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