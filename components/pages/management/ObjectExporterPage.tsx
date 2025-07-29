import React, { useState } from 'react';
import { useAppState } from '../../../context/AppContext';
import { ShareableAssetType, Terminology } from '../../../frontendTypes';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { generateBlueprint } from '../../../utils/sharing';
import Card from '../../ui/Card';

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

    const totalSelected = Object.values(selected).reduce((acc, curr) => acc + curr.length, 0);

    return (
        <div>
            <div className="sticky top-0 z-10 bg-stone-800/90 backdrop-blur-sm p-4 border border-stone-700/60 rounded-xl shadow-lg mb-6">
                 <div className="flex items-center gap-4 w-full">
                    <span className="font-bold text-lg text-stone-200 whitespace-nowrap">Export Options:</span>
                    <div className="flex-grow">
                        <Input placeholder="Blueprint Name*" value={blueprintName} onChange={e => setBlueprintName(e.target.value)} required />
                    </div>
                     <div className="flex-grow">
                        <Input placeholder="Description (Optional)" value={blueprintDesc} onChange={e => setBlueprintDesc(e.target.value)} />
                    </div>
                    <div>
                        <Button onClick={handleExport} disabled={!blueprintName.trim() || totalSelected === 0}>
                            Export ({totalSelected})
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {assetTypes.map(({ key, label, data }) => (
                     <Card key={key} title={settings.terminology[label] as string}>
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-sm text-stone-400">{data.length} items</p>
                            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleToggleAll(key, data)}>Toggle All</Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-2 border-t border-stone-700/60 pt-2">
                            {data.map((item: any) => (
                                <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-stone-800/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected[key].includes(item.id)}
                                        onChange={() => handleToggle(key, item.id)}
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                    />
                                    <span className="ml-3 text-stone-300">{item.title || item.name}</span>
                                </label>
                            ))}
                        </div>
                        {data.length === 0 && <p className="text-xs text-stone-500 italic text-center py-2">No custom {settings.terminology[label].toLowerCase()} to export.</p>}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ObjectExporterPage;