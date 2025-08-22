
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from '../users/types';
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
import { logger } from '../../utils/logger';

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
    logger.log('[Header] User logged out.');
    localStorage.removeItem('lastUserId');
    localStorage.removeItem('isAppUnlocked');
    setCurrentUser(null);
    setAppUnlocked(false);
    setProfileDropdownOpen(false);
  };
  
  const handleSwitchUser = (e: React.MouseEvent) => {
    e.preventDefault();
    logger.log('[Header] User initiated "Switch User".');
    setIsSwitchingUser(true);
    setProfileDropdownOpen(false);
  };

  const navigateTo = (page: Page) => {
    logger.log(`[Header] Navigating to page from profile dropdown: ${page}`);
    setActivePage(page);
    setProfileDropdownOpen(false);
  }
  
  const handleModeChange = (mode: AppMode) => {
    logger.log('[Header] App mode changed to:', mode);
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
                <button data-log-id="header-mode-guild-toggle" onClick={() => setGuildDropdownOpen(!guildDropdownOpen)} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 ${appMode.mode === 'guild' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
                    <span>{currentGuildName}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
                {guildDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-stone-900 border border-stone-700 rounded-md shadow-lg z-20">
                        <div className="py-1">
                            {userGuilds.map(guild => (
                                <a href="#" key={guild.id} onClick={(e) => { e.preventDefault(); handleModeChange({ mode: 'guild', guildId: guild.id }); }} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-700">
                                    {guild.name}
                                </a>
                            ))}
                            {userGuilds.length === 0 && <span className="block px-4 py-2 text-sm text-stone-400">No guilds joined.</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      {/* Right Group */}
      <div className="flex items-center gap-2 md:gap-4">
        <RewardDisplay />
        <Clock />
        <FullscreenToggle />
        <div className="relative">
          <button data-log-id="header-profile-dropdown-toggle" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-800/50">
            <Avatar user={currentUser} className="w-10 h-10 rounded-full" />
            <div className="hidden md:block text-left">
              <p className="font-semibold text-stone-200">{currentUser.gameName}</p>
              <p className="text-xs text-stone-400">{currentUser.role}</p>
            </div>
            <ChevronDownIcon className="w-5 h-5 text-stone-400 hidden md:block" />
          </button>
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-700 rounded-md shadow-lg z-20">
              <div className="py-1">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Profile'); }} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-700">My Profile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Settings'); }} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-700">Settings</a>
                {settings.sharedMode.enabled && (
                    <a href="#" onClick={(e) => { e.preventDefault(); exitToSharedView(); }} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-700">Exit to Kiosk</a>
                )}
                <a href="#" onClick={handleSwitchUser} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-700">Switch User</a>
                <div className="border-t border-stone-700 my-1"></div>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Logout</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
