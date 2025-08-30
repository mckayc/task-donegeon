import React, { useState, useEffect, useRef } from 'react';
import { Quest, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { XCircleIcon, SparklesIcon } from '../user-interface/Icons';
import Avatar from '../user-interface/Avatar';

interface AiTeacherPanelProps {
    quest: Quest;
    user: User;
    onClose: () => void;
}

interface Message {
    author: 'user' | 'ai';
    text: string;
}

const AiTeacherPanel: React.FC<AiTeacherPanelProps> = ({ quest, user, onClose }) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const startChat = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/ai/chat/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questId: quest.id, userId: user.id }),
                });

                if (!response.ok) {
                    throw new Error('Failed to start a chat session with the AI Teacher.');
                }
                const data = await response.json();
                setSessionId(data.sessionId);
                setMessages([{ author: 'ai', text: `Hello ${user.gameName}! I'm your AI Teacher. Let's talk about "${quest.title}". What would you like to know?` }]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        startChat();
    }, [quest.id, quest.title, user.id, user.gameName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !sessionId || isLoading) return;

        const userMessage: Message = { author: 'user', text: inputMessage.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: userMessage.text }),
            });

            if (!response.ok) {
                throw new Error('The AI Teacher could not respond. Please try again.');
            }
            const data = await response.json();
            const aiMessage: Message = { author: 'ai', text: data.reply };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            // Add the failed user message back to the input for resubmission
            setInputMessage(userMessage.text);
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
            <div className="bg-stone-900 border border-emerald-500/50 rounded-xl shadow-2xl max-w-lg w-full h-[70vh] flex flex-col">
                <div className="p-4 border-b border-stone-700/60 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-medieval text-emerald-400">AI Teacher</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <XCircleIcon className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
                    {messages.map((msg, index) => {
                        const isUser = msg.author === 'user';
                        return (
                            <div key={index} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                {isUser ? (
                                    <Avatar user={user} className="w-8 h-8 rounded-full flex-shrink-0" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0">
                                        <SparklesIcon className="w-5 h-5 text-emerald-300" />
                                    </div>
                                )}
                                <div className={`max-w-xs p-3 rounded-lg ${isUser ? 'bg-blue-800 text-white' : 'bg-stone-700 text-stone-200'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        );
                    })}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-emerald-300 animate-pulse" />
                            </div>
                            <div className="max-w-xs p-3 rounded-lg bg-stone-700 text-stone-200 flex items-center gap-1.5">
                                <span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-stone-700/60 flex-shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-start gap-2">
                         <Input
                            as="textarea"
                            rows={2}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={sessionId ? "Ask a question..." : "Connecting to AI Teacher..."}
                            className="flex-grow resize-none"
                            disabled={!sessionId || isLoading}
                            autoFocus
                        />
                        <Button type="submit" disabled={!sessionId || isLoading || !inputMessage.trim()} className="h-full">
                            Send
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiTeacherPanel;