import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { libraryPacks } from '../../../data/assetLibrary';
import { LibraryPack, BlueprintAssets, TrophyRequirementType, QuestGroup, Quest, GameAsset, Market, Trophy, RewardTypeDefinition, QuestType, User, ShareableAssetType } from '../../../types';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Input } from '@/components/ui/input';
import CreateQuestDialog from '../../quests/CreateQuestDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import EditTrophyDialog from '../../settings/EditTrophyDialog';
import EditMarketDialog from '../../markets/EditMarketDialog';
import UserMultiSelect from '../../ui/UserMultiSelect';

const packTypes = ['All', 'Quests', 'Markets', 'Items', 'Trophies', 'Rewards', 'Quest Groups'];

type SelectableAsset = { id: string; name: string; description: string; icon: string; type: keyof BlueprintAssets; questType?: QuestType };

const AssetPreview: React.FC<{ assets: Partial<BlueprintAssets> }> = ({ assets }) => {
    const assetList = [
        ...(assets.quests || []),
        ...(assets.questGroups || []),
        ...(assets.gameAssets || []),
        ...(assets.trophies || []),
        ...(assets.markets || []),
        ...(assets.rewardTypes || []),
    ].slice(0, 3);

    if (assetList.length === 0) {
        return <div className="text-xs text-muted-foreground italic">No preview available.</div>;
    }

    return (
        <div className="space-y-1 mt-3 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground">Contains:</p>
            {assetList.map((asset, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground">
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
            <Card className={`h-full p-4 hover:bg-accent/10 hover:border-accent transition-colors duration-200 border-2 ${pack.color || 'border-border'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{pack.emoji}</span>
                    <span className={`text-sm font-bold uppercase ${pack.color ? '' : 'text-primary'}`}>{pack.type}</span>
                </div>
                <h4 className="text-lg font-bold text-foreground mt-2">{pack.title}</h4>
                <p className="text-sm text-muted-foreground mt-2">{pack.description}</p>
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
    const [userIdsForImport, setUserIdsForImport] = useState<string[]>(() => users.map((u: User) => u.id));

    const allAssets = useMemo((): SelectableAsset[] => {
        const assets: SelectableAsset[] = [];
        livePackAssets.quests?.forEach(q => assets.push({ id: q.id, name: q.title, description: q.description, icon: q.icon || '📝', type: 'quests', questType: q.type }));
        livePackAssets.questGroups?.forEach(qg => assets.push({ id: qg.id, name: qg.name, description: qg.description, icon: qg.icon || '📂', type: 'questGroups' }));
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
            ranks: new Map<string, string>(),
            quests: new Map<string, string>(),
        };

        // Pass 1: Base data types with few dependencies
        if (livePackAssets.questGroups) {
            for (const packGroup of livePackAssets.questGroups) {
                try {
                    const existingGroup = allQuestGroupsFromState.find((g: QuestGroup) => g.name.toLowerCase() === packGroup.name.toLowerCase());
                    if (existingGroup) {
                        idMaps.questGroups.set(packGroup.id, existingGroup.id);
                    } else {
                        const { id, ...rest } = packGroup;
                        const newGroup = await addQuestGroup(rest);
                        if (newGroup) {
                            idMaps.questGroups.set(packGroup.id, newGroup.id);
                            importedCount++;
                        }
                    }
                } catch (e) {
                    addNotification({ type: 'error', message: `Failed to import Quest Group "${packGroup.name}"` });
                }
            }
        }
        
        if (livePackAssets.rewardTypes) {
            for (const asset of livePackAssets.rewardTypes) {
                if (selectedIds.includes(asset.id)) {
                    try {
                        const { id, ...rest } = asset;
                        const newAsset = await addRewardType(rest);
                        if (newAsset) {
                            idMaps.rewardTypes.set(id, newAsset.id);
                            importedCount++;
                        }
                    } catch (e) {
                        addNotification({ type: 'error', message: `Failed to import Reward Type "${asset.name}"` });
                    }
                }
            }
        }

        // Pass 2: Quests (depends on Groups and Rewards)
        if (livePackAssets.quests) {
            for (const q of livePackAssets.quests) {
                if (selectedIds.includes(q.id)) {
                    try {
                        const { id, assignedUserIds, ...rest } = q;
                        const newQuestPayload = {
                            ...rest,
                            assignedUserIds: userIdsForImport,
                            guildId: appMode.mode === 'guild' ? appMode.guildId : undefined,
                            groupId: q.groupId ? idMaps.questGroups.get(q.groupId) : undefined,
                            rewards: (q.rewards || []).map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                            lateSetbacks: (q.lateSetbacks || []).map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                            incompleteSetbacks: (q.incompleteSetbacks || []).map(r => ({ ...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId })),
                        };
                        const newQuest = await addQuest(newQuestPayload as Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>);
                        if (newQuest) {
                            idMaps.quests.set(id, newQuest.id);
                            importedCount++;
                        }
                    } catch (e) {
                        addNotification({ type: 'error', message: `Failed to import Quest "${q.title}"` });
                    }
                }
            }
        }
        
        // Pass 3: Assets that depend on previous assets
        if (livePackAssets.markets) {
            for (const asset of livePackAssets.markets) {
                if (selectedIds.includes(asset.id)) {
                    try {
                        const { id, ...rest } = asset;
                        const newMarketPayload = { ...rest };
                        if (newMarketPayload.status.type === 'conditional') {
                            newMarketPayload.status.conditions = newMarketPayload.status.conditions.map(cond => {
                                if (cond.type === 'QUEST_COMPLETED') {
                                    return { ...cond, questId: idMaps.quests.get(cond.questId) || cond.questId };
                                }
                                return cond;
                            });
                        }
                        const newAsset = await addMarket(newMarketPayload);
                        if (newAsset) {
                            idMaps.markets.set(id, newAsset.id);
                            importedCount++;
                        }
                    } catch (e) {
                         addNotification({ type: 'error', message: `Failed to import Market "${asset.title}"` });
                    }
                }
            }
        }
        
        if (livePackAssets.trophies) {
            for (const t of livePackAssets.trophies) {
                if (selectedIds.includes(t.id)) {
                    try {
                        const { id, ...rest } = t;
                        const newTrophyPayload = { ...rest, requirements: (t.requirements || []).map(req => ({ ...req })) };
                        const newAsset = await addTrophy(newTrophyPayload as Omit<Trophy, 'id'>);
                        if (newAsset) {
                            idMaps.trophies.set(id, newAsset.id);
                            importedCount++;
                        }
                    } catch (e) {
                         addNotification({ type: 'error', message: `Failed to import Trophy "${t.name}"` });
                    }
                }
            }
        }
        
        if (livePackAssets.gameAssets) {
            for (const ga of livePackAssets.gameAssets) {
                if (selectedIds.includes(ga.id)) {
                    try {
                        const { id, ...rest } = ga;
                        const newAssetPayload = {
                            ...rest,
                            marketIds: (ga.marketIds || []).map(mid => idMaps.markets.get(mid) || mid),
                            costGroups: (ga.costGroups || []).map(group => group.map(c => ({...c, rewardTypeId: idMaps.rewardTypes.get(c.rewardTypeId) || c.rewardTypeId })))
                        };
                        await addGameAsset(newAssetPayload as Omit<GameAsset, 'id' | 'creatorId' | 'createdAt' | 'purchaseCount'>);
                        importedCount++;
                    } catch (e) {
                         addNotification({ type: 'error', message: `Failed to import Item "${ga.name}"` });
                    }
                }
            }
        }

        addNotification({type: 'success', message: `Finished installing assets from ${pack.title}. Imported ${importedCount} items.`});
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
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <Button variant="secondary" size="sm" onClick={onBack}>&larr; Back to Library</Button>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-5xl">{pack.emoji}</span>
                                <div>
                                    <h2 className="text-3xl font-display text-accent">{pack.title}</h2>
                                    <p className="text-muted-foreground">{pack.description}</p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleInstall} disabled={selectedIds.length === 0}>Install {selectedIds.length} Selected</Button>
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                        {(livePackAssets.quests || []).length > 0 && (
                            <div className="p-4 bg-background rounded-lg border">
                                <UserMultiSelect
                                    allUsers={users}
                                    selectedUserIds={userIdsForImport}
                                    onSelectionChange={setUserIdsForImport}
                                    label="Assign Imported Quests to Users"
                                />
                                <p className="text-xs text-muted-foreground mt-2">By default, all quests from this pack will be assigned to the selected users.</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-2 sticky top-0 bg-card py-2">
                            <h4 className="font-bold text-foreground">Pack Contents</h4>
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                {selectedIds.length === allAssets.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                        {Object.entries(groupedAssets).map(([type, assets]) => (
                            <div key={type}>
                                <h5 className="font-bold text-lg text-foreground capitalize mb-2">{typeTitles[type] || type}</h5>
                                <div className="space-y-2">
                                    {assets.map(asset => (
                                        <div key={asset.id} className="flex items-start p-3 rounded-md has-[:checked]:bg-accent/10 has-[:checked]:border-accent/20 border border-transparent transition-colors">
                                            <input
                                                type="checkbox"
                                                id={`asset-${asset.id}`}
                                                checked={selectedIds.includes(asset.id)}
                                                onChange={() => handleToggle(asset.id)}
                                                className="h-5 w-5 rounded text-primary bg-background border-input focus:ring-ring mt-1 flex-shrink-0"
                                            />
                                            <label htmlFor={`asset-${asset.id}`} className="ml-3 flex-grow">
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    <span className="text-xl">{asset.icon}</span>
                                                    <button onClick={() => handleEditAsset(asset)} className="hover:underline hover:text-accent transition-colors text-left">
                                                        {asset.name}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
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

            const groupNameMatch = (pack.assets.questGroups || []).some(g => 
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
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div className="flex-grow max-w-sm">
                            <Input placeholder="Search packs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex space-x-2 p-1 bg-background rounded-lg overflow-x-auto">
                            {packTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActiveFilter(type)}
                                    className={`px-3 py-1 rounded-md font-semibold text-sm transition-colors whitespace-nowrap ${
                                        activeFilter === type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
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
                </CardContent>
            </Card>
        </div>
    );
};

export default AssetLibraryPage;