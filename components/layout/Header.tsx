
import React, { useState, useMemo, useEffect } from 'react';
import { Page, Role, AppMode, User } from '../../types';
import Avatar from '../ui/Avatar';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import FullscreenToggle from '../ui/FullscreenToggle';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const { syncStatus, syncError } = useAppState();

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

const QuickSwitchBar: React.FC = () => {
    const { users, loginHistory, settings } = useAppState();
    const { setTargetedUserForLogin, setIsSwitchingUser } = useAppDispatch();
    
    const sortedUsers = useMemo(() => {
        const sharedModeUserIds = new Set(settings.sharedMode.userIds);
        return loginHistory
            .map(userId => users.find(u => u.id === userId && sharedModeUserIds.has(u.id)))
            .filter((u): u is User => !!u);
    }, [loginHistory, users, settings.sharedMode.userIds]);

    const handleSwitch = (user: User) => {
        setTargetedUserForLogin(user);
        setIsSwitchingUser(true);
    };

    if (sortedUsers.length < 2 || !settings.sharedMode.quickUserSwitchingEnabled) return null;

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
  const { currentUser, guilds, appMode, settings } = useAppState();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked, exitToSharedView, setAppMode, setActivePage } = useAppDispatch();

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
      const g = guilds.find(g => g.id === appMode.guildId);
      return g?.name || 'Guild View';
    }
    // currentUser is guaranteed to exist because of the check below
    return currentUser!.gameName;
  }, [appMode, guilds, currentUser]);

  if (!currentUser) return null;

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50">
      {/* Left Group */}
      <div className="flex items-center gap-2 md:gap-4">
        {settings.sharedMode.enabled ? (
            <button
                onClick={exitToSharedView}
                className="bg-amber-600 text-white px-4 py-1.5 rounded-full font-bold text-lg hover:bg-amber-500 transition-colors"
            >
                Exit User
            </button>
        ) : (
            <div className="relative">
                <button onClick={() => setModeDropdownOpen(!modeDropdownOpen)} className="flex items-center gap-2 bg-stone-800/50 px-3 py-1.5 rounded-full border border-stone-700/60 hover:bg-stone-700 transition-colors">
                    <span className="font-semibold text-accent-light">{currentModeName}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {modeDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                    <a href="#" onClick={() => handleModeChange({ mode: 'personal' })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">{currentUser.gameName} (Personal)</a>
                    <div className="border-t border-stone-700 my-1"></div>
                    <div className="px-4 pt-2 pb-1 text-xs text-stone-500 font-semibold uppercase">{settings.terminology.groups}</div>
                    {userGuilds.map(guild => (
                        <a href="#" key={guild.id} onClick={() => handleModeChange({ mode: 'guild', guildId: guild.id })} className="block px-4 py-2 text-stone-300 hover:bg-stone-700">{guild.name}</a>
                    ))}
                </div>
                )}
            </div>
        )}
      </div>

      {/* Center Group */}
      <div className="hidden md:flex items-center justify-center flex-grow mx-4">
        {settings.sharedMode.enabled && settings.sharedMode.quickUserSwitchingEnabled && <QuickSwitchBar />}
      </div>
      
      {/* Right Group */}
      <div className="flex items-center gap-4">
        <FullscreenToggle />
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