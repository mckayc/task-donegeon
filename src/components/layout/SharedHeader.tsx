import React, { useMemo, useState, useEffect } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
// FIX: Corrected import path for types
import { User } from '../../types';
import Avatar from '../user-interface/Avatar';
import FullscreenToggle from '../user-interface/FullscreenToggle';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { SwitchUserIcon, ChartBarIcon, CalendarDaysIcon, ArrowDownTrayIcon } from '../user-interface/Icons';
import { SharedView } from './SharedLayout';
import BatteryStatus from '../user-interface/BatteryStatus';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    return (
        <div className={`hidden lg:block bg-stone-800/50 px-4 py-2 rounded-full border border-stone-700/60 font-mono text-lg font-semibold text-stone-300 flex items-center gap-3`}>
            <span>{time.toLocaleTimeString()}</span>
        </div>
    );
};

interface SharedHeaderProps {
    activeView: SharedView;
    setActiveView: (view: SharedView) => void;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ activeView, setActiveView }) => {
  const { settings, isUpdateAvailable } = useSystemState();
  const { installUpdate } = useSystemDispatch();
  const { users } = useAuthState();
  const { setTargetedUserForLogin, setIsSwitchingUser } = useAuthDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());

   useEffect(() => {
        const timerId = setInterval(() => setCurrentDate(new Date()), 60000); // Update date every minute
        return () => clearInterval(timerId);
    }, []);

  const sharedUsers = useMemo(() => {
    const userMap = new Map(users.map((u: User) => [u.id, u]));
    const userIdsToShow = settings.sharedMode.userIds;
    return userIdsToShow.map((id: string) => userMap.get(id)).filter((u): u is User => !!u);
  }, [users, settings.sharedMode.userIds]);

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
        </div>
        {/* Right Group */}
        <div className="flex items-center gap-3">
          {settings.sharedMode.showBattery && <BatteryStatus />}
          <Clock />
          <FullscreenToggle />
          
          {isUpdateAvailable && (
              <button
                  onClick={installUpdate}
                  title="An update is available. Click to install."
                  className="relative p-2 rounded-full text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                  aria-label="Install update"
              >
                  <ArrowDownTrayIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-stone-900" />
              </button>
          )}

          <div className="flex bg-stone-800/50 p-1 rounded-full border border-stone-700/60 ml-2">
              <button 
                  onClick={() => setActiveView('calendar')} 
                  className={`p-2 rounded-full transition-colors ${activeView === 'calendar' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
                  title="Calendar View"
              >
                  <CalendarDaysIcon className="w-5 h-5" />
              </button>
              <button 
                  onClick={() => setActiveView('leaderboard')} 
                  className={`p-2 rounded-full transition-colors ${activeView === 'leaderboard' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}
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
                  className="group flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <Avatar user={user} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors overflow-hidden" />
                  <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{user.username}</span>
                </button>
              ))}
               <button
                  onClick={() => setIsSwitchingUser(true)}
                  title="Switch to another user"
                  className="group flex flex-col items-center gap-1 flex-shrink-0"
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