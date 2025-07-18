


import React, { useMemo, useState, useEffect } from 'react';
import { useAuthState, useSettingsState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Avatar from '../ui/Avatar';
import FullscreenToggle from '../ui/FullscreenToggle';

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

const SharedHeader: React.FC = () => {
  const { users } = useAuthState();
  const { settings } = useSettingsState();
  const { setTargetedUserForLogin, setIsSwitchingUser } = useAppDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());

   useEffect(() => {
        const timerId = setInterval(() => setCurrentDate(new Date()), 60000); // Update date every minute
        return () => clearInterval(timerId);
    }, []);

  const sharedUsers = useMemo(() => {
    const userMap = new Map(users.map(u => [u.id, u]));
    const userIdsToShow = settings.sharedMode.userIds.length > 0 ? settings.sharedMode.userIds : users.map(u => u.id);
    return userIdsToShow.map(id => userMap.get(id)).filter((u): u is User => !!u);
  }, [users, settings.sharedMode.userIds]);

  const handleUserSelect = (user: User) => {
    setTargetedUserForLogin(user);
    setIsSwitchingUser(true);
  };

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
        <div className="hidden sm:block text-lg font-semibold text-stone-200">
            {currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Clock />
        <FullscreenToggle />
        <div className="h-full border-l border-stone-700/60 mx-2"></div>
        {sharedUsers.map(user => (
          <button
            key={user.id}
            onClick={() => handleUserSelect(user)}
            title={`Login as ${user.gameName}`}
            className="group flex flex-col items-center gap-1"
          >
            <Avatar user={user} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors overflow-hidden" />
            <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{user.gameName}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default SharedHeader;
