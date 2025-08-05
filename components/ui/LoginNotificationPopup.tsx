import React from 'react';
import { SystemNotification, SystemNotificationType, User } from '../../types';
import Button from './Button';
import Card from './Card';
import { useAppDispatch } from '../../context/AppContext';

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
    const { markSystemNotificationsAsRead } = useAppDispatch();

    const handleDismiss = () => {
        const notificationIds = notifications.map(n => n.id);
        markSystemNotificationsAsRead(notificationIds);
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
            <Card title={`Welcome Back, ${user.gameName}!`} className="max-w-2xl w-full max-h-[80vh] flex flex-col bg-stone-900/80">
                <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-grow">
                    <p className="text-stone-300 text-center">Here's what you missed:</p>
                    {Object.entries(groupedNotifications).map(([type, notifs]) => (
                        <div key={type}>
                            <h4 className="text-lg font-bold text-accent-light mb-2 flex items-center gap-2">
                                {getIconForType(notifs[0].type)} {type}
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
                <div className="p-4 border-t border-stone-700/60 text-center">
                    <Button onClick={handleDismiss}>Got It, Let's Go!</Button>
                </div>
            </Card>
        </div>
    );
};

export default LoginNotificationPopup;
