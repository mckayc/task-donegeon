import React, { useState, useMemo } from 'react';
import { LibraryPack, Quest, GameAsset, Trophy, Market, RewardTypeDefinition } from '../../types';
import { useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';

interface AssetLibraryImportDialogProps {
  pack: LibraryPack;
  onClose: () => void;
}

type SelectableAsset = { id: string; name: string; type: keyof LibraryPack['assets'] };

const AssetLibraryImportDialog: React.FC<AssetLibraryImportDialogProps> = ({ pack, onClose }) => {
    const { addQuest, addGameAsset, addTrophy, addRewardType, addMarket, addNotification } = useAppDispatch();

    const allAssets = useMemo((): SelectableAsset[] => {
        const assets: SelectableAsset[] = [];
        pack.assets.quests?.forEach(q => assets.push({ id: q.id, name: q.title, type: 'quests' }));
        pack.assets.gameAssets?.forEach(ga => assets.push({ id: ga.id, name: ga.name, type: 'gameAssets' }));
        pack.assets.trophies?.forEach(t => assets.push({ id: t.id, name: t.name, type: 'trophies' }));
        pack.assets.markets?.forEach(m => assets.push({ id: m.id, name: m.title, type: 'markets' }));
        pack.assets.rewardTypes?.forEach(rt => assets.push({ id: rt.id, name: rt.name, type: 'rewardTypes' }));
        return assets;
    }, [pack]);
    
    const [selectedIds, setSelectedIds] = useState<string[]>(allAssets.map(a => a.id));

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

        pack.assets.rewardTypes?.forEach(rt => {
            if (selectedIds.includes(rt.id)) {
                const newId = generateId('rt');
                rewardIdMap.set(rt.id, newId);
                const { id, ...rest } = rt;
                addRewardType(rest); importedCount++;
            }
        });
        
        pack.assets.trophies?.forEach(t => { if (selectedIds.includes(t.id)) { const { id, ...rest } = t; addTrophy(rest); importedCount++; }});
        pack.assets.markets?.forEach(m => { if (selectedIds.includes(m.id)) { const newId = generateId('market'); marketIdMap.set(m.id, newId); const { id, ...rest } = m; addMarket(rest); importedCount++; }});
        
        pack.assets.quests?.forEach(q => {
            if (selectedIds.includes(q.id)) {
                const { id, ...rest } = q;
                const newQuest = { ...rest, rewards: q.rewards.map(r => ({ ...r, rewardTypeId: rewardIdMap.get(r.rewardTypeId) || r.rewardTypeId })) };
                addQuest(newQuest); importedCount++;
            }
        });
        
        pack.assets.gameAssets?.forEach(ga => {
            if (selectedIds.includes(ga.id)) {
                const { id, ...rest } = ga;
                const newAsset = { ...rest, marketIds: ga.marketIds.map(mid => marketIdMap.get(mid) || mid), cost: ga.cost.map(c => ({...c, rewardTypeId: rewardIdMap.get(c.rewardTypeId) || c.rewardTypeId }))};
                addGameAsset(newAsset); importedCount++;
            }
        });

        addNotification({type: 'success', message: `Successfully installed ${importedCount} assets from ${pack.title} pack!`});
        onClose();
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
                    {allAssets.map(asset => (
                        <label key={asset.id} className="flex items-center p-2 rounded-md hover:bg-stone-700/50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(asset.id)}
                                onChange={() => handleToggle(asset.id)}
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                            />
                            <span className="ml-3 text-stone-300">{asset.name} <span className="text-xs text-stone-500 capitalize">{asset.type}</span></span>
                        </label>
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
