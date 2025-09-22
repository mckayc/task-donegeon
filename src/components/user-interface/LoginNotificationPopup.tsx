import React from 'react';
import { SystemNotification, SystemNotificationType, User } from '../../../types';
import Button from './Button';
import { useSystemDispatch } from '../../../context/SystemContext';
import { motion } from 'framer-motion';

const getIconForType = (type: SystemNotificationType) => {
    switch (type) {
        case SystemNotificationType.Announcement: return '📢';
        case SystemNotificationType.QuestAssigned: return '🗺️';
        case SystemNotificationType.TrophyAwarded: return '🏆';
        case SystemNotificationType.ApprovalRequired: return '✅';
        case SystemNotificationType.GiftReceived: return '🎁';
        case SystemNotificationType.TradeRequestReceived: return '↔️';
        case SystemNotificationType.TradeAccepted: return '🤝';
        case SystemNotificationType.TradeCancelled: return '❌';
        case SystemNotificationType.TradeRejected: return '🚫';
        default: return '🔔';
    }
};

const quotes = [
    "The journey of a thousand miles begins with a single step... or in this case, a single quest.",
    "Even the mightiest dragon was once a hatchling. Go forth and conquer your tasks!",
    "Fortune favors the bold, and the adventurer who does their chores.",
    "A clean keep is a happy keep. To the cleaning quests!",
    "Remember, every quest completed is a story told. What tale will you write today?"
];

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];


interface LoginNotificationPopupProps {
  notifications: SystemNotification[];
  user: User;
  onClose: () => void;
}

const LoginNotificationPopup: React.FC<LoginNotificationPopupProps> = ({ notifications, user, onClose }) => {
    const { markSystemNotificationsAsRead } = useSystemDispatch();

    const handleAcknowledge = () => {
        const notificationIds = notifications.map(n => n.id);
        markSystemNotificationsAsRead(notificationIds, user.id);
        onClose();
    };

    const handleLater = () => {
        onClose();
    };

    const groupedNotifications = notifications.reduce<Record<string, SystemNotification[]>>((acc, notif) => {
        const typeKey = notif.type.replace(/([A-Z])/g, ' $1').trim();
        if (!acc[typeKey]) {
            acc[typeKey] = [];
        }
        acc[typeKey].push(notif);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-stone-900/80 border border-stone-700/60 rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col backdrop-blur-sm"
            >
                <div className="px-6 py-4 border-b border-stone-700/60 flex items-center justify-between rounded-t-xl flex-shrink-0">
                    <h3 className="text-xl font-medieval text-emerald-400">Welcome Back, {user.gameName}!</h3>
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
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-stone-700/50 text-center">
                        <p className="text-sm text-stone-400 italic">"{randomQuote}"</p>
                    </div>
                </div>
                <div className="p-4 border-t border-stone-700/60 flex justify-end gap-4 flex-shrink-0">
                    <Button variant="secondary" onClick={handleLater}>Maybe Later</Button>
                    <Button onClick={handleAcknowledge}>Acknowledge</Button>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginNotificationPopup;
