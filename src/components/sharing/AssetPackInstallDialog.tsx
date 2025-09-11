
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AssetPack, ImportResolution, ShareableAssetType, Quest, RewardItem, GameAsset, User, UserTemplate } from '../../types';
import { Terminology } from '../../types/app';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import DependencyGraph from './DependencyGraph';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import { useEconomyState } from '../../context/EconomyContext';

interface AssetPackInstallDialogProps {
  assetPack: AssetPack;
  initialResolutions: ImportResolution[];
  onClose: () => void;
  onConfirm: (assetPack: AssetPack, resolutions: ImportResolution[], userIdsToAssign?: string[]) => void;
  allowUserAssignment: boolean;
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
    chronicles: 'link_chronicles',
};

const AssetCard: React.FC<{
    item: any;
    type: ShareableAssetType;
    isSelected: boolean;
    isDisabled: boolean;
    onToggle: () => void;
    terminology: Terminology;
}> = ({ item, type, isSelected, isDisabled, onToggle, terminology }) => {
    const { rewardTypes } = useEconomyState();
    const getRewardInfo = (id: string) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    
    const title = item.title || item.name || item.gameName;
    const description = item.description || item.purpose || `A new ${terminology[terminologyMap[type]] || type}`;
    
    return (
        <div className={`p-3 rounded-lg border-2 flex flex-col h-full transition-colors ${isSelected ? 'bg-emerald-900/40 border-emerald-600' : 'bg-stone-800/50 border-transparent'}`}>
            <div className="flex items-start gap-3 mb-2">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    disabled={isDisabled}
                    className="mt-1 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500 disabled:opacity-50"
                />
                <div className="flex-grow">
                    <p className="font-bold text-stone-200">{item.icon} {title}</p>
                    <p className="text-xs text-stone-400">{description}</p>
                </div>
            </div>
            {item.rewards && item.rewards.length > 0 && (
                <div className="mt-auto pt-2 border-t border-stone-700/60">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {item.rewards.map((r: RewardItem) => {
                            const { name, icon } = getRewardInfo(r.rewardTypeId);
                            return (
                                <span key={r.rewardTypeId} className="text-xs text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded-full">
                                    {r.amount} {icon}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AssetPackInstallDialog: React.FC<AssetPackInstallDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm, allowUserAssignment }) => {
    const { settings } = useSystemState();
    const { users } = useAuthState();
    const [resolutions, setResolutions] = useState<ImportResolution[]>(initialResolutions);
    const [userIdsToAssign, setUserIdsToAssign] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('review');

    useEffect(() => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Opened Asset Pack Install dialog for "${assetPack.manifest.name}".` });
        }
    }, [assetPack.manifest.name]);

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename' | 'keep') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution } : r));
    };

    const handleNewNameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };
    
    const handleToggleSelection = (id: string, type: ShareableAssetType) => {
         setResolutions(prev => prev.map(r => {
            if(r.id === id && r.type === type) {
                return { ...r, selected: !r.selected };
            }
            return r;
         }));
    };
    
    const handleSelectAll = (assetType: ShareableAssetType, shouldSelect: boolean) => {
        setResolutions(prev => prev.map(r => {
            if (r.type === assetType && r.status === 'new') {
                return { ...r, selected: shouldSelect };
            }
            return r;
        }));
    };

    const handleConfirm = () => {
        onConfirm(assetPack, resolutions, userIdsToAssign);
    };

    const assetGroups = useMemo(() => {
        const groups: { [key in ShareableAssetType]?: any[] } = {};
        Object.keys(assetPack.assets).forEach(key => {
            const assetType = key as ShareableAssetType;
            const assets = assetPack.assets[assetType];
            if (assets && assets.length > 0) {
                groups[assetType] = assets;
            }
        });
        return groups;
    }, [assetPack]);
    
    const conflictResolutions = useMemo(() => resolutions.filter(r => r.status === 'conflict'), [resolutions]);
    const newResolutions = useMemo(() => resolutions.filter(r => r.status === 'new'), [resolutions]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-3xl font-medieval text-accent">Install Asset Pack</h2>
                    <p className="text-stone-300">{assetPack.manifest.name} <span className="text-sm text-stone-500">by {assetPack.manifest.author}</span></p>
                </div>
                
                 <div className="border-b border-stone-700/60 flex-shrink-0">
                    <nav className="-mb-px flex space-x-6 px-6">
                        <button onClick={() => setActiveTab('review')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'review' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Review & Select</button>
                        <button onClick={() => setActiveTab('dependencies')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dependencies' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Dependencies</button>
                    </nav>
                </div>

                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {activeTab === 'review' ? (
                        <>
                            {allowUserAssignment && (assetPack.assets.quests || []).length > 0 && (
                                <div className="p-4 bg-stone-900/50 rounded-lg">
                                    <h3 className="font-semibold text-stone-200 mb-2">Assign Quests to Users</h3>
                                    <UserMultiSelect
                                        allUsers={users}
                                        selectedUserIds={userIdsToAssign}
                                        onSelectionChange={setUserIdsToAssign}
                                        label="Select users to assign these quests to. Leave blank to assign to no one."
                                    />
                                </div>
                            )}
                            
                             {conflictResolutions.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-lg text-amber-300 mb-2">Conflicts Found</h3>
                                    <p className="text-sm text-stone-400 mb-3">Some assets in this pack have the same name as assets you already have. Please choose how to handle them.</p>
                                    <div className="space-y-3">
                                        {conflictResolutions.map(res => (
                                            <div key={`${res.type}-${res.id}`} className="p-3 bg-stone-900/40 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                                <div className="md:col-span-1">
                                                    <p className="font-semibold text-stone-200">{res.name}</p>
                                                    <p className="text-xs text-stone-500 capitalize">{settings.terminology[terminologyMap[res.type]] || res.type}</p>
                                                </div>
                                                <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
                                                    <Button variant={res.resolution === 'skip' ? 'default' : 'secondary'} size="sm" onClick={() => handleResolutionChange(res.id, res.type, 'skip')} className="!text-xs">Skip</Button>
                                                    <Button variant={res.resolution === 'rename' ? 'default' : 'secondary'} size="sm" onClick={() => handleResolutionChange(res.id, res.type, 'rename')} className="!text-xs">Rename</Button>
                                                    {res.resolution === 'rename' && (
                                                        <Input 
                                                            value={res.newName || ''} 
                                                            onChange={e => handleNewNameChange(res.id, res.type, e.target.value)}
                                                            placeholder="New name..."
                                                            className="h-8 text-xs flex-grow"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {newResolutions.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-lg text-green-300 mb-2">New Assets</h3>
                                     <p className="text-sm text-stone-400 mb-3">Select the new assets you wish to import from this pack.</p>
                                    <div className="space-y-4">
                                        {Object.entries(assetGroups).map(([type, assets]) => {
                                            const newAssetsInGroup = newResolutions.filter(r => r.type === type);
                                            if (newAssetsInGroup.length === 0) return null;
                                            
                                            return (
                                                <div key={type}>
                                                    <div className="flex items-center justify-between">
                                                         <h4 className="font-semibold text-stone-200 capitalize">{settings.terminology[terminologyMap[type as ShareableAssetType]] || type}</h4>
                                                         <Button variant="secondary" size="sm" className="!text-xs" onClick={() => handleSelectAll(type as ShareableAssetType, newAssetsInGroup.some(r => !r.selected))}>
                                                             {newAssetsInGroup.every(r => r.selected) ? 'Deselect All' : 'Select All'}
                                                         </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                                         {assets.map((item: any) => {
                                                            const resolution = newResolutions.find(r => (r.type === 'users' ? r.id === item.username : r.id === item.id) && r.type === type);
                                                            if (!resolution) return null;
                                                            return (
                                                                <AssetCard 
                                                                    key={item.id || item.username} 
                                                                    item={item} 
                                                                    type={type as ShareableAssetType}
                                                                    isSelected={resolution.selected ?? false}
                                                                    isDisabled={false}
                                                                    onToggle={() => handleToggleSelection(resolution.id, resolution.type)}
                                                                    terminology={settings.terminology}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <DependencyGraph pack={assetPack} />
                    )}
                </div>

                <div className="p-4 bg-black/20 mt-auto flex justify-end space-x-4 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm & Install</Button>
                </div>
            </div>
        </div>
    );
};
