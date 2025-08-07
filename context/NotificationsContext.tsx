import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Notification } from '../types';

// State managed by this context
interface NotificationsState {
  notifications: Notification[];
}

// Dispatch functions provided by this context
interface NotificationsDispatch {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationsStateContext = createContext<NotificationsState | undefined>(undefined);
const NotificationsDispatchContext = createContext<NotificationsDispatch | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id: uniqueId }]);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const stateValue: NotificationsState = { notifications };
  const dispatchValue: NotificationsDispatch = { addNotification, removeNotification };

  return (
    <NotificationsStateContext.Provider value={stateValue}>
      <NotificationsDispatchContext.Provider value={dispatchValue}>
        {children}
      </NotificationsDispatchContext.Provider>
    </NotificationsStateContext.Provider>
  );
};

export const useNotificationsState = (): NotificationsState => {
  const context = useContext(NotificationsStateContext);
  if (context === undefined) throw new Error('useNotificationsState must be used within a NotificationsProvider');
  return context;
};

export const useNotificationsDispatch = (): NotificationsDispatch => {
  const context = useContext(NotificationsDispatchContext);
  if (context === undefined) throw new Error('useNotificationsDispatch must be used within a NotificationsProvider');
  return context;
};
