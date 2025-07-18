
import React, { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Avatar from '../ui/Avatar';

const SharedHeader: React.FC = () => {
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

  return (
    <header className="h-20 bg-stone-900/30 flex items-center justify-between px-4 md:px-8 border-b border-stone-700/50">
      <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
      <div className="flex items-center gap-3">
        {sharedUsers.map(user => (
          <button
            key={user.id}
            onClick={() => handleUserSelect(user)}
            title={`Login as ${user.gameName}`}
            className="group flex flex-col items-center gap-1"
          >
            <Avatar user={user} className="w-12 h-12 bg-stone-700 rounded-full border-2 border-stone-600 group-hover:border-accent transition-colors" />
            <span className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{user.gameName}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default SharedHeader;
