import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SparklesIcon } from '../ui/Icons';
import { useAppState } from '../../context/AppContext';

interface QuestIdea {
  title: string;
  description: string;
}

interface QuestIdeaResponse {
    quests: QuestIdea[];
}

interface QuestIdeaGeneratorProps {
  onUseIdea: (idea: QuestIdea) => void;
  onClose: () => void;
}

const QuestIdeaGenerator: React.FC<QuestIdeaGeneratorProps> = ({ onUseIdea, onClose }) => {
    const { settings } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedQuests, setGeneratedQuests] = useState<QuestIdea[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a theme or topic for the quest ideas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedQuests([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate 5 quest ideas for a gamified task app. The quests should be based on the theme: "${prompt}".`,
                config: {
                    systemInstruction: "You are a creative assistant for a gamified task management app called Task Donegeon. Your goal is to generate quest ideas in JSON format. The quests should be practical and actionable.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            quests: {
                                type: Type.ARRAY,
                                description: 'A list of quest ideas.',
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: {
                                            type: Type.STRING,
                                            description: 'A short, engaging title for the quest.'
                                        },
                                        description: {
                                            type: Type.STRING,
                                            description: 'A brief, one-sentence description of the quest.'
                                        },
                                    },
                                    required: ['title', 'description']
                                }
                            }
                        },
                        required: ['quests']
                    }
                }
            });

            const jsonResponse = JSON.parse(response.text) as QuestIdeaResponse;
            setGeneratedQuests(jsonResponse.quests || []);

        } catch (err) {
            console.error("Gemini API error:", err);
            setError('Failed to generate ideas. Please check the prompt and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8" />
                        Generate {settings.terminology.task} Ideas
                    </h2>
                    <p className="text-stone-400 mt-2">Describe a theme, and the AI will generate some ideas for you.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="flex gap-4">
                        <Input
                            label="Quest Theme"
                            placeholder="e.g., 'Weekly kitchen chores for kids'"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                            className="flex-grow"
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="self-end">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    
                    {isLoading && (
                         <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                            <p className="mt-4 text-stone-300">The AI is thinking...</p>
                        </div>
                    )}
                    
                    {generatedQuests.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedQuests.map((quest, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <h4 className="font-bold text-stone-100">{quest.title}</h4>
                                        <p className="text-sm text-stone-400">{quest.description}</p>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea(quest)}>
                                        Use Idea
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-stone-700/60 text-right">
                    <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default QuestIdeaGenerator;
