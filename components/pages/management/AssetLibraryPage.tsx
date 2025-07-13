
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { Quest, MarketItem, QuestType, QuestAvailability } from '../../../types';

type AssetCategory = 'elementary_chores' | 'teen_chores' | 'fitness_goals' | 'learning_goals' | 'fantasy_rpg_items' | 'sci_fi_items';
type GeneratedAsset = Partial<Quest> & Partial<MarketItem>;

const CATEGORIES: { id: AssetCategory; label: string; assetType: 'Quest' | 'MarketItem'; }[] = [
    { id: 'elementary_chores', label: 'Quests: Elementary Chores', assetType: 'Quest' },
    { id: 'teen_chores', label: 'Quests: Teen Responsibilities', assetType: 'Quest' },
    { id: 'fitness_goals', label: 'Quests: Fitness Goals', assetType: 'Quest' },
    { id: 'learning_goals', label: 'Quests: Learning Goals', assetType: 'Quest' },
    { id: 'fantasy_rpg_items', label: 'Market: Fantasy RPG Items', assetType: 'MarketItem' },
    { id: 'sci_fi_items', label: 'Market: Sci-Fi Gadgets', assetType: 'MarketItem' },
];

const AssetLibraryPage: React.FC = () => {
    const { markets, rewardTypes } = useAppState();
    const { addQuest, addMarketItem, addNotification } = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('elementary_chores');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
    const [selection, setSelection] = useState<number[]>([]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedAssets([]);
        setSelection([]);

        const categoryInfo = CATEGORIES.find(c => c.id === selectedCategory);
        if (!categoryInfo) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/generate-assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: categoryInfo.label, assetType: categoryInfo.assetType }),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to generate assets from server.');
            }

            const parsedAssets = await response.json();
            setGeneratedAssets(parsedAssets);
        } catch (error) {
            console.error('Error generating assets:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            addNotification({ type: 'error', message: `Failed to generate assets: ${message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = () => {
        const categoryInfo = CATEGORIES.find(c => c.id === selectedCategory)!;
        const rewardMap = {
            strength: rewardTypes.find(rt => rt.id === 'core-strength')?.id,
            diligence: rewardTypes.find(rt => rt.id === 'core-diligence')?.id,
            wisdom: rewardTypes.find(rt => rt.id === 'core-wisdom')?.id,
            skill: rewardTypes.find(rt => rt.id === 'core-skill')?.id,
            creative: rewardTypes.find(rt => rt.id === 'core-creative')?.id,
            gold: rewardTypes.find(rt => rt.id === 'core-gold')?.id,
            gems: rewardTypes.find(rt => rt.id === 'core-gems')?.id,
            crystals: rewardTypes.find(rt => rt.id === 'core-crystal')?.id,
        };

        let importedCount = 0;
        selection.forEach(index => {
            const asset = generatedAssets[index] as any;
            if (categoryInfo.assetType === 'Quest') {
                const rewardTypeId = rewardMap[asset.reward_type as keyof typeof rewardMap] || rewardMap.diligence!;
                addQuest({
                    title: asset.title, description: asset.description,
                    rewards: [{ rewardTypeId: rewardTypeId, amount: asset.reward_amount }],
                    type: QuestType.Duty, isActive: true, isOptional: false,
                    requiresApproval: asset.requires_approval,
                    availabilityType: QuestAvailability.Daily, availabilityCount: null,
                    weeklyRecurrenceDays: [], monthlyRecurrenceDays: [], assignedUserIds: [],
                    tags: [selectedCategory], lateSetbacks: [], incompleteSetbacks: [],
                });
                importedCount++;
            } else { // MarketItem
                const costTypeId = rewardMap[asset.cost_type as keyof typeof rewardMap] || rewardMap.crystals!;
                const targetMarketId = markets.find(m => m.id.includes('gadget'))?.id || markets[0]?.id;
                if(targetMarketId) {
                    addMarketItem(targetMarketId, {
                        title: asset.title, description: asset.description,
                        cost: [{ rewardTypeId: costTypeId, amount: asset.cost_amount }],
                        payout: [],
                    });
                    importedCount++;
                }
            }
        });

        addNotification({type: 'success', message: `${importedCount} assets imported successfully!`});
        setGeneratedAssets([]);
        setSelection([]);
    };
    
    const handleToggleSelection = (index: number) => {
        setSelection(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    }
    
    return (
        <div className="space-y-6">
            <Card title="AI-Powered Asset Library">
                <p className="text-stone-400 text-sm mb-4">
                    Quickly populate your game with pre-made content. Select a category and let our AI generate a list of relevant quests or market items for you to review and import. Requires a valid API key on the server.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as AssetCategory)}
                        className="flex-grow px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                        disabled={isLoading}
                    >
                        {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                    <Button onClick={handleGenerate} disabled={isLoading} className="flex-shrink-0">
                        {isLoading ? 'Generating...' : 'Generate Assets'}
                    </Button>
                </div>
            </Card>

            {(isLoading || generatedAssets.length > 0) && (
                <Card>
                    {isLoading ? (
                        <p className="text-center text-stone-300">Generating... Please wait a moment.</p>
                    ) : (
                        <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-stone-200">Generated Assets</h3>
                                <Button onClick={handleImport} disabled={selection.length === 0}>
                                    Import {selection.length} Selected
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {generatedAssets.map((asset, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-stone-900/40 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={selection.includes(index)}
                                            onChange={() => handleToggleSelection(index)}
                                            className="h-5 w-5 mt-1 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <p className="font-bold text-stone-100">{asset.title}</p>
                                            <p className="text-sm text-stone-400">{asset.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default AssetLibraryPage;