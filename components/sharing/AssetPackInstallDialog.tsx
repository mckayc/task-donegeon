import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { AssetPack, ImportResolution, ShareableAssetType, Terminology, Role, UserTemplate, Quest } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import { useAuthState } from '../../context/AuthContext';
import { bugLogger } from '../../utils/bugLogger';

interface AssetPackInstallDialogProps {
  assetPack: AssetPack;
  initialResolutions: ImportResolution[];
  onClose: () => void;
  onConfirm: (assetPack: AssetPack, resolutions: ImportResolution[]) => Promise<void>;
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

const AssetCard: React.FC<{
    resolution: ImportResolution;
    asset: any;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onResolutionChange: (res: 'skip' | 'rename') => void;
    onRename: (newName: string) => void;
    onImportSingle: () => Promise<void>;
    isImporting: boolean;
}> = ({ resolution, asset, onToggle, onResolutionChange, onRename, onImportSingle, isImporting }) => {
    const isConflict = resolution.status === 'conflict';
    const canImportSingle = !isConflict || resolution.resolution === 'rename';

    return (
        <div className={`p-3 rounded-lg border-2 ${
            isConflict 
            ? 'border-amber-700/60 bg-amber-900/30' 
            : resolution.selected 
            ? 'border-emerald-700/60 bg-emerald-900/30'
            : 'border-stone-700/60 bg-stone-900/50'
        }`}>
            <div className="flex items-start gap-3">
                <input 
                    type="checkbox" 
                    checked={resolution.selected} 
                    onChange={onToggle} 
                    className="mt-1 h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-stone-100">{asset.icon || '▫️'} {resolution.name}</p>
                            <p className="text-sm text-stone-400">{asset.description}</p>
                        </div>
                        {canImportSingle && (
                            <Button size="sm" variant="secondary" onClick={onImportSingle} disabled={isImporting}>
                                {isImporting ? '...' : 'Import'}
                            </Button>
                        )}
                    </div>
                    {isConflict && (
                        <div className="mt-2 pt-2 border-t border-amber-600/30">
                            <p className="text-xs text-amber-300 font-semibold mb-2">This item already exists.</p>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center text-sm">
                                    <input type="radio" name={`${resolution.type}-${resolution.id}-res`} checked={resolution.resolution === 'skip'} onChange={() => onResolutionChange('skip')} className="h-4 w-4" />
                                    <span className="ml-2">Skip</span>
                                </label>
                                <label className="flex items-center text-sm">
                                    <input type="radio" name={`${resolution.type}-${resolution.id}-res`} checked={resolution.resolution === 'rename'} onChange={() => onResolutionChange('rename')} className="h-4 w-4" />
                                    <span className="ml-2">Rename</span>
                                </label>
                            </div>
                            {resolution.resolution === 'rename' && (
                                <Input
                                    value={resolution.newName || `${resolution.name} (Imported)`}
                                    onChange={e => onRename(e.target.value)}
                                    className="mt-2 text-sm"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const AssetPackInstallDialog: React.FC<AssetPackInstallDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm }) => {
    const { settings } = useAppState();
    const { users } = useAuthState();
    const [resolutions, setResolutions] = useState(initialResolutions);
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>(() => users.map(u => u.id));
    const [importingItemId, setImportingItemId] = useState<string | null>(null);
    const lastCheckedId = useRef<string | null>(null);

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution, selected: resolution !== 'skip' } : r));
    };
    
    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };

