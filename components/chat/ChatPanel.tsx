import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Avatar from '../ui/avatar';
import { Input } from '@/components/ui/input';
import { XCircleIcon, ArrowLeftIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import ToggleSwitch from '../ui/toggle-switch';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type ChatTarget = User | {
    id: string;
    gameName: string;
    isGuild: true;
    icon: string;
};

const ChatPanel: React.FC = () => {
    const { currentUser, users, guilds, chatMessages, isChatOpen, settings, isAiReplying } = useAppState();
    const { toggleChat, sendMessage, markMessagesAsRead } = useAppDispatch();
    const [activeChatTarget, setActiveChatTarget] = useState<ChatTarget | null>(null);
    const [message, setMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Draggable & Resizable State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [size, setSize] = useLocalStorage('chat-panel-size', { width: 600, height: 700 });
    const [position, setPosition] = useLocalStorage('chat-panel-position', { x: window.innerWidth - 624, y: window.innerHeight - 724 });
    const panelRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, isResizing: false, initialX: 0, initialY: 0, initialWidth: 0, initialHeight: 0 });

    useEffect(() => {
        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);

            if (!mobile) {
                // This logic is complex because the useLocalStorage hook is simple and doesn't
                // support functional updates. We read the stateful values and then set them.
                const currentSize = JSON.parse(localStorage.getItem('chat-panel-size') || JSON.stringify({ width: 600, height: 700 }));
                const currentPos = JSON.parse(localStorage.getItem('chat-panel-position') || JSON.stringify({ x: 20, y: 20 }));

                const clampedWidth = clamp(currentSize.width, 400, window.innerWidth - 40);
                const clampedHeight = clamp(currentSize.height, 500, window.innerHeight - 40);
                setSize({ width: clampedWidth, height: clampedHeight });

                const clampedX = clamp(currentPos.x, 20, window.innerWidth - clampedWidth - 20);
                const clampedY = clamp(currentPos.y, 20, window.innerHeight - clampedHeight - 20);
                setPosition({ x: clampedX, y: clampedY });
            }
        };

        handleResize(); // Run once on mount to clamp initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSize, setPosition]);


    const handleMouseMove = useCallback((e: MouseEvent) => {
        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

        if (dragRef.current.isDragging) {
            const newX = e.clientX - dragRef.current.initialX;
            const newY = e.clientY - dragRef.current.initialY;
            
            setPosition({
                x: clamp(newX, 0, window.innerWidth - size.width),
                y: clamp(newY, 0, window.innerHeight - size.height)
            });
        }
        if (dragRef.current.isResizing) {
            const newWidth = dragRef.current.initialWidth + (e.clientX - dragRef.current.initialX);
            const newHeight = dragRef.current.initialHeight + (e.clientY - dragRef.current.initialY);
            
            setSize({
                width: clamp(newWidth, 400, window.innerWidth - position.x),
                height: clamp(newHeight, 500, window.innerHeight - position.y)
            });
        }
    }, [position.x, position.y, setPosition, setSize, size.width, size.height]);

    const handleMouseUp = useCallback(() => {
        dragRef.current.isDragging = false;
        dragRef.current.isResizing = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);
    
    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMobile || (e.target as HTMLElement).closest('button')) return;
        dragRef.current.isDragging = true;
        dragRef.current.initialX = e.clientX - position.x;
        dragRef.current.initialY = e.clientY - position.y;
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dragRef.current.isResizing = true;
        dragRef.current.initialX = e.clientX;
        dragRef.current.initialY = e.clientY;
        dragRef.current.initialWidth = size.width;
        dragRef.current.initialHeight = size.height;
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };


    const guildChatTargets = useMemo((): ChatTarget[] => {
        if (!currentUser) return [];
        const userGuilds = guilds.filter(g => g.memberIds.includes(currentUser.id));
        return userGuilds.map(guild => ({
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
        const dms = new Set(chatMessages.filter(msg => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id) && users.find(u => u.id === msg.senderId)).map(msg => msg.senderId));
        const guildsWithUnread = new Set(chatMessages.filter(msg => msg.guildId && !msg.readBy.includes(currentUser.id) && users.find(u => u.id === msg.senderId)).map(msg => msg.guildId));
        return { dms, guilds: guildsWithUnread };
    }, [chatMessages, currentUser, users]);

    const activeConversation = useMemo(() => {
        if (!currentUser || !activeChatTarget) return [];
        
        if ('isGuild' in activeChatTarget && activeChatTarget.isGuild) {
            return chatMessages.filter(msg => msg.guildId === activeChatTarget.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

        return chatMessages.filter(msg =>
            (msg.senderId === currentUser.id && msg.recipientId === activeChatTarget.id) ||
            (msg.senderId === activeChatTarget.id && msg.recipientId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [chatMessages, currentUser, activeChatTarget]);

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
        if (activeChatTarget) {
            if ('isGuild' in activeChatTarget && activeChatTarget.isGuild) {
                markMessagesAsRead({ guildId: activeChatTarget.id });
            } else {
                markMessagesAsRead({ partnerId: activeChatTarget.id });
            }
        }
    }, [activeChatTarget, activeConversation, markMessagesAsRead]);
    
    useEffect(() => {
        if (!userScrolledUp) {
            scrollToBottom();
        }
    }, [activeConversation, userScrolledUp, scrollToBottom, isAiReplying]);
    
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !activeChatTarget) return;
    
        const currentMessage = message;
        const currentIsAnnouncement = isAnnouncement;
        
        // Optimistically clear UI
        setMessage('');
        if (currentIsAnnouncement) {
            setIsAnnouncement(false);
        }
        setUserScrolledUp(false);
    
        const payload: any = { message: currentMessage };
        if ('isGuild' in activeChatTarget && activeChatTarget.isGuild) {
            payload.guildId = activeChatTarget.id;
            payload.isAnnouncement = currentIsAnnouncement;
        } else {
            payload.recipientId = activeChatTarget.id;
        }
        
        try {
            await sendMessage(payload);
            // On success, the websocket will handle the UI update.
        } catch (error) {
            // On failure, restore the message and toggle
            setMessage(currentMessage);
            if (payload.isAnnouncement) {
                setIsAnnouncement(true);
            }
            // Notification is handled by apiRequest
            console.error("Failed to send message:", error);
        }
    };
    
    useEffect(() => {
        setUserScrolledUp(false);
        setTimeout(scrollToBottom, 0); 
    }, [activeChatTarget, scrollToBottom]);


    if (!isChatOpen || !currentUser) return null;
    
    let lastDate: string | null = null;
    
    return (
        <div
            ref={panelRef}
            className={`fixed z-50 bg-card border shadow-2xl flex flex-col
                        ${isMobile ? 'inset-0 rounded-none' : 'rounded-xl'}`}
            style={!isMobile ? {
                width: `${size.width}px`,
                height: `${size.height}px`,
                transform: `translate(${position.x}px, ${position.y}px)`
            } : {}}
        >
            <header 
                onMouseDown={handleDragMouseDown}
                className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${!isMobile ? 'cursor-move' : ''}`}
            >
                <h3 className="font-bold text-lg text-card-foreground">Chat</h3>
                <button onClick={toggleChat} className="text-muted-foreground hover:text-foreground"><XCircleIcon className="w-6 h-6"/></button>
            </header>
            
            <div className="flex-grow flex md:flex-row flex-col overflow-hidden relative">
                <aside className={`w-full md:w-1/3 border-r overflow-y-auto transition-transform duration-300 absolute md:static inset-0 bg-card ${activeChatTarget ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                    {chatPartners.map(target => {
                        const isGuild = 'isGuild' in target && target.isGuild;
                        const hasUnread = isGuild ? unreadInfo.guilds.has(target.id) : unreadInfo.dms.has(target.id);
                        return (
                            <button key={target.id} onClick={() => setActiveChatTarget(target)} className={`w-full flex items-center gap-2 p-2 text-left hover:bg-accent/50 ${activeChatTarget?.id === target.id ? 'bg-primary/20' : ''}`}>
                                {isGuild ? <span className="w-8 h-8 flex-shrink-0 rounded-full bg-background flex items-center justify-center text-lg">{target.icon}</span> : <Avatar user={target as User} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden" />}
                                <span className="text-sm font-semibold text-card-foreground truncate flex-grow">{target.gameName}</span>
                                {hasUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"></div>}
                            </button>
                        );
                    })}
                </aside>

                <main className={`w-full md:w-2/3 flex flex-col absolute inset-0 md:static transition-transform duration-300 bg-card ${activeChatTarget ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    {activeChatTarget ? (
                        <>
                            <div className="p-3 border-b flex-shrink-0 flex items-center justify-center relative">
                                <button onClick={() => setActiveChatTarget(null)} className="md:hidden absolute left-4 text-muted-foreground hover:text-foreground">
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                                <p className="font-bold text-center text-card-foreground">{activeChatTarget.gameName}</p>
                            </div>
                            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-3 space-y-3 overflow-y-auto">
                                {activeConversation.map(msg => {
                                    const msgDate = new Date(msg.timestamp).toLocaleDateString();
                                    const showDateSeparator = msgDate !== lastDate;
                                    lastDate = msgDate;
                                    const isOwnMessage = msg.senderId === currentUser.id;
                                    const sender = users.find(u => u.id === msg.senderId);
                                    const isMsgAnnouncement = msg.isAnnouncement && 'isGuild' in activeChatTarget && activeChatTarget.isGuild;

                                    if (!sender) return null; // FIX: Don't render messages from deleted users

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="text-center text-xs text-muted-foreground my-2">
                                                    --- {new Date(msg.timestamp).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })} ---
                                                </div>
                                            )}
                                            <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                {!isOwnMessage && 'isGuild' in activeChatTarget && activeChatTarget.isGuild && sender && (
                                                    <Avatar user={sender} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden self-start" />
                                                )}
                                                <div className={`max-w-xs px-3 py-2 rounded-lg flex flex-col ${
                                                    isMsgAnnouncement 
                                                    ? 'bg-amber-800/60 border border-amber-600'
                                                    : isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                                                }`}>
                                                    {isMsgAnnouncement && (
                                                        <div className="text-xs font-bold text-amber-200 mb-1 border-b border-amber-500/50 pb-1">📢 Announcement</div>
                                                    )}
                                                    {!isOwnMessage && 'isGuild' in activeChatTarget && activeChatTarget.isGuild && sender && !isMsgAnnouncement && (
                                                        <p className="text-xs font-bold text-accent-light mb-1">{sender.gameName}</p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                                 {isAiReplying && activeChatTarget?.id === 'user-ai-assistant' && (
                                    <div className="flex items-end gap-2 justify-start">
                                        <Avatar user={users.find(u => u.id === 'user-ai-assistant')!} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden self-start" />
                                        <div className="max-w-xs px-4 py-3 rounded-lg flex items-center gap-1.5 bg-background text-foreground">
                                            <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                            <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {activeChatTarget && 'isGuild' in activeChatTarget && activeChatTarget.isGuild && currentUser.role === Role.DonegeonMaster && (
                                <div className="p-2 border-t">
                                    <ToggleSwitch 
                                        enabled={isAnnouncement}
                                        setEnabled={setIsAnnouncement}
                                        label={`Send as ${settings.terminology.group} Announcement`}
                                    />
                                </div>
                            )}

                            <form onSubmit={handleSend} className="p-3 border-t flex-shrink-0 flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    autoComplete="off"
                                    className="flex-grow"
                                />
                                <Button type="submit">Send</Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                            Select a user or guild to start chatting.
                        </div>
                    )}
                </main>
            </div>
             {!isMobile && (
                <div
                    onMouseDown={handleResizeMouseDown}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M 0 10 L 10 0 M 5 10 L 10 5 M 8 10 L 10 8' stroke='%2344403c' stroke-width='2'/%3e%3c/svg%3e")`
                    }}
                />
            )}
        </div>
    );
};

export default ChatPanel;