import React, { useState, useMemo, useEffect } from 'react';
import { Page, AppMode, Quest, Role } from '../../types';
import Avatar from '../user-interface/Avatar';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import { ChevronDownIcon, MenuIcon, DeviceDesktopIcon, DevicePhoneMobileIcon, BellIcon } from '../user-interface/Icons';
import RewardDisplay from '../user-interface/RewardDisplay';
import { useCommunityState } from '../../context/CommunityContext';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useSyncStatus } from '../../context/DataProvider';
import Button from '../user-interface/Button';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import { useQuestsState } from '../../context/QuestsContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface PendingApprovals {
    quests: { id: string; title: string; submittedAt: string; questId: string; }[];
    purchases: { id: string; title: string; submittedAt: string; }[];
}

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

const ViewModeToggle: React.FC = () => {
    const { isMobileView } = useUIState();
    const { setIsMobileView } = useUIDispatch();

    return (
        <button
            onClick={() => setIsMobileView(!isMobileView)}
            title={isMobileView ? 'Switch to Desktop View' : 'Switch to Mobile View'}
            className="p-2 rounded-full text-stone-300 hover:bg-stone-700/50 hover:text-white transition-colors"
            aria-label="Toggle device view mode"
        >
            {isMobileView ? <DeviceDesktopIcon className="w-6 h-6" /> : <DevicePhoneMobileIcon className="w-6 h-6" />}
        </button>
    );
};

