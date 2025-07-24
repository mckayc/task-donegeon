import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { libraryPacks } from '../../../data/assetLibrary';
import { LibraryPack, BlueprintAssets, TrophyRequirementType, QuestGroup, Quest, GameAsset, Market, Trophy, RewardTypeDefinition, QuestType } from '../../../types';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Input from '../../ui/Input';
import CreateQuestDialog from '../../quests/CreateQuestDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import EditTrophyDialog from '../../settings/EditTrophyDialog';
import EditMarketDialog from '../../markets/EditMarketDialog';

const packTypes = ['All', 'Quests', 'Markets', 'Items', 'Trophies', 'Rewards'];

type SelectableAsset = { id: string; name: string; description: string; icon: string; type: keyof BlueprintAssets; questType?: QuestType };

const AssetPreview: React.FC<{ assets: Partial<BlueprintAssets> }> = ({ assets }) => {
    const assetList = [
        ...(assets.quests || []),
        ...(assets.gameAssets || []),
        ...(assets.trophies || []),
        ...(assets.markets || []),
        ...(assets.rewardTypes || []),
    ].slice(0, 3);

    if (assetList.length === 0) {
        return <div className="text-xs text-stone-500 italic">No preview available.</div>;
    }

    return (
        <div className="space-y-1 mt-3 pt-3 border-t border-stone-700/60">
            <p className="text-xs font-semibold text-stone-400">Contains:</p>
            {assetList.map((asset, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-stone-300">
                    <span className="text-lg">{'icon' in asset ? asset.icon : '❔'}</span>
                    <span className="truncate">{'title' in asset ? asset.title : asset.name}</span>
                </div>
            ))}
        </div>
    );
};

