import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import { logger } from '../utils/logger';

// State managed by this context
interface NotificationsState {
  notifications: Notification[];
}

// Dispatch functions provided by this context
interface NotificationsDispatch {
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (notificationId: string) => void;
  updateNotification: (notificationId: string, updates: Partial<Omit<Notification, 'id'>>) => void;
}

const NotificationsStateContext = createContext<NotificationsState | undefined>(undefined);
const NotificationsDispatchContext = createContext<NotificationsDispatch | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logger.log('[NotificationDispatch] addNotification called:', notification);
    setNotifications(prev => [...prev, { ...notification, id: uniqueId }]);
    return uniqueId;
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const updateNotification = useCallback((notificationId: string, updates: Partial<Omit<Notification, 'id'>>) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, ...updates } : n));
  }, []);


  const stateValue: NotificationsState = { notifications };
  const dispatchValue: NotificationsDispatch = { addNotification, removeNotification, updateNotification };

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