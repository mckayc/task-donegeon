import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SparklesIcon } from '../ui/Icons';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Type, GenerateContentResponse } from '@google/genai';
import { Quest, Trophy, GameAsset, QuestAvailability, QuestType } from '../../types';
import Card from '../ui/Card';

type AssetType = 'Quests' | 'Trophies' | 'Items';

interface GeneratedAsset {
    id: string;
    type: AssetType;
    data: any;
    isSelected: boolean;
}

const AiStudioPage: React.FC = () => {
    const { addQuest, addTrophy, addGameAsset, addNotification } = useAppDispatch();
    const { settings } = useAppState();
    const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);
    const [context, setContext] = useState(localStorage.getItem('aiStudioContext') || '');
    const [prompt, setPrompt] = useState('');
    const [quantity, setQuantity] = useState(5);
    const [assetType, setAssetType] = useState<AssetType>('Quests');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

    useEffect(() => {
        fetch('/api/ai/status')
            .then(res => res.json())
            .then(data => setIsApiConfigured(data.isConfigured))
            .catch(() => setIsApiConfigured(false));
    }, []);

    const handleSaveContext = () => {
        localStorage.setItem('aiStudioContext', context);
        addNotification({ type: 'success', message: 'Context saved!' });
    };

    const getSchemaForAssetType = (type: AssetType) => {
        switch (type) {
            case 'Quests':
                return {
                    type: Type.ARRAY, description: `A list of ${settings.terminology.tasks.toLowerCase()}.`, items: {
                        type: Type.OBJECT, properties: {
                            title: { type: Type.STRING, description: 'A short, engaging title.' },
                            description: { type: Type.STRING, description: 'A one-sentence description.' },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }, required: ['title', 'description']
                    }
                };
            case 'Trophies':
                return {
                    type: Type.ARRAY, description: `A list of ${settings.terminology.awards.toLowerCase()}.`, items: {
                        type: Type.OBJECT, properties: {
                            name: { type: Type.STRING, description: 'The name of the award.' },
                            description: { type: Type.STRING, description: 'How to earn this award.' },
                            icon: { type: Type.STRING, description: 'A single emoji to represent the award.' },
                        }, required: ['name', 'description', 'icon']
                    }
                };
            case 'Items':
                return {
                     type: Type.ARRAY, description: 'A list of items for the store.', items: {
                        type: Type.OBJECT, properties: {
                            name: { type: Type.STRING, description: 'The name of the item.' },
                            description: { type: Type.STRING, description: 'A short, enticing description.' },
                            category: { type: Type.STRING, description: 'e.g., Avatar, Theme, Power-up' }
                        }, required: ['name', 'description', 'category']
                    }
                };
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate assets.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedAssets([]);

        const fullPrompt = `
            Context: ${context || 'A typical family with children.'}
            Request: Generate ${quantity} ${assetType} based on the theme: "${prompt}".
        `;
        
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
                                assets: getSchemaForAssetType(assetType),
                            },
                            required: ['assets']
                        }
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate assets.');
            }

            const result: GenerateContentResponse = await response.json();
            const text = result.text;
            if (!text) throw new Error("Received an empty response from the AI.");

            const jsonResponse = JSON.parse(text);

            if (jsonResponse.assets && Array.isArray(jsonResponse.assets)) {
                setGeneratedAssets(jsonResponse.assets.map((asset: any, i: number) => ({
                    id: `gen-${i}-${Date.now()}`,
                    type: assetType,
                    data: asset,
                    isSelected: true,
                })));
            } else {
                 throw new Error("AI response did not contain a valid 'assets' array.");
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleAssetSelection = (id: string) => {
        setGeneratedAssets(prev => prev.map(asset => 
            asset.id === id ? { ...asset, isSelected: !asset.isSelected } : asset
        ));
    };

    const handleImportAssets = () => {
        const assetsToImport = generatedAssets.filter(a => a.isSelected);
        if (assetsToImport.length === 0) {
            addNotification({ type: 'info', message: 'No assets selected to import.' });
            return;
        }

        assetsToImport.forEach(asset => {
            switch(asset.type) {
                case 'Quests':
                    addQuest({ title: asset.data.title, description: asset.data.description, tags: asset.data.tags || [], type: asset.data.type || QuestType.Duty, rewards: [], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false, requiresApproval: false, availabilityType: QuestAvailability.Daily, availabilityCount: null, weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: [] });
                    break;
                case 'Trophies':
                    addTrophy({ name: asset.data.name, description: asset.data.description, icon: asset.data.icon || '🏆', isManual: true, requirements: [] });
                    break;
                case 'Items':
                    addGameAsset({ name: asset.data.name, description: asset.data.description, category: asset.data.category || 'Misc', url: 'https://placehold.co/150x150/84cc16/FFFFFF?text=New', isForSale: false, cost: [], marketIds: [] });
                    break;
            }
        });
        
        addNotification({type: 'success', message: `${assetsToImport.length} assets imported successfully!`});
        setGeneratedAssets([]);
    };

    const renderAsset = (asset: GeneratedAsset) => {
        switch (asset.type) {
            case 'Quests':
                return (
                    <div>
                        <p className="font-bold text-stone-200">{asset.data.title}</p>
                        <p className="text-sm text-stone-400">{asset.data.description}</p>
                        {asset.data.tags && asset.data.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {asset.data.tags.map((tag: string) => <span key={tag} className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">{tag}</span>)}
                            </div>
                        )}
                    </div>
                );
            case 'Trophies':
                 return <p><span className="text-2xl mr-2">{asset.data.icon}</span> <span className="font-bold text-stone-200">{asset.data.name}</span> - {asset.data.description}</p>;
            case 'Items':
                 return <p><span className="font-bold text-stone-200">{asset.data.name}</span> <span className="text-xs text-stone-400">({asset.data.category})</span> - {asset.data.description}</p>;
            default:
                return null;
        }
    };


    if (isApiConfigured === false) {
        return <Card title="AI Features Not Configured"><p className="text-amber-400">The server administrator has not configured an API key for Gemini AI. Please add the `API_KEY` to your environment variables to enable this page.</p></Card>;
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-medieval text-stone-100 flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-accent" /> AI Studio
            </h1>
            
            <Card title="Generation Context">
                <p className="text-stone-400 text-sm mb-3">Provide some background information about your group or family. This helps the AI generate more relevant and personalized ideas. This data is saved in your browser's local storage.</p>
                <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                    placeholder="e.g., A family with two kids, ages 8 and 12. We live in a house with a backyard and have one dog. We want to focus on chores and outdoor activities."
                />
                <div className="text-right mt-2">
                    <Button variant="secondary" onClick={handleSaveContext}>Save Context</Button>
                </div>
            </Card>

            <Card title="Generate New Assets">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-stone-300 mb-1">Asset Type</label>
                             <Input as="select" value={assetType} onChange={e => setAssetType(e.target.value as AssetType)}>
                                <option value="Quests">{settings.terminology.tasks}</option>
                                <option value="Trophies">{settings.terminology.awards}</option>
                                <option value="Items">Items</option>
                            </Input>
                        </div>
                         <div>
                            <Input label="Quantity" type="number" min="1" max="10" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                        </div>
                    </div>
                     <div>
                        <Input
                            label="Prompt / Theme"
                            placeholder="e.g., 'summer yard work', 'creative art projects', 'learning about space'"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="text-right">
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Generating...' : 'Generate Assets'}
                        </Button>
                    </div>
                </div>
            </Card>

            {error && <p className="text-red-400 text-center bg-red-900/30 p-3 rounded-md">{error}</p>}
            
            {isLoading && (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                    <p className="mt-4 text-stone-300">The AI is conjuring your assets...</p>
                </div>
            )}
            
            {generatedAssets.length > 0 && (
                <Card title="Generated Assets">
                    <div className="space-y-3">
                        {generatedAssets.map(asset => (
                            <div key={asset.id} className="bg-stone-900/50 p-3 rounded-lg flex items-center gap-4">
                               <input
                                    type="checkbox"
                                    checked={asset.isSelected}
                                    onChange={() => toggleAssetSelection(asset.id)}
                                    className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 flex-shrink-0"
                                />
                                <div className="flex-grow">
                                    {renderAsset(asset)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-right pt-4 mt-4 border-t border-stone-700">
                        <Button onClick={handleImportAssets}>Import Selected</Button>
                    </div>
                </Card>
            )}

        </div>
    );
};

export default AiStudioPage;