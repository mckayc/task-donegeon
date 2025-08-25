import React from 'react';
import Card from '../user-interface/Card';
import { Terminology } from '../../types/app';
import { QuestCompletionStatus } from '../quests/types';

type Activity = {
    id: string;
    title: string;
    note?: string;
    rewardsText?: string;
    status: string;
    icon: string;
};

interface RecentActivityCardProps {
    activities: Activity[];
    terminology: Terminology;
}

const statusColorClass = (status: string) => {
    switch (status) {
        case "Awarded!":
        case QuestCompletionStatus.Approved:
        case "Completed":
        case "Exchanged!":
            return 'text-green-400';
        case QuestCompletionStatus.Pending:
            return 'text-yellow-400';
        case QuestCompletionStatus.Rejected:
            return 'text-red-400';
        default:
            return 'text-stone-400';
    }
};

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities, terminology }) => {
    return (
        <Card title={`Recent ${terminology.history}`}>
            {activities.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {activities.map(activity => (
                        <div key={activity.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-sm">
                            <p className="text-stone-300 truncate md:col-span-1 flex items-center gap-2" title={activity.title}>
                               <span className="text-xl">{activity.icon}</span>
                               <span>{activity.title}</span>
                            </p>
                            <p className="text-stone-400 italic truncate md:col-span-1 md:text-center" title={activity.note}>
                                {activity.note}
                            </p>
                            <p className={`font-semibold ${statusColorClass(activity.status)} flex-shrink-0 md:col-span-1 md:text-right flex items-center md:justify-end gap-2`}>
                                {activity.rewardsText && <span className="text-stone-300 font-semibold">{activity.rewardsText}</span>}
                                <span>{activity.status}</span>
                            </p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-stone-400 text-sm italic">No recent activity.</p>}
        </Card>
    );
};

export default RecentActivityCard;