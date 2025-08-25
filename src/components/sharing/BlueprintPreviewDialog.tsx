import React, { useState } from 'react';
import { AssetPack, ImportResolution, ShareableAssetType } from '../../types';
import { Terminology } from '../../types/app';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import { analyzeAssetPackForConflicts } from '../../utils/sharing';

interface BlueprintPreviewDialogProps {
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
    rotations: 'link_manage_rotations',
    modifierDefinitions: 'link_triumphs_trials',
};

const BlueprintPreviewDialog: React.FC<BlueprintPreviewDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm }) => {
    const { settings } = useSystemState();
    const [resolutions, setResolutions] = useState(initialResolutions);

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution } : r));
    };

    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };

    const newItems = resolutions.filter(r => r.status === 'new');
    const conflictingItems = resolutions.filter(r => r.status === 'conflict');

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Asset Pack Preview</h2>
                    <p className="text-stone-300 mt-1">Review the contents before importing.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="p-4 bg-stone-900/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-100">{assetPack.manifest.name}</h3>
                        <p className="text-sm text-stone-400">by {assetPack.manifest.author}</p>
                        <p className="text-stone-300 mt-2">{assetPack.manifest.description}</p>
                    </div>

                    {newItems.length > 0 && (
                        <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h4 className="font-semibold text-green-400 mb-2">New Items to be Added ({newItems.length})</h4>
                            <ul className="text-sm text-stone-300 list-disc list-inside max-h-32 overflow-y-auto">
                                {newItems.map((res: ImportResolution) => <li key={`${res.type}-${res.id}`}>{res.name} <span className="text-xs text-stone-500 capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></li>)}
                            </ul>
                        </div>
                    )}
                    
                    {conflictingItems.length > 0 && (
                        <div className="p-4 bg-amber-900/30 border border-amber-700/60 rounded-lg">
                            <h4 className="font-semibold text-amber-400 mb-2">Name Conflicts ({conflictingItems.length})</h4>
                            <p className="text-sm text-amber-300/80 mb-4">Some items in this asset pack have the same name as items you already have. Please choose how to handle them.</p>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {conflictingItems.map((res: ImportResolution) => (
                                    <div key={`${res.type}-${res.id}`} className="bg-stone-800/50 p-3 rounded-md">
                                        <p className="font-bold text-stone-200">{res.name} <span className="text-xs text-stone-500 capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <label className="flex items-center">
                                                <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'skip'} onChange={() => handleResolutionChange(res.id, res.type, 'skip')} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                                                <span className="ml-2 text-sm">Skip Import</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'rename'} onChange={() => handleResolutionChange(res.id, res.type, 'rename')} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                                                <span className="ml-2 text-sm">Rename</span>
                                            </label>
                                        </div>
                                        {res.resolution === 'rename' && (
                                            <Input
                                                value={res.newName || `${res.name} (Imported)`}
                                                onChange={e => handleRenameChange(res.id, res.type, e.target.value)}
                                                className="mt-2 text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-stone-700/60">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={() => onConfirm(assetPack, resolutions)}>Confirm & Import</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlueprintPreviewDialog;