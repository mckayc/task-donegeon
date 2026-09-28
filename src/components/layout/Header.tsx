import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: Corrected import path for types
import { Page, AppMode, Quest, Role, User, QuestType, QuestCompletionStatus } from '../../types';
import Avatar from '../user-interface/Avatar';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import { ChevronDownIcon, MenuIcon, DeviceDesktopIcon, DevicePhoneMobileIcon, BellIcon } from '../user-interface/Icons';
import RewardDisplay from '../user-interface/RewardDisplay';
import { useCommunityState } from '../../context/CommunityContext';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useSyncStatus } from '../../context/DataProvider';
import QuestDetailDialog from '../quests/QuestDetailDialog';
import { useQuestsState } from '../../context/QuestsContext';
import { INITIAL_MAIN_SIDEBAR_CONFIG } from '../../data/initialData';
import { isQuestScheduledForDay } from '../../utils/conditions';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import LiveTimerWidget from './LiveTimerWidget';
import BatteryStatus from '../user-interface/BatteryStatus';

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
  const { installUpdate, updateSettings } = useSystemDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { isMobileView, isKioskDevice } = useUIState();
  const { toggleSidebar, setActivePage } = useUIDispatch();
  const { currentUser } = useAuthState();
  const { logout, setIsSwitchingUser } = useAuthDispatch();
  const { quests, questCompletions } = useQuestsState();

  const isFocusModeActive = useMemo(() => {
    if (settings.focusMode?.enabled !== undefined) {
      return settings.focusMode.enabled;
    }
    const main = settings.sidebars?.main || [];
    const isMarketHidden = main.find(i => i.id === 'Marketplace')?.isVisible === false;
    const isTrophyHidden = main.find(i => i.id === 'Trophies')?.isVisible === false;
    return isMarketHidden && isTrophyHidden;
  }, [settings.focusMode, settings.sidebars?.main]);

  const todayDutyStats = useMemo(() => {
    if (!currentUser || currentUser.role !== Role.Explorer) {
      return { total: 0, completed: 0, allDone: false };
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const scheduledDuties = quests.filter(q => {
      if (!q.isActive || q.type !== QuestType.Duty) return false;
      if (q.assignedUserIds && q.assignedUserIds.length > 0 && !q.assignedUserIds.includes(currentUser.id)) {
        return false;
      }
      return isQuestScheduledForDay(q, now);
    });

    if (scheduledDuties.length === 0) {
      return { total: 0, completed: 0, allDone: true };
    }

    const userCompletionsToday = questCompletions.filter(c => {
      if (c.userId !== currentUser.id) return false;
      const compTime = new Date(c.completedAt).getTime();
      return compTime >= todayStart && compTime < todayEnd && c.status === QuestCompletionStatus.Approved;
    });

    const completedQuestIds = new Set(userCompletionsToday.map(c => c.questId));
    const completedCount = scheduledDuties.filter(d => completedQuestIds.has(d.id)).length;
    return {
      total: scheduledDuties.length,
      completed: completedCount,
      allDone: completedCount >= scheduledDuties.length,
    };
  }, [currentUser, quests, questCompletions]);

  const handleToggleFocusMode = async () => {
    const nextState = !isFocusModeActive;
    const userConfig = settings.sidebars?.main || [];
    const defaultConfig = INITIAL_MAIN_SIDEBAR_CONFIG;

    const updatedMain = defaultConfig.map(item => {
      const existing = userConfig.find(u => u.id === item.id);
      const currentVis = existing ? existing.isVisible : item.isVisible;

      if (nextState) {
        if (['Marketplace', 'Trophies', 'Ranks', 'Progress', 'Avatar', 'Collection', 'Themes', 'Chronicles', 'Chat'].includes(item.id)) {
          return { ...item, isVisible: false };
        }
        return { ...item, isVisible: currentVis };
      } else {
        if (['Marketplace', 'Trophies', 'Ranks', 'Progress', 'Avatar', 'Collection', 'Themes', 'Chronicles', 'Chat'].includes(item.id)) {
          return { ...item, isVisible: true };
        }
        return { ...item, isVisible: currentVis };
      }
    });

    await updateSettings({
      ...settings,
      sidebars: { ...settings.sidebars, main: updatedMain },
      focusMode: {
        ...(settings.focusMode || { autoUnlockOnDutiesComplete: false }),
        enabled: nextState,
      },
      chat: {
        ...settings.chat,
        enabled: nextState ? false : true,
      }
    });

    addNotification({
      type: nextState ? 'info' : 'success',
      message: nextState
        ? '🎯 Focus Mode activated! Non-chore tabs hidden for children.'
        : '🛡️ Full RPG Realm restored! All features accessible.',
    });
  };

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pendingDropdownOpen, setPendingDropdownOpen] = useState(false);
  const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);
  
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovals>({ quests: [], purchases: [] });
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
            setProfileDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
  }, [currentUser, quests]);

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
  
  const handleSwitchUser = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSwitchingUser(true);
    setProfileDropdownOpen(false);
  };

  const navigateTo = (page: Page) => {
    setActivePage(page);
    setProfileDropdownOpen(false);
  }
  
  const handleKioskToggle = () => {
      const newKioskState = !isKioskDevice;
      localStorage.setItem('isKioskDevice', String(newKioskState));
      // Reload the page to apply the new mode from the root component
      window.location.href = '/';
  };

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
        <div className="hidden sm:block">
            <h1 className="font-semibold text-lg text-stone-200">Personal Dashboard</h1>
        </div>
      </div>

      {/* Center Group */}
      <div className="flex-grow flex items-center justify-center mx-2 md:mx-4 min-w-0">
          <LiveTimerWidget />
          <div className="border-l border-stone-600/80 h-6 flex-shrink-0 hidden md:block" />
          <div className="overflow-x-auto scrollbar-hide mx-2 py-2">
            <RewardDisplay />
          </div>
          <div className="border-r border-stone-600/80 h-6 flex-shrink-0 hidden md:block" />
      </div>
      
      {/* Right Group */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Focus Mode Quick Control / Status */}
        {currentUser.role === Role.DonegeonMaster && (
            <button
                type="button"
                onClick={handleToggleFocusMode}
                title={isFocusModeActive ? "Focus Mode is ON. Click to restore Full RPG Realm." : "Focus Mode is OFF. Click to activate Focus Mode (hide non-chore distractions)."}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                    isFocusModeActive
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 hover:bg-amber-900/80 ring-1 ring-amber-500/50'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-700/60 hover:text-white'
                }`}
                data-log-id="header-quick-toggle-focus-mode"
            >
                <span>🎯</span>
                <span className="hidden sm:inline">Focus Mode:</span>
                <span className={isFocusModeActive ? 'text-amber-400 font-extrabold' : 'text-stone-400'}>
                    {isFocusModeActive ? 'ON' : 'OFF'}
                </span>
            </button>
        )}

        {currentUser.role === Role.Explorer && isFocusModeActive && (
            <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                    todayDutyStats.allDone
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500/70 text-amber-300'
                }`}
                title={todayDutyStats.allDone ? "All duties complete! The Realm is unlocked for today." : `${todayDutyStats.completed} of ${todayDutyStats.total} duties complete.`}
            >
                <span>{todayDutyStats.allDone ? '✨' : '🎯'}</span>
                <span className="hidden md:inline">
                    {todayDutyStats.allDone 
                        ? 'Realm Unlocked!' 
                        : `Focus: ${todayDutyStats.completed}/${todayDutyStats.total} Done`}
                </span>
            </div>
        )}

        {isMobileView && <BatteryStatus />}
        <ViewModeToggle />
        <FullscreenToggle />
        {isKioskDevice && (
            <Button variant="secondary" onClick={() => logout()} size="sm" className="!text-xs !py-1 !px-3">
                Kiosk
            </Button>
        )}
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
        <div className="relative" ref={profileDropdownRef}>
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
                        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('Dashboard', { from: 'header-customize-dashboard' }); }} data-log-id="header-profile-link-customize-dashboard" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Customize Dashboard</a>
                        <a href="#" onClick={handleSwitchUser} data-log-id="header-profile-link-switch" className="block px-4 py-2 text-stone-300 hover:bg-stone-700">Switch User</a>
                    </div>
                    {currentUser.role === Role.DonegeonMaster && settings.sharedMode.enabled && (
                        <div className="py-2 border-t border-stone-700">
                            <div className="px-4">
                                 <ToggleSwitch
                                    enabled={isKioskDevice}
                                    setEnabled={handleKioskToggle}
                                    label="Kiosk Mode (This Device)"
                                />
                            </div>
                        </div>
                    )}
                    <div className="py-1 border-t border-stone-700">
                        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} data-log-id="header-profile-link-logout" className="block px-4 py-2 text-red-400 hover:bg-stone-700">Log Out</a>
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