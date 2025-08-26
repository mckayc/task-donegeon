

import React, { useState } from 'react';
import { AssetPack, ImportResolution, ShareableAssetType } from '../../../types';
import { Terminology } from '../../types/app';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import DependencyGraph from './DependencyGraph';
import { bugLogger } from '../../utils/bugLogger';

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
    rotations: 'link_manage_rotations',
    modifierDefinitions: 'link_triumphs_trials',
};

const AssetPackInstallDialog: React.FC<AssetPackInstallDialogProps> = ({ assetPack, initialResolutions, onClose, onConfirm }) => {
    const { settings } = useSystemState();
    const [resolutions, setResolutions] = useState(initialResolutions.map(r => ({ ...r, selected: r.status === 'new' })));
    const [activeTab, setActiveTab] = useState('contents');

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename') => {
        setResolutions(prev => prev.map(r => {
            if (r.id === id && r.type === type) {
                return { ...r, resolution, selected: resolution !== 'skip' };
            }
            return r;
        }));
    };
    
    const handleSelectionChange = (id: string, type: ShareableAssetType) => {
        setResolutions(prev => prev.map(r => 
            (r.id === id && r.type === type) ? { ...r, selected: !r.selected } : r
        ));
    };

    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };
    
    const handleToggleGroup = (type: ShareableAssetType, shouldSelect: boolean) => {
        setResolutions(prev => prev.map(r => {
            if (r.type === type) {
                if (r.status === 'conflict' && r.resolution === 'skip' && shouldSelect) {
                    // Don't auto-select skipped conflicts
                    return r;
                }
                return { ...r, selected: shouldSelect };
            }
            return r;
        }));
    };
    
    const handleConfirm = () => {
        if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Confirmed import from asset pack: ${assetPack.manifest.name}` });
        }
        const finalResolutions = resolutions.filter(r => r.selected && r.resolution !== 'skip');
        onConfirm(assetPack, finalResolutions);
    };

    const groupedResolutions = resolutions.reduce((acc, res) => {
        if (!acc[res.type]) acc[res.type] = [];
        acc[res.type].push(res);
        return acc;
    }, {} as Record<ShareableAssetType, (ImportResolution & {selected?: boolean})[]>);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Install Asset Pack</h2>
                    <p className="text-stone-300 mt-1">Review the contents before importing.</p>
                </div>

                <div className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="p-4 bg-stone-900/50 rounded-lg">
                        <h3 className="font-bold text-lg text-stone-100">{assetPack.manifest.name}</h3>
                        <p className="text-sm text-stone-400">by {assetPack.manifest.author}</p>
                        <p className="text-stone-300 mt-2">{assetPack.manifest.description}</p>
                    </div>

                    <div className="border-b border-stone-700">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('contents')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'contents' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                                Contents ({resolutions.filter(r => r.selected).length} selected)
                            </button>
                            <button onClick={() => setActiveTab('dependencies')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dependencies' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                                Dependency Summary
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'contents' && (
                        <div className="space-y-4">
                             {Object.entries(groupedResolutions).map(([type, items]) => {
                                const assetType = type as ShareableAssetType;
                                const totalInGroup = items.length;
                                const selectedInGroup = items.filter(i => i.selected).length;
                                const areAllSelected = totalInGroup > 0 && selectedInGroup === totalInGroup;

                                return (
                                    <div key={type} className="p-4 bg-stone-900/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold capitalize text-stone-200">{settings.terminology[terminologyMap[assetType]] || assetType} ({items.length})</h4>
                                            <label className="flex items-center gap-2 text-xs font-medium text-stone-300 cursor-pointer">
                                                <input type="checkbox" checked={areAllSelected} onChange={(e) => handleToggleGroup(assetType, e.target.checked)} />
                                                Select All
                                            </label>
                                        </div>
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {items.map(res => (
                                                <div key={`${res.type}-${res.id}`} className={`p-3 rounded-md ${res.status === 'conflict' ? 'bg-amber-900/30' : 'bg-stone-800/50'}`}>
                                                    <div className="flex items-start gap-3">
                                                         <input
                                                            type="checkbox"
                                                            checked={!!res.selected}
                                                            onChange={() => handleSelectionChange(res.id, res.type)}
                                                            className="mt-1 h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                                        />
                                                        <p className="font-bold text-stone-200 flex-grow">{res.name}</p>
                                                    </div>
                                                    
                                                    {res.status === 'conflict' && (
                                                        <div className="pl-7 mt-2 space-y-2">
                                                            <p className="text-xs text-amber-300/80">A local item with this name already exists.</p>
                                                            <div className="flex items-center gap-4">
                                                                <label className="flex items-center"><input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'skip'} onChange={() => handleResolutionChange(res.id, res.type, 'skip')} /><span className="ml-2 text-sm">Skip</span></label>
                                                                <label className="flex items-center"><input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'rename'} onChange={() => handleResolutionChange(res.id, res.type, 'rename')} /><span className="ml-2 text-sm">Rename</span></label>
                                                            </div>
                                                            {res.resolution === 'rename' && (
                                                                <Input value={res.newName || `${res.name} (Imported)`} onChange={e => handleRenameChange(res.id, res.type, e.target.value)} className="text-sm" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                             })}
                        </div>
                    )}
                    {activeTab === 'dependencies' && <DependencyGraph pack={assetPack} />}

                </div>

                <div className="p-6 border-t border-stone-700/60">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleConfirm} disabled={resolutions.filter(r => r.selected).length === 0}>
                            Confirm & Import ({resolutions.filter(r => r.selected).length})
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPackInstallDialog;