const PackCard: React.FC<{ pack: LibraryPack; onSelect: () => void; }> = ({ pack, onSelect }) => {
    return (
        <button onClick={onSelect} className="text-left h-full">
            <Card className={`h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200 border-2 ${pack.color || 'border-stone-700/60'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{pack.emoji}</span>
                    <span className={`text-sm font-bold uppercase ${pack.color ? '' : 'text-emerald-400'}`}>{pack.type}</span>
                </div>
                <h4 className="text-lg font-bold text-stone-100 mt-2">{pack.title}</h4>
                <p className="text-sm text-stone-400 mt-2">{pack.description}</p>
                <AssetPreview assets={pack.assets} />
            </Card>
        </button>
    );
};

const PackDetailView: React.FC<{ pack: LibraryPack; onBack: () => void; }> = ({ pack, onBack }) => {
    const { settings, questGroups: allQuestGroupsFromState, users, appMode } = useAppState();
    const { addQuest, addGameAsset, addTrophy, addRewardType, addMarket, addQuestGroup, addNotification } = useAppDispatch();
    
    const [livePackAssets, setLivePackAssets] = useState<Partial<BlueprintAssets>>(() => JSON.parse(JSON.stringify(pack.assets)));
    const [assetToEdit, setAssetToEdit] = useState<{data: any, type: keyof BlueprintAssets} | null>(null);

    const allAssets = useMemo((): SelectableAsset[] => {
        const assets: SelectableAsset[] = [];
        livePackAssets.quests?.forEach(q => assets.push({ id: q.id, name: q.title, description: q.description, icon: q.icon || '📝', type: 'quests', questType: q.type }));
        livePackAssets.gameAssets?.forEach(ga => assets.push({ id: ga.id, name: ga.name, description: ga.description, icon: ga.icon || '📦', type: 'gameAssets' }));
        livePackAssets.trophies?.forEach(t => assets.push({ id: t.id, name: t.name, description: t.description, icon: t.icon, type: 'trophies' }));
        livePackAssets.markets?.forEach(m => assets.push({ id: m.id, name: m.title, description: m.description, icon: m.icon || '🛒', type: 'markets' }));
        livePackAssets.rewardTypes?.forEach(rt => assets.push({ id: rt.id, name: rt.name, description: rt.description, icon: rt.icon || '💎', type: 'rewardTypes' }));
        return assets;
    }, [livePackAssets]);
    
    const [selectedIds, setSelectedIds] = useState<string[]>(allAssets.map(a => a.id));

    const groupedAssets = useMemo(() => {
        const groups: { [key: string]: SelectableAsset[] } = {};
        allAssets.forEach(asset => {
            let typeKey = asset.type as string;
            if (asset.type === 'quests') {
                typeKey = asset.questType === QuestType.Duty ? 'Duties' : 'Ventures';
            }
            if (!groups[typeKey]) groups[typeKey] = [];
            groups[typeKey].push(asset);
        });
        return groups;
    }, [allAssets]);

    const handleToggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const handleSelectAll = () => setSelectedIds(selectedIds.length === allAssets.length ? [] : allAssets.map(a => a.id));
    
    const handleEditAsset = (asset: SelectableAsset) => {
        const originalAsset = (livePackAssets as any)[asset.type]?.find((a: any) => a.id === asset.id);
        if (originalAsset) {
            setAssetToEdit({ data: originalAsset, type: asset.type });
        }
    };

    const handleSaveEditedAsset = (updatedData: any) => {
        if (!assetToEdit) return;
        setLivePackAssets(prev => {
            const newAssets = { ...prev };
            const assetList = [...((newAssets[assetToEdit.type] as any[]) || [])]; // Create a new array to modify
            const assetIndex = assetList.findIndex(a => a.id === assetToEdit.data.id);
            if (assetIndex > -1) {
                assetList[assetIndex] = { ...assetList[assetIndex], ...updatedData };
                (newAssets as any)[assetToEdit.type] = assetList; // Assign the modified array back
            }
            return newAssets;
        });
        setAssetToEdit(null);
    };

    const handleInstall = async () => {
        let importedCount = 0;
        const idMaps = {
            rewardTypes: new Map<string, string>(),
            markets: new Map<string, string>(),
            trophies: new Map<string, string>(),
            questGroups: new Map<string, string>(),
        };

        // 1. Process Quest Groups specifically to handle name conflicts and get new IDs
        if (livePackAssets.questGroups) {
            for (const packGroup of livePackAssets.questGroups) {
                const existingGroup = allQuestGroupsFromState.find(g => g.name.toLowerCase() === packGroup.name.toLowerCase());
                if (existingGroup) {
                    idMaps.questGroups.set(packGroup.id, existingGroup.id);
                } else {
                    const { id, ...rest } = packGroup;
                    const newGroup = await addQuestGroup(rest); // This function returns the new group with its generated ID
                    if (newGroup) {
                        idMaps.questGroups.set(packGroup.id, newGroup.id);
                        importedCount++;
                    }
                }
            }
        }
        
        // 2. Process simple assets
        livePackAssets.rewardTypes?.forEach(asset => {
            if (selectedIds.includes(asset.id)) {
                const { id, ...rest } = asset;
                addRewardType(rest);
                importedCount++;
            }
        });

        livePackAssets.markets?.forEach(asset => {
            if (selectedIds.includes(asset.id)) {
                const { id, ...rest } = asset;
                addMarket(rest);
                importedCount++;
            }
        });
        
        livePackAssets.trophies?.forEach(t => { 
            if (selectedIds.includes(t.id)) { 
                const { id, ...rest } = t; 
                const newTrophy = { ...rest, requirements: (t.requirements || []).map(req => ({ ...req })) };
                addTrophy(newTrophy as Omit<Trophy, 'id'>); 
                importedCount++; 
            }
        });
        
        livePackAssets.quests?.forEach(q => {
            if (selectedIds.includes(q.id)) {
                const { id, assignedUserIds, ...rest } = q;
                const newQuest = { 
                    ...rest,
                    assignedUserIds: users.map(u => u.id),
                    guildId: appMode.mode === 'guild' ? appMode.guildId : undefined,
                    groupId: q.groupId ? idMaps.questGroups.get(q.groupId) : undefined,
                    rewards: q.rewards.map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                    lateSetbacks: q.lateSetbacks.map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                    incompleteSetbacks: q.incompleteSetbacks.map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                };
                addQuest(newQuest as Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>); 
                importedCount++;
            }
        });
        
        livePackAssets.gameAssets?.forEach(ga => {
            if (selectedIds.includes(ga.id)) {
                const { id, ...rest } = ga;
                const newAsset = { 
                    ...rest, 
                    marketIds: (ga.marketIds || []).map(mid => idMaps.markets.get(mid) || mid), 
                    costGroups: (ga.costGroups || []).map(group => group.map(c => ({...c, rewardTypeId: idMaps.rewardTypes.get(c.rewardTypeId) || c.rewardTypeId })))
                };
                addGameAsset(newAsset as Omit<GameAsset, 'id' | 'creatorId' | 'createdAt'>); 
                importedCount++;
            }
        });

        addNotification({type: 'success', message: `Successfully installed ${importedCount} assets from ${pack.title}!`});
        onBack();
    };

    const typeTitles: {[key: string]: string} = { 
        Duties: settings.terminology.recurringTasks,
        Ventures: settings.terminology.singleTasks,
        questGroups: "Quest Groups", 
        gameAssets: "Items", 
        markets: settings.terminology.stores, 
        trophies: settings.terminology.awards, 
        rewardTypes: settings.terminology.points 
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Button variant="secondary" size="sm" onClick={onBack}>&larr; Back to Library</Button>
                        <div className="flex items-center gap-4 mt-4">
                            <span className="text-5xl">{pack.emoji}</span>
                            <div>
                                <h2 className="text-3xl font-medieval text-accent">{pack.title}</h2>
                                <p className="text-stone-400">{pack.description}</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleInstall} disabled={selectedIds.length === 0}>Install {selectedIds.length} Selected</Button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                    <div className="flex justify-between items-center mb-2 sticky top-0 bg-stone-800 py-2">
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
                                    <div key={asset.id} className="flex items-start p-3 rounded-md has-[:checked]:bg-stone-700/60 has-[:checked]:border-stone-600/80 border border-transparent transition-colors">
                                        <input
                                            type="checkbox"
                                            id={`asset-${asset.id}`}
                                            checked={selectedIds.includes(asset.id)}
                                            onChange={() => handleToggle(asset.id)}
                                            className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 mt-1 flex-shrink-0"
                                        />
                                        <label htmlFor={`asset-${asset.id}`} className="ml-3 flex-grow">
                                            <div className="font-semibold text-stone-200 flex items-center gap-2">
                                                <span className="text-xl">{asset.icon}</span>
                                                <button onClick={() => handleEditAsset(asset)} className="hover:underline hover:text-accent transition-colors text-left">
                                                    {asset.name}
                                                </button>
                                            </div>
                                            <p className="text-sm text-stone-400 mt-1">{asset.description}</p>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {assetToEdit && (
                <>
                    {assetToEdit.type === 'quests' && <CreateQuestDialog mode="edit" initialData={assetToEdit.data} onSave={handleSaveEditedAsset} onClose={() => setAssetToEdit(null)} />}
                    {assetToEdit.type === 'gameAssets' && <EditGameAssetDialog mode="edit" assetToEdit={null} initialData={assetToEdit.data} onSave={handleSaveEditedAsset} onClose={() => setAssetToEdit(null)} />}
                    {assetToEdit.type === 'trophies' && <EditTrophyDialog mode="edit" trophy={null} initialData={assetToEdit.data} onSave={handleSaveEditedAsset} onClose={() => setAssetToEdit(null)} />}
                    {assetToEdit.type === 'markets' && <EditMarketDialog mode="edit" market={null} initialData={assetToEdit.data} onSave={handleSaveEditedAsset} onClose={() => setAssetToEdit(null)} />}
                </>
            )}
        </>
    );
};

const AssetLibraryPage: React.FC = () => {
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPacks = useMemo(() => {
        return libraryPacks.filter(pack => {
            const filterMatch = activeFilter === 'All' || pack.type === activeFilter;
            if (!filterMatch) return false;

            if (!searchTerm.trim()) return true;
            const lowerSearch = searchTerm.toLowerCase();

            const textMatch = pack.title.toLowerCase().includes(lowerSearch) || pack.description.toLowerCase().includes(lowerSearch);
            if (textMatch) return true;

            const assetContentMatch = Object.values(pack.assets).some(assetArray => {
                if (!Array.isArray(assetArray)) return false;
                return assetArray.some(asset => {
                    const name = (asset as any).title || (asset as any).name || '';
                    const desc = (asset as any).description || '';
                    return name.toLowerCase().includes(lowerSearch) || desc.toLowerCase().includes(lowerSearch);
                });
            });
            if (assetContentMatch) return true;

            const questTagMatch = pack.assets.quests?.some(q => 
                q.tags.some(t => t.toLowerCase().includes(lowerSearch))
            );
            if (questTagMatch) return true;

            const groupNameMatch = pack.assets.questGroups?.some(g => 
                g.name.toLowerCase().includes(lowerSearch)
            );
            if (groupNameMatch) return true;
            
            return false;
        });
    }, [activeFilter, searchTerm]);
    
    if (selectedPack) {
        return (
            <PackDetailView
                pack={selectedPack}
                onBack={() => setSelectedPack(null)}
            />
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                     <div className="flex-grow max-w-sm">
                        <Input placeholder="Search packs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                    <div className="flex space-x-2 p-1 bg-stone-900/50 rounded-lg overflow-x-auto">
                        {packTypes.map(type => (
                             <button
                                key={type}
                                onClick={() => setActiveFilter(type)}
                                className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors whitespace-nowrap ${
                                    activeFilter === type ? 'btn-primary' : 'text-stone-300 hover:bg-stone-700'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPacks.map(pack => (
                        <PackCard key={pack.id} pack={pack} onSelect={() => setSelectedPack(pack)} />
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default AssetLibraryPage;