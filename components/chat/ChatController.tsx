import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { useUIState, useUIDispatch } from '../../context/UIStateContext';

const ChatController: React.FC = () => {
    const { settings, chatMessages } = useAppState();
    const { currentUser } = useAuthState();
    const { isChatOpen } = useUIState();
    const { toggleChat } = useUIDispatch();

    const unreadMessagesCount = useMemo(() => {
        if (!currentUser) return 0;
        const sendersWithUnread = new Set(
            chatMessages
                .filter(msg => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id))
                .map(msg => msg.senderId)
        );
        return sendersWithUnread.size;
    }, [chatMessages, currentUser]);

    if (!settings.chat.enabled || !currentUser || isChatOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <button
                onClick={toggleChat}
                className="relative w-16 h-16 bg-emerald-600 rounded-full shadow-lg text-white flex items-center justify-center text-3xl hover:bg-emerald-500 transition-transform transform hover:scale-110"
                aria-label="Toggle Chat"
            >
                {settings.chat.chatEmoji}
                {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-stone-800">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default ChatController;