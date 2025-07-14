


import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { Quest, GameAsset, RewardItem, Trophy } from '../../../types';
import { libraryPacks, LibraryPack } from '../../../data/assetLibrary';

const AssetLibraryPage: React.FC = () => {
    const { addQuest, addGameAsset, addTrophy, addRewardType, addMarket, addNotification } = useAppDispatch();
    
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);

    const handleImport = (pack: LibraryPack) => {
        let importedCount = 0;
        
        const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        // Maps for new IDs
        const rewardIdMap = new Map<string, string>();
        const marketIdMap = new Map<string, string>();
        
        // Import Rewards first as they are dependencies
        if (pack.assets.rewardTypes) {
            pack.assets.rewardTypes.forEach(rt => {
                const newId = generateId('rt');
                rewardIdMap.set(rt.id, newId);
                const { id, ...restOfRt } = rt;
                addRewardType(restOfRt);
                importedCount++;
            });
        }
        
        // Import Trophies
        if (pack.assets.trophies) {
             pack.assets.trophies.forEach(trophy => {
                const { id, ...restOfTrophy } = trophy;
                addTrophy(restOfTrophy);
                importedCount++;
             });
        }
        
        // Import Markets
        if (pack.assets.markets) {
             pack.assets.markets.forEach(market => {
                const newId = generateId('market');
                marketIdMap.set(market.id, newId);
                const { id, ...restOfMarket } = market;
                addMarket(restOfMarket);
                importedCount++;
             });
        }
        
        // Import Quests, remapping reward IDs
        if (pack.assets.quests) {
            pack.assets.quests.forEach(quest => {
                const { id, ...restOfQuest } = quest;
                const newQuest: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'> = {
                    ...restOfQuest,
                    rewards: quest.rewards.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                    lateSetbacks: quest.lateSetbacks.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                    incompleteSetbacks: quest.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                };
                addQuest(newQuest);
                importedCount++;
            });
        }

        // Import GameAssets, remapping market IDs and reward IDs
        if (pack.assets.gameAssets) {
            pack.assets.gameAssets.forEach(asset => {
                const { id, ...restOfAsset } = asset;
                const newAsset: Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'> = {
                    ...restOfAsset,
                    marketIds: asset.marketIds.map(mid => marketIdMap.get(mid) || mid),
                    cost: asset.cost.map(c => ({...c, rewardTypeId: rewardIdMap.get(c.rewardTypeId) || c.rewardTypeId })),
                };
                addGameAsset(newAsset);
                importedCount++;
            });
        }

        addNotification({type: 'success', message: `Successfully installed ${pack.title} pack (${importedCount} assets)!`});
        setSelectedPack(null);
    };

    return (
        <div className="space-y-6">
            <Card title="Built-in Asset Library">
                <p className="text-stone-400 text-sm mb-4">
                    Quickly populate your game with pre-made content packs. Select a pack to see its contents, then install it to add the assets to your game.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {libraryPacks.map(pack => (
                        <button key={pack.id} onClick={() => setSelectedPack(pack)} className="text-left">
                            <Card className="h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200">
                                <span className="text-sm font-bold uppercase text-emerald-400">{pack.type}</span>
                                <h4 className="text-lg font-bold text-stone-100 mt-1">{pack.title}</h4>
                                <p className="text-sm text-stone-400 mt-2">{pack.description}</p>
                            </Card>
                        </button>
                    ))}
                </div>
            </Card>

            {selectedPack && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-stone-700/60">
                            <h2 className="text-2xl font-medieval text-accent">{selectedPack.title}</h2>
                            <p className="text-sm text-stone-400">{selectedPack.description}</p>
                        </div>
                        <div className="p-6 space-y-2 overflow-y-auto scrollbar-hide text-sm text-stone-300 list-disc list-inside">
                            <h4 className="font-bold text-stone-200">Contents:</h4>
                            <ul className="list-disc list-inside">
                                {selectedPack.assets.quests?.map(q => <li key={q.id}>Quest: {q.title}</li>)}
                                {selectedPack.assets.markets?.map(m => <li key={m.id}>Market: {m.title}</li>)}
                                {selectedPack.assets.gameAssets?.map(ga => <li key={ga.id}>Item: {ga.name}</li>)}
                                {selectedPack.assets.trophies?.map(t => <li key={t.id}>Trophy: {t.name}</li>)}
                                {selectedPack.assets.rewardTypes?.map(rt => <li key={rt.id}>Reward: {rt.name}</li>)}
                            </ul>
                        </div>
                        <div className="p-4 border-t border-stone-700/60 text-right space-x-4">
                            <Button variant="secondary" onClick={() => setSelectedPack(null)}>Cancel</Button>
                            <Button onClick={() => handleImport(selectedPack)}>Install Pack</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetLibraryPage;