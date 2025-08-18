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
import { motion } from 'framer-motion';

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

const ChatPanel = () => {
    const { guilds, chatMessages, settings } = useData();
    const { currentUser, users } = useAuthState();
    const { toggleChat } = useUIDispatch();
    const { sendMessage, markMessagesAsRead } = useActionsDispatch();
    const [activeChatTarget, setActiveChatTarget] = useState<ChatTarget | null>(null);
    const [message, setMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chatPartners = useMemo(() => {
        if (!currentUser) return [];
        
        const userGuilds: ChatTarget[] = guilds
            .filter(g => g.memberIds.includes(currentUser.id))
            .map(guild => ({
                id: guild.id,
                gameName: `${guild.name} Hall`,
                isGuild: true,
                icon: '🏰',
            }));
    
        const userPartners: ChatTarget[] = users.filter(user => user.id !== currentUser.id);
    
        return [...userGuilds, ...userPartners];
    }, [currentUser, users, guilds]);

    const unreadInfo = useMemo(() => {
        if (!currentUser) return { dms: new Set(), guilds: new Set() };

        const dms = new Set(
            chatMessages
                .filter(msg => 
                    msg.recipientId === currentUser.id && 
                    !msg.readBy.includes(currentUser.id) &&
                    msg.senderId !== currentUser.id
                )
                .map(msg => msg.senderId)
        );

        const userGuildIds = new Set(guilds.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
        const guildsWithUnread = new Set(
            chatMessages
                .filter(msg => 
                    msg.guildId && 
                    userGuildIds.has(msg.guildId) && 
                    !msg.readBy.includes(currentUser.id) &&
                    msg.senderId !== currentUser.id
                )
                .map(msg => msg.guildId)
        );
        
        return { dms, guilds: guildsWithUnread };
    }, [chatMessages, currentUser, guilds]);

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
            const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5;
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

    const panelStyles = isMobile 
        ? { width: '100vw', height: '100vh', top: 0, left: 0 }
        : { width: 550, height: 600, bottom: '1.5rem', right: '1.5rem' };

    return (
        <motion.div
            data-bug-reporter-ignore
            className="fixed z-[98] flex flex-col bg-stone-800 border border-stone-700 rounded-xl shadow-2xl"
            style={panelStyles}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            <div
                className="p-4 border-b border-stone-700 flex-shrink-0"
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-medieval text-accent flex items-center gap-2">
                        {settings.terminology.link_chat}
                    </h3>
                    <button onClick={toggleChat} className="text-stone-400 hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar */}
                <div className={`border-r border-stone-700 flex flex-col flex-shrink-0 transition-all duration-300 ${isMobile ? (activeChatTarget ? 'hidden' : 'w-full') : 'w-48'}`}>
                    <h4 className="p-3 font-semibold text-stone-300 border-b border-stone-700 flex-shrink-0">Conversations</h4>
                    <div className="flex-grow overflow-y-auto scrollbar-hide">
                        {chatPartners.map(partner => {
                            const hasUnread = unreadInfo.dms.has(partner.id) || (isGuildChatTarget(partner) && unreadInfo.guilds.has(partner.id));
                            return (
                                <button
                                    key={partner.id}
                                    onClick={() => setActiveChatTarget(partner)}
                                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                                        activeChatTarget?.id === partner.id ? 'bg-emerald-800/50' : 'hover:bg-stone-700/50'
                                    }`}
                                >
                                    {isGuildChatTarget(partner) ? (
                                        <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-xl flex-shrink-0">{partner.icon}</div>
                                    ) : (
                                        <Avatar user={partner as User} className="w-10 h-10 rounded-full flex-shrink-0" />
                                    )}
                                    <span className="flex-grow truncate text-stone-200 text-sm font-semibold">{partner.gameName}</span>
                                    {hasUnread && (
                                        <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Conversation Area */}
                <div className={`flex flex-col flex-grow ${isMobile && !activeChatTarget ? 'hidden' : ''}`}>
                    {activeChatTarget ? (
                        <>
                            <div className="p-3 border-b border-stone-700 flex-shrink-0 flex items-center gap-3">
                                {isMobile && (
                                    <Button variant="secondary" size="sm" onClick={() => setActiveChatTarget(null)} className="!py-1 !px-2">&larr; Back</Button>
                                )}
                                {isGuildChatTarget(activeChatTarget) ? (
                                    <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-lg flex-shrink-0">{activeChatTarget.icon}</div>
                                ) : (
                                    <Avatar user={activeChatTarget as User} className="w-8 h-8 rounded-full flex-shrink-0" />
                                )}
                                <span className="font-bold text-stone-100">{activeChatTarget.gameName}</span>
                            </div>
                            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide">
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
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-500">
                            <p>Select a conversation from the left.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatPanel;
