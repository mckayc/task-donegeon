import React, { useState } from 'react';
import { GenerateContentResponse, Type } from "@google/genai";
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { SparklesIcon } from '../user-interface/Icons';
import { QuestType } from '../../types';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { useAuthState } from '../../context/AuthContext';
import { useSystemState } from '../../context/SystemContext';
import { useQuestsState } from '../../context/QuestsState';
import { useEconomyState } from '../../context/EconomyContext';

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
    const { settings } = useSystemState();
    const { questGroups } = useQuestsState();
    const { rewardTypes } = useEconomyState();
    const { users } = useAuthState();
    const [prompt, setPrompt] = useState('');
    const [questType, setQuestType] = useState<QuestType>(QuestType.Venture);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
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
        
        let userContext = '';
        if (selectedUserId) {
            const selectedUser = users.find(u => u.id === selectedUserId);
            if (selectedUser) {
                userContext = ` Generate these specifically for a user with this context: User's Name: ${selectedUser.gameName} (real name ${selectedUser.firstName} ${selectedUser.lastName}). Birthday: ${selectedUser.birthday}. About Me: "${selectedUser.aboutMe || 'Not provided.'}". Private Admin Notes: "${selectedUser.adminNotes || 'Not provided.'}". Tailor the ideas to these details, referring to the user by name and considering their age based on their birthday.`;
            }
        }

        const fullPrompt = `Generate 5 quest ideas for a gamified task app called ${settings.terminology.appName}.${userContext} The quests should be of type "${questType}". Duties are recurring tasks and Ventures are one-time projects. The quests should be practical, actionable, and based on the theme: "${prompt}". For each quest, also suggest 2-3 relevant tags (e.g., 'cleaning', 'outdoors', 'creative'), a suggested reward based on the task's likely effort (using reward names from this list: ${rewardNames}). IMPORTANT: The suggested reward 'amount' must be a small integer, almost always between 1 and 10.
        
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
                    <h2 className="text-3xl font-medieval text-accent flex items-center gap-3"><SparklesIcon className="w-8 h-8" /> Generate Quest Ideas</h2>
                </div>
                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            as="select"
                            label="Quest Type"
                            value={questType}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setQuestType(e.target.value as QuestType)}
                            disabled={isLoading}
                        >
                            <option value={QuestType.Venture}>{settings.terminology.singleTask}</option>
                            <option value={QuestType.Duty}>{settings.terminology.recurringTask}</option>
                            <option value={QuestType.Journey}>{settings.terminology.journey}</option>
                        </Input>
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
                    </div>
                    <div className="flex gap-4">
                        <Input
                            label="Quest Theme or Topic"
                            placeholder="e.g., 'cleaning the kitchen', 'learning javascript'"
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
                    {generatedQuests.length > 0 && (
                        <div className="space-y-3 pt-4">
                            {generatedQuests.map((quest, index) => (
                                <div key={index} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <p className="font-bold text-stone-200">{quest.icon} {quest.title}</p>
                                        <p className="text-sm text-stone-400">{quest.description}</p>
                                    </div>
                                    <Button variant="secondary" className="text-sm py-1 px-3 flex-shrink-0" onClick={() => onUseIdea({ ...quest, type: questType })}>Use Idea</Button>
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