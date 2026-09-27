import React, { useMemo, useState, useEffect } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { User, QuestType, QuestCompletionStatus } from '../../types';
import Avatar from '../user-interface/Avatar';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useSyncStatus } from '../../context/DataProvider';
import { SwitchUserIcon, ChartBarIcon, CalendarDaysIcon, ArrowDownTrayIcon } from '../user-interface/Icons';
import { SharedView } from './SharedLayout';
import BatteryStatus from '../user-interface/BatteryStatus';
import { Moon, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { isQuestScheduledForDay } from '../../utils/conditions';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className="hidden lg:flex bg-stone-800/50 px-4 py-2 rounded-full border border-stone-700/60 font-mono text-lg font-semibold text-stone-300 items-center gap-3">
            <span>{time.toLocaleTimeString()}</span>
        </div>
    );
};

interface SharedHeaderProps {
    activeView: SharedView;
    setActiveView: (view: SharedView) => void;
    onTriggerScreensaver?: () => void;
    isWakeLockActive?: boolean;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({
    activeView,
    setActiveView,
    onTriggerScreensaver,
    isWakeLockActive = false,
}) => {
  const { settings, isUpdateAvailable } = useSystemState();
  const { installUpdate } = useSystemDispatch();
  const { users } = useAuthState();
  const { quests, questCompletions } = useQuestsState();
  const { setTargetedUserForLogin, setIsSwitchingUser } = useAuthDispatch();
  const { syncStatus, syncData } = useSyncStatus();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const sharedUsers = useMemo(() => {
    const userMap = new Map(users.map((u: User) => [u.id, u]));
    const userIdsToShow = settings.sharedMode.userIds || [];
    const filtered = userIdsToShow.map((id: string) => userMap.get(id)).filter((u): u is User => !!u);
    return filtered.length > 0 ? filtered : users;
  }, [users, settings.sharedMode.userIds]);

  // Compute daily duties summary across shared users
  const dailyDutySummary = useMemo(() => {
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    let totalScheduled = 0;
    let totalCompleted = 0;

    sharedUsers.forEach(user => {
      const userCompletionsToday = questCompletions.filter(c => {
        if (c.userId !== user.id) return false;
        const compTime = new Date(c.completedAt).getTime();
        return compTime >= todayStart && compTime < todayEnd && c.status === QuestCompletionStatus.Approved;
      });
      const completedQuestIds = new Set(userCompletionsToday.map(c => c.questId));

      const userDuties = quests.filter(q => {
        if (!q.isActive || q.type !== QuestType.Duty) return false;
        if (!isQuestScheduledForDay(q, currentDate)) return false;
        if (q.assignedUserIds && q.assignedUserIds.length > 0) {
          return q.assignedUserIds.includes(user.id);
        }
        return true;
      });

      totalScheduled += userDuties.length;
      totalCompleted += userDuties.filter(d => completedQuestIds.has(d.id)).length;
    });

    return { totalScheduled, totalCompleted };
  }, [sharedUsers, quests, questCompletions, currentDate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleUserSelect = (user: User) => {
    setTargetedUserForLogin(user);
    setIsSwitchingUser(true);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 h-20 bg-stone-900/80 backdrop-blur-sm border-b border-stone-700/50 overflow-x-auto scrollbar-hide">
      <div className="flex items-center justify-between px-4 md:px-8 h-full min-w-max w-full">
        {/* Left Group */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
          <div className="hidden sm:block text-lg font-semibold text-stone-200">
              {currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Daily Duty Completion Pill */}
          {dailyDutySummary.totalScheduled > 0 && (
            <div className="hidden xl:flex items-center gap-2 bg-stone-800/70 border border-stone-700/80 px-3 py-1 rounded-full text-xs font-medium text-stone-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Today: <strong className="text-emerald-400">{dailyDutySummary.totalCompleted}</strong>/{dailyDutySummary.totalScheduled} Duties
              </span>
            </div>
          )}
        </div>

        {/* Right Group */}
        <div className="flex items-center gap-3">
          {/* Wake Lock Badge */}
          {isWakeLockActive && (
            <div
              title="Screen Wake Lock is active: display will stay awake."
              className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Awake</span>
            </div>
          )}

          {settings.sharedMode.showBattery && <BatteryStatus />}
          <Clock />

          {/* Quick Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || syncStatus === 'syncing'}
            title="Refresh realm data from server"
            className="p-2 rounded-full text-stone-300 hover:text-white bg-stone-800/60 hover:bg-stone-700/80 border border-stone-700/60 transition-colors cursor-pointer"
            aria-label="Refresh realm data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing || syncStatus === 'syncing' ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Ambient Screensaver Mode Button */}
          {onTriggerScreensaver && (
            <button
              onClick={onTriggerScreensaver}
              title="Enter Ambient Screensaver Mode"
              className="p-2 rounded-full text-stone-300 hover:text-amber-300 bg-stone-800/60 hover:bg-stone-700/80 border border-stone-700/60 transition-colors cursor-pointer"
              aria-label="Enter ambient screensaver"
            >
              <Moon className="w-5 h-5" />
            </button>
          )}

          <FullscreenToggle />
          
          {isUpdateAvailable && (
              <button
                  onClick={installUpdate}
                  title="An update is available. Click to install."
                  className="relative p-2 rounded-full text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer"
                  aria-label="Install update"
              >
                  <ArrowDownTrayIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-stone-900" />
              </button>
          )}

          <div className="flex bg-stone-800/50 p-1 rounded-full border border-stone-700/60 ml-2">
              <button 
                  onClick={() => setActiveView('calendar')} 
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeView === 'calendar' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
                  title="Calendar View"
              >
                  <CalendarDaysIcon className="w-5 h-5" />
              </button>
              <button 
                  onClick={() => setActiveView('leaderboard')} 
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeView === 'leaderboard' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
                  title="Leaderboard View"
              >
                  <ChartBarIcon className="w-5 h-5" />
              </button>
          </div>

          <div className="h-full border-l border-stone-700/60 mx-2 hidden md:block"></div>
          <div className="flex items-center gap-3 py-2">
              {sharedUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  title={`Login as ${user.gameName}`}
                  className="group flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <Avatar user={user} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors overflow-hidden" />
                  <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{user.username}</span>
                </button>
              ))}
               <button
                  onClick={() => setIsSwitchingUser(true)}
                  title="Switch to another user"
                  className="group flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                  <div className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors flex items-center justify-center">
                      <SwitchUserIcon className="w-6 h-6 text-stone-300 group-hover:text-white" />
                  </div>
                  <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">Switch</span>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;
