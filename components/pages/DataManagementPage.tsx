
import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { ShareableAssetType, Terminology } from '../../types';
import * as Icons from '../ui/Icons';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { generateBlueprint } from '../../utils/sharing';

const DataManagementPage: React.FC = () => {
    const { settings, quests, markets, rewardTypes, ranks, trophies } = useAppState();
    const { deleteSelectedAssets, addNotification } = useAppDispatch();

    const ASSET_TYPES: { key: ShareableAssetType, label: keyof Terminology, data: any[], icon: React.FC }[] = [
        { key: 'quests', label: 'tasks', data: quests, icon: Icons.QuestsIcon },
        { key: 'markets', label: 'stores', data: markets, icon: Icons.MarketplaceIcon },
        { key: 'rewardTypes', label: 'points', data: rewardTypes.filter(rt => !rt.isCore), icon: Icons.RewardsIcon },
        { key: 'ranks', label: 'levels', data: ranks, icon: Icons.RankIcon },
        { key: 'trophies', label: 'awards', data: trophies, icon: Icons.TrophyIcon },
    ];

    const [selectedAssetType, setSelectedAssetType] = useState<ShareableAssetType>('quests');
    const [selection, setSelection] = useState<Record<ShareableAssetType, string[]>>({
        quests: [], markets: [], rewardTypes: [], ranks: [], trophies: []
    });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const activeAsset = useMemo(() => ASSET_TYPES.find(at => at.key === selectedAssetType)!, [selectedAssetType, ASSET_TYPES]);
    const totalSelectedCount = useMemo(() => Object.values(selection).reduce((sum, ids) => sum + ids.length, 0), [selection]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const allIds = activeAsset.data.map(item => item.id);
        setSelection(prev => ({
            ...prev,
            [selectedAssetType]: isChecked ? allIds : [],
        }));
    };

    const handleSelectOne = (id: string) => {
        setSelection(prev => {
            const currentSelection = prev[selectedAssetType];
            const newSelection = currentSelection.includes(id)
                ? currentSelection.filter(itemId => itemId !== id)
                : [...currentSelection, id];
            return { ...prev, [selectedAssetType]: newSelection };
        });
    };

    const handleConfirmDelete = () => {
        deleteSelectedAssets(selection);
        setSelection({ quests: [], markets: [], rewardTypes: [], ranks: [], trophies: [] });
        setConfirmDeleteOpen(false);
    };

    const handleExportSelected = () => {
        const blueprintName = window.prompt("Enter a name for your Blueprint:", "My Custom Export");
        if (blueprintName) {
            generateBlueprint(
                blueprintName,
                `A custom export of selected assets from ${settings.terminology.appName}.`,
                settings.terminology.appName,
                selection,
                { quests, rewardTypes, ranks, trophies, markets, settings }
            );
            addNotification({type: 'success', message: 'Blueprint file generated!'});
        }
    };
    
    const renderTable = () => {
        const currentSelection = selection[selectedAssetType];
        const allSelected = activeAsset.data.length > 0 && currentSelection.length === activeAsset.data.length;

        return (
             <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg flex-grow overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60 bg-stone-900/40">
                            <tr>
                                <th className="p-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                        aria-label="Select all items"
                                    />
                                </th>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Type / Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeAsset.data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-stone-400">
                                        No {settings.terminology[activeAsset.label].toLowerCase()} found.
                                    </td>
                                </tr>
                            ) : (
                                activeAsset.data.map(item => (
                                    <tr key={item.id} className="border-b border-stone-700/40 last:border-b-0 hover:bg-stone-800/40">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={currentSelection.includes(item.id)}
                                                onChange={() => handleSelectOne(item.id)}
                                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                            />
                                        </td>
                                        <td className="p-4 font-bold text-stone-200">{item.title || item.name}</td>
                                        <td className="p-4 text-stone-400">{item.type || item.category || `${item.xpThreshold} XP`}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-4xl font-medieval text-stone-100 mb-8 flex-shrink-0">Asset Manager</h1>
            <div className="flex-grow flex gap-6 overflow-hidden">
                <nav className="w-64 bg-stone-800/50 border border-stone-700/60 rounded-xl p-4 flex-shrink-0 flex flex-col">
                    <h2 className="text-lg font-bold text-stone-300 mb-4 px-2">Asset Types</h2>
                    <div className="space-y-2">
                        {ASSET_TYPES.map(asset => (
                            <button
                                key={asset.key}
                                onClick={() => setSelectedAssetType(asset.key)}
                                className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${selectedAssetType === asset.key ? 'bg-emerald-600/20 text-emerald-300' : 'text-stone-300 hover:bg-stone-700/50'}`}
                            >
                                <asset.icon />
                                <span className="capitalize">{settings.terminology[asset.label]}</span>
                            </button>
                        ))}
                    </div>
                </nav>
                <div className="flex-grow flex flex-col">
                    {renderTable()}
                </div>
            </div>
            {totalSelectedCount > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-auto bg-stone-900 border border-stone-700 rounded-full shadow-2xl flex items-center gap-6 px-6 py-3 z-20 animate-fade-in-up">
                    <span className="font-bold text-stone-200">{totalSelectedCount} item(s) selected</span>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={handleExportSelected} className="py-2 px-5 text-sm">Export Selected</Button>
                        <Button onClick={() => setConfirmDeleteOpen(true)} className="!bg-red-600 hover:!bg-red-500 py-2 px-5 text-sm">Delete Selected</Button>
                    </div>
                </div>
            )}
            <ConfirmDialog
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Selected Assets"
                message={`Are you sure you want to permanently delete the ${totalSelectedCount} selected asset(s)? This action cannot be undone.`}
            />
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DataManagementPage;
