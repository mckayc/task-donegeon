import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { AssetPack, ImportResolution, ShareableAssetType, Terminology, Role, UserTemplate, Quest } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserMultiSelect from '../ui/UserMultiSelect';

interface AssetPackInstallDialogProps {
  assetPack: AssetPack;
  initialResolutions: ImportResolution[];
  onClose: () => void;
  onConfirm: (assetPack: AssetPack, resolutions: ImportResolution[]) => void;
}

const terminologyMap: { [key in ShareableAssetType]: keyof Terminology } = {
    quests: 'tasks',
    questGroups: 'link_manage_quest_groups',
    rewardTypes: 'points',
    ranks: 'levels',
    trophies: 'awards',
    markets: 'stores',
    gameAssets: 'link_manage_items',
    users: 'link_manage_users',
};

const AssetPackInstallDialog: React.FC<AssetPackInstallDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm }) => {
    const { settings, users } = useAppState();
    const [resolutions, setResolutions] = useState(initialResolutions);
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>(() => users.map(u => u.id));

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename' | 'keep') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution, selected: resolution !== 'skip' } : r));
    };

    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };
    
    const handleToggleSelection = (id: string, type: ShareableAssetType) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, selected: !r.selected } : r));
    }

    const hasQuests = useMemo(() => assetPack.assets.quests && assetPack.assets.quests.length > 0, [assetPack.assets.quests]);

    const handleConfirm = () => {
        const finalResolutions = [...resolutions];
        
        // Before confirming, update the quests in the asset pack with the selected assignees
        const updatedAssetPack = JSON.parse(JSON.stringify(assetPack));
        if (updatedAssetPack.assets.quests) {
            updatedAssetPack.assets.quests.forEach((quest: any) => {
                quest.assignedUserIds = assignedUserIds;
            });
        }
        
        onConfirm(updatedAssetPack, finalResolutions);
    };

    const categorizedResolutions = useMemo(() => {
        return resolutions.reduce((acc, res) => {
            const category = settings.terminology[terminologyMap[res.type]] || res.type;
            if (!acc[category]) acc[category] = [];
            acc[category].push(res);
            return acc;
        }, {} as Record<string, ImportResolution[]>);
    }, [resolutions, settings.terminology]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-3xl font-medieval text-accent">Install "{assetPack.manifest.name}"</h2>
                    <p className="text-stone-300 mt-1">Review and select the assets you want to import.</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto scrollbar-hide">
                    {/* Left Column: Asset Selection */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-stone-200">Select Assets to Import</h3>
                        {Object.entries(categorizedResolutions).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="font-semibold text-accent-light capitalize">{category}</h4>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2 border-l-2 border-stone-700/60 pl-2">
                                    {items.map(res => {
                                        const asset = (() => {
                                            if (!assetPack.assets || !res.type) return null;
                                            const assetList = (assetPack.assets as any)[res.type];
                                            if (!assetList) return null;
                                            if (res.type === 'users') {
                                                return assetList.find((u: any) => u.username === res.id);
                                            }
                                            return assetList.find((a: any) => a.id === res.id);
                                        })();

                                        const icon = asset?.icon || (res.type === 'users' ? '👤' : '▫️');
                                        const description = asset?.description || (res.type === 'users' ? `Role: ${(asset as any)?.role}` : 'No description provided.');
                                        
                                        return (
                                            <div key={`${res.type}-${res.id}`} className={`p-2 rounded-md ${res.status === 'conflict' ? 'bg-amber-900/30' : 'bg-stone-900/50'}`}>
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={res.selected}
                                                        onChange={() => handleToggleSelection(res.id, res.type)}
                                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 mt-1 flex-shrink-0"
                                                    />
                                                    <span className="text-2xl flex-shrink-0">{icon}</span>
                                                    <div className="flex-grow">
                                                        <span className="text-stone-300">{res.name}</span>
                                                        {res.status === 'conflict' && <span className="text-xs font-bold text-amber-400 ml-2">(Conflict)</span>}
                                                        <p className="text-xs text-stone-400">{description}</p>
                                                    </div>
                                                </label>
                                                {res.status === 'conflict' && res.selected && (
                                                    <div className="pl-12 mt-2 space-y-2">
                                                        <div className="flex items-center gap-4">
                                                            <label className="flex items-center text-sm"><input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'skip'} onChange={() => handleResolutionChange(res.id, res.type, 'skip')} /> <span className="ml-2">Skip</span></label>
                                                            <label className="flex items-center text-sm"><input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'rename'} onChange={() => handleResolutionChange(res.id, res.type, 'rename')} /> <span className="ml-2">Rename</span></label>
                                                        </div>
                                                        {res.resolution === 'rename' && (
                                                            <Input value={res.newName || `${res.name} (Imported)`} onChange={e => handleRenameChange(res.id, res.type, e.target.value)} className="text-sm h-8" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: User Assignment */}
                    {hasQuests && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-stone-200">Assign Quests</h3>
                             <UserMultiSelect
                                allUsers={users}
                                selectedUserIds={assignedUserIds}
                                onSelectionChange={setAssignedUserIds}
                                label="Assign imported quests to these users:"
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-stone-700/60 flex-shrink-0">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleConfirm}>Confirm & Import</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPackInstallDialog;