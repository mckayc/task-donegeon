import React, { useState } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SparklesIcon } from '../ui/Icons';
import { useAppState } from '../../context/AppContext';

interface TrophyIdea {
  name: string;
  description: string;
  icon: string;
}

interface TrophyIdeaGeneratorProps {
  onUseIdea: (idea: TrophyIdea) => void;
  onClose: () => void;
}

const TrophyIdeaGenerator: React.FC<TrophyIdeaGeneratorProps> = ({ onUseIdea, onClose }) => {
    const { settings } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedTrophies, setGeneratedTrophies] = useState<TrophyIdea[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a theme for the trophy ideas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedTrophies([]);

        const fullPrompt = `Generate 5 trophy ideas for a gamified task app called ${settings.terminology.appName}. The trophies should be based on the theme: "${prompt}". For each trophy, provide a single, relevant Unicode emoji for its icon.`;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    prompt: fullPrompt,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                trophies: {
                                    type: Type.ARRAY,
                                    description: 'A list of trophy ideas.',
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING, description: 'The name of the trophy.' },
                                            description: { type: Type.STRING, description: 'A short description of how to earn it.' },
                                            icon: { type: Type.STRING, description: 'A single emoji to represent the trophy.' },
                                        },
                                        required: ['name', 'description', 'icon']
                                    }
                                }
                            },
                            required: ['trophies']
                        }
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate ideas.');
            }

            const result: GenerateContentResponse = await response.json();
            const text = result.text;
            if (!text) {
                throw new Error("Received an empty response from the AI.");
            }
            
            const jsonResponse = JSON.parse(text);
            setGeneratedTrophies(jsonResponse.trophies || []);

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3"><SparklesIcon className="w-8 h-8" /> Generate {settings.terminology.award} Ideas</h2>
                </div>
                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="flex gap-4">
                        <Input
                            label="Trophy Theme"
                            placeholder="e.g., 'household chores', 'sports achievements'"
                            value={prompt}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleGenerate()}
                            className="flex-grow"
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="self-end">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {isLoading && <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div><p className="mt-4 text-stone-300">The AI is thinking...</p></div>}
                    {generatedTrophies.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedTrophies.map((trophy, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-stone-200">{trophy.icon} {trophy.name}</p>
                                        <p className="text-sm text-stone-400">{trophy.description}</p>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea(trophy)}>Use Idea</Button>
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

export default TrophyIdeaGenerator;