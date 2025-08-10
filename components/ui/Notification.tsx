import React, { useEffect, useRef, useCallback } from 'react';
import { Notification as NotificationType } from '../../types';
import { motion } from 'framer-motion';

interface NotificationProps {
  notification: NotificationType;
  onDismiss: () => void;
}

const getIcon = (type: NotificationType['type'], customIcon?: string) => {
    if (type === 'trophy' && customIcon) {
        return <span className="text-2xl">{customIcon}</span>;
    }
    const iconClasses = 'w-6 h-6';
    switch (type) {
        case 'success':
            return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${iconClasses} text-green-400`}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'error':
            return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${iconClasses} text-red-400`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.007H12v-.007z" /></svg>;
        case 'info':
            return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${iconClasses} text-sky-400`}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
        default:
            return null;
    }
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
    const onDismissRef = useRef(onDismiss);
    useEffect(() => {
        onDismissRef.current = onDismiss;
    });

    const handleDismiss = useCallback(() => {
        onDismissRef.current();
    }, []);
  
    useEffect(() => {
      const duration = notification.duration === 0 ? 0 : notification.duration || 5000;

      if (duration > 0) {
        const timerId = setTimeout(() => {
          handleDismiss();
        }, duration);
    
        return () => {
          clearTimeout(timerId);
        };
      }
    }, [notification.id, notification.duration, handleDismiss]);
  
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className="max-w-sm w-full bg-stone-800 shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
      >
        <div className="p-4 border border-stone-700/80 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type, notification.icon)}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className={`text-sm font-semibold ${notification.type === 'trophy' ? 'text-amber-300' : 'text-stone-100'}`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className="inline-flex text-stone-400 hover:text-stone-200"
                onClick={handleDismiss}
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  export default Notification;