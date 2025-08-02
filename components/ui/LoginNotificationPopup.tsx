import React from 'react';
import { SystemNotification, SystemNotificationType, User } from '../../types';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '../../context/AppContext';
import { XCircleIcon } from '@/components/ui/Icons';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

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
            <Card className="relative max-w-2xl w-full max-h-[80vh] flex flex-col backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-display text-accent">Welcome Back, {user.gameName}!</CardTitle>
                </CardHeader>
                 <button onClick={handleDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <XCircleIcon className="w-6 h-6" />
                </button>

                <CardContent className="space-y-6 overflow-y-auto scrollbar-hide flex-grow">
                    <p className="text-foreground text-center">Here's what you missed:</p>
                    {Object.entries(groupedNotifications).map(([type, notifs]) => (
                        <div key={type}>
                            <h4 className="text-lg font-bold text-accent-light mb-2 flex items-center gap-2">
                                {getIconForType(notifs[0].type)} {type}
                            </h4>
                            <ul className="space-y-2 list-disc list-inside pl-2">
                                {notifs.map(n => (
                                    <li key={n.id} className="text-foreground">
                                        {n.message}
                                        <span className="text-xs text-muted-foreground ml-2">({new Date(n.timestamp).toLocaleString()})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={handleDismiss}>Got It, Let's Go!</Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginNotificationPopup;