import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Blueprint, IAppData, ImportResolution } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import ToggleSwitch from '../../ui/ToggleSwitch';
import Input from '../../ui/Input';

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

const DataManagementPage: React.FC = () => {
    const appState = useAppState();
    const { settings } = appState;
    const { restoreFromBackup, importBlueprint, addNotification, updateSettings, restoreDefaultObjects, clearAllHistory, resetAllPlayerData, deleteAllCustomContent } = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [blueprintToPreview, setBlueprintToPreview] = useState<Blueprint | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);
    const [backupToDelete, setBackupToDelete] = useState<ServerBackup | null>(null);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    
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
                } else if (parsed.name && parsed.assets) {
                    const conflicts = analyzeBlueprintForConflicts(parsed, appState);
                    setInitialResolutions(conflicts);
                    setBlueprintToPreview(parsed);
                } else {
                    throw new Error("File does not appear to be a valid backup or blueprint.");
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
        const { isAppUnlocked, isFirstRun, notifications, isSwitchingUser, targetedUserForLogin, activePage, activeMarketId, allTags, isDataLoaded, isSidebarCollapsed, syncStatus, syncError, isChatOpen, currentUser } = appState;
        const dataToBackup = { users: appState.users, quests: appState.quests, markets: appState.markets, rewardTypes: appState.rewardTypes, questCompletions: appState.questCompletions, purchaseRequests: appState.purchaseRequests, guilds: appState.guilds, ranks: appState.ranks, trophies: appState.trophies, userTrophies: appState.userTrophies, adminAdjustments: appState.adminAdjustments, gameAssets: appState.gameAssets, systemLogs: appState.systemLogs, settings: appState.settings, themes: appState.themes, loginHistory: appState.loginHistory, chatMessages: appState.chatMessages, systemNotifications: appState.systemNotifications };

        try {
            const response = await fetch('/api/backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToBackup),
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

    const confirm = (title: string, message: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setConfirmAction(() => action); // Use callback form to ensure the correct function is stored
    };
    
    const manualBackups = serverBackups.filter(b => !b.isAuto);
    const autoBackups = serverBackups.filter(b => b.isAuto);

    return (
        <div className="space-y-6">
             <Card title="Database Tools">
                <div className="space-y-4">
                    <p className="text-sm text-stone-400">These tools allow you to manage the core data of your game. Use with caution.</p>
                    <div className="p-4 bg-stone-900/50 rounded-lg">
                        <h4 className="font-bold text-stone-200">Restore Default Objects</h4>
                        <p className="text-xs text-stone-400 mb-3">If you're missing default content from an update, use this to add it back without overwriting your custom creations.</p>
                        <Button variant="secondary" onClick={() => confirm(
                            'Restore Trophies?',
                            'This will add any missing default trophies to your game. It will not affect any custom trophies you have created. Proceed?',
                            () => restoreDefaultObjects('trophies')
                        )}>Restore Missing Default Trophies</Button>
                    </div>
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
                <p className="text-stone-400 text-sm mb-4">Select a Blueprint or full backup `.json` file. The app will automatically detect which it is and guide you through the next steps.</p>
                <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json,application/json" className="hidden" />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Select File</Button>
                    <p className="text-xs text-amber-400 font-semibold mt-4">Restoring from a full backup will overwrite all current data.</p>
                </div>
            </Card>

             <Card title="Danger Zone">
                <div className="space-y-4">
                    <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-red-300">Clear All History</h4>
                            <p className="text-sm text-red-200/80 mt-1">Permanently deletes all quest completions, purchase logs, and other historical data.</p>
                        </div>
                        <Button className="!bg-red-600 hover:!bg-red-500" onClick={() => confirm('Clear History?', 'This will permanently delete all historical data like quest completions and logs. Are you sure?', clearAllHistory)}>Clear</Button>
                    </div>
                     <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-red-300">Reset All Player Data</h4>
                            <p className="text-sm text-red-200/80 mt-1">Resets all user balances, owned items, and awarded trophies to zero. User accounts will remain.</p>
                        </div>
                        <Button className="!bg-red-600 hover:!bg-red-500" onClick={() => confirm('Reset Player Data?', 'This will reset all player progress (balances, items, trophies) to zero for all users. Are you sure?', resetAllPlayerData)}>Reset</Button>
                    </div>
                     <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-red-300">Delete All Custom Content</h4>
                            <p className="text-sm text-red-200/80 mt-1">Deletes all custom quests, items, markets, trophies, and rewards. Core/default objects will remain.</p>
                        </div>
                        <Button className="!bg-red-600 hover:!bg-red-500" onClick={() => confirm('Delete Custom Content?', 'This will permanently delete ALL quests, items, markets, and other content you have created. Are you absolutely sure?', deleteAllCustomContent)}>Delete</Button>
                    </div>
                </div>
            </Card>

            {blueprintToPreview && (
                <BlueprintPreviewDialog blueprint={blueprintToPreview} initialResolutions={initialResolutions} onClose={() => setBlueprintToPreview(null)} onConfirm={importBlueprint} />
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
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => { if (confirmAction) confirmAction(); setConfirmAction(null); }}
                title={confirmTitle}
                message={confirmMessage}
            />
        </div>
    );
};

export default DataManagementPage;