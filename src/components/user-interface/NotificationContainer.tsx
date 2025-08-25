import React from 'react';
import { useNotificationsState, useNotificationsDispatch } from '../../context/NotificationsContext';
import Notification from './Notification';
import { AnimatePresence } from 'framer-motion';

const NotificationContainer: React.FC = () => {
    const { notifications } = useNotificationsState();
    const { removeNotification } = useNotificationsDispatch();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                <AnimatePresence>
                    {notifications.map(notification => (
                        <Notification
                            key={notification.id}
                            notification={notification}
                            onDismiss={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationContainer;