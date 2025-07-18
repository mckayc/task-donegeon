import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '../ui/Icons';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GenerateContentResponse, Type } from '@google/genai';
import { Quest, Trophy, GameAsset, QuestAvailability, QuestType, Market } from '../../types';
import Card from '../ui/Card';
import { useSettings } from '../../context/SettingsContext';

type AssetType = 'Duties' | 'Ventures' | 'Trophies' | 'Items' | 'Markets';

interface GeneratedAsset {
    id: string;
    type: AssetType;
    data: any;
    isSelected: boolean;
}

const ApiInstructions: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 text-sm space-y-4">
        <p>To use the AI Studio, a Google Gemini API key must be configured on the server. Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a>.</p>
        <p>The server administrator needs to set the <code>API_KEY</code> environment variable:</p>
        <ul className="list-disc list-inside space-y-1">
            <li><strong>For Local/Docker Development:</strong> Add <code>API_KEY=your_api_key_here</code> to the <code>.env</code> file in the project's root directory.</li>
            <li><strong>For Vercel Deployment:</strong> Add an environment variable named <code>API_KEY</code> with your key in the Vercel project settings.</li>
        </ul>
        <p>After setting the key, the server may need to be restarted. Use the "Test API Key" button below to verify the setup.</p>
    </div>
);


