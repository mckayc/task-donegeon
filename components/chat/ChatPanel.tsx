
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuthState, useUIState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import { XCircleIcon } from '../ui/Icons';
import Button from '../ui/Button';

const ChatPanel: React.FC = () => {
    const { currentUser, users } = useAuthState();
    const { chatMessages, isChatOpen } = useUIState();
    const { toggleChat, sendMessage, markMessagesAsRead } = useAppDispatch();
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const chatPartners = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(user => user.id !== currentUser.id);
    }, [currentUser, users]);

    const unreadSenders = useMemo(() => {
        if (!currentUser) return new Set();
        return new Set(chatMessages.filter(msg => msg.recipientId === currentUser.id && !msg.isRead).map(msg => msg.senderId));
    }, [chatMessages, currentUser]);

    const activeConversation = useMemo(() => {
        if (!currentUser || !activeChatUser) return [];
        return chatMessages.filter(msg =>
            (msg.senderId === currentUser.id && msg.recipientId === activeChatUser.id) ||
            (msg.senderId === activeChatUser.id && msg.recipientId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [chatMessages, currentUser, activeChatUser]);

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
        if (activeChatUser) {
            markMessagesAsRead(activeChatUser.id);
        }
    }, [activeChatUser, activeConversation, markMessagesAsRead]);
    
    useEffect(() => {
        if (!userScrolledUp) {
            scrollToBottom();
        }
    }, [activeConversation, userScrolledUp, scrollToBottom]);
    
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && activeChatUser) {
            sendMessage({ recipientId: activeChatUser.id, message });
            setMessage('');
            setUserScrolledUp(false);
        }
    };
    
    useEffect(() => {
        // When switching users, reset scroll state and scroll to bottom
        setUserScrolledUp(false);
        setTimeout(scrollToBottom, 0); 
    }, [activeChatUser, scrollToBottom]);


    if (!isChatOpen || !currentUser) return null;
    
    let lastDate: string | null = null;

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[600px] h-[700px] bg-stone-800 border border-stone-700 rounded-xl shadow-2xl flex flex-col">
            <header className="p-4 border-b border-stone-700 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-lg text-stone-100">Chat</h3>
                <button onClick={toggleChat} className="text-stone-400 hover:text-white"><XCircleIcon className="w-6 h-6"/></button>
            </header>
            
            <div className="flex-grow flex overflow-hidden">
                <aside className="w-1/3 border-r border-stone-700 overflow-y-auto">
                    {chatPartners.map(user => {
                        const hasUnread = unreadSenders.has(user.id);
                        return (
                            <button key={user.id} onClick={() => setActiveChatUser(user)} className={`w-full flex items-center gap-2 p-2 text-left hover:bg-stone-700/50 ${activeChatUser?.id === user.id ? 'bg-emerald-900/50' : ''}`}>
                                <Avatar user={user} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden" />
                                <span className="text-sm font-semibold text-stone-200 truncate flex-grow">{user.gameName}</span>
                                {hasUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"></div>}
                            </button>
                        );
                    })}
                </aside>

                <main className="w-2/3 flex flex-col">
                    {activeChatUser ? (
                        <>
                            <div className="p-3 border-b border-stone-700 flex-shrink-0">
                                <p className="font-bold text-center text-stone-200">{activeChatUser.gameName}</p>
                            </div>
                            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow p-3 space-y-3 overflow-y-auto">
                                {activeConversation.map(msg => {
                                    const msgDate = new Date(msg.timestamp).toLocaleDateString();
                                    const showDateSeparator = msgDate !== lastDate;
                                    lastDate = msgDate;
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="text-center text-xs text-stone-500 my-2">
                                                    --- {new Date(msg.timestamp).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })} ---
                                                </div>
                                            )}
                                            <div className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.senderId === currentUser.id ? 'bg-emerald-700 text-white' : 'bg-stone-600 text-stone-100'}`}>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                                <span className="text-xs text-stone-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
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
                            Select a user to start chatting.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ChatPanel;
