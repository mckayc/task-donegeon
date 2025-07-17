
import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Avatar from '../ui/Avatar';
import Clock from '../ui/Clock';
import FullscreenToggle from '../ui/FullscreenToggle';

interface SharedHeaderProps {
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ currentDate, setCurrentDate }) => {
  const { users, settings } = useAppState();
  const { setTargetedUserForLogin, setIsSwitchingUser } = useAppDispatch();

  const sharedUsers = useMemo(() => {
    const userMap = new Map(users.map(u => [u.id, u]));
    const userIdsToShow = settings.sharedMode.userIds.length > 0 ? settings.sharedMode.userIds : users.map(u => u.id);
    return userIdsToShow.map(id => userMap.get(id)).filter((u): u is User => !!u);
  }, [users, settings.sharedMode.userIds]);

  const handleUserSelect = (user: User) => {
    setTargetedUserForLogin(user);
    setIsSwitchingUser(true);
  };
  
  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50 flex-shrink-0">
        <div className="flex items-center gap-4">
            <h1 className="font-medieval text-accent hidden sm:block">{settings.terminology.appName}</h1>
             <div className="flex items-center bg-stone-800/50 rounded-full border border-stone-700/60">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-stone-700 transition">&lt;</button>
                <div className="text-lg font-semibold text-emerald-300 mx-4 text-center w-32 md:w-64">
                    <span className="hidden md:inline">{currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <span className="md:hidden">{currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</span>
                </div>
                <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-stone-700 transition">&gt;</button>
            </div>
        </div>
      
      <div className="flex items-center gap-4 flex-1 min-w-0 justify-end">
        <div className="flex-1 flex justify-end min-w-0">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2">
            {sharedUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                title={`Login as ${user.gameName}`}
                className="group flex flex-col items-center gap-1 flex-shrink-0"
              >
                <Avatar user={user} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors overflow-hidden" />
                <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{user.gameName}</span>
              </button>
            ))}
            </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
            <FullscreenToggle />
            <Clock />
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;
