import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { AssetPack, AssetPackManifestInfo, ImportResolution } from '../../../types';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import Input from '../../ui/Input';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';

const AssetPacksPage: React.FC = () => {
    const appState = useAppState();
    const { addNotification, importAssetPack } = useAppDispatch();
    const [localPacks, setLocalPacks] = useState<AssetPackManifestInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    
    const [packToPreview, setPackToPreview] = useState<AssetPack | null>(null);
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
    
    const handleInstallLocal = async (filename: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/asset-packs/get/${encodeURIComponent(filename)}`);
            if (!response.ok) throw new Error(`Could not fetch asset pack: ${filename}`);
            const packData: AssetPack = await response.json();
            
            const conflictResolutions = analyzeAssetPackForConflicts(packData, appState);
            setResolutions(conflictResolutions);
            setPackToPreview(packData);

        } catch(e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            addNotification({type: 'error', message: `Failed to install pack: ${msg}`});
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInstallRemote = async () => {
        if (!remoteUrl.trim() || !remoteUrl.trim().endsWith('.json')) {
            addNotification({type: 'error', message: 'Please enter a valid URL to a .json file.'});
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetch(`/api/asset-packs/fetch-remote?url=${encodeURIComponent(remoteUrl)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Could not fetch asset pack from URL.`);
            }
            const packData: AssetPack = await response.json();

            const conflictResolutions = analyzeAssetPackForConflicts(packData, appState);
            setResolutions(conflictResolutions);
            setPackToPreview(packData);
        } catch(e) {
             const msg = e instanceof Error ? e.message : 'Unknown error';
            addNotification({type: 'error', message: `Failed to install remote pack: ${msg}`});
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = (pack: AssetPack, res: ImportResolution[]) => {
        importAssetPack(pack, res);
        setPackToPreview(null);
        setResolutions([]);
    };

    return (
        <div className="space-y-6">
            <Card title="Install Local Asset Packs">
                <p className="text-sm text-stone-400 mb-4">These packs were found in the <code>/asset_packs</code> folder on your server. Click one to review and install its contents.</p>
                {isLoading ? (
                    <div className="text-center text-stone-400">Loading asset packs...</div>
                ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                ) : localPacks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {localPacks.map(packInfo => (
                            <Card key={packInfo.filename} className="h-full">
                                <h4 className="font-bold text-lg text-stone-100 flex items-center gap-2">
                                    {packInfo.manifest.emoji || '📦'} {packInfo.manifest.name}
                                </h4>
                                <p className="text-xs text-stone-500">v{packInfo.manifest.version} by {packInfo.manifest.author}</p>
                                <p className="text-sm text-stone-400 mt-2 flex-grow">{packInfo.manifest.description}</p>
                                <div className="mt-4 text-right">
                                    <Button size="sm" onClick={() => handleInstallLocal(packInfo.filename)}>Install</Button>
                                </div>
                            </Card>
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

            {packToPreview && (
                <BlueprintPreviewDialog
                    blueprint={packToPreview}
                    initialResolutions={resolutions}
                    onClose={() => setPackToPreview(null)}
                    onConfirm={handleConfirmImport}
                />
            )}
        </div>
    );
};

export default AssetPacksPage;