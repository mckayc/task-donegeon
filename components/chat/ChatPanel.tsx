

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataProvider';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useActionsDispatch } from '../../context/ActionsContext';
import { useAuthState } from '../../context/AuthContext';
import { Role, User, ChatMessage, Guild } from '../../types';
import Avatar from '../user-interface/Avatar';
import Input from '../user-interface/Input';
import { XCircleIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';

type GuildTarget = {
    id: string;
    gameName: string;
    isGuild: true;
    icon: string;
};
type ChatTarget = User | GuildTarget;

const isGuildChatTarget = (target: ChatTarget | null): target is GuildTarget => {
    return !!target && 'isGuild' in target && target.isGuild === true;
}

const ChatPanel: React.FC = () => {
    const { guilds, chatMessages, settings } = useData();
    const { isChatOpen } = useUIState();
    const { currentUser, users } = useAuthState();
    const { toggleChat } = useUIDispatch();
    const { sendMessage, markMessagesAsRead } = useActionsDispatch();
    const [activeChatTarget, setActiveChatTarget] = useState<ChatTarget | null>(null);
    const [message, setMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const guildChatTargets = useMemo((): ChatTarget[] => {
        if (!currentUser) return [];
        const userGuilds = guilds.filter((g: Guild) => g.memberIds.includes(currentUser.id));
        return userGuilds.map((guild: Guild) => ({
            id: guild.id,
            gameName: `${guild.name} Hall`,
            isGuild: true,
            icon: '🏰',
        }));
    }, [currentUser, guilds]);

    const chatPartners = useMemo(() => {
        if (!currentUser) return [];
        const partners: ChatTarget[] = users.filter(user => user.id !== currentUser.id);
        return [...guildChatTargets, ...partners];
    }, [currentUser, users, guildChatTargets]);

    const unreadInfo = useMemo(() => {
        if (!currentUser) return { dms: new Set(), guilds: new Set() };
        const dms = new Set(chatMessages.filter((msg: ChatMessage) => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id)).map((msg: ChatMessage) => msg.senderId));
        const guildsWithUnread = new Set(chatMessages.filter((msg: ChatMessage) => msg.guildId && !msg.readBy.includes(currentUser.id) && users.find(u => u.id === msg.senderId)).map((msg: ChatMessage) => msg.guildId));
        return { dms, guilds: guildsWithUnread };
    }, [chatMessages, currentUser, users]);

    const activeConversation = useMemo(() => {
        if (!currentUser || !activeChatTarget) return [];
        
        if (isGuildChatTarget(activeChatTarget)) {
            return chatMessages.filter((msg: ChatMessage) => msg.guildId === activeChatTarget.id)
                .sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

        return chatMessages.filter((msg: ChatMessage) =>
            (msg.senderId === currentUser.id && msg.recipientId === activeChatTarget.id) ||
            (msg.senderId === activeChatTarget.id && msg.recipientId === currentUser.id)
        ).sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [chatMessages, currentUser, activeChatTarget]);
    
    const unreadInActiveConvo = useMemo(() => {
        if (!currentUser || !activeConversation) return 0;
        // Don't count our own messages as unread
        return activeConversation.filter((msg: ChatMessage) => msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id)).length;
    }, [activeConversation, currentUser]);

    useEffect(() => {
        if (activeChatTarget && unreadInActiveConvo > 0) {
            if (isGuildChatTarget(activeChatTarget)) {
                markMessagesAsRead({ guildId: activeChatTarget.id });
            } else {
                markMessagesAsRead({ partnerId: activeChatTarget.id });
            }
        }
    }, [activeChatTarget, unreadInActiveConvo, markMessagesAsRead]);

    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, []);

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5; // Add a small buffer
            setUserScrolledUp(!atBottom);
        }
    };
    
    useEffect(() => {
        if (!userScrolledUp) {
            scrollToBottom();
        }
    }, [activeConversation, userScrolledUp, scrollToBottom]);
    
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !activeChatTarget || !currentUser) return;
        
        sendMessage({
            senderId: currentUser.id,
            recipientId: isGuildChatTarget(activeChatTarget) ? undefined : activeChatTarget.id,
            guildId: isGuildChatTarget(activeChatTarget) ? activeChatTarget.id : undefined,
            message: message,
            isAnnouncement: isAnnouncement,
        });
        
        setMessage('');
        setIsAnnouncement(false);
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div data-bug-reporter-ignore className={`flex-shrink-0 flex-col bg-stone-800 border-l border-stone-700 transition-all duration-300 ${isChatOpen ? 'w-80 flex' : 'w-0 hidden'}`}>
            <div className="p-4 border-b border-stone-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medieval text-accent">{settings.terminology.link_chat}</h3>
                    <button onClick={toggleChat} className="text-stone-400 hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="p-2 border-b border-stone-700 flex-shrink-0">
                <Input as="select" value={activeChatTarget?.id || ''} onChange={e => setActiveChatTarget(chatPartners.find(p => p.id === e.target.value) || null)} aria-label="Select chat partner">
                    <option value="">Select a chat...</option>
                    {chatPartners.map(partner => (
                        <option key={partner.id} value={partner.id}>
                            {isGuildChatTarget(partner) ? '🏰' : '👤'} {partner.gameName}
                            {(unreadInfo.dms.has(partner.id) || (isGuildChatTarget(partner) && unreadInfo.guilds.has(partner.id))) ? ' (New!)' : ''}
                        </option>
                    ))}
                </Input>
            </div>
            
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide">
                {!activeChatTarget && <p className="text-center text-stone-500 pt-10">Select a user or guild to start chatting.</p>}
                {activeConversation.map(msg => {
                    const sender = users.find(u => u.id === msg.senderId);
                    const isMyMessage = msg.senderId === currentUser.id;
                    const isSystemAnnouncement = msg.isAnnouncement && isGuildChatTarget(activeChatTarget);

                    if (isSystemAnnouncement) {
                        return (
                             <div key={msg.id} className="text-center my-2">
                                <span className="px-3 py-1 bg-amber-800 text-amber-200 text-xs font-bold rounded-full">{msg.message}</span>
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                            {sender && <Avatar user={sender} className="w-10 h-10 rounded-full flex-shrink-0" />}
                            <div className={`p-3 rounded-lg max-w-xs ${isMyMessage ? 'bg-emerald-800' : 'bg-stone-700'}`}>
                                {!isMyMessage && sender && <p className="font-bold text-sm text-accent-light mb-1">{sender.gameName}</p>}
                                <p className="text-stone-200 whitespace-pre-wrap break-words">{msg.message}</p>
                                <p className="text-xs text-stone-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {activeChatTarget && (
                <form onSubmit={handleSend} className="p-4 border-t border-stone-700 flex-shrink-0 space-y-2">
                    <div className="flex gap-2">
                        <Input 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-grow h-10"
                        />
                        <Button type="submit" disabled={!message.trim()} className="h-10">Send</Button>
                    </div>
                    {currentUser.role === Role.DonegeonMaster && isGuildChatTarget(activeChatTarget) && (
                        <ToggleSwitch enabled={isAnnouncement} setEnabled={setIsAnnouncement} label="Send as Announcement" />
                    )}
                </form>
            )}
        </div>
    );
};

export default ChatPanel;
