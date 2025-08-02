import React, { useState, useMemo, ChangeEvent } from 'react';
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
import UserMultiSelect from '../../ui/user-multi-select';

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
                    const { id, ...rest } = asset;
                    const newAsset = await addRewardType(rest);
                    if (newAsset) {
                        idMaps.rewardTypes.set(id, newAsset.id);
                        importedCount++;
                    }
                }
            }
        }
        if (livePackAssets.markets) {
            for (const asset of livePackAssets.markets) {
                if (selectedIds.includes(asset.id)) {
                    const { id, ...rest } = asset;
                    const newAsset = await addMarket(rest);
                    if (newAsset) {
                        idMaps.markets.set(id, newAsset.id);
                        importedCount++;
                    }
                }
            }
        }
        if (livePackAssets.trophies) {
            for (const asset of livePackAssets.trophies) {
                if (selectedIds.includes(asset.id)) {
                    const { id, ...rest } = asset;
                    const newAsset = await addTrophy(rest);
                    if (newAsset) {
                        idMaps.trophies.set(id, newAsset.id);
                        importedCount++;
                    }
                }
            }
        }

        // Pass 2: Assets with dependencies
        if (livePackAssets.gameAssets) {
            for (const asset of livePackAssets.gameAssets) {
                if (selectedIds.includes(asset.id)) {
                    const { id, ...rest } = asset;
                    const newCostGroups = rest.costGroups.map(g => g.map(c => ({...c, rewardTypeId: idMaps.rewardTypes.get(c.rewardTypeId) || c.rewardTypeId })));
                    const newMarketIds = rest.marketIds.map(mid => idMaps.markets.get(mid) || mid);
                    const newPayload = { ...rest, costGroups: newCostGroups, marketIds: newMarketIds };
                    await addGameAsset(newPayload);
                    importedCount++;
                }
            }
        }

        if (livePackAssets.quests) {
            for (const asset of livePackAssets.quests) {
                if (selectedIds.includes(asset.id)) {
                    const { id, ...rest } = asset;
                    const newRewards = rest.rewards.map(r => ({...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId}));
                    const newLateSetbacks = rest.lateSetbacks.map(r => ({...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId}));
                    const newIncompleteSetbacks = rest.incompleteSetbacks.map(r => ({...r, rewardTypeId: idMaps.rewardTypes.get(r.rewardTypeId) || r.rewardTypeId}));
                    const newGroupId = rest.groupId ? (idMaps.questGroups.get(rest.groupId) || rest.groupId) : undefined;
                    const newPayload = { ...rest, assignedUserIds: userIdsForImport, rewards: newRewards, lateSetbacks: newLateSetbacks, incompleteSetbacks: newIncompleteSetbacks, groupId: newGroupId, guildId: appMode.mode === 'guild' ? appMode.guildId : undefined };
                    await addQuest(newPayload);
                    importedCount++;
                }
            }
        }

        addNotification({ type: 'success', message: `Successfully imported ${importedCount} assets!` });
        onBack();
    };

    const renderAssetEditor = () => {
        if (!assetToEdit) return null;
        const { data, type } = assetToEdit;
        switch(type) {
            case 'quests': return <CreateQuestDialog initialData={data} onClose={() => setAssetToEdit(null)} onSave={handleSaveEditedAsset} mode="ai-creation" />;
            case 'gameAssets': return <EditGameAssetDialog assetToEdit={null} initialData={data} onClose={() => setAssetToEdit(null)} onSave={handleSaveEditedAsset} mode="ai-creation" />;
            case 'trophies': return <EditTrophyDialog trophy={null} initialData={data} onClose={() => setAssetToEdit(null)} onSave={handleSaveEditedAsset} mode="ai-creation" />;
            case 'markets': return <EditMarketDialog market={null} initialData={data} onClose={() => setAssetToEdit(null)} onSave={handleSaveEditedAsset} mode="ai-creation" />;
            default: return null;
        }
    };
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={onBack} variant="secondary">&larr; Back to Library</Button>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-foreground">{pack.title}</h2>
            <p className="text-muted-foreground">{pack.description}</p>
          </div>
        </div>

        <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <h3 className="font-semibold text-lg text-foreground mb-2">Assign to Users</h3>
                     <UserMultiSelect allUsers={users} selectedUserIds={userIdsForImport} onSelectionChange={setUserIdsForImport} label="Quests from this pack will be assigned to:" />
                </div>
                 <div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">Included Assets ({selectedIds.length} / {allAssets.length})</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2 border p-2 rounded-md">
                        <label className="flex items-center p-2 rounded-md hover:bg-accent/10 cursor-pointer">
                           <input type="checkbox" checked={selectedIds.length === allAssets.length} onChange={handleSelectAll} className="h-4 w-4 rounded text-primary bg-background border-input focus:ring-ring" />
                            <span className="ml-3 font-bold text-foreground">Select All</span>
                        </label>
                        {Object.entries(groupedAssets).map(([groupName, assets]) => (
                            <div key={groupName}>
                                <p className="font-semibold text-muted-foreground text-sm capitalize pl-2">{groupName}</p>
                                {assets.map(asset => (
                                     <label key={asset.id} className="flex items-center p-2 rounded-md hover:bg-accent/10 cursor-pointer">
                                        <input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={() => handleToggle(asset.id)} className="h-4 w-4 rounded text-primary bg-background border-input focus:ring-ring" />
                                        <span className="ml-3 text-foreground">{asset.icon} {asset.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="ml-auto text-xs text-muted-foreground hover:text-primary">Edit</button>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="text-right">
            <Button onClick={handleInstall} disabled={selectedIds.length === 0}>
                Install {selectedIds.length} Selected Assets
            </Button>
        </div>
        
        {renderAssetEditor()}
      </div>
    );
};


const AssetLibraryPage: React.FC = () => {
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);

    const filteredPacks = useMemo(() => {
        return libraryPacks.filter(pack => {
            const typeMatch = filter === 'All' || pack.type === filter;
            const searchMatch = pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                pack.description.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && searchMatch;
        });
    }, [filter, searchTerm]);

    if (selectedPack) {
        return <PackDetailView pack={selectedPack} onBack={() => setSelectedPack(null)} />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <Input
                        placeholder="Search packs..."
                        value={searchTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                        {packTypes.map(type => (
                            <Button
                                key={type}
                                variant={filter === type ? 'default' : 'secondary'}
                                onClick={() => setFilter(type)}
                            >
                                {type}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPacks.map(pack => (
                    <PackCard key={pack.id} pack={pack} onSelect={() => setSelectedPack(pack)} />
                ))}
            </div>
        </div>
    );
};
export default AssetLibraryPage;
