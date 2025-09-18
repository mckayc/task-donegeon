import React, { useState, useEffect, useMemo } from 'react';
import { AITutorSessionLog } from './types';
import Button from '../user-interface/Button';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';

interface AITutorReportDialogProps {
  completionId: string;
  onClose: () => void;
}

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const AITutorReportDialog: React.FC<AITutorReportDialogProps> = ({ completionId, onClose }) => {
    const [log, setLog] = useState<AITutorSessionLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { users } = useAuthState();
    const { aiTutors } = useSystemState();

    useEffect(() => {
        const fetchLog = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/chronicles/tutor-session/${completionId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('No detailed session log was found for this quest completion.');
                    }
                    throw new Error('Failed to fetch session log.');
                }
                const data = await response.json();
                setLog(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLog();
    }, [completionId]);

    const tutor = useMemo(() => aiTutors.find(t => t.id === log?.tutorId), [aiTutors, log]);
    const user = useMemo(() => users.find(u => u.id === log?.userId), [users, log]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-emerald-400">AI Tutor Session Report</h2>
                    {user && <p className="text-stone-300">For: <span className="font-bold">{user.gameName}</span></p>}
                </div>

                <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
                    {isLoading && <div className="text-center">Loading report...</div>}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {log && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-3 bg-stone-900/50 rounded-lg">
                                <div><p className="text-sm font-semibold text-stone-400">Tutor</p><p className="font-bold text-stone-100">{tutor?.name || 'Unknown'}</p></div>
                                <div><p className="text-sm font-semibold text-stone-400">Duration</p><p className="font-bold text-stone-100">{formatDuration(log.durationSeconds)}</p></div>
                                <div><p className="text-sm font-semibold text-stone-400">Started At</p><p className="font-bold text-stone-100">{new Date(log.startedAt).toLocaleString()}</p></div>
                                <div><p className="text-sm font-semibold text-stone-400">Ended At</p><p className="font-bold text-stone-100">{new Date(log.endedAt).toLocaleString()}</p></div>
                                {(log.finalScore !== undefined && log.totalQuestions !== undefined) && (
                                     <div><p className="text-sm font-semibold text-stone-400">Final Score</p><p className="font-bold text-stone-100">{log.finalScore} / {log.totalQuestions}</p></div>
                                )}
                            </div>
                             <div>
                                <h3 className="font-bold text-lg text-stone-200 mt-4 mb-2">Transcript</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 bg-black/20 p-3 rounded-md">
                                    {log.transcript.map((entry, index) => (
                                        <div key={index} className={`p-2 rounded-md ${entry.author === 'ai' ? 'bg-stone-700/50' : 'bg-blue-900/40 text-right'}`}>
                                            <p className={`text-xs font-bold ${entry.author === 'ai' ? 'text-emerald-400' : 'text-sky-400'}`}>{entry.author.toUpperCase()}</p>
                                            <p className="text-sm text-stone-200 whitespace-pre-wrap">{entry.text}</p>
                                            {entry.isCorrect !== undefined && (
                                                <p className={`text-xs font-bold mt-1 ${entry.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                    {entry.isCorrect ? 'Correct' : 'Incorrect'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/20 rounded-b-xl flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default AITutorReportDialog;
