import React, { useState, useCallback } from 'react';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';
import { GenerateContentResponse, Type } from "@google/genai";
import { Quest, QuestType, Terminology, GameAsset, Trophy, Market, QuestGroup } from '../../types';
import Card from '../user-interface/Card';
import CreateQuestDialog from '../quests/CreateQuestDialog';
import { EditGameAssetDialog } from '../admin/EditGameAssetDialog';
import EditTrophyDialog from '../settings/EditTrophyDialog';
import EditMarketDialog from '../markets/EditMarketDialog';
import EditQuestGroupDialog from '../quests/EditQuestGroupDialog';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState, useEconomyDispatch } from '../../context/EconomyContext';
import { useProgressionDispatch } from '../../context/ProgressionContext';

type AssetType = 'Ventures' | 'Duties' | 'Journeys' | 'Items' | 'Markets' | 'Trophies' | 'Quest Groups';

const assetTypeConfig: { [key in AssetType]: { icon: string; termKey: keyof Terminology, schemaKey: string } } = {
    'Ventures': { icon: '🗺️', termKey: 'singleTasks', schemaKey: 'ventures' },
    'Duties': { icon: '🔄', termKey: 'recurringTasks', schemaKey: 'duties' },
    'Journeys': { icon: '🧭', termKey: 'journeys', schemaKey: 'journeys' },
    'Items': { icon: '⚔️', termKey: 'link_manage_items', schemaKey: 'items' },
    'Markets': { icon: '🛒', termKey: 'stores', schemaKey: 'markets' },
    'Trophies': { icon: '🏆', termKey: 'awards', schemaKey: 'trophies' },
    'Quest Groups': { icon: '📂', termKey: 'link_manage_quest_groups', schemaKey: 'quest_groups' },
};

type GeneratedResults = {
    ventures?: Partial<Quest>[];
    duties?: Partial<Quest>[];
    journeys?: Partial<Quest>[];
    items?: Partial<GameAsset>[];
    markets?: Partial<Market>[];
    trophies?: Partial<Trophy>[];
    quest_groups?: Partial<QuestGroup>[];
};

type DialogState = {
    type: AssetType;
    data: any;
    index: number;
} | null;

