import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '@/components/ui/icons';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { GenerateContentResponse, Type } from '@google/genai';
import { QuestType, Terminology } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import EditGameAssetDialog from '../admin/EditGameAssetDialog';
import EditTrophyDialog from '../settings/EditTrophyDialog';
import EditMarketDialog from '../markets/EditMarketDialog';

type AssetType = 'Duties' | 'Ventures' | 'Trophies' | 'Items' | 'Markets';

const assetTypeConfig: { [key in AssetType]: { icon: string; description: string; termKey: keyof Terminology } } = {
    Ventures: { icon: '🗺️', description: 'One-time tasks or projects.', termKey: 'singleTasks' },
    Duties: { icon: '🔄', description: 'Recurring daily or weekly tasks.', termKey: 'recurringTasks' },
    Items: { icon: '⚔️', description: 'Virtual goods for the marketplace.', termKey: 'link_manage_items' },
    Trophies: { icon: '🏆', description: 'Achievements for users to earn.', termKey: 'awards' },
    Markets: { icon: '🛒', description: 'Themed stores for selling items.', termKey: 'stores' },
};

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
    const { settings, isAiConfigured, rewardTypes, questGroups } = useAppState();
    const { addNotification } = useAppDispatch();
    const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>(isAiConfigured ? 'valid' : 'unknown');
    const [apiError, setApiError] = useState<string | null>(null);

    const [context, setContext] = useState(localStorage.getItem('aiStudioContext') || '');
    const [prompt, setPrompt] = useState('');
    const [assetType, setAssetType] = useState<AssetType>('Ventures');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [aiGeneratedData, setAiGeneratedData] = useState<any | null>(null);
    const [dialogToShow, setDialogToShow] = useState<AssetType | null>(null);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

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
        const questSchema = { type: Type.OBJECT, properties: {
            title: { type: Type.STRING, description: 'A short, engaging title.' },
            description: { type: Type.STRING, description: 'A one-sentence description.' },
            icon: { type: Type.STRING, description: 'A single, relevant emoji.'},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedRewards: { type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    rewardTypeName: { type: Type.STRING },
                    amount: { type: Type.INTEGER }
                }
            }},
            groupName: { type: Type.STRING },
            isNewGroup: { type: Type.BOOLEAN }
        }, required: ['title', 'description', 'icon', 'tags', 'suggestedRewards', 'groupName', 'isNewGroup'] };

        switch (type) {
            case 'Markets':
                return { type: Type.OBJECT, properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                }, required: ['title', 'description', 'icon'] };
            case 'Duties':
            case 'Ventures':
                return questSchema;
            case 'Trophies':
                return { type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                }, required: ['name', 'description', 'icon'] };
            case 'Items':
                return { type: Type.OBJECT, properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    icon: { type: Type.STRING }
                }, required: ['name', 'description', 'category', 'icon'] };
            default: return {};
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) { setError('Please enter a prompt to generate assets.'); return; }
        setIsLoading(true); setError('');
        
        const assetTypeName = assetType === 'Duties' ? 'Duties (recurring tasks)' : assetType === 'Ventures' ? 'Ventures (one-time projects)' : assetType;
        const rewardNames = rewardTypes.map(rt => rt.name).join(', ');
        const groupNames = questGroups.map(g => g.name).join(', ');
        const fullPrompt = `Context: ${context || 'A typical family with children.'}\nRequest: Generate a single JSON object for a ${assetTypeName} based on the theme: "${prompt}". If generating a quest, suggest 2-3 relevant tags, a suggested reward (using reward names from this list: ${rewardNames}), and the most appropriate quest group (from this list: ${groupNames}, or suggest a new one).`;

        const requestBody = {
             model: 'gemini-2.5-flash',
             prompt: fullPrompt,
             generationConfig: { 
                 responseMimeType: "application/json",
                 responseSchema: getSchemaForAssetType(assetType)
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
            if (!text) { throw new Error("Received an empty response from the AI. The prompt may have been blocked."); }
            
            const assetData = JSON.parse(text);

            if (assetData) {
                setAiGeneratedData(assetData);
                if (!dialogToShow) { // Only open the dialog on the first generation
                    setDialogToShow(assetType);
                }
            } else {
                throw new Error("AI did not return a valid asset. Please try a different prompt.");
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate ideas. ${message}`);
            // If the dialog was open, close it on error
            if (dialogToShow) {
                setDialogToShow(null);
                setAiGeneratedData(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, assetType, context, dialogToShow, rewardTypes, questGroups, settings.terminology]);
    
    const handleCloseDialog = () => {
        setDialogToShow(null);
        setAiGeneratedData(null);
        setPrompt(''); // Clear prompt after finishing
    };
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Asset Generator</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">1. Select Asset Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(assetTypeConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setAssetType(key as AssetType)}
                                                className={`p-4 rounded-lg text-center transition-all duration-200 border-2 ${
                                                    assetType === key
                                                        ? 'bg-primary/20 border-primary ring-2 ring-primary/50 scale-105'
                                                        : 'bg-background/50 border-transparent hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="text-4xl">{config.icon}</div>
                                                <p className="font-semibold text-sm text-foreground mt-2 capitalize">{settings.terminology[config.termKey]}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="ai-prompt" className="block text-sm font-medium text-foreground mb-2">2. Enter Prompt / Theme</label>
                                    <textarea
                                        id="ai-prompt"
                                        rows={4}
                                        placeholder={`e.g., 'Weekly kitchen chores for kids', 'Magical forest artifacts', 'Sports achievements'`}
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-md"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                            <div className="text-right mt-4">
                                <Button onClick={handleGenerate} disabled={isLoading || !isAiAvailable || !prompt.trim()}>
                                    {isLoading ? 'Generating...' : 'Generate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Generation Context</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">Provide some general context about your group or goals. This will be included with every prompt to help the AI generate more relevant content.</p>
                            <textarea
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                placeholder="e.g., A family with two kids, ages 8 and 12, focusing on household chores and homework."
                                rows={4}
                                className="w-full px-4 py-2 bg-background border border-input rounded-md"
                            />
                            <div className="text-right mt-2">
                                <Button variant="secondary" onClick={handleSaveContext} size="sm">Save Context</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>AI Studio Setup</CardTitle></CardHeader>
                        <CardContent>
                            {!isAiAvailable ? (
                                <div className="text-amber-300 bg-amber-900/40 p-4 rounded-md border border-amber-700/60">
                                    <p className="font-bold mb-2">AI Features Disabled</p>
                                    <p className="text-sm">The AI Studio is currently disabled in the main application settings. An administrator can enable it from the Settings page.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="font-semibold text-foreground">API Key Status:</span>
                                        {apiStatus === 'testing' && <span className="text-yellow-400">Testing...</span>}
                                        {apiStatus === 'valid' && <span className="flex items-center gap-2 text-green-400 font-bold"><CheckCircleIcon className="w-5 h-5" /> Connected</span>}
                                        {apiStatus === 'invalid' && <span className="flex items-center gap-2 text-red-400 font-bold"><XCircleIcon className="w-5 h-5" /> Invalid / Not Found</span>}
                                        {apiStatus === 'unknown' && <span className="text-muted-foreground">Unknown</span>}
                                        <Button variant="secondary" onClick={testApiKey} disabled={apiStatus === 'testing'} size="sm">
                                            Test API Key
                                        </Button>
                                    </div>
                                    {apiStatus === 'invalid' && apiError && <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-md">{apiError}</p>}
                                    {(apiStatus === 'unknown' || apiStatus === 'invalid') && <ApiInstructions />}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {dialogToShow && aiGeneratedData && (
                <>
                    {(dialogToShow === 'Ventures' || dialogToShow === 'Duties') && (
                        <CreateQuestDialog
                            key={JSON.stringify(aiGeneratedData)} // Re-mounts the component with new data
                            mode="ai-creation"
                            initialData={{ ...aiGeneratedData, type: dialogToShow === 'Duties' ? QuestType.Duty : QuestType.Venture }}
                            onClose={handleCloseDialog}
                            onTryAgain={handleGenerate}
                            isGenerating={isLoading}
                        />
                    )}
                     {dialogToShow === 'Items' && (
                        <EditGameAssetDialog
                            key={JSON.stringify(aiGeneratedData)}
                            assetToEdit={null}
                            initialData={{
                                ...aiGeneratedData,
                                url: `https://placehold.co/150/FFFFFF/000000?text=${encodeURIComponent(aiGeneratedData.icon)}`
                            }}
                            onClose={handleCloseDialog}
                            mode="ai-creation"
                            onTryAgain={handleGenerate}
                            isGenerating={isLoading}
                        />
                    )}
                     {dialogToShow === 'Trophies' && (
                        <EditTrophyDialog
                            key={JSON.stringify(aiGeneratedData)}
                            trophy={null}
                            initialData={aiGeneratedData}
                            onClose={handleCloseDialog}
                            mode="ai-creation"
                            onTryAgain={handleGenerate}
                            isGenerating={isLoading}
                        />
                    )}
                     {dialogToShow === 'Markets' && (
                        <EditMarketDialog
                            key={JSON.stringify(aiGeneratedData)}
                            market={null}
                            initialData={aiGeneratedData}
                            onClose={handleCloseDialog}
                            mode="ai-creation"
                            onTryAgain={handleGenerate}
                            isGenerating={isLoading}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default AiStudioPage;