import React, { useState, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { AssetPack, ImportResolution, ShareableAssetType, Terminology, Role, UserTemplate, Quest } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserMultiSelect from '../ui/UserMultiSelect';
import { useAuthState } from '../../context/AuthContext';

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
    const { settings } = useAppState();
    const { users } = useAuthState();
    const [resolutions, setResolutions] = useState(initialResolutions);
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>(() => users.map(u => u.id));

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename' | 'keep') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution, selected: resolution !== 'skip' } : r));
    };
    
    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };

    const handleConfirm = () => {
        const packToInstall = JSON.parse(JSON.stringify(assetPack));
        
        if (packToInstall.assets.quests && packToInstall.assets.quests.length > 0) {
            packToInstall.assets.quests = packToInstall.assets.quests.map((quest: Quest) => ({
                ...quest,
                assignedUserIds: [...assignedUserIds]
            }));
        }
        
        onConfirm(packToInstall, resolutions);
    };

    const newItems = resolutions.filter(r => r.status === 'new');
    const conflictingItems = resolutions.filter(r => r.status === 'conflict');
    const hasUsersToImport = useMemo(() => assetPack.assets.users && assetPack.assets.users.length > 0, [assetPack.assets.users]);
    const hasQuestsToImport = useMemo(() => assetPack.assets.quests && assetPack.assets.quests.length > 0, [assetPack.assets.quests]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Install Asset Pack</h2>
                    <p className="text-stone-300 mt-1">Review contents and resolve conflicts before importing.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="p-4 bg-stone-900/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-100">{assetPack.manifest.name}</h3>
                        <p className="text-sm text-stone-400">by {assetPack.manifest.author}</p>
                        <p className="text-stone-300 mt-2">{assetPack.manifest.description}</p>
                    </div>
                    
                    { (newItems.length > 0 || conflictingItems.length > 0) ? (
                        <>
                            {newItems.length > 0 && (
                                <div className="p-4 bg-stone-900/50 rounded-lg">
                                    <h4 className="font-semibold text-green-400 mb-2">New Items to be Added ({newItems.length})</h4>
                                    <ul className="text-sm text-stone-300 list-disc list-inside max-h-32 overflow-y-auto">
                                        {newItems.map(res => <li key={`${res.type}-${res.id}`}>{res.name} <span className="text-xs text-stone-500 capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></li>)}
                                    </ul>
                                </div>
                            )}
                            
                            {conflictingItems.length > 0 && (
                                <div className="p-4 bg-amber-900/30 border border-amber-700/60 rounded-lg">
                                    <h4 className="font-semibold text-amber-400 mb-2">Name Conflicts ({conflictingItems.length})</h4>
                                    <p className="text-sm text-amber-300/80 mb-4">Choose how to handle items that already exist in your game.</p>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {conflictingItems.map(res => (
                                            <div key={`${res.type}-${res.id}`} className="bg-stone-800/50 p-3 rounded-md">
                                                <p className="font-bold text-stone-200">{res.name} <span className="text-xs text-stone-500 capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <label className="flex items-center">
                                                        <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'skip'} onChange={() => handleResolutionChange(res.id, res.type, 'skip')} className="h-4 w-4" />
                                                        <span className="ml-2 text-sm">Skip Import</span>
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'rename'} onChange={() => handleResolutionChange(res.id, res.type, 'rename')} className="h-4 w-4" />
                                                        <span className="ml-2 text-sm">Import and Rename</span>
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

                             {(hasUsersToImport || hasQuestsToImport) && (
                                <div className="p-4 bg-stone-900/50 rounded-lg">
                                    <h4 className="font-semibold text-stone-200 mb-2">Assignment Options</h4>
                                    {hasQuestsToImport && <p className="text-sm text-stone-400 mb-3">Assign all imported quests to the selected users.</p>}
                                    {hasUsersToImport && !hasQuestsToImport && <p className="text-sm text-stone-400 mb-3">Imported users will be added to the default guild.</p>}
                                    {hasQuestsToImport && (
                                        <UserMultiSelect
                                            label="Assign Quests To"
                                            allUsers={users}
                                            selectedUserIds={assignedUserIds}
                                            onSelectionChange={setAssignedUserIds}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-stone-400 text-center">This asset pack is empty or contains no new items.</p>
                    )}
                </div>

                <div className="p-6 border-t border-stone-700/60">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleConfirm} disabled={resolutions.filter(r => r.selected).length === 0}>
                            Import Selected ({resolutions.filter(r => r.selected).length})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPackInstallDialog;
