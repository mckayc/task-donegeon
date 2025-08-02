import React, { useState } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SparklesIcon } from '@/components/ui/icons';
import { useAppState } from '../../context/AppContext';
import { QuestType } from '../../types';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Label } from '@/components/ui/label';

interface QuestIdea {
  title: string;
  description: string;
  icon: string;
  tags: string[];
  suggestedRewards: {
      rewardTypeName: string;
      amount: number;
  }[];
  groupName?: string;
  isNewGroup?: boolean;
}

interface QuestIdeaGeneratorProps {
  onUseIdea: (idea: QuestIdea & { type: QuestType }) => void;
  onClose: () => void;
}

const QuestIdeaGenerator: React.FC<QuestIdeaGeneratorProps> = ({ onUseIdea, onClose }) => {
    const { settings, rewardTypes, questGroups } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [questType, setQuestType] = useState<QuestType>(QuestType.Venture);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedQuests, setGeneratedQuests] = useState<QuestIdea[]>([]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a theme or topic for the quest ideas.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedQuests([]);

        const rewardNames = rewardTypes.map(rt => rt.name).join(', ');
        const groupNames = questGroups.map(g => g.name).join(', ');
        const fullPrompt = `Generate 5 quest ideas for a gamified task app called ${settings.terminology.appName}. The quests should be of type "${questType}". Duties are recurring tasks and Ventures are one-time projects. The quests should be practical, actionable, and based on the theme: "${prompt}". For each quest, also suggest 2-3 relevant tags (e.g., 'cleaning', 'outdoors', 'creative'), a suggested reward based on the task's likely effort (using reward names from this list: ${rewardNames}).
        
        Here is a list of existing Quest Groups: "${groupNames}". For each idea, suggest the most appropriate group from this list. If none of the existing groups seem appropriate, suggest a suitable new group name and indicate it's a new group by setting the isNewGroup flag to true.`;

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
                                quests: {
                                    type: Type.ARRAY,
                                    description: 'A list of quest ideas.',
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            title: { type: Type.STRING, description: 'A short, engaging title for the quest.' },
                                            description: { type: Type.STRING, description: 'A brief, one-sentence description of the quest.' },
                                            icon: { type: Type.STRING, description: 'A single, relevant emoji.' },
                                            tags: { type: Type.ARRAY, description: 'An array of 2-3 relevant string tags.', items: { type: Type.STRING } },
                                            suggestedRewards: {
                                                type: Type.ARRAY,
                                                description: 'An array of suggested rewards.',
                                                items: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        rewardTypeName: { type: Type.STRING, description: 'The name of the reward type.' },
                                                        amount: { type: Type.INTEGER, description: 'The suggested amount of the reward.' },
                                                    },
                                                    required: ['rewardTypeName', 'amount']
                                                }
                                            },
                                            groupName: { type: Type.STRING, description: 'The most appropriate group name for the quest. This can be an existing group name or a new one.'},
                                            isNewGroup: { type: Type.BOOLEAN, description: 'Set to true if the groupName is a new suggestion, not from the existing list.' }
                                        },
                                        required: ['title', 'description', 'icon', 'tags', 'suggestedRewards', 'groupName', 'isNewGroup']
                                    }
                                }
                            },
                            required: ['quests']
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
                throw new Error("Received an empty response from the AI. The prompt may have been blocked or was too generic.");
            }
            
            const jsonResponse = JSON.parse(text);
            setGeneratedQuests(jsonResponse.quests || []);

        } catch (err) {
            console.error("AI Generation Error:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8" />
                        Generate {settings.terminology.task} Ideas
                    </h2>
                    <p className="text-stone-400 mt-2">Describe a theme, and the AI will generate some ideas for you.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col gap-4">
                        <div className="flex-grow space-y-2">
                          <Label htmlFor="quest-theme">Quest Theme</Label>
                          <Input
                              id="quest-theme"
                              placeholder="e.g., 'Weekly kitchen chores for kids'"
                              value={prompt}
                              onChange={e => setPrompt(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                              className="flex-grow"
                              disabled={isLoading}
                          />
                        </div>
                         <div className="flex items-center justify-between p-3 bg-stone-900/40 rounded-lg">
                            <span className="font-semibold text-stone-300">Quest Type:</span>
                             <div className="flex items-center gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="questType" value={QuestType.Venture} checked={questType === QuestType.Venture} onChange={() => setQuestType(QuestType.Venture)} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                                    <span className="ml-2">{settings.terminology.singleTask} (One-time)</span>
                                </label>
                                 <label className="flex items-center cursor-pointer">
                                    <input type="radio" name="questType" value={QuestType.Duty} checked={questType === QuestType.Duty} onChange={() => setQuestType(QuestType.Duty)} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                                    <span className="ml-2">{settings.terminology.recurringTask} (Recurring)</span>
                                </label>
                            </div>
                         </div>
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="self-end">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    
                    {isLoading && (
                         <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
                            <p className="mt-4 text-stone-300">The AI is thinking...</p>
                        </div>
                    )}
                    
                    {generatedQuests.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedQuests.map((quest, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-stone-100 flex items-center gap-2">{quest.icon} {quest.title}</h4>
                                        <p className="text-sm text-stone-400 mt-1">{quest.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {quest.groupName && <span className={`text-xs px-2 py-0.5 rounded-full ${quest.isNewGroup ? 'bg-green-900/50 text-green-300' : 'bg-purple-900/50 text-purple-300'}`}>{quest.isNewGroup ? `New Group: ${quest.groupName}` : quest.groupName}</span>}
                                            {quest.tags?.map(tag => <span key={tag} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">{tag}</span>)}
                                            {quest.suggestedRewards?.map(r => <span key={r.rewardTypeName} className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">+{r.amount} {r.rewardTypeName}</span>)}
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea({...quest, type: questType})}>
                                        Use Idea
                                    </Button>
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

export default QuestIdeaGenerator;