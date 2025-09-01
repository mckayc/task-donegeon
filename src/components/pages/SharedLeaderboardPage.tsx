import React, { useMemo } from 'react';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { User } from '../../../types';
import SharedUserLeaderboardCard from '../dashboard/SharedUserLeaderboardCard';

const SharedLeaderboardPage: React.FC = () => {
    const { settings } = useSystemState();
    const { users } = useAuthState();

    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map((u: User) => [u.id, u]));
        const userIdsToShow = settings.sharedMode.userIds;
        return userIdsToShow.map((id: string) => userMap.get(id)).filter((u): u is User => !!u);
    }, [users, settings.sharedMode.userIds]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-x-auto scrollbar-hide p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-max h-full">
                    {sharedUsers.map(user => (
                        <div key={user.id} className="w-80 flex-shrink-0 flex flex-col">
                           <SharedUserLeaderboardCard user={user} />
                        </div>
                    ))}
                     {sharedUsers.length === 0 && (
                        <div className="col-span-full flex items-center justify-center h-full">
                            <p className="text-stone-500">No users have been configured for Kiosk Mode.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedLeaderboardPage;