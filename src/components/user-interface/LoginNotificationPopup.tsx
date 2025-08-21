

import React from 'react';
import { SystemNotification, SystemNotificationType, User } from '../../types';
import Button from './Button';
import { XCircleIcon } from './Icons';
import { useSystemDispatch } from '../../context/SystemContext';

// Icons for different notification types
const getIconForType = (type: SystemNotificationType) => {
    switch (type) {
        case SystemNotificationType.Announcement: return '📢';
        case SystemNotificationType.QuestAssigned: return '🗺️';
        case SystemNotificationType.TrophyAwarded: return '🏆';
        case SystemNotificationType.ApprovalRequired: return '✅';
        default: return '🔔';
    }
};

interface LoginNotificationPopupProps {
  notifications: SystemNotification[];
  user: User;
  onClose: () => void;
}

const LoginNotificationPopup: React.FC<LoginNotificationPopupProps> = ({ notifications, user, onClose }) => {
    const { markSystemNotificationsAsRead } = useSystemDispatch();

    const handleDismiss = () => {
        const notificationIds = notifications.map(n => n.id);
        markSystemNotificationsAsRead(notificationIds, user.id);
        onClose();
    };

    const groupedNotifications = notifications.reduce((acc, notif) => {
        const typeKey = notif.type.replace(/([A-Z])/g, ' $1').trim(); // Add spaces for readability
        if (!acc[typeKey]) {
            acc[typeKey] = [];
        }
        acc[typeKey].push(notif);
        return acc;
    }, {} as Record<string, SystemNotification[]>);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="relative bg-stone-900/80 border border-stone-700/60 rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-stone-700/60 flex items-center justify-between rounded-t-xl flex-shrink-0">
                    <h3 className="text-xl font-medieval text-emerald-400">Welcome Back, {user.gameName}!</h3>
                     <button onClick={handleDismiss} className="text-stone-400 hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-grow">
                    <p className="text-stone-300 text-center">Here's what you missed:</p>
                    {Object.entries(groupedNotifications).map(([type, notifs]) => (
                        <div key={type}>
                            <h4 className="text-lg font-bold text-accent-light mb-2 flex items-center gap-2">
                                {notifs.length > 0 && getIconForType(notifs[0].type)} {type}
                            </h4>
                            <ul className="space-y-2 list-disc list-inside pl-2">
                                {notifs.map(n => (
                                    <li key={n.id} className="text-stone-200">
                                        {n.message}
                                        <span className="text-xs text-stone-500 ml-2">({new Date(n.timestamp).toLocaleString()})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-stone-700/60 text-center flex-shrink-0">
                    <Button onClick={handleDismiss}>Got It, Let's Go!</Button>
                </div>
            </div>
        </div>
    );
};

export default LoginNotificationPopup;