const AiStudioPage: React.FC = () => {
    const { addQuest, addTrophy, addGameAsset, addNotification, addMarket } = useAppDispatch();
    const { settings, isAiConfigured } = useAppState();
    const { isAiAvailable } = useSettings();
    const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>(isAiConfigured ? 'valid' : 'unknown');
    const [apiError, setApiError] = useState<string | null>(null);

    const [context, setContext] = useState(localStorage.getItem('aiStudioContext') || '');
    const [prompt, setPrompt] = useState('');
    const [quantity, setQuantity] = useState(5);
    const [assetType, setAssetType] = useState<AssetType>('Ventures');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
    const resultsRef = useRef<HTMLDivElement>(null);

    const testApiKey = async () => {
        setApiStatus('testing');
        setApiError(null);
        try {
            const response = await fetch('/api/ai/test', { method: 'POST' });
            const data = await response.json();
            if (response.ok && data.success) {
                setApiStatus('valid');
            } else {
                setApiStatus('invalid');
                setApiError(data.error || 'An unknown error occurred during testing.');
            }
        } catch {
            setApiStatus('invalid');
            setApiError('Could not connect to the server to test the API key.');
        }
    };
    
    const handleSaveContext = () => {
        localStorage.setItem('aiStudioContext', context);
        addNotification({ type: 'success', message: 'Context saved!' });
    };

    const getSchemaForAssetType = (type: AssetType) => {
        const questSchema = { type: Type.ARRAY, description: `A list of ${settings.terminology.tasks.toLowerCase()}.`, items: {
            type: Type.OBJECT, properties: {
                title: { type: Type.STRING, description: 'A short, engaging title.' },
                description: { type: Type.STRING, description: 'A one-sentence description.' },
                icon: { type: Type.STRING, description: 'A single, relevant emoji.'},
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }, required: ['title', 'description', 'icon']
        }};

        switch (type) {
            case 'Markets':
                return { type: Type.ARRAY, description: 'A list of themed markets.', items: {
                    type: Type.OBJECT, properties: {
                        title: { type: Type.STRING, description: 'The name of the market.' },
                        description: { type: Type.STRING, description: 'A short description of what is sold.' },
                        icon: { type: Type.STRING, description: 'A single emoji.' },
                    }, required: ['title', 'description', 'icon']
                }};
            case 'Duties':
            case 'Ventures':
                return questSchema;
            case 'Trophies':
                return { type: Type.ARRAY, description: `A list of ${settings.terminology.awards.toLowerCase()}.`, items: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING, description: 'The name of the award.' },
                        description: { type: Type.STRING, description: 'How to earn this award.' },
                        icon: { type: Type.STRING, description: 'A single emoji to represent the award.' },
                    }, required: ['name', 'description', 'icon']
                }};
            case 'Items':
                return { type: Type.ARRAY, description: 'A list of items for the store.', items: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING, description: 'The name of the item.' },
                        description: { type: Type.STRING, description: 'A short, enticing description.' },
                        category: { type: Type.STRING, description: 'e.g., Avatar, Theme, Power-up' },
                        icon: { type: Type.STRING, description: 'A single, relevant emoji.'}
                    }, required: ['name', 'description', 'category', 'icon']
                }};
            default: return {};
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Please enter a prompt to generate assets.'); return; }
        setIsLoading(true); setError(''); setGeneratedAssets([]);
        
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        const assetTypeName = assetType === 'Duties' ? 'Duties (recurring tasks)' : assetType === 'Ventures' ? 'Ventures (one-time projects)' : assetType;
        const fullPrompt = `Context: ${context || 'A typical family with children.'}\nRequest: Generate a JSON object with a single key "assets". The value of "assets" should be an array of ${quantity} ${assetTypeName} based on the theme: "${prompt}".`;

        const requestBody = {
             model: 'gemini-2.5-flash',
             prompt: fullPrompt,
             generationConfig: { 
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.OBJECT,
                     properties: { assets: getSchemaForAssetType(assetType) },
                     required: ['assets']
                 }
            }
        };

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Server responded with status ${response.status}`);
            }

            const result: { text: string } = await response.json();
            const text = result.text;

            if (!text) {
                throw new Error("Received an empty response from the AI. The prompt may have been blocked.");
            }
            
            const jsonResponse = JSON.parse(text);
            const newAssets = (jsonResponse.assets || []).map((assetData: any) => ({
                id: `gen-${Date.now()}-${Math.random()}`,
                type: assetType,
                data: assetData,
                isSelected: false
            }));
            setGeneratedAssets(newAssets);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleSelect = (id: string) => {
        setGeneratedAssets(prev => prev.map(asset => 
            asset.id === id ? { ...asset, isSelected: !asset.isSelected } : asset
        ));
    };

    const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isSelected = e.target.checked;
        setGeneratedAssets(prev => prev.map(asset => ({ ...asset, isSelected })));
    };

    const handleImportSelected = () => {
        let importedCount = 0;
        generatedAssets.forEach(asset => {
            if (asset.isSelected) {
                switch (asset.type) {
                    case 'Duties':
                        addQuest({
                            ...asset.data, type: QuestType.Duty, availabilityType: QuestAvailability.Daily,
                            rewards: [], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false,
                            requiresApproval: true, assignedUserIds: [], guildId: undefined, icon: asset.data.icon || '✨'
                        });
                        break;
                    case 'Ventures':
                        addQuest({
                            ...asset.data, type: QuestType.Venture, availabilityType: QuestAvailability.Unlimited,
                            rewards: [], lateSetbacks: [], incompleteSetbacks: [], isActive: true, isOptional: false,
                            requiresApproval: true, assignedUserIds: [], guildId: undefined, icon: asset.data.icon || '✨'
                        });
                        break;
                    case 'Trophies':
                        addTrophy({ ...asset.data, isManual: true, requirements: [], icon: asset.data.icon || '🏆' });
                        break;
                    case 'Items':
                        addGameAsset({
                            ...asset.data, url: 'https://placehold.co/150/84cc16/FFFFFF?text=AI',
                            isForSale: false, cost: [], marketIds: [], purchaseLimit: null, purchaseCount: 0, icon: asset.data.icon || '📦'
                        });
                        break;
                    case 'Markets':
                        addMarket({ ...asset.data, status: 'open', icon: asset.data.icon || '🛒' });
                        break;
                }
                importedCount++;
            }
        });
        addNotification({ type: 'success', message: `Successfully imported ${importedCount} new assets!` });
        setGeneratedAssets([]);
    };
    
    const selectedCount = generatedAssets.filter(a => a.isSelected).length;

    return (
        <div className="space-y-6">
            <Card title="AI Studio Setup">
                {!isAiAvailable ? (
                    <div className="text-amber-300 bg-amber-900/40 p-4 rounded-md border border-amber-700/60">
                        <p className="font-bold mb-2">AI Features Disabled</p>
                        <p className="text-sm">The AI Studio is currently disabled in the main application settings. An administrator can enable it from the Settings page.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="font-semibold text-stone-200">API Key Status:</span>
                            {apiStatus === 'testing' && <span className="text-yellow-400">Testing...</span>}
                            {apiStatus === 'valid' && <span className="flex items-center gap-2 text-green-400 font-bold"><CheckCircleIcon className="w-5 h-5" /> Connected</span>}
                            {apiStatus === 'invalid' && <span className="flex items-center gap-2 text-red-400 font-bold"><XCircleIcon className="w-5 h-5" /> Invalid / Not Found</span>}
                            {apiStatus === 'unknown' && <span className="text-stone-400">Unknown</span>}
                            <Button variant="secondary" onClick={testApiKey} disabled={apiStatus === 'testing'} className="text-xs py-1 px-3">
                                Test API Key
                            </Button>
                        </div>
                        {apiStatus === 'invalid' && apiError && <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md">{apiError}</p>}
                        {(apiStatus === 'unknown' || apiStatus === 'invalid') && <ApiInstructions />}
                    </>
                )}
            </Card>
            
            <Card title="Generation Context">
                <p className="text-sm text-stone-400 mb-2">Provide some general context about your group or goals. This will be included with every prompt to help the AI generate more relevant content.</p>
                <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="e.g., A family with two kids, ages 8 and 12, focusing on household chores and homework."
                    rows={3}
                    className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                />
                <div className="text-right mt-2">
                    <Button variant="secondary" onClick={handleSaveContext} className="text-xs py-1 px-3">Save Context</Button>
                </div>
            </Card>

            <Card title="Asset Generator">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input as="select" label="Asset Type" value={assetType} onChange={e => setAssetType(e.target.value as AssetType)}>
                        <option value="Ventures">{settings.terminology.singleTasks}</option>
                        <option value="Duties">{settings.terminology.recurringTasks}</option>
                        <option value="Items">Items</option>
                        <option value="Trophies">{settings.terminology.awards}</option>
                        <option value="Markets">{settings.terminology.stores}</option>
                    </Input>
                    <Input label="Quantity" type="number" min="1" max="20" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
                    <Input label="Prompt / Theme" placeholder="e.g., 'Weekly kitchen chores'" value={prompt} onChange={e => setPrompt(e.target.value)} />
                </div>
                <div className="text-right mt-4">
                    <Button onClick={handleGenerate} disabled={isLoading || !isAiAvailable}>
                        {isLoading ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </Card>
            
            <div ref={resultsRef}>
                {(isLoading || generatedAssets.length > 0) && (
                    <Card title="Generated Assets">
                        {isLoading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                                <p className="mt-4 text-stone-300">The AI is thinking...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-2 border-b border-stone-700/60">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCount === generatedAssets.length}
                                            onChange={handleToggleSelectAll}
                                            className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                        />
                                        <span className="font-semibold text-stone-300">Select / Deselect All</span>
                                    </label>
                                </div>
                                {generatedAssets.map(asset => (
                                    <div key={asset.id} className="bg-stone-900/50 p-3 rounded-lg flex items-start gap-3">
                                        <input type="checkbox" checked={asset.isSelected} onChange={() => handleToggleSelect(asset.id)} className="mt-1 h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        <div>
                                            <p className="font-bold text-stone-200">{asset.data.icon} {asset.data.title || asset.data.name}</p>
                                            <p className="text-sm text-stone-400">{asset.data.description}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-right pt-4 border-t border-stone-700/60">
                                    <Button onClick={handleImportSelected} disabled={selectedCount === 0}>
                                        Import {selectedCount} Selected
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>

        </div>
    );
};

export default AiStudioPage;