import React, { useMemo, useEffect, useState } from 'react';
import { Page, Role, AppMode, User } from '../../types';
import Avatar from '../ui/Avatar';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import FullscreenToggle from '../ui/FullscreenToggle';
import { ChevronDownIcon } from '@/components/ui/Icons';
import RewardDisplay from '../ui/RewardDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown-Menu";
import { Button } from '@/components/ui/Button';

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
            className={`hidden lg:flex items-center gap-3 bg-card px-4 py-2 rounded-full border-2 transition-colors duration-500 border-transparent`}
        >
            <span className={`text-xs font-semibold uppercase flex items-center gap-1.5 ${currentStatus.color}`}>
                <span className={`w-2 h-2 rounded-full ${currentStatus.pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }}></span>
                {currentStatus.text}
            </span>
            <span className="font-mono text-lg font-semibold text-foreground/80">{time.toLocaleTimeString()}</span>
        </div>
    );
};

const Header: React.FC = () => {
  const { currentUser, guilds, appMode, settings } = useAppState();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked, exitToSharedView, setAppMode, setActivePage } = useAppDispatch();

  const handleLogout = () => {
    localStorage.removeItem('lastUserId');
    localStorage.removeItem('isAppUnlocked');
    setCurrentUser(null);
    setAppUnlocked(false);
  };
  
  const handleSwitchUser = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSwitchingUser(true);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
  }
  
  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
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
    <header className="h-20 bg-background/80 flex items-center justify-between px-4 md:px-8 border-b backdrop-blur-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex bg-card p-1 rounded-full border">
            <Button onClick={() => handleModeChange({ mode: 'personal' })} variant={appMode.mode === 'personal' ? 'default' : 'ghost'} size="sm" className="rounded-full">
                Personal
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={appMode.mode === 'guild' ? 'default' : 'ghost'} size="sm" className="rounded-full" disabled={userGuilds.length === 0}>
                        <span>{currentGuildName}</span>
                        {userGuilds.length > 1 && <ChevronDownIcon className="w-4 h-4 ml-1" />}
                    </Button>
                </DropdownMenuTrigger>
                {userGuilds.length > 1 && (
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Select a {settings.terminology.group}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         {userGuilds.map(guild => (
                            <DropdownMenuItem key={guild.id} onSelect={() => handleModeChange({ mode: 'guild', guildId: guild.id })}>
                                {guild.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                 )}
            </DropdownMenu>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center flex-grow mx-4">
        <RewardDisplay />
      </div>
      
      <div className="flex items-center gap-4 flex-shrink-0">
        <Clock />
        {settings.sharedMode.enabled && (
            <Button
                onClick={exitToSharedView}
                className="bg-amber-600 text-white font-bold hover:bg-amber-500"
                size="sm"
            >
                Exit User
            </Button>
        )}
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                <span className="hidden sm:inline text-foreground font-medium">{currentUser.gameName}</span>
                <Avatar user={currentUser} className="w-12 h-12 rounded-full border-2 border-accent overflow-hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSwitchUser(e as unknown as React.MouseEvent); }}>Switch User</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigateTo('Profile')}>Profile</DropdownMenuItem>
              {currentUser.role === Role.DonegeonMaster && (
                  <DropdownMenuItem onSelect={() => navigateTo('Settings')}>Settings</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-red-400 focus:text-red-400">Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <FullscreenToggle />
      </div>
    </header>
  );
};

export default Header;