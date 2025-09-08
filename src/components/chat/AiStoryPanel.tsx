import React, { useState, useEffect, useRef } from 'react';
import { Quest, User } from '../../types';
import Button from '../user-interface/Button';
import { XCircleIcon, SparklesIcon } from '../user-interface/Icons';

interface AiStoryPanelProps {
    quest: Quest;
    user: User;
    onClose: () => void;
    onStoryFinished: () => void;
}

interface Story {
    title: string;
    story: string;
}

const AiStoryPanel: React.FC<AiStoryPanelProps> = ({ quest, user, onClose, onStoryFinished }) => {
    const [story, setStory] = useState<Story | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const storyContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const generateStory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/ai/generate-story', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quest, user }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate a story from the AI.');
                }
                const data = await response.json();
                setStory(data.story);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        generateStory();
    }, [quest, user]);

    const handleFinish = () => {
        onStoryFinished();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-stone-700/60 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-medieval text-emerald-400">An AI-Generated Story</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <XCircleIcon className="w-6 h-6" />
                    </Button>
                </div>

                <div ref={storyContainerRef} className="flex-1 p-8 overflow-y-auto scrollbar-hide">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
                            <p className="mt-4 text-stone-300">The AI is weaving a tale for you...</p>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {story && (
                        <div className="prose prose-invert max-w-none prose-p:text-stone-300 prose-headings:text-accent">
                            <h1>{story.title}</h1>
                            <p className="whitespace-pre-wrap">{story.story}</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-stone-700/60 flex-shrink-0 text-center">
                    <Button onClick={handleFinish} disabled={!story}>
                        Finish Story
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AiStoryPanel;