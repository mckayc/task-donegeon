
import React, { useState, useEffect, useRef } from 'react';
import { Quest, User, QuizQuestion, QuizChoice } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { XCircleIcon, SparklesIcon, CheckCircleIcon } from '../user-interface/Icons';
import Avatar from '../user-interface/Avatar';

interface AiTeacherPanelProps {
    quest: Quest;
    user: User;
    onClose: () => void;
    onQuizPassed: () => void;
}

interface Message {
    author: 'user' | 'ai';
    text: string;
}

const AiTeacherPanel: React.FC<AiTeacherPanelProps> = ({ quest, user, onClose, onQuizPassed }) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    // Initial Quiz State
    const [initialQuiz, setInitialQuiz] = useState<QuizQuestion[] | null>(null);
    const [currentInitialQuizQuestion, setCurrentInitialQuizQuestion] = useState(0);
    const [initialQuizAnswers, setInitialQuizAnswers] = useState<(string | null)[]>([]);
    const [showInitialQuizFeedbackFor, setShowInitialQuizFeedbackFor] = useState<number | null>(null);
    
    // Final Quiz State
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>([]);
    const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(quest.aiTutorSessionMinutes ? quest.aiTutorSessionMinutes * 60 : 0);
    const timerRef = useRef<number | null>(null);

    // Interactive Choice Buttons State
    const [currentChoices, setCurrentChoices] = useState<string[]>([]);

    useEffect(() => {
        if (quest.aiTutorSessionMinutes && quest.aiTutorSessionMinutes > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quest.aiTutorSessionMinutes]);

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
                setInitialQuiz(data.quiz?.questions || null);
                if (data.quiz?.questions) {
                    setInitialQuizAnswers(new Array(data.quiz.questions.length).fill(null));
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        startChat();
    }, [quest.id, quest.title, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, quiz, initialQuiz]);

    const handleSendMessage = async (messageText?: string) => {
        const textToSend = messageText || inputMessage.trim();
        if (!textToSend || !sessionId || isLoading) return;

        const userMessage: Message = { author: 'user', text: textToSend };
        const previousChoices = [...currentChoices];

        setCurrentChoices([]); // Optimistically clear choices
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
            
            let aiMessageText = data.reply;
            if (data.functionCall && data.functionCall.name === 'ask_a_question_with_choices') {
                const choices = data.functionCall.args.choices || [];
                setCurrentChoices(choices);
                if (!aiMessageText && data.functionCall.args.question) {
                    aiMessageText = data.functionCall.args.question;
                }
            } else {
                setCurrentChoices([]);
            }

            const cleanedText = (aiMessageText || '').replace(/<tool_code>[\s\S]*?<\/tool_code>|<\/?multiple_choice>|<\/?question>|<\/?option>/g, '').trim();
            if (cleanedText) {
                const aiMessage: Message = { author: 'ai', text: cleanedText };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setMessages(prev => prev.filter(m => m !== userMessage));
            setCurrentChoices(previousChoices);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialQuizAnswer = (choice: QuizChoice) => {
        const newAnswers = [...initialQuizAnswers];
        newAnswers[currentInitialQuizQuestion] = choice.text;
        setInitialQuizAnswers(newAnswers);
        setShowInitialQuizFeedbackFor(currentInitialQuizQuestion);

        setTimeout(() => {
            setShowInitialQuizFeedbackFor(null);
            setCurrentInitialQuizQuestion(prev => prev + 1);
        }, 2500);
    };

    const handleBeginLesson = () => {
        if (!initialQuiz) return;
        
        const summary = initialQuiz.map((q, index) => {
            const userAnswer = initialQuizAnswers[index];
            const correctChoice = q.choices.find(c => c.isCorrect);
            const isCorrect = userAnswer === correctChoice?.text;
            return `Question "${q.question}": User answered "${userAnswer}", which was ${isCorrect ? 'correct' : 'incorrect'}.`;
        }).join('\n');
        
        const introMessage = `I've finished the initial quiz. Here are my results:\n${summary}\nBased on this, please start the lesson on my weakest topic.`;
        
        setInitialQuiz(null);
        handleSendMessage(introMessage);
    };

    const handleGenerateQuiz = async () => {
        if (!sessionId) return;
        setIsLoading(true);
        setError(null);
        setQuiz(null);
        setQuizResult(null);

        try {
            const response = await fetch('/api/ai/chat/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            if (!response.ok) throw new Error('Could not generate the quiz.');
            const data = await response.json();
            if (data.quiz && data.quiz.questions) {
                setQuiz(data.quiz.questions);
                setQuizAnswers(new Array(data.quiz.questions.length).fill(null));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while generating the quiz.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswerChange = (questionIndex: number, choiceText: string) => {
        const newAnswers = [...quizAnswers];
        newAnswers[questionIndex] = choiceText;
        setQuizAnswers(newAnswers);
    };
    
    const handleSubmitQuiz = () => {
        if (!quiz) return;
        let score = 0;
        quiz.forEach((q, index) => {
            const correctChoice = q.choices.find(c => c.isCorrect);
            if (correctChoice && quizAnswers[index] === correctChoice.text) {
                score++;
            }
        });
        setQuizResult({ score, total: quiz.length });
        if (score >= 2) { // Passing score
            onQuizPassed();
        }
    };

    const isQuizReady = timeLeft === 0;

    const renderInitialQuiz = () => {
        if (!initialQuiz || currentInitialQuizQuestion >= initialQuiz.length) return null;
        
        const q = initialQuiz[currentInitialQuizQuestion];
        const correctChoice = q.choices.find(c => c.isCorrect)?.text;
        
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-emerald-300">Let's check what you know!</h3>
                <p className="font-semibold text-stone-200">{currentInitialQuizQuestion + 1}. {q.question}</p>
                <div className="mt-2 space-y-2">
                    {q.choices.map((choice, cIndex) => {
                        const isSelected = initialQuizAnswers[currentInitialQuizQuestion] === choice.text;
                        const showFeedback = showInitialQuizFeedbackFor === currentInitialQuizQuestion && isSelected;
                        let feedbackClass = '';
                        if (showFeedback) {
                            feedbackClass = choice.isCorrect ? 'bg-green-700/50 border-green-500' : 'bg-red-700/50 border-red-500';
                        }

                        return (
                            <button
                                key={cIndex}
                                onClick={() => handleInitialQuizAnswer(choice)}
                                disabled={showInitialQuizFeedbackFor !== null}
                                className={`w-full text-left flex items-center gap-3 p-3 rounded-md bg-stone-700/50 hover:bg-stone-700 disabled:cursor-not-allowed border ${feedbackClass}`}
                            >
                                {showFeedback && (
                                    choice.isCorrect ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-400" />
                                )}
                                <span className="text-stone-300">{choice.text}</span>
                            </button>
                        );
                    })}
                </div>
                {showInitialQuizFeedbackFor === currentInitialQuizQuestion && !q.choices.find(c => c.text === initialQuizAnswers[currentInitialQuizQuestion])?.isCorrect && (
                     <p className="text-sm text-amber-300 p-2 bg-amber-900/40 rounded-md">The correct answer was: {correctChoice}</p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
            <div className="bg-stone-900 border border-emerald-500/50 rounded-xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-stone-700/60 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-medieval text-emerald-400">AI Teacher</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <XCircleIcon className="w-6 h-6" />
                    </Button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="text-center mb-6 flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-emerald-800/50 border-2 border-emerald-600/70 flex items-center justify-center mx-auto">
                                <SparklesIcon className="w-12 h-12 text-emerald-300" />
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-stone-200">AI Lesson: <span className="text-accent">{quest.title}</span></h3>
                            <p className="text-sm text-stone-400">{quest.description}</p>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pr-2">
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
                                        <div className={`max-w-md p-3 rounded-lg ${isUser ? 'bg-blue-800 text-white' : 'bg-stone-700 text-stone-200'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {isLoading && !quiz && !initialQuiz && (
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
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {!quiz && !initialQuiz && (
                             <div className="mt-auto pt-4 flex-shrink-0">
                                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-start gap-2">
                                    <Input
                                        as="textarea"
                                        rows={2}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                        placeholder={sessionId ? "Your response..." : "Connecting..."}
                                        className="flex-grow resize-none"
                                        disabled={!sessionId || isLoading}
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={!sessionId || isLoading || !inputMessage.trim()} className="h-full">Send</Button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/3 lg:w-2/5 border-t md:border-t-0 md:border-l border-stone-700/60 flex flex-col p-4 bg-stone-900/50">
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                            
                            {initialQuiz && renderInitialQuiz()}

                            {!initialQuiz && currentChoices.length > 0 && !isLoading && (
                                <div>
                                    <h4 className="font-bold text-stone-300 mb-2">Choose an option:</h4>
                                    <div className="flex flex-col gap-2">
                                        {currentChoices.map((choice, index) => (
                                            <Button key={index} type="button" variant="secondary" onClick={() => handleSendMessage(choice)} className="w-full justify-start text-left !h-auto !py-2 whitespace-normal">{choice}</Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!initialQuiz && quiz && !quizResult && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-emerald-300">Quiz Time!</h3>
                                    {quiz.map((q, qIndex) => (
                                        <div key={qIndex}>
                                            <p className="font-semibold text-stone-200">{qIndex + 1}. {q.question}</p>
                                            <div className="mt-2 space-y-2">
                                                {q.choices.map((choice, cIndex) => (
                                                    <label key={cIndex} className="flex items-center gap-2 p-2 rounded-md bg-stone-700/50 hover:bg-stone-700 cursor-pointer">
                                                        <input type="radio" name={`question-${qIndex}`} value={choice.text} checked={quizAnswers[qIndex] === choice.text} onChange={() => handleAnswerChange(qIndex, choice.text)} />
                                                        <span className="text-stone-300">{choice.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!initialQuiz && quizResult && (
                                <div className={`p-4 rounded-lg text-center ${quizResult.score >= 2 ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                                    <h3 className="font-bold text-lg">{quizResult.score >= 2 ? 'Quiz Passed!' : 'Try Again!'}</h3>
                                    <p>You scored {quizResult.score} out of {quizResult.total}.</p>
                                    {quizResult.score < 2 && <Button onClick={handleGenerateQuiz} variant="secondary" size="sm" className="mt-2">Retake Quiz</Button>}
                                </div>
                            )}
                            
                             {isLoading && (quiz || initialQuiz) && (
                                 <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
                                    <p className="mt-3 text-stone-400 text-sm">
                                        {quiz ? 'Grading your quiz...' : 'Preparing your lesson...'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-4 flex-shrink-0 text-center">
                             {initialQuiz && currentInitialQuizQuestion >= initialQuiz.length && !isLoading && (
                                <Button onClick={handleBeginLesson}>Begin Lesson</Button>
                            )}
                            {!initialQuiz && (
                                quiz ? (
                                    quizResult ? null : <Button onClick={handleSubmitQuiz} disabled={quizAnswers.some(a => a === null)}>Submit Quiz</Button>
                                ) : (
                                    <Button onClick={handleGenerateQuiz} disabled={!isQuizReady || isLoading}>
                                        {isQuizReady ? "I'm ready for the quiz!" : `Quiz unlocks in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiTeacherPanel;
