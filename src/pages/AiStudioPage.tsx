
import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Sparkles, CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import CreateQuestDialog from '../components/quests/CreateQuestDialog';

type AssetType = 'Duties' | 'Ventures' | 'Trophies' | 'Items' | 'Markets';

const assetTypeConfig: { [key in AssetType]: { icon: string; description: string; } } = {
    Ventures: { icon: '🗺️', description: 'One-time tasks or projects.' },
    Duties: { icon: '🔄', description: 'Recurring daily or weekly tasks.' },
    Items: { icon: '⚔️', description: 'Virtual goods for the marketplace.' },
    Trophies: { icon: '🏆', description: 'Achievements for users to earn.' },
    Markets: { icon: '🛒', description: 'Themed stores for selling items.' },
};

const ApiInstructions: React.FC = () => (
    <div className="text-donegeon-text/80 text-sm space-y-3">
        <p>To use the AI Studio, a Google Gemini API key must be configured on the server. Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-donegeon-accent hover:underline">Google AI Studio</a>.</p>
        <p>The server administrator needs to set the <code>API_KEY</code> environment variable in the <code>.env</code> file.</p>
        <p>After setting the key, restart the server and use the "Test API Key" button to verify.</p>
    </div>
);

const AiStudioPage: React.FC = () => {
    const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>('unknown');
    const [apiError, setApiError] = useState<string | null>(null);

    const [context, setContext] = useState('');
    const [prompt, setPrompt] = useState('');
    const [assetType, setAssetType] = useState<AssetType>('Ventures');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [aiGeneratedData, setAiGeneratedData] = useState<any | null>(null);
    const [dialogToShow, setDialogToShow] = useState<AssetType | null>(null);


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

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) { setError('Please enter a prompt to generate assets.'); return; }
        setIsLoading(true); setError('');
        
        const fullPrompt = `Context: ${context || 'A typical family with children.'}\nRequest: Generate a single JSON object for a ${assetType} based on the theme: "${prompt}".`;

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt }) // Simplified for now
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Server responded with status ${response.status}`);
            }

            const result = await response.json();
            const text = result.text;
            if (!text) { throw new Error("Received an empty response from the AI. The prompt may have been blocked."); }
            
            const assetData = JSON.parse(text);

            if (assetData) {
                setAiGeneratedData(assetData);
                setDialogToShow(assetType);
            } else {
                throw new Error("AI did not return a valid asset. Please try a different prompt.");
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate ideas. ${message}`);
            if (dialogToShow) {
                setDialogToShow(null);
                setAiGeneratedData(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, assetType, context, dialogToShow]);
    
    const handleCloseDialog = () => {
        setDialogToShow(null);
        setAiGeneratedData(null);
        setPrompt('');
    };

    const handleUseIdea = () => {
        if (!aiGeneratedData) return;

        if (dialogToShow === 'Ventures' || dialogToShow === 'Duties') {
            // This will be handled by the dialog itself opening
        } else {
            alert(`Using generated '${dialogToShow}' is not yet implemented. Check the console for the generated data.`);
            console.log(aiGeneratedData);
            handleCloseDialog();
        }
    }
    
    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-donegeon-accent mb-6 flex items-center gap-3" style={{ textShadow: '1px 1px 2px #000' }}>
                    <Sparkles className="h-8 w-8" /> AI Studio
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Asset Generator</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-donegeon-text/80 mb-2">1. Select Asset Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(assetTypeConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setAssetType(key as AssetType)}
                                                className={`p-4 rounded-lg text-center transition-all duration-200 border-2 ${
                                                    assetType === key
                                                        ? 'bg-donegeon-green/30 border-donegeon-green'
                                                        : 'bg-donegeon-brown/50 border-donegeon-gray hover:border-donegeon-accent'
                                                }`}
                                            >
                                                <div className="text-4xl">{config.icon}</div>
                                                <p className="font-semibold text-sm text-donegeon-text mt-2">{key}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="ai-prompt" className="block text-sm font-medium text-donegeon-text/80 mb-2">2. Enter Prompt / Theme</label>
                                    <textarea
                                        id="ai-prompt"
                                        rows={4}
                                        placeholder={`e.g., 'Weekly kitchen chores for kids', 'Magical forest artifacts'`}
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        className="flex w-full rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-donegeon-accent"
                                    />
                                </div>
                                {error && <p className="text-donegeon-red text-center mt-4">{error}</p>}
                                <div className="text-right pt-2">
                                    <Button onClick={handleGenerate} disabled={isLoading || apiStatus !== 'valid' || !prompt.trim()}>
                                        {isLoading ? <LoaderCircle className="animate-spin" /> : 'Generate'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                             <CardHeader><CardTitle>Generation Context</CardTitle></CardHeader>
                             <CardContent>
                                <p className="text-sm text-donegeon-text/80 mb-2">Provide general context about your group. This helps the AI generate more relevant content.</p>
                                <textarea
                                    value={context}
                                    onChange={e => setContext(e.target.value)}
                                    placeholder="e.g., A family with two kids, ages 8 and 12, focusing on household chores and homework."
                                    rows={4}
                                     className="flex w-full rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-donegeon-accent"
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>AI Studio Setup</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="font-semibold text-donegeon-text">API Key Status:</span>
                                    {apiStatus === 'testing' && <span className="text-yellow-400 flex items-center gap-2"><LoaderCircle className="animate-spin h-4 w-4"/>Testing...</span>}
                                    {apiStatus === 'valid' && <span className="flex items-center gap-2 text-donegeon-green font-bold"><CheckCircle className="h-5 w-5" /> Connected</span>}
                                    {apiStatus === 'invalid' && <span className="flex items-center gap-2 text-donegeon-red font-bold"><XCircle className="h-5 w-5" /> Invalid / Not Found</span>}
                                    {apiStatus === 'unknown' && <span className="text-gray-400">Unknown</span>}
                                    <Button variant="outline" size="sm" onClick={testApiKey} disabled={apiStatus === 'testing'}>
                                        Test
                                    </Button>
                                </div>
                                {apiStatus === 'invalid' && apiError && <p className="text-sm text-donegeon-red bg-donegeon-red/20 p-3 rounded-md">{apiError}</p>}
                                {(apiStatus === 'unknown' || apiStatus === 'invalid') && <ApiInstructions />}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {(dialogToShow === 'Ventures' || dialogToShow === 'Duties') && aiGeneratedData && (
                <CreateQuestDialog
                    key={JSON.stringify(aiGeneratedData)}
                    initialData={{ ...aiGeneratedData, type: dialogToShow === 'Duties' ? 'Duty' : 'Venture' }}
                    onClose={handleCloseDialog}
                />
            )}
            {dialogToShow && !['Ventures', 'Duties'].includes(dialogToShow) && aiGeneratedData && (
                handleUseIdea()
            )}
        </>
    );
};

export default AiStudioPage;
