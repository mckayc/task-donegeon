import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';
import { GenerateContentResponse, Type } from '@google/genai';
import { QuestType } from '../../types';
import { Terminology } from '../../types/app';
import Card from '../user-interface/Card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { EditGameAssetDialog } from '../admin/EditGameAssetDialog';
import EditTrophyDialog from '../settings/EditTrophyDialog';
import EditMarketDialog from '../markets/EditMarketDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';

type AssetType = 'Duties' | 'Ventures' | 'Journeys' | 'Trophies' | 'Items' | 'Markets';

const assetTypeConfig: { [key in AssetType]: { icon: string; description: string; termKey: keyof Terminology } } = {
    Ventures: { icon: '🗺️', description: 'One-time tasks or projects.', termKey: 'singleTasks' },
    Duties: { icon: '🔄', description: 'Recurring daily or weekly tasks.', termKey: 'recurringTasks' },
    Journeys: { icon: '🧭', description: 'Multi-step adventures.', termKey: 'journeys' },
    Items: { icon: '⚔️', description: 'Virtual goods for the marketplace.', termKey: 'link_manage_items' },
    Trophies: { icon: '🏆', description: 'Achievements for users to earn.', termKey: 'awards' },
    Markets: { icon: '🛒', description: 'Themed stores for selling items.', termKey: 'stores' },
};

const ApiInstructions: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 text-sm space-y-4">
        <p>To use the Suggestion Engine, a Google Gemini API key must be configured on the server. Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a>.</p>
        <p>The server administrator needs to set the <code>API_KEY</code> environment variable:</p>
        <ul className="list-disc list-inside space-y-1">
            <li><strong>For Local/Docker Development:</strong> Add <code>API_KEY=your_api_key_here</code> to the <code>.env</code> file in the project's root directory.</li>
            <li><strong>For Vercel Deployment:</strong> Add an environment variable named <code>API_KEY</code> with your key in the Vercel project settings.</li>
        </ul>
        <p>After setting the key, the server may need to be restarted. Use the "Test API Key" button below to verify the setup.</p>
    </div>
);

