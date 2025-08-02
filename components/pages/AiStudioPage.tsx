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
             if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setApiStatus('valid');
                    addNotification({ type: 'success', message: 'API key is valid!' });
                } else {
                    setApiStatus('invalid');
                    setApiError(data.error || 'Test failed.');
                }
            } else {
                const data = await response.json();
                setApiStatus('invalid');
                setApiError(data.error || 'Test failed with a server error.');
            }
        } catch (e) {
            setApiStatus('invalid');
            setApiError(e instanceof Error ? e.message : 'An unknown error occurred.');
        }
    };
    
    const handleContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContext(e.target.value);
        localStorage.setItem('aiStudioContext', e.target.value);
    };
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setAiGeneratedData(null);
        // ... (API call logic would go here)
        setIsLoading(false);
    };
    
    const handleUseIdea = (idea: any) => {
        setAiGeneratedData(idea);
        setDialogToShow(assetType);
    };

    const handleTryAgain = () => {
        setAiGeneratedData(null);
        handleGenerate();
    };
    
    const handleCloseDialog = () => {
        setDialogToShow(null);
        setAiGeneratedData(null);
    };
    
    const renderDialog = () => {
        if (!dialogToShow || !aiGeneratedData) return null;
        switch(dialogToShow) {
            case 'Ventures':
            case 'Duties':
                return <CreateQuestDialog initialData={{...aiGeneratedData, type: dialogToShow === 'Duties' ? QuestType.Duty : QuestType.Venture}} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleTryAgain} isGenerating={isLoading} />;
            case 'Items':
                return <EditGameAssetDialog assetToEdit={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleTryAgain} isGenerating={isLoading} />;
            case 'Trophies':
                return <EditTrophyDialog trophy={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleTryAgain} isGenerating={isLoading} />;
            case 'Markets':
                return <EditMarketDialog market={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleTryAgain} isGenerating={isLoading} />;
            default:
                return null;
        }
    };

    if (!isAiAvailable) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SparklesIcon /> AI Studio Disabled</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">The AI Studio is currently disabled. An administrator must first enable AI features in the settings and configure a valid API key on the server.</p>
                    <ApiInstructions />
                    <div className="flex items-center gap-4">
                        <Button onClick={testApiKey} disabled={apiStatus === 'testing'}>
                            {apiStatus === 'testing' ? 'Testing...' : 'Test API Key'}
                        </Button>
                        {apiStatus === 'valid' && <span className="flex items-center gap-2 text-green-400"><CheckCircleIcon /> Valid</span>}
                        {apiStatus === 'invalid' && <span className="flex items-center gap-2 text-red-400"><XCircleIcon /> Invalid</span>}
                    </div>
                    {apiStatus === 'invalid' && apiError && <p className="text-sm text-red-400">{apiError}</p>}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SparklesIcon /> AI Studio</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Provide general context about your game (e.g., family chore list, classroom tasks, personal habits) to improve the AI's suggestions.</p>
                        <Input placeholder="General Context (optional)" value={context} onChange={handleContextChange} />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {Object.entries(assetTypeConfig).map(([type, config]) => (
                                <button key={type} onClick={() => setAssetType(type as AssetType)} className={`p-4 rounded-lg text-center transition-colors border-2 ${assetType === type ? 'border-primary bg-primary/20' : 'border-border bg-background hover:bg-accent/50'}`}>
                                    <span className="text-3xl">{config.icon}</span>
                                    <p className="font-semibold text-sm mt-2">{settings.terminology[config.termKey]}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <Input placeholder={`Generate ${settings.terminology[assetTypeConfig[assetType].termKey].toLowerCase()} about...`} value={prompt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleGenerate()} />
                            <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                                {isLoading ? 'Generating...' : 'Generate'}
                            </Button>
                        </div>
                        {error && <p className="text-red-400 text-center">{error}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* This is where generated results would be displayed */}
            {isLoading && <p>Loading...</p>}

            {renderDialog()}
        </div>
    );
};

export default AiStudioPage;