import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import { XCircleIcon } from '../ui/Icons';

const ChatPanel: React.FC = () => {
    const { currentUser, users, chatMessages, isChatOpen } = useAppState();
    const { toggleChat, sendMessage, markMessagesAsRead } = useAppDispatch();
    const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatPartners = useMemo(() => {
        if (!currentUser) return [];
        // Show all users except the current one
        return users.filter(user => user.id !== currentUser.id);
    }, [currentUser, users]);


    const activeConversation = useMemo(() => {
        if (!currentUser || !activeChatUser) return [];
        return chatMessages.filter(msg =>
            (msg.senderId === currentUser.id && msg.recipientId === activeChatUser.id) ||
            (msg.senderId === activeChatUser.id && msg.recipientId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [chatMessages, currentUser, activeChatUser]);

    useEffect(() => {
        if (activeChatUser) {
            markMessagesAsRead(activeChatUser.id);
        }
    }, [activeChatUser, activeConversation, markMessagesAsRead]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && activeChatUser) {
            sendMessage({ recipientId: activeChatUser.id, message });
            setMessage('');
        }
    };

    if (!isChatOpen || !currentUser) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[500px] bg-stone-800 border border-stone-700 rounded-xl shadow-2xl flex flex-col">
            <header className="p-4 border-b border-stone-700 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-lg text-stone-100">Chat</h3>
                <button onClick={toggleChat} className="text-stone-400 hover:text-white"><XCircleIcon className="w-6 h-6"/></button>
            </header>
            
            <div className="flex-grow flex overflow-hidden">
                <aside className="w-1/3 border-r border-stone-700 overflow-y-auto scrollbar-hide">
                    {chatPartners.map(user => (
                        <button key={user.id} onClick={() => setActiveChatUser(user)} className={`w-full flex items-center gap-2 p-2 text-left hover:bg-stone-700/50 ${activeChatUser?.id === user.id ? 'bg-emerald-900/50' : ''}`}>
                            <Avatar user={user} className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden" />
                            <span className="text-sm font-semibold text-stone-200 truncate">{user.gameName}</span>
                        </button>
                    ))}
                </aside>

                <main className="w-2/3 flex flex-col">
                    {activeChatUser ? (
                        <>
                            <div className="p-3 border-b border-stone-700 flex-shrink-0">
                                <p className="font-bold text-center text-stone-200">{activeChatUser.gameName}</p>
                            </div>
                            <div className="flex-grow p-3 space-y-3 overflow-y-auto scrollbar-hide">
                                {activeConversation.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs px-3 py-2 rounded-lg ${msg.senderId === currentUser.id ? 'bg-emerald-700 text-white' : 'bg-stone-600 text-stone-100'}`}>
                                            <p className="text-sm">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-3 border-t border-stone-700 flex-shrink-0">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    autoComplete="off"
                                />
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