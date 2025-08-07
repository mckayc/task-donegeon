import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { AssetPack, AssetPackManifestInfo, ImportResolution } from '../../../types';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import Input from '../../ui/Input';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import AssetPackInstallDialog from '../../sharing/AssetPackInstallDialog';

const AssetLibraryPage: React.FC = () => {
    const appState = useAppState();
    const { addNotification, importAssetPack } = useAppDispatch();
    const [localPacks, setLocalPacks] = useState<AssetPackManifestInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    
    const [packToInstall, setPackToInstall] = useState<AssetPack | null>(null);
    const [resolutions, setResolutions] = useState<ImportResolution[]>([]);

    useEffect(() => {
        const discoverPacks = async () => {
            try {
                const response = await fetch('/api/asset-packs/discover');
                if (!response.ok) throw new Error('Failed to discover local asset packs.');
                const data = await response.json();
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
    
    const beginInstallProcess = async (packFetcher: () => Promise<AssetPack>) => {
        try {
            setIsLoading(true);
            const packData = await packFetcher();
            const conflictResolutions = analyzeAssetPackForConflicts(packData, appState);
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
        beginInstallProcess(async () => {
            const response = await fetch(`/api/asset-packs/fetch-remote?url=${encodeURIComponent(remoteUrl)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Could not fetch asset pack from URL.`);
            }
            return await response.json();
        });
    };

    const handleConfirmImport = (pack: AssetPack, res: ImportResolution[]) => {
        importAssetPack(pack, res);
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
            <Card title="Install Local Asset Packs">
                <p className="text-sm text-stone-400 mb-4">These packs were found in the <code>/asset_packs</code> folder on your server. Click one to review and install its contents.</p>
                {isLoading ? (
                    <div className="text-center text-stone-400">Loading asset packs...</div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : localPacks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {localPacks.map(packInfo => (
                            <button key={packInfo.filename} onClick={() => handleInstallLocal(packInfo.filename)} className="h-full w-full text-left">
                                <Card className="h-full hover:border-accent transition-colors">
                                    <h4 className="font-bold text-lg text-stone-100 flex items-center gap-2">
                                        {packInfo.manifest.emoji || '📦'} {packInfo.manifest.name}
                                    </h4>
                                    <p className="text-xs text-stone-500">v{packInfo.manifest.version} by {packInfo.manifest.author}</p>
                                    <p className="text-sm text-stone-400 mt-2 flex-grow">{packInfo.manifest.description}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-stone-700/60 grid grid-cols-2 gap-x-4 gap-y-2">
                                        <ul className="space-y-1">
                                          {packInfo.summary.quests.map(q => <SummaryItem key={q.title} icon={q.icon} name={q.title} />)}
                                          {packInfo.summary.gameAssets.map(a => <SummaryItem key={a.name} icon={a.icon} name={a.name} />)}
                                        </ul>
                                        <ul className="space-y-1">
                                          {packInfo.summary.trophies.map(t => <SummaryItem key={t.name} icon={t.icon} name={t.name} />)}
                                          {packInfo.summary.users.map(u => <SummaryItem key={u.gameName} icon={'👤'} name={u.gameName} />)}
                                        </ul>
                                    </div>
                                </Card>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-stone-400 py-4">No local asset packs found.</p>
                )}
            </Card>

            <Card title="Import from URL">
                <p className="text-sm text-stone-400 mb-4">Paste the URL of an Asset Pack `.json` file to import content from the community.</p>
                <div className="flex gap-2">
                    <Input
                        placeholder="https://example.com/my_cool_pack.json"
                        value={remoteUrl}
                        onChange={e => setRemoteUrl(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleInstallRemote} disabled={isLoading}>Import</Button>
                </div>
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