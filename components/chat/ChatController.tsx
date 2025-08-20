
import React, { useMemo } from 'react';
import { useData } from '../../context/DataProvider';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { Role, ChatMessage } from '../../types';

const ChatController: React.FC = () => {
    const { settings, chatMessages, guilds } = useData();
    const { isChatOpen } = useUIState();
    const { currentUser } = useAuthState();
    const { toggleChat } = useUIDispatch();

    const showBugReporter = useMemo(() => {
        return settings.developerMode.enabled && currentUser?.role === Role.DonegeonMaster;
    }, [settings.developerMode.enabled, currentUser?.role]);

    const unreadMessagesCount = useMemo(() => {
        if (!currentUser) return 0;
        
        const unreadDms = chatMessages.filter(
            (msg: ChatMessage) => msg.recipientId === currentUser.id && 
                    !msg.readBy.includes(currentUser.id) &&
                    msg.senderId !== currentUser.id
        );
        const uniqueSenders = new Set(unreadDms.map(msg => msg.senderId));
        
        const userGuildIds = new Set(guilds.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
        const unreadGuilds = new Set(
            chatMessages
                .filter((msg: ChatMessage) => 
                    msg.guildId && 
                    userGuildIds.has(msg.guildId) && 
                    !msg.readBy.includes(currentUser.id) &&
                    msg.senderId !== currentUser.id
                )
                .map(msg => msg.guildId)
        );
        
        return uniqueSenders.size + unreadGuilds.size;
      }, [chatMessages, currentUser, guilds]);

    if (!settings.chat.enabled || !currentUser || isChatOpen) {
        return null;
    }

    return (
        <div className={`fixed right-6 z-40 transition-all duration-300 ${showBugReporter ? 'bottom-24' : 'bottom-6'}`}>
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