const SuggestionEnginePage: React.FC = () => {
    const { settings, isAiConfigured } = useSystemState();
    const { questGroups } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { users } = useAuthState();
    const { addNotification } = useNotificationsDispatch();
    const { addQuest, addQuestGroup } = useQuestsDispatch();
    const { addGameAsset, addMarket } = useEconomyDispatch();
    const { addTrophy } = useProgressionDispatch();

    const [selectedAssetTypes, setSelectedAssetTypes] = useState<Record<AssetType, number>>({} as Record<AssetType, number>);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [view, setView] = useState<'form' | 'results'>('form');
    const [generatedResults, setGeneratedResults] = useState<GeneratedResults | null>(null);
    const [dialogState, setDialogState] = useState<DialogState>(null);
    const [editingQuestGroup, setEditingQuestGroup] = useState<QuestGroup | null>(null);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const handleAssetTypeChange = (type: AssetType) => {
        setSelectedAssetTypes(prev => {
            const newSelection = { ...prev };
            if (newSelection[type]) {
                delete newSelection[type];
            } else {
                newSelection[type] = 1;
            }
            return newSelection;
        });
    };

    const handleQuantityChange = (type: AssetType, quantity: number) => {
        const num = Math.max(1, Math.min(20, quantity || 1));
        setSelectedAssetTypes(prev => ({ ...prev, [type]: num }));
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
            case 'Markets': return { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['title', 'description', 'icon'] };
            case 'Duties':
            case 'Ventures': return { type: Type.OBJECT, properties: baseQuestSchema, required: ['title', 'description', 'icon', 'tags', 'suggestedRewards', 'groupName', 'isNewGroup'] };
            case 'Journeys': return { type: Type.OBJECT, properties: { ...baseQuestSchema, checkpoints: { type: Type.ARRAY, description: "An array of 2 to 5 steps or checkpoints.", items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, suggestedRewards: { ...rewardSchema, description: "Rewards for this checkpoint." } }, required: ['description'] } } }, required: ['title', 'description', 'icon', 'tags', 'checkpoints', 'groupName', 'isNewGroup'] };
            case 'Trophies': return { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['name', 'description', 'icon'] };
            case 'Items': return { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, category: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['name', 'description', 'category', 'icon'] };
            case 'Quest Groups': return { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } }, required: ['name', 'description', 'icon'] };
            default: return {};
        }
    };
    
    const buildDynamicSchema = () => {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        Object.entries(selectedAssetTypes).forEach(([assetType, quantity]) => {
            if (quantity > 0) {
                const config = assetTypeConfig[assetType as AssetType];
                properties[config.schemaKey] = {
                    type: Type.ARRAY,
                    description: `Generate exactly ${quantity} ${assetType.toLowerCase()}.`,
                    items: getSchemaForAssetType(assetType as AssetType)
                };
                required.push(config.schemaKey);
            }
        });
        return { type: Type.OBJECT, properties, required };
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || Object.keys(selectedAssetTypes).length === 0) {
            setError('Please select at least one asset type and provide a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');

        const assetQuantities = Object.entries(selectedAssetTypes).map(([type, quantity]) => `${quantity} ${type}`).join(', ');
        const rewardNames = rewardTypes.map(rt => rt.name).join(', ');
        const groupNames = questGroups.map(g => g.name).join(', ');
        
        const fullPrompt = `Generate a JSON object containing ${assetQuantities} for a gamified task app called ${settings.terminology.appName}. All generated assets should be thematically related to: "${prompt}".
        For any assets that have rewards (like quests), use reward names from this list: ${rewardNames}. CRITICAL REWARD RULE: Reward amounts must be small integers, typically between 1 and 5.
        For any quests, you can assign them to an existing Quest Group from this list: "${groupNames}". If none fit, suggest a new group name and set the isNewGroup flag to true.
        Ensure all generated assets are unique, creative, and fit the theme.`;

        const requestBody = {
            model: 'gemini-2.5-flash',
            prompt: fullPrompt,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: buildDynamicSchema()
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
            if (!text) { throw new Error("Received an empty response from the AI."); }
            
            const assetData = JSON.parse(text);
            setGeneratedResults(assetData);
            setView('results');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, selectedAssetTypes, rewardTypes, questGroups, settings.terminology]);

    const handleDiscardItem = (schemaKey: keyof GeneratedResults, index: number) => {
        setGeneratedResults(prev => {
            if (!prev || !prev[schemaKey]) return prev;
            const newResults = { ...prev };
            const newItems = [...newResults[schemaKey]!];
            newItems.splice(index, 1);
            newResults[schemaKey] = newItems;
            return newResults;
        });
    };

    const handleAddItem = async (schemaKey: keyof GeneratedResults, item: any, index: number) => {
        let success = false;
        try {
            if (schemaKey === 'ventures' || schemaKey === 'duties' || schemaKey === 'journeys') {
                await addQuest(item); success = true;
            } else if (schemaKey === 'items') {
                await addGameAsset(item); success = true;
            } else if (schemaKey === 'markets') {
                await addMarket(item); success = true;
            } else if (schemaKey === 'trophies') {
                await addTrophy(item); success = true;
            } else if (schemaKey === 'quest_groups') {
                await addQuestGroup(item); success = true;
            }
            if (success) {
                handleDiscardItem(schemaKey, index);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleEditAndAddItem = async (assetType: AssetType, itemData: any, schemaKey: keyof GeneratedResults, index: number) => {
        if (assetType === 'Quest Groups') {
            const newGroup = await addQuestGroup(itemData);
            if (newGroup) {
                setEditingQuestGroup(newGroup);
                handleDiscardItem(schemaKey, index);
            }
        } else {
            setDialogState({ type: assetType, data: itemData, index });
            handleDiscardItem(schemaKey, index);
        }
    };
    
    const renderResults = () => {
        if (!generatedResults) return null;
        
        const typeMapping: { [key in keyof GeneratedResults]?: AssetType } = {
            ventures: 'Ventures', duties: 'Duties', journeys: 'Journeys',
            items: 'Items', markets: 'Markets', trophies: 'Trophies', quest_groups: 'Quest Groups'
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-medieval text-emerald-400">Generated Assets</h2>
                    <Button variant="secondary" onClick={() => { setView('form'); setGeneratedResults(null); }}>&larr; Back to Generator</Button>
                </div>
                {Object.entries(generatedResults).map(([schemaKey, items]) => {
                    if (!items || items.length === 0) return null;
                    const assetType = typeMapping[schemaKey as keyof GeneratedResults];
                    // FIX: Add a guard clause to ensure assetType and its config exist before rendering, preventing a crash if the API returns an unexpected key.
                    if (!assetType) return null;
                    const config = assetTypeConfig[assetType];
                    // FIX: Correctly check that a termKey exists on the config object before using it to access terminology settings, preventing a potential runtime error.
                    if (!config?.termKey) return null;

                    return (
                        // FIX: Add a type assertion to `config.termKey` to assure TypeScript that it is a valid key for the `terminology` object, resolving a TS7053 error.
                        <Card key={schemaKey} title={`${config.icon} Generated ${settings.terminology[config.termKey as keyof Terminology]}`}>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="bg-stone-900/50 p-3 rounded-lg flex justify-between items-center gap-4">
                                        <div className="flex-grow">
                                            {/* FIX: Use type assertions to safely access 'title' or 'name' from the union type, resolving TS2339 property not found errors. */}
                                            <p className="font-bold text-stone-200">{item.icon} {(item as any).title || (item as any).name}</p>
                                            <p className="text-sm text-stone-400">{item.description}</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button size="sm" variant="secondary" onClick={() => handleAddItem(schemaKey as keyof GeneratedResults, item, index)}>Add</Button>
                                            {/* FIX: The assetType is now guaranteed to be defined due to the guard clause above, resolving a TS2345 error. */}
                                            <Button size="sm" variant="secondary" onClick={() => handleEditAndAddItem(assetType, item, schemaKey as keyof GeneratedResults, index)}>Edit & Add</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDiscardItem(schemaKey as keyof GeneratedResults, index)}>Discard</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };
    
    const renderDialogs = () => {
        if (editingQuestGroup) {
            return <EditQuestGroupDialog groupToEdit={editingQuestGroup} onClose={() => setEditingQuestGroup(null)} />;
        }
        if (!dialogState) return null;

        const commonProps = {
            initialData: dialogState.data,
            onClose: () => setDialogState(null),
            mode: 'ai-creation' as const,
        };

        switch (dialogState.type) {
            case 'Ventures': return <CreateQuestDialog {...commonProps} initialData={{ ...dialogState.data, type: QuestType.Venture }} />;
            case 'Duties': return <CreateQuestDialog {...commonProps} initialData={{ ...dialogState.data, type: QuestType.Duty }} />;
            case 'Journeys': return <CreateQuestDialog {...commonProps} initialData={{ ...dialogState.data, type: QuestType.Journey }} />;
            case 'Items': return <EditGameAssetDialog {...commonProps} assetToEdit={null} />;
            case 'Markets': return <EditMarketDialog {...commonProps} market={null} />;
            case 'Trophies': return <EditTrophyDialog {...commonProps} trophy={null} />;
            default: return null;
        }
    };

    return (
        <>
            {view === 'form' ? (
                 <Card title="Suggestion Foundry">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-2">1. Select Asset Types & Quantities</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(assetTypeConfig).map(([type, config]) => {
                                    const assetKey = type as AssetType;
                                    const isSelected = !!selectedAssetTypes[assetKey];
                                    return (
                                        <div key={type} className={`p-3 rounded-lg text-center transition-all duration-200 border-2 ${isSelected ? 'bg-emerald-800/60 border-emerald-500' : 'bg-stone-900/50 border-transparent'}`}>
                                            <label className="flex flex-col items-center cursor-pointer">
                                                <input type="checkbox" checked={isSelected} onChange={() => handleAssetTypeChange(assetKey)} className="hidden"/>
                                                <div className="text-4xl">{config.icon}</div>
                                                <p className="font-semibold text-sm text-stone-200 mt-2 capitalize">{settings.terminology[config.termKey]}</p>
                                            </label>
                                            {isSelected && (
                                                <Input type="number" value={selectedAssetTypes[assetKey]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(assetKey, parseInt(e.target.value))} min="1" max="20" className="w-20 mx-auto mt-2 h-8 text-center" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="ai-prompt" className="block text-sm font-medium text-stone-300 mb-2">2. Enter General Prompt</label>
                            <textarea id="ai-prompt" rows={4} placeholder={`e.g., 'Weekly kitchen chores for kids', 'Magical forest artifacts'`} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    <div className="text-right mt-4">
                        <Button onClick={handleGenerate} disabled={isLoading || !isAiAvailable || !prompt.trim() || Object.keys(selectedAssetTypes).length === 0}>
                            {isLoading ? 'Generating...' : 'Generate Assets'}
                        </Button>
                    </div>
                </Card>
            ) : renderResults()}
            {renderDialogs()}
        </>
    );
};

export default SuggestionEnginePage;
