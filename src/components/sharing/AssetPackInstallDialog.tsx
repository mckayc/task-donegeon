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
    // FIX: Add 'aiTutors' to the terminology map.
    aiTutors: 'link_manage_ai_tutors',
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
                    className="mt-1 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                <p className="font-bold text-stone-200 flex-grow leading-tight">
                    <span className="mr-2 text-lg">{item.icon || '📦'}</span>
                    {title}
                </p>
            </div>
            <p className="text-xs text-stone-400 line-clamp-2 flex-grow">{description}</p>
            {(type === 'quests' || type === 'gameAssets') && (
                <div className="mt-2 pt-2 border-t border-stone-700/60 text-xs">
                    {(type === 'quests' && item.rewards?.length > 0) && (
                         <div className="flex flex-wrap gap-x-2 gap-y-1">
                            {item.rewards.map((r: RewardItem) => <span key={r.rewardTypeId}>+{r.amount} {getRewardInfo(r.rewardTypeId).icon}</span>)}
                        </div>
                    )}
                    {(type === 'gameAssets' && item.costGroups?.[0]?.length > 0) && (
                         <div className="flex flex-wrap gap-x-2 gap-y-1">
                            {item.costGroups[0].map((c: RewardItem) => <span key={c.rewardTypeId}>{c.amount} {getRewardInfo(c.rewardTypeId).icon}</span>)}
                        </div>
                    )}
                </div>
            )}
             {isDisabled && <div className="absolute inset-0 bg-black/20" title="Cannot deselect, required by another selected asset."></div>}
        </div>
    )
}


const AssetPackInstallDialog: React.FC<AssetPackInstallDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm, allowUserAssignment }) => {
    const { settings } = useSystemState();
    const { users } = useAuthState();
    const [resolutions, setResolutions] = useState(initialResolutions);
    const [selectedAssetKeys, setSelectedAssetKeys] = useState<Set<string>>(new Set());
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('contents');

    // ... (dependency graph logic will go here)

    useEffect(() => {
        if (allowUserAssignment) {
            setSelectedUserIds(users.map(u => u.id));
        }
        const initialSelection = new Set<string>();
        initialResolutions.forEach(res => {
            if (res.status === 'new') {
                initialSelection.add(`${res.type}:${res.id}`);
            }
        });
        setSelectedAssetKeys(initialSelection);
    }, [initialResolutions, allowUserAssignment, users]);
    
    const handleConfirm = () => {
        if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Confirmed import from asset pack: ${assetPack.manifest.name}` });
        }
        
        const finalResolutions = resolutions.filter(res => {
            const key = `${res.type}:${res.id}`;
            return selectedAssetKeys.has(key) && res.resolution !== 'skip';
        });
        
        const packWithSelectedAssets: AssetPack = { ...assetPack, assets: {} };
        
        finalResolutions.forEach(res => {
            if (!packWithSelectedAssets.assets[res.type]) {
                (packWithSelectedAssets.assets as any)[res.type] = [];
            }
            // FIX: Ensure the asset list exists before trying to find an item in it.
            const assetList = assetPack.assets[res.type] as any[] | undefined;
            let originalAsset;
            if (res.type === 'users') {
                 originalAsset = assetList ? assetList.find(a => a.username === res.id) : undefined;
            } else {
                 originalAsset = assetList ? assetList.find(a => a.id === res.id) : undefined;
            }
            if (originalAsset) {
                ((packWithSelectedAssets.assets as any)[res.type] as any[]).push(originalAsset);
            }
        });
        
        onConfirm(packWithSelectedAssets, finalResolutions, allowUserAssignment ? selectedUserIds : undefined);
    };

    const groupedResolutions = resolutions.reduce((acc, res) => {
        if (!acc[res.type]) acc[res.type] = [];
        acc[res.type].push(res);
        return acc;
    }, {} as Record<ShareableAssetType, ImportResolution[]>);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Install Asset Pack</h2>
                    <p className="text-stone-300 mt-1">Review and select the contents to import.</p>
                </div>

                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left Column */}
                    <div className="md:col-span-1 flex flex-col gap-6">
                         <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-bold text-lg text-stone-100">{assetPack.manifest.name}</h3>
                            <p className="text-sm text-stone-400">by {assetPack.manifest.author}</p>
                            <p className="text-stone-300 mt-2">{assetPack.manifest.description}</p>
                        </div>
                        {allowUserAssignment && (
                             <UserMultiSelect
                                allUsers={users}
                                selectedUserIds={selectedUserIds}
                                onSelectionChange={setSelectedUserIds}
                                label="Assign Quests To"
                            />
                        )}
                         <div className="border-b border-stone-700">
                            <nav className="-mb-px flex space-x-6">
                                <button onClick={() => setActiveTab('contents')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'contents' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                                    Contents ({selectedAssetKeys.size})
                                </button>
                                <button onClick={() => setActiveTab('dependencies')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dependencies' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                                    Summary
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="md:col-span-2 overflow-y-auto pr-2 scrollbar-hide">
                         {activeTab === 'contents' && (
                            <div className="space-y-4">
                                {Object.entries(groupedResolutions).map(([type, items]) => {
                                    const assetType = type as ShareableAssetType;
                                    return (
                                        <div key={type}>
                                            <h4 className="font-semibold capitalize text-stone-200 mb-2">{settings.terminology[terminologyMap[assetType]] || assetType}</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {items.map(res => {
                                                    let originalAsset;
                                                    if (assetType === 'users') {
                                                        originalAsset = (assetPack.assets.users as UserTemplate[])?.find(a => a.username === res.id);
                                                    } else {
                                                        originalAsset = (assetPack.assets[assetType] as any[])?.find(a => a.id === res.id);
                                                    }
                                                    if (!originalAsset) return null;
                                                    
                                                    return <AssetCard
                                                        key={res.id}
                                                        item={originalAsset}
                                                        type={assetType}
                                                        isSelected={selectedAssetKeys.has(`${assetType}:${res.id}`)}
                                                        isDisabled={false} // Add dependency logic here
                                                        onToggle={() => {
                                                            const key = `${assetType}:${res.id}`;
                                                            const newSelection = new Set(selectedAssetKeys);
                                                            if (newSelection.has(key)) newSelection.delete(key);
                                                            else newSelection.add(key);
                                                            setSelectedAssetKeys(newSelection);
                                                        }}
                                                        terminology={settings.terminology}
                                                    />
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {activeTab === 'dependencies' && <DependencyGraph pack={assetPack} />}
                    </div>

                </div>

                <div className="p-6 border-t border-stone-700/60">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleConfirm} disabled={selectedAssetKeys.size === 0}>
                            Confirm & Import ({selectedAssetKeys.size})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPackInstallDialog;