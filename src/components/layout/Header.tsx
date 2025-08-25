import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from '../../../types';
import { Page, AppMode } from '../../types/app';
import Avatar from '../user-interface/Avatar';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import { ChevronDownIcon } from '../user-interface/Icons';
import RewardDisplay from '../user-interface/RewardDisplay';
import { useCommunityState } from '../../context/CommunityContext';
import { useSystemState } from '../../context/SystemContext';
import { useSyncStatus } from '../../context/DataProvider';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { syncStatus, syncError } = useSyncStatus();

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const statusConfig = useMemo(() => ({
        idle: { borderColor: 'border-stone-700/60', pulse: false, title: 'Ready.' },
        syncing: { borderColor: 'border-blue-500', pulse: true, title: 'Syncing data...' },
        success: { borderColor: 'border-green-500', pulse: false, title: 'Data is up to date.' },
        error: { borderColor: 'border-red-500', pulse: false, title: `Sync Error: ${syncError || 'An unknown error occurred.'}` },
    }), [syncError]);

    const currentStatus = statusConfig[syncStatus];

    return (
        <div
            title={currentStatus.title}
            className={`hidden lg:block bg-stone-800/50 px-4 py-2 rounded-full border-2 font-mono text-lg font-semibold text-stone-300 flex items-center gap-3 transition-colors duration-500 ${currentStatus.borderColor} ${currentStatus.pulse ? 'animate-pulse' : ''}`}
        >
            <span>{time.toLocaleTimeString()}</span>
        </div>
    );
};

const Header: React.FC = () => {
  const { settings } = useSystemState();
  const { guilds } = useCommunityState();
  const { appMode } = useUIState();
  const { setAppMode, setActivePage } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked, exitToSharedView } = useAuthDispatch();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [guildDropdownOpen, setGuildDropdownOpen] = useState(false);

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
    // Always navigate to the dashboard when switching modes for a consistent experience.
    // The Guild page is accessible from the sidebar.
    setActivePage('Dashboard');
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
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50">
      {/* Left Group */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex bg-stone-800/50 p-1 rounded-full border border-stone-700/60">
            <button data-log-id="header-mode-personal" onClick={() => handleModeChange({ mode: 'personal' })} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${appMode.mode === 'personal' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
                Personal
            </button>
            <div className="relative">
                <button
                    data-log-id="header-mode-guild-dropdown"
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
                            <a href="#" key={guild.id} data-log-id={`header-mode-guild-select-${guild.id}`} onClick={() => handleModeChange({ mode: 'guild', guildId: guild.id })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">{guild.name}</a>
                        ))}
                    </div>
                 )}
            </div>
        </div>
      </div>

      {/* Center Group */}
      <div className="flex-grow flex items-center justify-center mx-2 md:mx-4 min-w-0">
          <div className="border-l border-stone-600/80 h-6 flex-shrink-0 hidden md:block" />
          <div className="overflow-x-auto scrollbar-hide mx-2 py-2">
            <RewardDisplay />
          </div>
          <div className="border-r border-stone-600/80 h-6 flex-shrink-0 hidden md:block" />
      </div>
      
      {/* Right Group */}
      <div className="flex items-center gap-4">
        <FullscreenToggle />
        <Clock />
        {settings.sharedMode.enabled && (
            <button
                onClick={exitToSharedView}
                data-log-id="header-exit-shared-view"
                className="bg-amber-600 text-white px-4 py-1.5 rounded-full font-bold text-lg hover:bg-amber-500"
                title="Exit to Shared View"
            >
                Exit
            </button>
        )}
        <div className="relative">
            <button onClick={() => setProfileDropdownOpen(p => !p)} data-log-id="header-profile-dropdown" className="flex items-center gap-2">
                <Avatar user={currentUser} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600" />
                <div className="hidden md:block text-left">
                    <p className="font-semibold text-stone-100">{currentUser.gameName}</p>
                    <p className="text-xs text-stone-400">{currentUser.role}</p>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-stone-400 hidden md:block" />
            </button>
            {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                    <div className="px-4 py-3 border-b border-stone-700">
                        <p className="font-semibold text-stone-100">{currentUser.gameName}</p>
                        <p className="text-sm text-stone-400">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Profile'); }} data-log-id="header-profile-link-profile" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">My Profile</a>
                        <a href="#" onClick={handleSwitchUser} data-log-id="header-profile-link-switch" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Switch User</a>
                    </div>
                    <div className="py-1 border-t border-stone-700">
                        <a href="#" onClick={handleLogout} data-log-id="header-profile-link-logout" className="block px-4 py-2 text-red-400 hover:bg-stone-700">Log Out</a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};
export default Header;