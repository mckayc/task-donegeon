import React, { useState } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { SparklesIcon } from '../user-interface/Icons';
import { useAppState } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';

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
    const { users } = useAuthState();
    const [prompt, setPrompt] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
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
        
        let userContext = '';
        if (selectedUserId) {
            const selectedUser = users.find(u => u.id === selectedUserId);
            if (selectedUser) {
                userContext = ` Generate these specifically for a user with this context: User's Name: ${selectedUser.gameName} (real name ${selectedUser.firstName} ${selectedUser.lastName}). Birthday: ${selectedUser.birthday}. About Me: "${selectedUser.aboutMe || 'Not provided.'}". Private Admin Notes: "${selectedUser.adminNotes || 'Not provided.'}". Tailor the ideas to these details, referring to the user by name and considering their age based on their birthday.`;
            }
        }

        const fullPrompt = `Generate 5 item ideas for a gamified task app called ${settings.terminology.appName}.${userContext} The items should be based on the theme: "${prompt}". For each item, provide a single, relevant Unicode emoji for its icon.`;

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
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3"><SparklesIcon className="w-8 h-8" /> Generate Item Ideas</h2>
                </div>
                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <Input
                        as="select"
                        label="Generate for User (Optional)"
                        value={selectedUserId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">General / For All Users</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.gameName}</option>
                        ))}
                    </Input>
                    <div className="flex gap-4">
                        <Input
                            label="Item Theme"
                            placeholder="e.g., 'Magical forest artifacts', 'Sci-fi gadgets'"
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
                    {generatedItems.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedItems.map((item, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-stone-200">{item.icon} {item.name} <span className="text-xs font-normal text-stone-400">({item.category})</span></p>
                                        <p className="text-sm text-stone-400">{item.description}</p>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea(item)}>Use Idea</Button>
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

export default ItemIdeaGenerator;