    const handleToggleSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>, clickedRes: ImportResolution) => {
        const isShiftClick = event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey;
        const isChecked = event.target.checked;

        if (isShiftClick && lastCheckedId.current) {
            const allIds = resolutions.map(r => `${r.type}-${r.id}`);
            const lastFullId = lastCheckedId.current;
            const currentFullId = `${clickedRes.type}-${clickedRes.id}`;
            const lastIndex = allIds.indexOf(lastFullId);
            const currentIndex = allIds.indexOf(currentFullId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeResolutions = resolutions.slice(start, end + 1);
                
                setResolutions(prev => prev.map(res => {
                    if (rangeResolutions.some(rangeRes => rangeRes.id === res.id && rangeRes.type === res.type)) {
                        return { ...res, selected: isChecked };
                    }
                    return res;
                }));
            }
        } else {
             setResolutions(prev => prev.map(r => r.id === clickedRes.id && r.type === clickedRes.type ? { ...r, selected: !r.selected } : r));
        }

        lastCheckedId.current = `${clickedRes.type}-${clickedRes.id}`;

    }, [resolutions]);
    
    const handleConfirm = () => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Confirmed installation of asset pack: ${assetPack.manifest.name}` });
        }
        const packToInstall = JSON.parse(JSON.stringify(assetPack));
        
        if (packToInstall.assets.quests && packToInstall.assets.quests.length > 0) {
            packToInstall.assets.quests = packToInstall.assets.quests.map((quest: Quest) => ({
                ...quest,
                assignedUserIds: [...assignedUserIds]
            }));
        }
        
        onConfirm(packToInstall, resolutions);
    };

    const handleSingleImport = async (resToImport: ImportResolution) => {
        setImportingItemId(resToImport.id);

        const singleItemResolutions = resolutions.map(r => 
            (r.id === resToImport.id && r.type === resToImport.type) 
                ? { ...r, selected: true } 
                : { ...r, selected: false }
        );
        
        const packToInstall = JSON.parse(JSON.stringify(assetPack));
        if (packToInstall.assets.quests && packToInstall.assets.quests.length > 0) {
            packToInstall.assets.quests = packToInstall.assets.quests.map((quest: Quest) => ({
                ...quest,
                assignedUserIds: [...assignedUserIds]
            }));
        }

        await onConfirm(packToInstall, singleItemResolutions);

        setResolutions(prev => prev.map(r => 
            (r.id === resToImport.id && r.type === resToImport.type) 
                ? { ...r, status: 'conflict', resolution: 'skip', selected: false } 
                : r
        ));

        setImportingItemId(null);
    };


    const hasQuestsToImport = useMemo(() => assetPack.assets.quests && assetPack.assets.quests.length > 0, [assetPack.assets.quests]);

    const groupedResolutions = useMemo(() => {
        return resolutions.reduce((acc, res) => {
            const typeKey = settings.terminology[terminologyMap[res.type]] || res.type;
            if (!acc[typeKey]) {
                acc[typeKey] = [];
            }
            acc[typeKey].push(res);
            return acc;
        }, {} as Record<string, ImportResolution[]>);
    }, [resolutions, settings.terminology]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Install Asset Pack</h2>
                    <p className="text-stone-300 mt-1">Review contents and resolve conflicts before importing.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="p-4 bg-stone-900/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-100">{assetPack.manifest.emoji} {assetPack.manifest.name}</h3>
                        <p className="text-sm text-stone-400">by {assetPack.manifest.author}</p>
                        <p className="text-stone-300 mt-2">{assetPack.manifest.description}</p>
                    </div>

                    {resolutions.length > 0 ? (
                        Object.entries(groupedResolutions).map(([groupName, groupResolutions]) => (
                            <div key={groupName} className="p-4 bg-stone-900/50 rounded-lg">
                                <h4 className="font-semibold text-stone-200 capitalize mb-3">{groupName} ({groupResolutions.length})</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {groupResolutions.map(res => {
                                        const assetList = assetPack.assets[res.type];
                                        const asset = Array.isArray(assetList)
                                            ? assetList.find(a => {
                                                if (res.type === 'users') {
                                                    return (a as UserTemplate).username === res.id;
                                                }
                                                return (a as { id: string }).id === res.id;
                                              })
                                            : undefined;
                                        if (!asset) return null;
                                        return (
                                            <AssetCard
                                                key={`${res.type}-${res.id}`}
                                                resolution={res}
                                                asset={asset}
                                                onToggle={(e) => handleToggleSelection(e, res)}
                                                onResolutionChange={(newRes) => handleResolutionChange(res.id, res.type, newRes)}
                                                onRename={(newName) => handleRenameChange(res.id, res.type, newName)}
                                                onImportSingle={() => handleSingleImport(res)}
                                                isImporting={importingItemId === res.id}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-stone-400 text-center">This asset pack is empty or contains no new items.</p>
                    )}
                    
                    {hasQuestsToImport && (
                        <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h4 className="font-semibold text-stone-200 mb-2">Quest Assignment</h4>
                            <p className="text-sm text-stone-400 mb-3">Assign all imported quests to the selected users.</p>
                            <UserMultiSelect
                                label="Assign Quests To"
                                allUsers={users}
                                selectedUserIds={assignedUserIds}
                                onSelectionChange={setAssignedUserIds}
                            />
                        </div>
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