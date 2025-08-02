import React, { useState, ChangeEvent } from 'react';
import { useAppState } from '../../context/AppContext';
import { ShareableAssetType, Terminology } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { generateBlueprint } from '../../utils/sharing';

const ExportPanel: React.FC = () => {
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
        { key: 'ranks',