const Header: React.FC = () => {
  const { settings, isUpdateAvailable } = useSystemState();
  const { installUpdate } = useSystemDispatch();
  const { guilds } = useCommunityState();
  const { appMode, isMobileView } = useUIState();
  const { setAppMode, setActivePage, toggleSidebar } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { setCurrentUser, setIsSwitchingUser, setAppUnlocked, exitToSharedView, setIsSharedViewActive } = useAuthDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { quests } = useQuestsState();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [guildDropdownOpen, setGuildDropdownOpen] = useState(false);
  const [pendingDropdownOpen, setPendingDropdownOpen] = useState(false);
  const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);
  
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovals>({ quests: [], purchases: [] });
  
  // State to read directly from localStorage for UI purposes, fixing the toggle button logic.
  const [isKioskEnabledOnDevice, setIsKioskEnabledOnDevice] = useState(false);

  useEffect(() => {
    // Check localStorage when component mounts and on storage events
    const checkKioskStatus = () => {
        const status = localStorage.getItem('isKioskModeActive') === 'true';
        setIsKioskEnabledOnDevice(status);
    };
    checkKioskStatus();
    window.addEventListener('storage', checkKioskStatus);
    return () => window.removeEventListener('storage', checkKioskStatus);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchPendingApprovals = async () => {
        try {
            const response = await fetch(`/api/users/${currentUser.id}/pending-items`);
            if (!response.ok) throw new Error('Failed to fetch pending items');
            const data = await response.json();
            setPendingApprovals(data);
        } catch (error) {
            console.error("Failed to fetch pending approvals:", error);
            setPendingApprovals({ quests: [], purchases: [] });
        }
    };
    fetchPendingApprovals();
  }, [currentUser, quests]); // Refetch when quests change to ensure data is fresh after a completion

  const totalPending = useMemo(() => {
      return (pendingApprovals.quests?.length || 0) + (pendingApprovals.purchases?.length || 0);
  }, [pendingApprovals]);

  const handleViewQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest) {
        setViewingQuest(quest);
        setPendingDropdownOpen(false);
    }
  };

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
  
  const handleToggleKioskMode = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isKioskEnabledOnDevice) {
        setIsSharedViewActive(false);
        addNotification({ type: 'info', message: 'Kiosk mode disabled for this device.' });
        setIsKioskEnabledOnDevice(false);
    } else {
        setIsSharedViewActive(true);
        // Log out to transition to the shared view
        setCurrentUser(null);
    }
    setProfileDropdownOpen(false);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setProfileDropdownOpen(false);
  }
  
  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    setGuildDropdownOpen(false);
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
    <>
    <header className="h-20 bg-stone-900 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50 flex-shrink-0">
      {/* Left Group */}
      <div className="flex items-center gap-2 md:gap-4">
        {isMobileView && (
            <button onClick={toggleSidebar} className="p-2 -ml-2 text-stone-300 hover:text-white">
                <MenuIcon className="w-6 h-6" />
            </button>
        )}
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
      <div className="flex items-center gap-2 md:gap-4">
        <ViewModeToggle />
        <FullscreenToggle />
        <div className="relative">
            <button
                onClick={() => setPendingDropdownOpen(p => !p)}
                title="Pending Items"
                className="p-2 rounded-full text-stone-300 hover:bg-stone-700/50 hover:text-white transition-colors relative"
                aria-label="View pending items"
            >
                <BellIcon className="w-6 h-6" />
                {totalPending > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-red-600 rounded-full">
                        {totalPending > 9 ? '9+' : totalPending}
                    </span>
                )}
            </button>
            {pendingDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                    <div className="px-4 py-3 border-b border-stone-700">
                        <p className="font-semibold text-stone-100">My Pending Items ({totalPending})</p>
                    </div>
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {pendingApprovals.quests.length > 0 && (
                            <>
                                <div className="px-4 pt-2 pb-1 text-xs text-stone-500 font-semibold uppercase">Quests</div>
                                {pendingApprovals.quests.map(q => (
                                    <a href="#" key={q.id} onClick={(e) => { e.preventDefault(); handleViewQuest(q.questId); }} className="block px-4 py-2 text-stone-300 hover:bg-stone-700 text-sm">
                                        {q.title}
                                    </a>
                                ))}
                            </>
                        )}
                        {pendingApprovals.purchases.length > 0 && (
                            <>
                                <div className="px-4 pt-2 pb-1 text-xs text-stone-500 font-semibold uppercase border-t border-stone-700 mt-1">Purchases</div>
                                {pendingApprovals.purchases.map(p => (
                                    <span key={p.id} className="block px-4 py-2 text-stone-400 text-sm">{p.title}</span>
                                ))}
                             </>
                        )}
                        {totalPending === 0 && (
                            <p className="px-4 py-3 text-sm text-stone-400">You have no items pending approval.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
        {!isMobileView && <Clock />}
        {settings.sharedMode.enabled && (
            <Button
                onClick={exitToSharedView}
                data-log-id="header-exit-shared-view"
                variant="secondary"
                className="font-bold text-lg hidden sm:inline-flex"
                title="Exit to Shared View"
            >
                Exit
            </Button>
        )}
        <div className="relative">
            <button 
                onClick={() => setProfileDropdownOpen(p => !p)} 
                data-log-id="header-profile-dropdown" 
                className="relative flex items-center"
                title={currentUser.gameName}
            >
                <Avatar user={currentUser} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600" />
                {isUpdateAvailable && (
                    <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-stone-900" />
                )}
            </button>
            {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-20">
                    {isUpdateAvailable && (
                        <div className="border-b border-stone-700">
                            <a href="#" onClick={(e) => { e.preventDefault(); installUpdate(); }} data-log-id="header-profile-link-update" className="block px-4 py-3 text-emerald-300 bg-emerald-900/50 hover:bg-emerald-800/60 font-semibold">
                                Update Available
                            </a>
                        </div>
                    )}
                    <div className="px-4 py-3 border-b border-stone-700">
                        <p className="font-semibold text-stone-100">{currentUser.gameName}</p>
                        <p className="text-sm text-stone-400">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Profile'); }} data-log-id="header-profile-link-profile" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">My Profile</a>
                        <a href="#" onClick={handleSwitchUser} data-log-id="header-profile-link-switch" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Switch User</a>
                        {currentUser.role === Role.DonegeonMaster && settings.sharedMode.enabled && (
                            <a href="#" onClick={handleToggleKioskMode} data-log-id="header-profile-link-kiosk-toggle" className={`block px-4 py-2 hover:bg-stone-700 ${isKioskEnabledOnDevice ? 'text-red-400' : 'text-stone-300'}`}>
                                <span className="block leading-tight">{isKioskEnabledOnDevice ? 'Disable' : 'Enable'} Kiosk Mode</span>
                                <span className="block text-xs text-stone-500">on this device</span>
                            </a>
                        )}
                    </div>
                    <div className="py-1 border-t border-stone-700">
                        <a href="#" onClick={handleLogout} data-log-id="header-profile-link-logout" className="block px-4 py-2 text-red-400 hover:bg-stone-700">Log Out</a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
    {viewingQuest && (
        <QuestDetailDialog
            quest={viewingQuest}
            onClose={() => setViewingQuest(null)}
            dialogTitle={`Details for "${viewingQuest.title}"`}
        />
    )}
    </>
  );
};
export default Header;