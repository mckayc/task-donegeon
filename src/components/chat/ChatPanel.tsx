import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { Role, User, ChatMessage, Guild } from '../../../types';
import Avatar from '../user-interface/Avatar';
import Input from '../user-interface/Input';
import { XCircleIcon } from '../user-interface/Icons';
import Button from '../user-interface/Button';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { motion } from 'framer-motion';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { useCommunityState } from '../../context/CommunityContext';

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

export const ChatPanel: React.FC = () => {
    const { guilds } = useCommunityState();
    const { chatMessages, settings } = useSystemState();
    const { currentUser, users } = useAuthState();
    const { toggleChat } = useUIDispatch();
    const { sendMessage, markMessagesAsRead } = useSystemDispatch();
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
    }, [activeChatTarget, chatMessages, currentUser]);

    const handleSendMessage = async () => {
        if (!message.trim() || !currentUser) return;
        
        const payload: { recipientId?: string; guildId?: string; message: string; isAnnouncement?: boolean; } = {
            message: message.trim(),
        };

        if (isGuildChatTarget(activeChatTarget)) {
            payload.guildId = activeChatTarget.id;
            payload.isAnnouncement = isAnnouncement;
        } else if (activeChatTarget) {
            payload.recipientId = activeChatTarget.id;
        } else {
            return;
        }

        await sendMessage(payload);
        setMessage('');
        setIsAnnouncement(false);
    };

    const handleSelectChat = (target: ChatTarget) => {
        setActiveChatTarget(target);
        if (isGuildChatTarget(target)) {
            markMessagesAsRead({ guildId: target.id });
        } else {
            markMessagesAsRead({ partnerId: target.id });
        }
    };
    
    useEffect(() => {
        if (messagesContainerRef.current && !userScrolledUp) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [activeConversation, userScrolledUp]);

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
            setUserScrolledUp(!atBottom);
        }
    };

    if (!currentUser) return null;
    
    const panelVariants = {
        hidden: { x: isMobile ? "100vw" : 450 },
        visible: { x: 0 },
    };

    const isAdmin = currentUser.role === Role.DonegeonMaster;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={panelVariants}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-stone-900 border-l border-stone-700/60 shadow-2xl z-50 flex flex-col"
            data-bug-reporter-ignore
        >
            <div className="p-4 border-b border-stone-700/60 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-medieval text-emerald-400">Chat & Announcements</h2>
                <button onClick={toggleChat} className="text-stone-400 hover:text-white">
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/3 border-r border-stone-700/60 overflow-y-auto scrollbar-hide">
                    {chatPartners.map(partner => {
                        const isGuild = isGuildChatTarget(partner);
                        const hasUnread = isGuild ? unreadInfo.guilds.has(partner.id) : unreadInfo.dms.has(partner.id);

                        return (
                            <button
                                key={partner.id}
                                onClick={() => handleSelectChat(partner)}
                                className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${activeChatTarget?.id === partner.id ? 'bg-emerald-800/50' : 'hover:bg-stone-700/50'}`}
                            >
                                {isGuild ? (
                                    <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-xl">{partner.icon}</div>
                                ) : (
                                    <Avatar user={partner as User} className="w-10 h-10 rounded-full" />
                                )}
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold text-stone-200 truncate">{partner.gameName}</p>
                                </div>
                                {hasUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"></div>}
                            </button>
                        );
                    })}
                </div>

                <div className="w-2/3 flex flex-col">
                    <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
                        {activeChatTarget ? activeConversation.map(msg => {
                            const sender = users.find(u => u.id === msg.senderId);
                            const isMe = msg.senderId === currentUser.id;
                            
                            if (msg.isAnnouncement) {
                                return (
                                    <div key={msg.id} className="text-center my-2">
                                        <p className="text-xs font-bold text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full inline-block">📢 ANNOUNCEMENT 📢</p>
                                        <p className="text-sm text-stone-300 mt-1">{msg.message}</p>
                                    </div>
                                )
                            }

                            return (
                                <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {sender && <Avatar user={sender} className="w-8 h-8 rounded-full" />}
                                    <div className={`max-w-xs p-3 rounded-lg ${isMe ? 'bg-emerald-700 text-white' : 'bg-stone-700 text-stone-200'}`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-xs opacity-60 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex items-center justify-center h-full text-stone-500">
                                <p>Select a conversation to start chatting.</p>
                            </div>
                        )}
                    </div>
                    {activeChatTarget && (
                        <div className="p-4 border-t border-stone-700/60 flex-shrink-0">
                             <div className="flex items-start gap-2">
                                <Input
                                    as="textarea"
                                    rows={2}
                                    value={message}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder={`Message ${activeChatTarget.gameName}...`}
                                    className="flex-grow resize-none"
                                />
                                <Button onClick={handleSendMessage} disabled={!message.trim()} className="h-full">Send</Button>
                            </div>
                            {isAdmin && isGuildChatTarget(activeChatTarget) && (
                                <div className="mt-2">
                                    <ToggleSwitch enabled={isAnnouncement} setEnabled={setIsAnnouncement} label="Send as Announcement" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};