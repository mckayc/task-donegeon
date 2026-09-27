import React, { useMemo } from 'react';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import { User } from '../../types';
import SharedUserLeaderboardCard from '../dashboard/SharedUserLeaderboardCard';
import { Trophy } from 'lucide-react';

const SharedLeaderboardPage: React.FC = () => {
    const { settings } = useSystemState();
    const { users } = useAuthState();

    const sharedUsers = useMemo(() => {
        const userMap = new Map(users.map((u: User) => [u.id, u]));
        const userIdsToShow = settings.sharedMode.userIds || [];
        const filtered = userIdsToShow.map((id: string) => userMap.get(id)).filter((u): u is User => !!u);
        return filtered.length > 0 ? filtered : users;
    }, [users, settings.sharedMode.userIds]);

    return (
        <div className="overflow-x-auto scrollbar-hide p-4 md:p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-medieval text-stone-200">Realm Standings & Explorer Trophies</h2>
                </div>
                <span className="text-xs font-mono text-stone-400">
                    {sharedUsers.length} {sharedUsers.length === 1 ? 'Explorer' : 'Explorers'} Listed
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-max flex-grow">
                {sharedUsers.map(user => (
                    <div key={user.id} className="w-80 flex-shrink-0 flex flex-col">
                       <SharedUserLeaderboardCard user={user} />
                    </div>
                ))}
                {sharedUsers.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-full text-center p-8 my-auto">
                        <div className="text-4xl mb-3">🏆</div>
                        <h3 className="text-lg font-bold text-stone-200 font-medieval mb-1">No Explorers Configured</h3>
                        <p className="text-stone-400 text-sm">Select users in Settings &rarr; Shared / Kiosk Mode to display standings here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedLeaderboardPage;
