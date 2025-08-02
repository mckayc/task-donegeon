import React, { useState, ChangeEvent } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SparklesIcon } from '../ui/Icons';
import { useAppState } from '../../context/AppContext';

interface ItemIdea {
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface ItemIdeaGeneratorProps {
  onUseIdea: (idea: ItemIdea) => void;
  onClose: () => void;
}

const ItemIdeaGenerator: React.FC<ItemIdeaGeneratorProps> = ({ onUseIdea, onClose }) => {
    const { settings } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedItems, setGeneratedItems] = useState<ItemIdea[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a theme or topic for the item ideas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedItems([]);

        const fullPrompt = `Generate 5 item ideas for a gamified task app called ${settings.terminology.appName}. The items should be based on the theme: "${prompt}". For each item, provide a single, relevant Unicode emoji for its icon.`;

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
                                items: {
                                    type: Type.ARRAY,
                                    description: 'A list of item ideas.',
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING, description: 'The name of the item.' },
                                            description: { type: Type.STRING, description: 'A short, one-sentence description.' },
                                            category: { type: Type.STRING, description: 'A category for the item (e.g., Avatar, Pet, Theme, Tool).' },
                                            icon: { type: Type.STRING, description: 'A single emoji to represent the item.' }
                                        },
                                        required: ['name', 'description', 'category', 'icon']
                                    }
                                }
                            },
                            required: ['items']
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
            setGeneratedItems(jsonResponse.items || []);

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-display text-accent flex items-center gap-3"><SparklesIcon className="w-8 h-8" /> Generate Item Ideas</h2>
                </div>
                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="item-theme">Item Theme</Label>
                            <Input
                                id="item-theme"
                                placeholder="e.g., 'Magical forest artifacts', 'Sci-fi gadgets'"
                                value={prompt}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleGenerate()}
                                disabled={isLoading}
                            />
                        </div>
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="self-end">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {isLoading && <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-muted-foreground">The AI is thinking...</p></div>}
                    {generatedItems.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedItems.map((item, index) => (
                                <div key={index} className="bg-background/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-foreground">{item.icon} {item.name} <span className="text-xs font-normal text-muted-foreground">({item.category})</span></p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => onUseIdea(item)}>Use Idea</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t text-right">
                    <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ItemIdeaGenerator;