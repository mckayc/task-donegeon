
import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import ChatPanel from './ChatPanel';

const ChatController: React.FC = () => {
  const { isChatOpen } = useAppState();
  const { toggleChat } = useAppDispatch();

  if (!isChatOpen) {
    return null;
  }

  return <ChatPanel onClose={toggleChat} />;
};

export default ChatController;
