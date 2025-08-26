
import React from 'react';
import Card from '../user-interface/Card';
import { Terminology } from '../../types/app';
import { QuestCompletionStatus } from '../quests/types';
import { ChronicleEvent, Role } from '../../types';
import { useAuthState } from '../../context/AuthContext';

interface RecentActivityCardProps {
    activities: ChronicleEvent[];
    terminology: Terminology;
}

const statusColorClass = (status: string) => {
    switch (status) {
        case "Awarded":
        case QuestCompletionStatus.Approved:
        case "Completed":
        case "Exchanged":
        case "Gifted":
            return 'text-green-400';
        case QuestCompletionStatus.Pending:
        case "Requested":
            return 'text-yellow-400';
        case QuestCompletionStatus.Rejected:
        case "Setback":
            return 'text-red-400';
        case "Cancelled":
            return 'text-stone-400';
        default:
            return 'text-stone-400';
    }
};

const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities, terminology }) => {
    const { currentUser } = useAuthState();

    if (!currentUser) return null;

    return (
        <Card title={`Recent ${terminology.history}`}>
            {activities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {activities.map(activity => (
                        <div key={activity.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm p-3 bg-stone-900/40 rounded-lg border-l-4" style={{ borderColor: activity.color }}>
                            {/* Column 1: Title & Icon */}
                            <p className="font-semibold text-stone-100 flex items-center gap-3 truncate md:col-span-1" title={activity.title}>
                                <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                                <span className="truncate">{activity.title}</span>
                            </p>
                             {/* Column 2: Note */}
                            <div className="md:col-span-1 md:text-center min-w-0">
                                {activity.note && (
                                    <p className="text-sm text-stone-400 italic truncate" title={activity.note}>
                                        "{activity.note}"
                                    </p>
                                )}
                            </div>
                             {/* Column 3: Status & Date */}
                            <div className="md:col-span-1 text-right flex flex-col items-end justify-center">
                                <div className="font-semibold flex items-center justify-end gap-2">
                                    {activity.rewardsText && (
                                        <span 
                                            className={activity.status === 'Pending' ? 'text-stone-500 opacity-70' : 'text-stone-300'}
                                            title={activity.status === 'Pending' ? 'Reward pending approval.' : undefined}
                                        >
                                            {activity.rewardsText}
                                        </span>
                                    )}
                                    <span className={statusColorClass(activity.status)}>{activity.status}</span>
                                </div>
                                <div className="text-xs text-stone-400 mt-1 space-y-0.5">
                                    {activity.actorName && activity.actorName !== currentUser.gameName && (
                                        <p>by {activity.actorName}</p>
                                    )}
                                    <p>{formatTimestamp(activity.date)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-stone-400 text-sm italic">No recent activity.</p>}
        </Card>
    );
};

export default RecentActivityCard;