const SuggestionEnginePage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { questGroups } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'valid' | 'invalid'>(isAiConfigured ? 'valid' : 'unknown');
    const [apiError, setApiError] = useState<string | null>(null);

    const [context, setContext] = useState(localStorage.getItem('aiStudioContext') || '');
    const [prompt, setPrompt] = useState('');
    const [assetType, setAssetType] = useState<AssetType>('Ventures');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
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
        const rewardSchema = { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: {
                rewardTypeName: { type: Type.STRING },
                amount: { type: Type.INTEGER }
            }, required: ['rewardTypeName', 'amount']
        }};

        const baseQuestSchema = {
            title: { type: Type.STRING, description: 'A short, engaging title.' },
            description: { type: Type.STRING, description: 'A one-sentence description.' },
            icon: { type: Type.STRING, description: 'A single, relevant emoji.'},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedRewards: { ...rewardSchema, description: "Rewards for completing the entire quest." },
            groupName: { type: Type.STRING, description: 'The most appropriate group name for the quest. This can be an existing group name or a new one.'},
            isNewGroup: { type: Type.BOOLEAN, description: 'Set to true if the groupName is a new suggestion, not from the existing list.' }
        };

        switch (type) {
            case 'Markets':
                return { type: Type.OBJECT, properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                }, required: ['title', 'description', 'icon'] };
            case 'Duties':
            case 'Ventures':
                return { type: Type.OBJECT, properties: baseQuestSchema, required: ['title', 'description', 'icon', 'tags', 'suggestedRewards', 'groupName', 'isNewGroup'] };
            case 'Journeys':
                 return { type: Type.OBJECT, properties: {
                    ...baseQuestSchema,
                    checkpoints: {
                        type: Type.ARRAY,
                        description: "An array of 2 to 5 steps or checkpoints for the journey.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING, description: "Description of this single step." },
                                suggestedRewards: { ...rewardSchema, description: "Rewards for completing just this checkpoint." }
                            },
                            required: ['description']
                        }
                    }
                }, required: ['title', 'description', 'icon', 'tags', 'checkpoints', 'groupName', 'isNewGroup'] };
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
        
        const assetTypeName = assetType === 'Duties' ? 'Duties (recurring tasks)' : assetType === 'Ventures' ? 'Ventures (one-time projects)' : assetType === 'Journeys' ? 'Journeys (multi-step quests)' : assetType;
        const rewardNames = rewardTypes.map(rt => rt.name).join(', ');
        const groupNames = questGroups.map(g => g.name).join(', ');
        
        let specificInstructions = '';
        const rewardRule = `CRITICAL RULE FOR REWARDS: The 'amount' for any single reward type MUST be a very small integer, between 1 and 5. Most quests should only have one or two reward types. The total value of all rewards for a single quest should almost never exceed 5.`;

        if (assetType === 'Duties' || assetType === 'Ventures') {
            specificInstructions = `For each quest, also suggest 2-3 relevant tags (e.g., 'cleaning', 'outdoors', 'creative'), a suggested reward for completing the entire quest, based on the task's likely effort (using reward names from this list: ${rewardNames}). ${rewardRule}
            
            Here is a list of existing Quest Groups: "${groupNames}". For each idea, suggest the most appropriate group from this list. If none of the existing groups seem appropriate, suggest a suitable new group name and indicate it's a new group by setting the isNewGroup flag to true.`;
        } else if (assetType === 'Journeys') {
            specificInstructions = `This is a multi-step quest. Create 2-5 sequential "checkpoints". Each checkpoint must have its own description and can optionally have its own suggested rewards from the list: ${rewardNames}. Also provide a final reward for completing the entire Journey. ${rewardRule}
            
            Here is a list of existing Quest Groups: "${groupNames}". Suggest the most appropriate group. If none fit, suggest a new group name and set the isNewGroup flag to true.`;
        }
        
        let userContext = context ? ` General context for our group: "${context}".` : '';
        if (selectedUserId) {
            const selectedUser = users.find(u => u.id === selectedUserId);
            if (selectedUser) {
                userContext += ` Generate this specifically for a user with this context: User's Name: ${selectedUser.gameName} (real name ${selectedUser.firstName} ${selectedUser.lastName}). Birthday: ${selectedUser.birthday}. About Me: "${selectedUser.aboutMe || 'Not provided.'}". Private Admin Notes: "${selectedUser.adminNotes || 'Not provided.'}". Tailor the idea to these details, referring to the user by name and considering their age based on their birthday.`;
            }
        }

        const fullPrompt = `Generate a single JSON object for a ${assetTypeName} for a gamified task app called ${settings.terminology.appName}. The asset should be based on the theme: "${prompt}".${userContext} ${specificInstructions}`;

        const requestBody = {
             // FIX: Updated model from 'gemini-1.5-flash' to 'gemini-2.5-flash'
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
                if (!dialogToShow) {
                    setDialogToShow(assetType);
                }
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
    }, [prompt, assetType, context, dialogToShow, rewardTypes, questGroups, settings.terminology, users, selectedUserId]);
    
    const handleCloseDialog = () => {
        setDialogToShow(null);
        setAiGeneratedData(null);
        setPrompt('');
    };
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <Card title="Asset Generator">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-2">1. Select Asset Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(assetTypeConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setAssetType(key as AssetType)}
                                            className={`p-4 rounded-lg text-center transition-all duration-200 border-2 ${
                                                assetType === key
                                                    ? 'bg-emerald-800/60 border-emerald-500 ring-2 ring-emerald-500/50 scale-105'
                                                    : 'bg-stone-900/50 border-transparent hover:border-emerald-600'
                                            }`}
                                        >
                                            <div className="text-4xl">{config.icon}</div>
                                            <p className="font-semibold text-sm text-stone-200 mt-2 capitalize">{settings.terminology[config.termKey]}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="ai-prompt" className="block text-sm font-medium text-stone-300 mb-2">2. Enter Prompt / Theme</label>
                                <textarea
                                    id="ai-prompt"
                                    rows={4}
                                    placeholder={`e.g., 'Weekly kitchen chores for kids', 'Magical forest artifacts', 'Sports achievements'`}
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        <div className="text-right mt-4">
                            <Button onClick={handleGenerate} disabled={isLoading || !isAiAvailable || !prompt.trim()}>
                                {isLoading ? 'Generating...' : 'Generate'}
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Generation Context">
                        <p className="text-sm text-stone-400 mb-2">Provide some general context about your group or goals. This will be included with every prompt to help the AI generate more relevant content.</p>
                        <textarea
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            placeholder="e.g., A family with two kids, ages 8 and 12, focusing on household chores and homework."
                            rows={4}
                            className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                        />
                         <div className="pt-4 border-t border-stone-700/60">
                             <Input
                                as="select"
                                label="Personalize for User (Optional)"
                                value={selectedUserId}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">General / For All Users</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.gameName}</option>
                                ))}
                            </Input>
                         </div>
                        <div className="text-right mt-2">
                            <Button variant="secondary" onClick={handleSaveContext} className="text-xs py-1 px-3">Save Context</Button>
                        </div>
                    </Card>
                    <Card title="Suggestion Engine Setup">
                        {!isAiAvailable ? (
                            <div className="text-amber-300 bg-amber-900/40 p-4 rounded-md border border-amber-700/60">
                                <p className="font-bold mb-2">AI Features Disabled</p>
                                <p className="text-sm">The Suggestion Engine is currently disabled in the main application settings. An administrator can enable it from the Settings page.</p>
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
                </div>
            </div>
            {dialogToShow === 'Ventures' && <CreateQuestDialog initialData={{...aiGeneratedData, type: QuestType.Venture}} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
            {dialogToShow === 'Duties' && <CreateQuestDialog initialData={{...aiGeneratedData, type: QuestType.Duty}} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
            {dialogToShow === 'Journeys' && <CreateQuestDialog initialData={{...aiGeneratedData, type: QuestType.Journey}} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
            {dialogToShow === 'Items' && <EditGameAssetDialog assetToEdit={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
            {dialogToShow === 'Trophies' && <EditTrophyDialog trophy={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
            {dialogToShow === 'Markets' && <EditMarketDialog market={null} initialData={aiGeneratedData} onClose={handleCloseDialog} mode="ai-creation" onTryAgain={handleGenerate} isGenerating={isLoading} />}
        </>
    );
};

export default SuggestionEnginePage;
