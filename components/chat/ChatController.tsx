
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { ChatBubbleIcon } from '../ui/Icons';
import ChatPanel from './ChatPanel';

const ChatController: React.FC = () => {
  const { currentUser, chatMessages } = useAppState();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return chatMessages.filter(
      msg => msg.recipientId === currentUser.id && !msg.isRead
    ).length;
  }, [chatMessages, currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-full btn-primary shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform"
          aria-label="Open Chat"
        >
          <ChatBubbleIcon className="w-8 h-8" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 border-2 border-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default ChatController;
