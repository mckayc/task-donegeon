

import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { AssetPack, AssetPackManifestInfo, IAppData, ImportResolution, Quest } from '../../../types';
import { useSystemDispatch, useSystemState } from '../../../context/SystemContext';
import Input from '../../user-interface/Input';
import { analyzeAssetPackForConflicts } from '../../sharing/utils/sharing';
import AssetPackInstallDialog from '../../sharing/AssetPackInstallDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { useAuthState } from '../../../context/AuthContext';
import { bugLogger } from '../../../utils/bugLogger';
import { useDebounce } from '../../../hooks/useDebounce';
import { useQuestsState } from '../../../context/QuestsContext';
import { useEconomyState } from '../../../context/EconomyContext';
import { useProgressionState } from '../../../context/ProgressionContext';
import { useCommunityState } from '../../../context/CommunityContext';

const AssetLibraryPage: React.FC = () => {
    const systemState = useSystemState();
    const economyState = useEconomyState();
    const progressionState = useProgressionState();
    const communityState = useCommunityState();
    const authState = useAuthState();
    const questState = useQuestsState();
    const { importAssetPack } = useSystemDispatch();
    const { addNotification } = useNotificationsDispatch();
    const [localPacks, setLocalPacks] = useState<AssetPackManifestInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    
    const [packToInstall, setPackToInstall] = useState<AssetPack | null>(null);
    const [resolutions, setResolutions] = useState<ImportResolution[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const discoverPacks = async () => {
            try {
                const response = await fetch('/api/asset-packs/discover');
                if (!response.ok) throw new Error('Failed to discover local asset packs.');
                const data: AssetPackManifestInfo[] = await response.json();
                setLocalPacks(data);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                setError(msg);
                addNotification({type: 'error', message: msg});
            } finally {
                setIsLoading(false);
            }
        };
        discoverPacks();
    }, [addNotification]);
    
    const categories = useMemo(() => {
        const cats = new Set(localPacks.map(p => p.manifest.category).filter((c): c is string => !!c));
        return ['All', ...Array.from(cats).sort()];
    }, [localPacks]);
    
    const filteredPacks = useMemo(() => {
        let packs = [...localPacks];

        if (selectedCategory !== 'All') {
            packs = packs.filter(p => p.manifest.category === selectedCategory);
        }

        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            packs = packs.filter(p => 
                p.manifest.name.toLowerCase().includes(lowercasedTerm) ||
                p.manifest.description.toLowerCase().includes(lowercasedTerm) ||
                p.manifest.author.toLowerCase().includes(lowercasedTerm)
            );
        }

        return packs;
    }, [localPacks, debouncedSearchTerm, selectedCategory]);

    const categorizedPacks = useMemo(() => {
        return filteredPacks.reduce((acc, pack) => {
            const category = pack.manifest.category || 'Miscellaneous';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(pack);
            return acc;
        }, {} as Record<string, AssetPackManifestInfo[]>);
    }, [filteredPacks]);

    const beginInstallProcess = async (packFetcher: () => Promise<AssetPack>) => {
        try {
            setIsLoading(true);
            const packData = await packFetcher();
            const fullCurrentData: IAppData = { ...systemState, ...questState, ...authState, ...economyState, ...progressionState, ...communityState } as IAppData;
            const conflictResolutions = analyzeAssetPackForConflicts(packData, fullCurrentData);
            setResolutions(conflictResolutions);
            setPackToInstall(packData);
        } catch(e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            addNotification({type: 'error', message: `Failed to start installation: ${msg}`});
        } finally {
            setIsLoading(false);
        }
    };

    const handleInstallLocal = (filename: string) => {
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Clicked to install local asset pack: ${filename}` });
        }
        beginInstallProcess(async () => {
            const response = await fetch(`/api/asset-packs/get/${encodeURIComponent(filename)}`);
            if (!response.ok) throw new Error(`Could not fetch asset pack: ${filename}`);
            return await response.json();
        });
    };
    
    const handleInstallRemote = () => {
        if (!remoteUrl.trim() || !remoteUrl.trim().endsWith('.json')) {
            addNotification({type: 'error', message: 'Please enter a valid URL to a .json file.'});
            return;
        }
        if (bugLogger.isRecording()) {
            bugLogger.add({ type: 'ACTION', message: `Clicked to install remote asset pack from URL: ${remoteUrl}` });
        }
        beginInstallProcess(async () => {
            const response = await fetch(`/api/asset-packs/fetch-remote?url=${encodeURIComponent(remoteUrl)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Could not fetch asset pack from URL.`);
            }
            return await response.json();
        });
    };

    const handleConfirmImport = async (pack: AssetPack, res: ImportResolution[]) => {
        await importAssetPack(pack, res);
        setPackToInstall(null);
        setResolutions([]);
    };
    
    const SummaryItem: React.FC<{ icon: string | undefined, name: string }> = ({ icon, name }) => (
      <li className="flex items-center gap-2 text-sm text-stone-300">
        <span className="text-lg">{icon || '▫️'}</span>
        <span className="truncate" title={name}>{name}</span>
      </li>
    );

    return (
        <div className="space-y-6">
            <Card title="Asset Pack Library">
                 <div className="flex flex-wrap gap-2 mb-6 items-end p-2 bg-stone-900/40 rounded-lg">
                    <Input 
                        placeholder="Search packs..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto sm:flex-grow"
                    />
                    <Input 
                        as="select"
                        value={selectedCategory}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                        className="w-full sm:w-auto"
                        aria-label="Filter by category"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Input>
                    <div className="border-l border-stone-600 h-10 mx-2 hidden sm:block"></div>
                    <div className="flex gap-2 w-full sm:w-auto sm:flex-grow">
                        <Input
                            placeholder="Import from URL..."
                            value={remoteUrl}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteUrl(e.target.value)}
                            className="flex-grow"
                        />
                        <Button onClick={handleInstallRemote} disabled={isLoading || !remoteUrl.trim()}>Import</Button>
                    </div>
                </div>
                <p className="text-sm text-stone-400 mb-4 -mt-2">These packs were found in the <code>/asset_packs</code> folder on your server. Click one to review and install its contents.</p>
                {isLoading ? (
                    <div className="text-center text-stone-400">Loading asset packs...</div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : localPacks.length > 0 ? (
                    filteredPacks.length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(categorizedPacks).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, packs]) => (
                                <div key={category}>
                                    <h3 className="text-2xl font-medieval text-accent mb-3">{category}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {packs.map(packInfo => (
                                            <button key={packInfo.filename} onClick={() => handleInstallLocal(packInfo.filename)} className="h-full w-full text-left">
                                                <Card className="h-full hover:border-accent transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-lg text-stone-100 flex items-center gap-2">
                                                            {packInfo.manifest.emoji || '📦'} {packInfo.manifest.name}
                                                        </h4>
                                                        {packInfo.manifest.category && (
                                                            <span className="text-xs font-bold text-purple-300 bg-purple-900/50 px-2 py-1 rounded-full">{packInfo.manifest.category}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-stone-500">v{packInfo.manifest.version} by {packInfo.manifest.author}</p>
                                                    <p className="text-sm text-stone-400 mt-2 flex-grow">{packInfo.manifest.description}</p>
                                                    
                                                    <div className="mt-4 pt-4 border-t border-stone-700/60 grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <ul className="space-y-1">
                                                          {Array.isArray(packInfo.summary.quests) && (packInfo.summary.quests as any[]).map(q => <SummaryItem key={q.title} icon={q.icon} name={q.title} />)}
                                                          {Array.isArray(packInfo.summary.gameAssets) && (packInfo.summary.gameAssets as any[]).map(a => <SummaryItem key={a.name} icon={a.icon} name={a.name} />)}
                                                        </ul>
                                                        <ul className="space-y-1">
                                                          {Array.isArray(packInfo.summary.trophies) && (packInfo.summary.trophies as any[]).map(t => <SummaryItem key={t.name} icon={t.icon} name={t.name} />)}
                                                          {Array.isArray(packInfo.summary.users) && (packInfo.summary.users as any[]).map(u => <SummaryItem key={u.gameName} icon={'👤'} name={u.gameName} />)}
                                                        </ul>
                                                    </div>
                                                </Card>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-stone-400 py-4">No asset packs match your search criteria.</p>
                    )
                ) : (
                    <p className="text-center text-stone-400 py-4">No local asset packs found.</p>
                )}
            </Card>

            {packToInstall && (
                <AssetPackInstallDialog
                    assetPack={packToInstall}
                    initialResolutions={resolutions}
                    onClose={() => setPackToInstall(null)}
                    onConfirm={handleConfirmImport}
                />
            )}
        </div>
    );
};

export default AssetLibraryPage;