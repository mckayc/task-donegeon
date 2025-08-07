import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { AssetPack, IAppData, ImportResolution } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Input from '../../ui/Input';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { useAuthState } from '../../../context/AuthContext';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface ServerBackup {
    filename: string;
    createdAt: string;
    size: number;
    isAuto: boolean;
}

const BackupAndImportPage: React.FC = () => {
    const appState = useAppState();
    const authState = useAuthState();
    const { restoreFromBackup, importAssetPack, updateSettings } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assetPackToPreview, setAssetPackToPreview] = useState<AssetPack | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);
    const [backupToDelete, setBackupToDelete] = useState<ServerBackup | null>(null);
    
    const [autoBackupSettings, setAutoBackupSettings] = useState(appState.settings.automatedBackups);

    const fetchBackups = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/backups');
            if (response.ok) {
                const data = await response.json();
                setServerBackups(data);
            } else {
                throw new Error('Failed to fetch backup list.');
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            addNotification({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);
    
    const handleSaveAutoBackupSettings = () => {
        updateSettings({ automatedBackups: autoBackupSettings });
        addNotification({ type: 'success', message: 'Automated backup settings saved.' });
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                if (parsed.users && parsed.settings) {
                    setFileToRestore(parsed);
                } else if (parsed.manifest && parsed.assets) {
                    const fullCurrentData: IAppData = { ...appState, users: authState.users, loginHistory: authState.loginHistory };
                    const conflicts = analyzeAssetPackForConflicts(parsed, fullCurrentData);
                    setInitialResolutions(conflicts);
                    setAssetPackToPreview(parsed);
                } else {
                    throw new Error("File does not appear to be a valid backup or asset pack.");
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                const message = error instanceof Error ? error.message : 'Unknown error';
                addNotification({ type: 'error', message: `Failed to read file: ${message}` });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    const handleGenerateBackup = async () => {
        addNotification({ type: 'info', message: 'Generating manual backup...' });
        try {
            const response = await fetch('/api/backups', {
                method: 'POST',
            });
            if (response.ok) {
                addNotification({type: 'success', message: 'Manual backup generated successfully!'});
                fetchBackups();
            } else {
                throw new Error('Server failed to create backup.');
            }
        } catch(e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            addNotification({type: 'error', message: `Backup failed: ${message}`});
        }
    };

    const handleDeleteBackup = async () => {
        if (backupToDelete) {
            try {
                const response = await fetch(`/api/backups/${encodeURIComponent(backupToDelete.filename)}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    addNotification({type: 'success', message: `Deleted backup: ${backupToDelete.filename}`});
                    fetchBackups();
                } else {
                    throw new Error('Server failed to delete backup.');
                }
            } catch(e) {
                 const message = e instanceof Error ? e.message : 'Unknown error';
                 addNotification({type: 'error', message: `Delete failed: ${message}`});
            } finally {
                setBackupToDelete(null);
            }
        }
    };

    const handleConfirmImport = (pack: AssetPack, res: ImportResolution[]) => {
        importAssetPack(pack, res);
        setAssetPackToPreview(null);
        setInitialResolutions([]);
    };
    
    const manualBackups = serverBackups.filter(b => !b.isAuto);
    const autoBackups = serverBackups.filter(b => b.isAuto);

    return (
        <div className="space-y-6">
            <Card title="How Backups Work & Best Practices">
                 <div className="prose prose-invert max-w-none text-stone-300 text-sm space-y-3">
                    <p><strong>Important:</strong> Backups are now stored on the server in the directory specified in your Docker configuration. This provides a durable and persistent way to manage your data.</p>
                    <ul className="list-disc list-inside">
                        <li>This system is designed for self-hosted Docker environments where you can map a volume to the backup directory.</li>
                        <li>Automated backups provide a convenient safety net for recent changes.</li>
                        <li>For true safekeeping, it's still recommended to regularly download important manual backups to your local computer.</li>
                        <li>Before any major data change, like restoring a backup or importing a large asset pack, always create and download a fresh manual backup.</li>
                    </ul>
                </div>
            </Card>

            <Card title="Automated Backup Settings">
                <p className="text-sm text-stone-400 mb-4">These settings control the automated backup process running on the server.</p>
                <div className="space-y-4">
                    <ToggleSwitch 
                        enabled={autoBackupSettings.enabled}
                        setEnabled={(val) => setAutoBackupSettings(p => ({...p, enabled: val}))}
                        label="Enable Automated Backups"
                    />
                    {autoBackupSettings.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-700/60">
                             <Input 
                                label="Backup Frequency (in hours)"
                                type="number"
                                min="1"
                                value={autoBackupSettings.frequencyHours}
                                onChange={(e) => setAutoBackupSettings(p => ({...p, frequencyHours: parseInt(e.target.value) || 24}))}
                             />
                             <Input 
                                label="Max Backups to Keep"
                                type="number"
                                min="1"
                                value={autoBackupSettings.maxBackups}
                                onChange={(e) => setAutoBackupSettings(p => ({...p, maxBackups: parseInt(e.target.value) || 7}))}
                             />
                        </div>
                    )}
                </div>
                 <div className="text-right mt-4">
                    <Button onClick={handleSaveAutoBackupSettings}>Save Settings</Button>
                </div>
            </Card>

            <Card title="Server Backups">
                <div className="text-right mb-4">
                    <Button onClick={handleGenerateBackup}>Generate New Manual Backup</Button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-stone-200 mb-2">Manual Backups</h4>
                        {isLoading ? <p>Loading...</p> : manualBackups.length > 0 ? (
                            <div className="space-y-2">
                                {manualBackups.map(backup => (
                                    <div key={backup.filename} className="flex justify-between items-center p-3 bg-stone-900/50 rounded-md">
                                        <div>
                                            <p className="font-semibold text-stone-200">{backup.filename}</p>
                                            <p className="text-xs text-stone-400">{new Date(backup.createdAt).toLocaleString()} ({formatBytes(backup.size)})</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={`/api/backups/${encodeURIComponent(backup.filename)}`} download>
                                                <Button variant="secondary" className="text-sm py-1 px-3">Download</Button>
                                            </a>
                                            <Button className="!bg-red-600 hover:!bg-red-500 text-sm py-1 px-3" onClick={() => setBackupToDelete(backup)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-stone-400 py-4 text-sm">No manual backups found on the server.</p>}
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-stone-200 mb-2">Automated Backups</h4>
                        {isLoading ? <p>Loading...</p> : autoBackups.length > 0 ? (
                            <div className="space-y-2">
                                {autoBackups.map(backup => (
                                    <div key={backup.filename} className="flex justify-between items-center p-3 bg-stone-900/50 rounded-md">
                                        <div>
                                            <p className="font-semibold text-stone-200">{backup.filename}</p>
                                            <p className="text-xs text-stone-400">{new Date(backup.createdAt).toLocaleString()} ({formatBytes(backup.size)})</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={`/api/backups/${encodeURIComponent(backup.filename)}`} download>
                                                <Button variant="secondary" className="text-sm py-1 px-3">Download</Button>
                                            </a>
                                            <Button className="!bg-red-600 hover:!bg-red-500 text-sm py-1 px-3" onClick={() => setBackupToDelete(backup)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center text-stone-400 py-4 text-sm">No automated backups found on the server.</p>}
                    </div>
                </div>
            </Card>

            <Card title="Import / Restore from File">
                <p className="text-stone-400 text-sm mb-4">Select an Asset Pack or full backup `.json` file. The app will automatically detect which it is and guide you through the next steps.</p>
                <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json,application/json" className="hidden" />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Select File</Button>
                    <p className="text-xs text-amber-400 font-semibold mt-4">Restoring from a full backup will overwrite all current data.</p>
                </div>
            </Card>

            {assetPackToPreview && (
                <BlueprintPreviewDialog blueprint={assetPackToPreview} initialResolutions={initialResolutions} onClose={() => setAssetPackToPreview(null)} onConfirm={handleConfirmImport} />
            )}
            <ConfirmDialog
                isOpen={!!fileToRestore}
                onClose={() => setFileToRestore(null)}
                onConfirm={() => { if (fileToRestore) restoreFromBackup(fileToRestore); setFileToRestore(null); }}
                title="Confirm Full Restore"
                message="Are you sure you want to restore from this backup file? All current game data will be permanently overwritten. This action cannot be undone."
            />
            <ConfirmDialog
                isOpen={!!backupToDelete}
                onClose={() => setBackupToDelete(null)}
                onConfirm={handleDeleteBackup}
                title="Delete Server Backup"
                message={`Are you sure you want to delete the backup file "${backupToDelete?.filename}" from the server? This action is permanent.`}
            />
        </div>
    );
};

export default BackupAndImportPage;