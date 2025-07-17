
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ChatPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { users, currentUser, chatMessages } = useAppState();
    const { sendMessage, markMessagesAsRead } = useAppDispatch();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherUsers = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(u => u.id !== currentUser.id);
    }, [users, currentUser]);
    
    const unreadCounts = useMemo(() => {
        if (!currentUser) return {};
        const counts: Record<string, number> = {};
        chatMessages.forEach(msg => {
            if(msg.recipientId === currentUser.id && !msg.isRead) {
                counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
            }
        });
        return counts;
    }, [chatMessages, currentUser]);

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
        markMessagesAsRead(userId);
    };

    const conversation = useMemo(() => {
        if (!currentUser || !selectedUserId) return [];
        return chatMessages
            .filter(msg => 
                (msg.senderId === currentUser.id && msg.recipientId === selectedUserId) ||
                (msg.senderId === selectedUserId && msg.recipientId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [chatMessages, currentUser, selectedUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && selectedUserId) {
            sendMessage(selectedUserId, message);
            setMessage('');
        }
    };

    if (!currentUser) return null;

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 border-b border-stone-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-accent">Chat</h2>
                    <Button variant="secondary" onClick={onClose} className="py-1 px-3 text-sm">Close</Button>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    {/* User List */}
                    <div className="w-1/3 border-r border-stone-700/60 overflow-y-auto scrollbar-hide">
                        {otherUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user.id)}
                                className={`w-full flex items-center p-3 text-left gap-3 transition-colors hover:bg-stone-700/50 ${selectedUserId === user.id ? 'bg-emerald-800/40' : ''}`}
                            >
                                <Avatar user={user} className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-stone-200 font-semibold truncate">{user.gameName}</p>
                                </div>
                                {unreadCounts[user.id] > 0 && (
                                    <span className="flex-shrink-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadCounts[user.id]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {/* Conversation View */}
                    <div className="w-2/3 flex flex-col bg-stone-900/30">
                        {selectedUser ? (
                            <>
                                <div className="flex-shrink-0 p-3 border-b border-stone-700 flex items-center gap-3">
                                    <Avatar user={selectedUser} className="w-10 h-10 rounded-full" />
                                    <h3 className="font-bold text-lg text-stone-100">{selectedUser.gameName}</h3>
                                </div>
                                <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide">
                                    {conversation.map(msg => (
                                        <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                                            {msg.senderId !== currentUser.id && <Avatar user={users.find(u => u.id === msg.senderId)!} className="w-8 h-8 rounded-full self-start" />}
                                            <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${msg.senderId === currentUser.id ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-stone-700 text-stone-200 rounded-bl-none'}`}>
                                                <p>{msg.message}</p>
                                                <p className="text-xs opacity-60 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="flex-shrink-0 p-4 border-t border-stone-700">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <Input
                                            type="text"
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow"
                                            autoComplete="off"
                                        />
                                        <Button type="submit">Send</Button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-stone-500">
                                <p>Select a user to start chatting.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
