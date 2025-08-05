

import React, { useState, useMemo } from 'react';
import { BlueprintAssets, TrophyRequirementType } from '../../types';
import Button from '../ui/Button';
import { useAppDispatch } from '../../context/AppContext';
import { LibraryPack } from '../../data/assetLibrary';

interface AssetLibraryImportDialogProps {
  pack: LibraryPack;
  onClose: () => void;
}

type SelectableAsset = { id: string; name: string; description: string; icon: string; type: keyof BlueprintAssets };

const AssetLibraryImportDialog: React.FC<AssetLibraryImportDialogProps> = ({ pack, onClose }) => {
    const { addQuest, addGameAsset, addTrophy, addRewardType, addMarket, addNotification } = useAppDispatch();

    const allAssets = useMemo((): SelectableAsset[] => {
        const assets: SelectableAsset[] = [];
        pack.assets.quests?.forEach(q => assets.push({ id: q.id, name: q.title, description: q.description, icon: q.icon || '📝', type: 'quests' }));
        pack.assets.gameAssets?.forEach(ga => assets.push({ id: ga.id, name: ga.name, description: ga.description, icon: ga.icon || '📦', type: 'gameAssets' }));
        pack.assets.trophies?.forEach(t => assets.push({ id: t.id, name: t.name, description: t.description, icon: t.icon, type: 'trophies' }));
        pack.assets.markets?.forEach(m => assets.push({ id: m.id, name: m.title, description: m.description, icon: m.icon || '🛒', type: 'markets' }));
        pack.assets.rewardTypes?.forEach(rt => assets.push({ id: rt.id, name: rt.name, description: rt.description, icon: rt.icon || '💎', type: 'rewardTypes' }));
        return assets;
    }, [pack]);
    
    const [selectedIds, setSelectedIds] = useState<string[]>(allAssets.map(a => a.id));

    const groupedAssets = useMemo(() => {
        const groups: { [key: string]: SelectableAsset[] } = {};
        allAssets.forEach(asset => {
            const typeKey = asset.type as string;
            if (!groups[typeKey]) {
                groups[typeKey] = [];
            }
            groups[typeKey].push(asset);
        });
        return groups;
    }, [allAssets]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === allAssets.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(allAssets.map(a => a.id));
        }
    };
    
    const handleImport = () => {
        let importedCount = 0;
        const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        const rewardIdMap = new Map<string, string>();
        const marketIdMap = new Map<string, string>();
        const trophyIdMap = new Map<string, string>();


        // Import Reward Types first to create dependency map
        pack.assets.rewardTypes?.forEach(rt => {
            if (selectedIds.includes(rt.id)) {
                const newId = generateId('rt');
                rewardIdMap.set(rt.id, newId);
                const { id, ...rest } = rt;
                addRewardType(rest); 
                importedCount++;
            }
        });
        
        // Import Trophies and Markets
        pack.assets.trophies?.forEach(t => { 
            if (selectedIds.includes(t.id)) { 
                const newId = generateId('trophy');
                trophyIdMap.set(t.id, newId);
                const { id, ...rest } = t; 
                const newTrophy = {
                    ...rest,
                    requirements: (t.requirements || []).map(req => {
                        const newReq = { ...req };
                        if (newReq.type === TrophyRequirementType.EarnTotalReward && rewardIdMap.has(newReq.value)) {
                            newReq.value = rewardIdMap.get(newReq.value)!;
                        }
                        // Note: Rank mapping would go here if ranks were part of library packs.
                        return newReq;
                    })
                };
                addTrophy(newTrophy); 
                importedCount++; 
            }
        });
        pack.assets.markets?.forEach(m => { 
            if (selectedIds.includes(m.id)) { 
                const newId = generateId('market'); 
                marketIdMap.set(m.id, newId); 
                const { id, ...rest } = m; 
                addMarket(rest); 
                importedCount++; 
            }
        });
        
        // Import Quests, mapping reward IDs
        pack.assets.quests?.forEach(q => {
            if (selectedIds.includes(q.id)) {
                const { id, ...rest } = q;
                const newQuest = { 
                    ...rest, 
                    rewards: q.rewards.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                    lateSetbacks: q.lateSetbacks.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                    incompleteSetbacks: q.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })),
                };
                addQuest(newQuest); importedCount++;
            }
        });
        
        // Import Game Assets, mapping market and reward IDs
        pack.assets.gameAssets?.forEach(ga => {
            if (selectedIds.includes(ga.id)) {
                const { id, ...rest } = ga;
                const newAsset = { 
                    ...rest, 
                    marketIds: (ga.marketIds || []).map(mid => marketIdMap.get(mid) || mid), 
                    cost: (ga.cost || []).map(c => ({...c, rewardTypeId: rewardIdMap.get(c.rewardTypeId) || c.rewardTypeId }))
                };
                addGameAsset(newAsset); importedCount++;
            }
        });

        addNotification({type: 'success', message: `Successfully installed ${importedCount} assets from ${pack.title} pack!`});
        onClose();
    };

    const typeTitles: {[key: string]: string} = {
        quests: "Quests",
        gameAssets: "Items",
        markets: "Markets",
        trophies: "Trophies",
        rewardTypes: "Reward Types"
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-stone-700/60">
                    <h2 className="text-2xl font-medieval text-accent">{pack.title}</h2>
                    <p className="text-sm text-stone-400">{pack.description}</p>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto scrollbar-hide flex-grow">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-stone-200">Pack Contents</h4>
                        <Button variant="secondary" onClick={handleSelectAll} className="text-xs py-1 px-2">
                            {selectedIds.length === allAssets.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </div>
                    {Object.entries(groupedAssets).map(([type, assets]) => (
                        <div key={type}>
                            <h5 className="font-bold text-lg text-stone-300 capitalize mb-2">{typeTitles[type] || type}</h5>
                             <div className="space-y-2">
                                {assets.map(asset => (
                                    <label key={asset.id} className="flex items-start p-3 rounded-md hover:bg-stone-700/50 cursor-pointer border border-transparent has-[:checked]:bg-stone-700/60 has-[:checked]:border-stone-600/80 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(asset.id)}
                                            onChange={() => handleToggle(asset.id)}
                                            className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 mt-1 flex-shrink-0"
                                        />
                                        <div className="ml-3">
                                            <span className="font-semibold text-stone-200 flex items-center gap-2">
                                                <span className="text-xl">{asset.icon}</span>
                                                {asset.name}
                                            </span>
                                            <p className="text-sm text-stone-400 mt-1">{asset.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-stone-700/60 text-right space-x-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleImport} disabled={selectedIds.length === 0}>
                        Import {selectedIds.length} Assets
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssetLibraryImportDialog;
