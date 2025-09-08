import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ShareableAssetType, Terminology, IAppData } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { generateAssetPack } from '../../utils/sharing';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useSystemState } from '../../context/SystemContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useProgressionState } from '../../context/ProgressionContext';
import { useCommunityState } from '../../context/CommunityContext';

const ExportPanel: React.FC = () => {
    const systemState = useSystemState();
    const economyState = useEconomyState();
    const progressionState = useProgressionState();
    const communityState = useCommunityState();
    const authState = useAuthState();
    const questState = useQuestsState();
    const { settings } = systemState;
    const { users } = authState;
    const [selected, setSelected] = useState<{ [key in ShareableAssetType]: string[] }>({
        quests: [],
        questGroups: [],
        rewardTypes: [],
        ranks: [],
        trophies: [],
        markets: [],
        gameAssets: [],
        users: [],
        rotations: [],
        modifierDefinitions: [],
        chronicles: [],
    });
    const [blueprintName, setBlueprintName] = useState('');
    const [blueprintDesc, setBlueprintDesc] = useState('');
    const lastCheckedIds = useRef<Partial<Record<ShareableAssetType, string>>>({});

    const assetTypes: { key: ShareableAssetType, label: keyof Terminology, data: any[] }[] = useMemo(() => [
        { key: 'quests', label: 'tasks', data: questState.quests },
        { key: 'questGroups', label: 'link_manage_quest_groups', data: questState.questGroups },
        { key: 'rewardTypes', label: 'points', data: economyState.rewardTypes.filter(rt => !rt.isCore) },
        { key: 'ranks', label: 'levels', data: progressionState.ranks },
        { key: 'trophies', label: 'awards', data: progressionState.trophies },
        { key: 'markets', label: 'stores', data: economyState.markets },
        { key: 'gameAssets', label: 'link_manage_items', data: economyState.gameAssets },
        { key: 'users', label: 'link_manage_users', data: users },
        { key: 'rotations', label: 'link_manage_rotations', data: questState.rotations },
        { key: 'modifierDefinitions', label: 'link_triumphs_trials', data: systemState.modifierDefinitions },
        { key: 'chronicles', label: 'link_chronicles', data: users },
    ], [systemState, economyState, progressionState, questState, users]);

    const handleCheckboxChange = useCallback((
        event: React.ChangeEvent<HTMLInputElement>,
        type: ShareableAssetType,
        clickedId: string
    ) => {
        const isShiftClick = event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey;
        const isChecked = event.target.checked;
        const allItemsForType = assetTypes.find(at => at.key === type)?.data.map(d => d.id) || [];
        const selectedForType = selected[type];
        
        if (isShiftClick && lastCheckedIds.current[type]) {
            const lastId = lastCheckedIds.current[type];
            const lastIndex = allItemsForType.indexOf(lastId!);
            const currentIndex = allItemsForType.indexOf(clickedId);
            
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = allItemsForType.slice(start, end + 1);

                const newSelectedForType = new Set(selectedForType);
                if (isChecked) {
                    rangeIds.forEach(id => newSelectedForType.add(id));
                } else {
                    rangeIds.forEach(id => newSelectedForType.delete(id));
                }
                setSelected(prev => ({ ...prev, [type]: Array.from(newSelectedForType) }));
            }
        } else {
            const newSelectedForType = new Set(selectedForType);
            if(isChecked) newSelectedForType.add(clickedId);
            else newSelectedForType.delete(clickedId);
            setSelected(prev => ({ ...prev, [type]: Array.from(newSelectedForType) }));
        }
        lastCheckedIds.current[type] = clickedId;
    }, [selected, assetTypes]);
    
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

        const fullAppData: IAppData = {
            ...systemState,
            ...economyState,
            ...progressionState,
            ...communityState,
            ...authState,
            ...questState,
        } as IAppData;

        generateAssetPack(
            blueprintName,
            blueprintDesc,
            settings.terminology.appName,
            selected,
            fullAppData
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-lg text-stone-200">Export Blueprint</h4>
                <p className="text-stone-400 text-sm mb-3">Create a shareable file containing your custom game assets. Dependencies like custom {settings.terminology.points.toLowerCase()} will be included automatically.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Blueprint Name" placeholder="e.g., 'My Awesome Chore Pack'" value={blueprintName} onChange={e => setBlueprintName(e.target.value)} required />
                <Input label="Description (Optional)" placeholder="A brief summary of what's inside" value={blueprintDesc} onChange={e => setBlueprintDesc(e.target.value)} />
            </div>

            <div className="space-y-4">
                {assetTypes.map(({ key, label, data }) => (
                     <div key={key} className="p-4 bg-stone-900/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                             <h5 className="font-semibold capitalize text-stone-200">{settings.terminology[label]}</h5>
                            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleToggleAll(key, data)}>Toggle All</Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                            {data.map((item: any) => (
                                <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-stone-800/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected[key].includes(item.id)}
                                        onChange={(e) => handleCheckboxChange(e, key, item.id)}
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                    />
                                    <span className="ml-3 text-stone-300 truncate" title={item.title || item.name || item.gameName}>{item.title || item.name || item.gameName}</span>
                                </label>
                            ))}
                        </div>
                        {data.length === 0 && <p className="text-xs text-stone-500 italic text-center py-2">No custom {settings.terminology[label].toLowerCase()} to export.</p>}
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

export default ExportPanel;