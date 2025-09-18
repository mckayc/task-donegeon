import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// FIX: Import missing types from the main barrel file.
import { Quest, User, QuizQuestion, QuizChoice, AITutorSessionLog, TranscriptEntry } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { XCircleIcon, SparklesIcon, CheckCircleIcon } from '../user-interface/Icons';
import Avatar from '../user-interface/Avatar';
import { useSystemState } from '../../context/SystemContext';
import { startTutorSessionAPI, sendMessageToTutorAPI, generateFinalQuizAPI } from '../../api';

interface AITutorPanelProps {
    quest: Quest;
    user: User;
    onClose: () => void;
    onSessionComplete: (log: Omit<AITutorSessionLog, 'id' | 'completionId'>) => void;
}

interface Message {
    author: 'user' | 'ai';
    text: string;
}

type TutorStage = 'connecting' | 'pre-quiz' | 'teaching' | 'final-quiz' | 'summary' | 'error';

// FIX: Export the AITutorPanel component to make it available for import in other modules.
export const AITutorPanel: React.FC<AITutorPanelProps> = ({ quest, user, onClose, onSessionComplete }) => {
    const { aiTutors } = useSystemState();
    const tutor = useMemo(() => aiTutors.find(t => t.id === quest.aiTutorId), [aiTutors, quest.aiTutorId]);

    const [stage, setStage] = useState<TutorStage>('connecting');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>([]);
    const [showFeedbackFor, setShowFeedbackFor] = useState<number | null>(null);
    const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

    const sessionStartTimeRef = useRef(Date.now());
    const [timeLeft, setTimeLeft] = useState(tutor ? tutor.sessionMinutes * 60 : 0);
    const timerRef = useRef<number | null>(null);
    const inactivityTimerRef = useRef<number | null>(null);

    const [currentChoices, setCurrentChoices] = useState<string[]>([]);

    const addToTranscript = (entry: Omit<TranscriptEntry, 'timestamp'>) => {
        setTranscript(prev => [...prev, { ...entry, timestamp: new Date().toISOString() }]);
    };

    useEffect(() => {
        if (stage === 'teaching' && tutor && tutor.sessionMinutes > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        handleGenerateQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [stage, tutor]);
    
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (stage !== 'teaching' || isLoading) return;

        inactivityTimerRef.current = window.setTimeout(() => {
            handleSendMessage('[USER_INACTIVE]');
        }, 25000); // 25 seconds
    }, [stage, isLoading]);

    useEffect(() => {
        resetInactivityTimer();
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [messages, isLoading, stage, resetInactivityTimer]);

    useEffect(() => {
        const startChat = async () => {
            try {
                const data = await startTutorSessionAPI(quest.id, user.id);
                setSessionId(data.sessionId);
                if (data.quiz?.questions) {
                    setQuiz(data.quiz.questions);
                    setQuizAnswers(new Array(data.quiz.questions.length).fill(null));
                    setStage('pre-quiz');
                } else {
                    setStage('teaching'); // No pre-quiz, go straight to teaching
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                setStage('error');
            }
        };
        startChat();
    }, [quest.id, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, quiz]);

    const handleSendMessage = async (messageText?: string) => {
        const textToSend = messageText || inputMessage.trim();
        if (!textToSend || !sessionId || isLoading) return;

        resetInactivityTimer();
        const userMessage: Message = { author: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        if(!textToSend.startsWith('[USER_INACTIVE]')) {
             addToTranscript({ type: 'answer', author: 'user', text: textToSend });
        }
        setInputMessage('');
        setIsLoading(true);
        setError(null);
        setCurrentChoices([]);

        try {
            const data = await sendMessageToTutorAPI(sessionId, userMessage.text);
            let aiMessageText = data.reply;
            
            if (data.functionCall && data.functionCall.name === 'ask_a_question_with_choices') {
                const choices = data.functionCall.args.choices || [];
                setCurrentChoices(choices);
                if (!aiMessageText && data.functionCall.args.question) {
                    aiMessageText = data.functionCall.args.question;
                }
            }

            if (aiMessageText) {
                const aiMessage: Message = { author: 'ai', text: aiMessageText };
                setMessages(prev => [...prev, aiMessage]);
                addToTranscript({ type: 'feedback', author: 'ai', text: aiMessageText });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setMessages(prev => prev.filter(m => m !== userMessage));
        } finally {
            setIsLoading(false);
            resetInactivityTimer();
        }
    };
    
    const handleQuizAnswer = (choice: QuizChoice, isPreQuiz: boolean) => {
        const currentQuestion = (quiz || [])[currentQuestionIndex];
        addToTranscript({ type: 'question', author: 'ai', text: currentQuestion.question});
        addToTranscript({ type: 'answer', author: 'user', text: choice.text, isCorrect: choice.isCorrect });

        const newAnswers = [...quizAnswers];
        newAnswers[currentQuestionIndex] = choice.text;
        setQuizAnswers(newAnswers);
        setShowFeedbackFor(currentQuestionIndex);

        setTimeout(() => {
            setShowFeedbackFor(null);
            if (currentQuestionIndex + 1 >= (quiz || []).length) {
                if (isPreQuiz) {
                     handleBeginLesson();
                } else {
                     handleSubmitQuiz();
                }
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 2500);
    };

    const handleBeginLesson = () => {
        if (!quiz) return;
        const summary = quiz.map((q, index) => {
            const userAnswer = quizAnswers[index];
            const correctChoice = q.choices.find(c => c.isCorrect);
            const isCorrect = userAnswer === correctChoice?.text;
            return `Question "${q.question}": User answered "${userAnswer}", which was ${isCorrect ? 'correct' : 'incorrect'}.`;
        }).join('\n');
        
        const introMessage = `I've finished the initial quiz. Here are my results:\n${summary}\nBased on this, please start the lesson on my weakest topic.`;
        
        setQuiz(null);
        setCurrentQuestionIndex(0);
        handleSendMessage(introMessage);
        setStage('teaching');
    };

    const handleGenerateQuiz = async () => {
        if (!sessionId) return;
        setIsLoading(true);
        setError(null);
        setQuiz(null);
        setCurrentChoices([]);
        
        try {
            const data = await generateFinalQuizAPI(sessionId);
            if (data.quiz && data.quiz.questions) {
                setQuiz(data.quiz.questions);
                setQuizAnswers(new Array(data.quiz.questions.length).fill(null));
                setStage('final-quiz');
            } else {
                throw new Error("The AI didn't generate a quiz. Let's finish up.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while generating the quiz.');
        } finally {
            setIsLoading(false);
        }
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
        setStage('summary');

        const isPassed = score / quiz.length >= 0.66; // Passing is 2/3 correct
        const finalMessage = isPassed 
            ? `The user has passed the final quiz with a score of ${score}/${quiz.length}. Please provide a summary.`
            : `The user did not pass the final quiz, scoring ${score}/${quiz.length}. Please provide an encouraging summary of what was covered.`;
        
        handleSendMessage(finalMessage);

        const log: Omit<AITutorSessionLog, 'id' | 'completionId'> = {
            questId: quest.id,
            userId: user.id,
            tutorId: tutor!.id,
            startedAt: new Date(sessionStartTimeRef.current).toISOString(),
            endedAt: new Date().toISOString(),
            durationSeconds: Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
            transcript,
            finalScore: score,
            totalQuestions: quiz.length
        };
        onSessionComplete(log);
    };

    const renderQuiz = (isPreQuiz: boolean) => {
        if (!quiz || currentQuestionIndex >= quiz.length) return null;
        
        const q = quiz[currentQuestionIndex];
        
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-emerald-300">{isPreQuiz ? "Let's check what you know!" : "Quiz Time!"}</h3>
                <p className="font-semibold text-stone-200">{currentQuestionIndex + 1}. {q.question}</p>
                <div className="mt-2 space-y-2">
                    {q.choices.map((choice, cIndex) => {
                        const isSelected = quizAnswers[currentQuestionIndex] === choice.text;
                        const showFeedback = showFeedbackFor === currentQuestionIndex && isSelected;
                        let feedbackClass = '';
                        if (showFeedback) {
                            feedbackClass = choice.isCorrect ? 'bg-green-700/50 border-green-500' : 'bg-red-700/50 border-red-500';
                        }

                        return (
                            <button
                                key={cIndex}
                                onClick={() => handleQuizAnswer(choice, isPreQuiz)}
                                disabled={showFeedbackFor !== null}
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
            </div>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
            <div className="bg-stone-900 border border-emerald-500/50 rounded-xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-stone-700/60 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3"><SparklesIcon className="w-6 h-6 text-emerald-400" /><h2 className="text-xl font-medieval text-emerald-400">AI Tutor: {tutor?.name}</h2></div>
                    <Button variant="ghost" size="icon" onClick={onClose}><XCircleIcon className="w-6 h-6" /></Button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="text-center mb-6 flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-emerald-800/50 border-2 border-emerald-600/70 flex items-center justify-center mx-auto text-6xl">{tutor?.icon}</div>
                            <h3 className="mt-3 text-lg font-bold text-stone-200">Lesson: <span className="text-accent">{quest.title}</span></h3>
                            <p className="text-sm text-stone-400">{tutor?.subject}</p>
                        </div>

                        <div ref={messagesEndRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pr-2">
                            {messages.map((msg, index) => {
                                const isUser = msg.author === 'user';
                                if (msg.text.startsWith('[USER_INACTIVE]')) return null;
                                return (
                                    <div key={index} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                        {isUser ? (<Avatar user={user} className="w-8 h-8 rounded-full flex-shrink-0" />) : (<div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0 text-2xl">{tutor?.icon}</div>)}
                                        <div className={`max-w-md p-3 rounded-lg ${isUser ? 'bg-blue-800 text-white' : 'bg-stone-700 text-stone-200'}`}><p className="text-sm whitespace-pre-wrap">{msg.text}</p></div>
                                    </div>
                                );
                            })}
                            {isLoading && stage === 'teaching' && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0 text-2xl animate-pulse">{tutor?.icon}</div>
                                    <div className="max-w-xs p-3 rounded-lg bg-stone-700 text-stone-200 flex items-center gap-1.5"><span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-stone-400 rounded-full animate-bounce"></span></div>
                                </div>
                            )}
                        </div>
                        
                        {stage === 'teaching' && (
                             <div className="mt-auto pt-4 flex-shrink-0">
                                {currentChoices.length > 0 && !isLoading ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentChoices.map((choice, index) => (
                                            <Button key={index} type="button" variant="secondary" onClick={() => handleSendMessage(choice)} className="w-full justify-start text-left !h-auto !py-2 whitespace-normal">{choice}</Button>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-start gap-2">
                                        <Input as="textarea" rows={2} value={inputMessage} onChange={(e) => { setInputMessage(e.target.value); resetInactivityTimer(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={sessionId ? "Your response..." : "Connecting..."} className="flex-grow resize-none" disabled={!sessionId || isLoading} autoFocus />
                                        <Button type="submit" disabled={!sessionId || isLoading || !inputMessage.trim()} className="h-full">Send</Button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/3 lg:w-2/5 border-t md:border-t-0 md:border-l border-stone-700/60 flex flex-col p-4 bg-stone-900/50">
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {error && <p className="text-center text-red-400">{error}</p>}
                            {stage === 'connecting' && <div className="text-center text-stone-400">Connecting to AI Tutor...</div>}
                            {stage === 'pre-quiz' && renderQuiz(true)}
                            {stage === 'final-quiz' && renderQuiz(false)}
                            {stage === 'summary' && quizResult && (
                                 <div className={`p-4 rounded-lg text-center ${quizResult.score / quizResult.total >= 0.66 ? 'bg-green-900/50' : 'bg-amber-900/50'}`}>
                                    <h3 className="font-bold text-lg">{quizResult.score / quizResult.total >= 0.66 ? 'Lesson Complete!' : 'Good Effort!'}</h3>
                                    <p>You scored {quizResult.score} out of {quizResult.total}.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-auto pt-4 flex-shrink-0 text-center">
                            {stage === 'teaching' && (
                                <Button onClick={handleGenerateQuiz} disabled={timeLeft > 0 || isLoading}>
                                    {timeLeft > 0 ? `Quiz unlocks in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : "I'm ready for the quiz!"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
