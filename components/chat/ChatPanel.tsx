import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import { XCircleIcon, ArrowLeftIcon } from '../ui/Icons';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

type ChatTarget = User | {
    id: string;
    gameName: string;
    isGuild: true;
    icon: string;
};

const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: any) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
};

const ChatPanel: React.FC = () => {
    const { currentUser, users, guilds, chatMessages, isChatOpen, settings } = useAppState();
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
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragRef.current.isDragging) {
            setPosition({
                x: e.clientX - dragRef.current.initialX,
                y: e.clientY - dragRef.current.initialY
            });
        }
        if (dragRef.current.isResizing) {
            const newWidth = dragRef.current.initialWidth + (e.clientX - dragRef.current.initialX);
            const newHeight = dragRef.current.initialHeight + (e.clientY - dragRef.current.initialY);
            setSize({
                width: Math.max(400, newWidth),
                height: Math.max(500, newHeight)
            });
        }
    }, [setPosition, setSize]);

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
        const dms = new Set(chatMessages.filter(msg => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id)).map(msg => msg.senderId));
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
    }, [activeConversation, userScrolledUp, scrollToBottom]);
    
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && activeChatTarget) {
            if ('isGuild' in activeChatTarget && activeChatTarget.isGuild) {
                sendMessage({ guildId: activeChatTarget.id, message, isAnnouncement });
                if (isAnnouncement) {
                    setIsAnnouncement(false);
                }
            } else {
                sendMessage({ recipientId: activeChatTarget.id, message });
            }
            setMessage('');
            setUserScrolledUp(false);
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
            className={`fixed z-50 bg-stone-800 border border-stone-700 shadow-2xl flex flex-col
                        ${isMobile ? 'inset-0 rounded-none' : 'rounded-xl'}`}
            style={!isMobile ? {
                width: `${size.width}px`,
                height: `${size.height}px`,
                transform: `translate(${position.x}px, ${position.y}px)`
            } : {}}
        >
            <header 
                onMouseDown={handleDragMouseDown}
                className={`p-4 border-b border-stone-700 flex justify-between items-center flex-shrink-0 ${!isMobile ? 'cursor-move' : ''}`}
            >
                <h3 className="font-bold text-lg text-stone-100">Chat</h3>
                <button onClick={toggleChat} className="text-stone-400 hover:text-white"><XCircleIcon className="w-6 h-6"/></button>
            </header>
            
            <div className="flex-grow flex md:flex-row flex-col overflow-hidden relative">
                <aside className={`w-full md:w-1/3 border-r border-stone-700 overflow-y-auto transition-transform duration-300 absolute md:static inset-0 bg-stone-800 ${activeChatTarget ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                    {chatPartners.map(target => {
                        const isGuild = 'isGuild' in target && target.isGuild;
                        const hasUnread = isGuild ? unreadInfo.guilds.has(target.id) : unreadInfo.dms.has(target.id);
                        return (
                            <button key={target.id} onClick={() => setActiveChatTarget(target)} className={`w-full flex items-center gap-2 p-2 text-left hover:bg-stone-700/50 ${activeChatTarget?.id === target.id ? 'bg-emerald-900/50' : ''}`}>
                                {isGuild ? <span className="w-8 h-8 flex-shrink-0 rounded-full bg-stone-700 flex items-center justify-center text-lg">{target.icon}</span> : <Avatar user={target as User} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden" />}
                                <span className="text-sm font-semibold text-stone-200 truncate flex-grow">{target.gameName}</span>
                                {hasUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"></div>}
                            </button>
                        );
                    })}
                </aside>

                <main className={`w-full md:w-2/3 flex flex-col absolute inset-0 md:static transition-transform duration-300 bg-stone-800 ${activeChatTarget ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    {activeChatTarget ? (
                        <>
                            <div className="p-3 border-b border-stone-700 flex-shrink-0 flex items-center justify-center relative">
                                <button onClick={() => setActiveChatTarget(null)} className="md:hidden absolute left-4 text-stone-400 hover:text-white">
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                                <p className="font-bold text-center text-stone-200">{activeChatTarget.gameName}</p>
                            </div>
                            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-3 space-y-3 overflow-y-auto">
                                {activeConversation.map(msg => {
                                    const msgDate = new Date(msg.timestamp).toLocaleDateString();
                                    const showDateSeparator = msgDate !== lastDate;
                                    lastDate = msgDate;
                                    const isOwnMessage = msg.senderId === currentUser.id;
                                    const sender = users.find(u => u.id === msg.senderId);
                                    const isMsgAnnouncement = msg.isAnnouncement && 'isGuild' in activeChatTarget && activeChatTarget.isGuild;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="text-center text-xs text-stone-500 my-2">
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
                                                    : isOwnMessage ? 'bg-emerald-700 text-white' : 'bg-stone-600 text-stone-100'
                                                }`}>
                                                    {isMsgAnnouncement && (
                                                        <div className="text-xs font-bold text-amber-200 mb-1 border-b border-amber-500/50 pb-1">📢 Announcement</div>
                                                    )}
                                                    {!isOwnMessage && 'isGuild' in activeChatTarget && activeChatTarget.isGuild && sender && !isMsgAnnouncement && (
                                                        <p className="text-xs font-bold text-accent-light mb-1">{sender.gameName}</p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                                <span className="text-xs text-stone-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            
                            {activeChatTarget && 'isGuild' in activeChatTarget && activeChatTarget.isGuild && currentUser.role === Role.DonegeonMaster && (
                                <div className="p-2 border-t border-stone-700">
                                    <ToggleSwitch 
                                        enabled={isAnnouncement}
                                        setEnabled={setIsAnnouncement}
                                        label={`Send as ${settings.terminology.group} Announcement`}
                                    />
                                </div>
                            )}

                            <form onSubmit={handleSend} className="p-3 border-t border-stone-700 flex-shrink-0 flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    autoComplete="off"
                                    className="flex-grow"
                                />
                                <Button type="submit" className="px-4 py-2">Send</Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-stone-400 p-4">
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