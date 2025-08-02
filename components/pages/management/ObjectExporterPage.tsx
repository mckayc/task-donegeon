import React, { useState, ChangeEvent } from 'react';
import { useAppState } from '../../../context/AppContext';
import { ShareableAssetType, Terminology } from '../../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { generateBlueprint } from '../../../utils/sharing';

const ObjectExporterPage: React.FC = () => {
    const appState = useAppState();
    const { settings } = appState;
    const [selected, setSelected] = useState<{ [key in ShareableAssetType]: string[] }>({
        quests: [],
        questGroups: [],
        rewardTypes: [],
        ranks: [],
        trophies: [],
        markets: [],
        gameAssets: [],
    });
    const [blueprintName, setBlueprintName] = useState('');
    const [blueprintDesc, setBlueprintDesc] = useState('');

    const handleToggle = (type: ShareableAssetType, id: string) => {
        setSelected(prev => ({
            ...prev,
            [type]: prev[type].includes(id)
                ? prev[type].filter(i => i !== id)
                : [...prev[type], id],
        }));
    };
    
    const handleToggleAll = (type: ShareableAssetType, assets: {id: string}[]) => {
        const allIds = assets.map(a => a.id);
        const allSelected = allIds.every(id => selected[type].includes(id));
        setSelected(prev => ({
            ...prev,
            [type]: allSelected ? [] : [...new Set([...prev[type], ...allIds])],
        }));
    };

    const handleExport = () => {
        if (!blueprintName.trim()) {
            alert('Please provide a name for your Blueprint.');
            return;
        }
        generateBlueprint(
            blueprintName,
            blueprintDesc,
            settings.terminology.appName,
            selected,
            appState
        );
    };

    const assetTypes: { key: ShareableAssetType, label: keyof Terminology, data: any[] }[] = [
        { key: 'quests', label: 'tasks', data: appState.quests },
        { key: 'questGroups', label: 'link_manage_quest_groups', data: appState.questGroups },
        { key: 'rewardTypes', label: 'points', data: appState.rewardTypes.filter(rt => !rt.isCore) },
        { key: 'ranks', label: 'levels', data: appState.ranks },
        { key: 'trophies', label: 'awards', data: appState.trophies },
        { key: 'markets', label: 'stores', data: appState.markets },
        { key: 'gameAssets', label: 'link_manage_items', data: appState.gameAssets },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-lg text-foreground">Export Blueprint</h4>
                <p className="text-muted-foreground text-sm mb-3">Create a shareable file containing your custom game assets. Dependencies like custom {settings.terminology.points.toLowerCase()} will be included automatically.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bp-name">Blueprint Name</Label>
                  <Input id="bp-name" placeholder="e.g., 'My Awesome Chore Pack'" value={blueprintName} onChange={(e: ChangeEvent<HTMLInputElement>) => setBlueprintName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp-desc">Description (Optional)</Label>
                  <Input id="bp-desc" placeholder="A brief summary of what's inside" value={blueprintDesc} onChange={(e: ChangeEvent<HTMLInputElement>) => setBlueprintDesc(e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                {assetTypes.map(({ key, label, data }) => (
                     <div key={key} className="p-4 bg-background rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                             <h5 className="font-semibold capitalize text-foreground">{settings.terminology[label]}</h5>
                            <Button variant="outline" size="sm" onClick={() => handleToggleAll(key, data)}>Toggle All</Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                            {data.map((item: any) => (
                                <Label key={item.id} className="flex items-center p-2 rounded-md hover:bg-accent/10 cursor-pointer">
                                    <Checkbox
                                        checked={selected[key].includes(item.id)}
                                        onCheckedChange={() => handleToggle(key, item.id)}
                                    />
                                    <span className="ml-3 text-foreground">{item.title || item.name}</span>
                                </Label>
                            ))}
                        </div>
                        {data.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-2">No custom {settings.terminology[label].toLowerCase()} to export.</p>}
                    </div>
                ))}
            </div>
            
            <div className="text-right pt-4">
                <Button onClick={handleExport} disabled={!blueprintName.trim() || Object.values(selected).every(arr => arr.length === 0)}>
                    Create & Download Blueprint
                </Button>
            </div>
        </div>
    );
};

export default ObjectExporterPage;