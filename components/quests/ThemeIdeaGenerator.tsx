

import React, { useState } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { SparklesIcon } from '../user-interface/Icons';
import { useAppState } from '../../context/AppContext';

interface ThemeIdea {
  name: string;
  styles: any;
}

interface ThemeIdeaGeneratorProps {
  onUseIdea: (idea: ThemeIdea) => void;
  onClose: () => void;
}

const ThemeIdeaGenerator: React.FC<ThemeIdeaGeneratorProps> = ({ onUseIdea, onClose }) => {
    const { settings } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedThemes, setGeneratedThemes] = useState<ThemeIdea[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a theme for the theme ideas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedThemes([]);

        const fullPrompt = `Generate 3 UI theme ideas for a gamified task app called ${settings.terminology.appName}. The themes should be based on the theme: "${prompt}". Each theme should have a name and a set of HSL color values and font families.`;

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
                                themes: {
                                    type: Type.ARRAY,
                                    description: 'A list of theme ideas.',
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING, description: 'The name of the theme.' },
                                            styles: { type: Type.OBJECT, properties: {
                                                '--font-display': { type: Type.STRING, description: "Display font, e.g., 'MedievalSharp', cursive" },
                                                '--font-body': { type: Type.STRING, description: "Body font, e.g., 'Roboto', sans-serif" },
                                                '--color-bg-primary': { type: Type.STRING, description: 'Primary background HSL, e.g., 224 71% 4%' },
                                                '--color-bg-secondary': { type: Type.STRING, description: 'Secondary background HSL' },
                                                '--color-bg-tertiary': { type: Type.STRING, description: 'Tertiary background HSL' },
                                                '--color-text-primary': { type: Type.STRING, description: 'Primary text HSL' },
                                                '--color-text-secondary': { type: Type.STRING, description: 'Secondary text HSL' },
                                                '--color-border': { type: Type.STRING, description: 'Border HSL' },
                                                '--color-primary-hue': { type: Type.STRING },
                                                '--color-primary-saturation': { type: Type.STRING },
                                                '--color-primary-lightness': { type: Type.STRING },
                                                '--color-accent-hue': { type: Type.STRING },
                                                '--color-accent-saturation': { type: Type.STRING },
                                                '--color-accent-lightness': { type: Type.STRING },
                                                '--color-accent-light-hue': { type: Type.STRING },
                                                '--color-accent-light-saturation': { type: Type.STRING },
                                                '--color-accent-light-lightness': { type: Type.STRING },
                                            }}
                                        },
                                        required: ['name', 'styles']
                                    }
                                }
                            },
                            required: ['themes']
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
            setGeneratedThemes(jsonResponse.themes || []);

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
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3"><SparklesIcon className="w-8 h-8" /> Generate Theme Ideas</h2>
                </div>
                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="flex gap-4">
                        <Input
                            label="Theme Concept"
                            placeholder="e.g., 'Cyberpunk', 'Fairy Forest', 'Steampunk'"
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
                    {generatedThemes.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedThemes.map((theme, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div style={{fontFamily: theme.styles['--font-body'], color: `hsl(${theme.styles['--color-text-primary']})`}}>
                                        <p className="font-bold" style={{fontFamily: theme.styles['--font-display']}}>{theme.name}</p>
                                        <p className="text-sm">Example Text</p>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea(theme)}>Use Idea</Button>
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

export default ThemeIdeaGenerator;