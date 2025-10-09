import React, { useMemo } from 'react';
import { useQuestsState } from '../../context/QuestsContext';
import { useAuthState } from '../../context/AuthContext';
import Card from '../user-interface/Card';
import Avatar from '../user-interface/Avatar';
import { BookOpen } from 'lucide-react';

interface ReadingActivityCardProps {
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(hours.toString().padStart(2, '0'));
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));
    return parts.join(':');
};

const ReadingActivityCard: React.FC<ReadingActivityCardProps> = (props) => {
    const { quests } = useQuestsState();
    const { users } = useAuthState();

    const readingActivities = useMemo(() => {
        const activities: { user: any, quest: any, time: number, sessionTime?: number }[] = [];
        quests.forEach(quest => {
            if (quest.readingProgress) {
                Object.entries(quest.readingProgress).forEach(([userId, progress]) => {
                    const user = users.find(u => u.id === userId);
                    // FIX: Correctly cast the `progress` object to ensure type safety when accessing its properties.
                    const progressData = progress as { totalSeconds?: number; sessionSeconds?: number; };
                    if (user && progressData.totalSeconds && progressData.totalSeconds > 0) {
                        activities.push({ 
                            user, 
                            quest, 
                            time: progressData.totalSeconds,
                            sessionTime: progressData.sessionSeconds
                        });
                    }
                });
            }
        });
        return activities.sort((a, b) => b.time - a.time); // Show longest readers first
    }, [quests, users]);

    return (
        <Card title="Live Reading Activity" {...props}>
            {readingActivities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {readingActivities.map(({ user, quest, time, sessionTime }) => (
                        <div key={`${user.id}-${quest.id}`} className="flex items-center gap-3 p-2 bg-stone-900/50 rounded-md">
                            <Avatar user={user} className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold text-stone-200 truncate">{user.gameName}</p>
                                <p className="text-xs text-stone-400 truncate flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3 flex-shrink-0"/>
                                    <span className="truncate">Reading: {quest.title}</span>
                                </p>
                            </div>
                             <div className="font-mono text-right flex-shrink-0">
                                {/* FIX: Correctly access properties on a potentially unknown object type. */}
                                <p className="font-bold text-lg text-emerald-300" title="Total Time">{formatTime(time)}</p>
                                {/* FIX: Correctly access properties on a potentially unknown object type. */}
                                {sessionTime && sessionTime > 0 && <p className="text-xs text-stone-400" title="Current Session">({formatTime(sessionTime)})</p>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-stone-400 text-center text-sm">No active reading sessions.</p>
            )}
        </Card>
    );
};

export default ReadingActivityCard;
