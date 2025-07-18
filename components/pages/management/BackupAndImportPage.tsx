
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGameDataState, useAppDispatch, useAuthState, useSettingsState, useUIState } from '../../../context/AppContext';
import { Blueprint, IAppData, ImportResolution } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface LocalBackup {
    id: string;
    timestamp: Date;
    name: string;
    size: number;
    data: IAppData;
    isAuto?: boolean;
}

const BackupAndImportPage: React.FC = () => {
    const gameDataState = useGameDataState();
    const authState = useAuthState();
    const settingsState = useSettingsState();
    const uiState = useUIState();
    const { restoreFromBackup, importBlueprint, addNotification } = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [localBackups, setLocalBackups] = useState<LocalBackup[]>([]);
    const [blueprintToPreview, setBlueprintToPreview] = useState<Blueprint | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);
    const [backupToDelete, setBackupToDelete] = useState<LocalBackup | null>(null);

    const fullAppState: IAppData = useMemo(() => ({
        users: authState.users,
        loginHistory: authState.loginHistory,
        quests: gameDataState.quests,
        markets: gameDataState.markets,
        rewardTypes: gameDataState.rewardTypes,
        questCompletions: gameDataState.questCompletions,
        purchaseRequests: gameDataState.purchaseRequests,
        guilds: gameDataState.guilds,
        ranks: gameDataState.ranks,
        trophies: gameDataState.trophies,
        userTrophies: gameDataState.userTrophies,
        adminAdjustments: gameDataState.adminAdjustments,
        gameAssets: gameDataState.gameAssets,
        systemLogs: gameDataState.systemLogs,
        themes: gameDataState.themes,
        settings: settingsState.settings,
        chatMessages: uiState.chatMessages,
    }), [authState, gameDataState, settingsState, uiState]);

    useEffect(() => {
        try {
            const savedBackupsRaw = localStorage.getItem('localBackups');
            if (savedBackupsRaw) {
                const parsed = JSON.parse(savedBackupsRaw).map((b: any) => ({...b, timestamp: new Date(b.timestamp)}));
                setLocalBackups(parsed);
            }
        } catch (e) {
            console.error("Failed to load local backups:", e);
        }
    }, []);

    const saveBackupsToLocal = (backups: LocalBackup[]) => {
        try {
            localStorage.setItem('localBackups', JSON.stringify(backups));
        } catch (e) {
            console.error("Failed to save local backups:", e);
            addNotification({type: 'error', message: 'Could not save backups to local storage.'});
        }
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
                    const conflicts = analyzeBlueprintForConflicts(parsed, fullAppState);
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
    
    const handleGenerateBackup = () => {
        const dataStr = JSON.stringify(fullAppState, null, 2);
        const size = new Blob([dataStr]).size;

        const newBackup: LocalBackup = {
            id: `backup-${Date.now()}`,
            timestamp: new Date(),
            name: `donegeon_backup_${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.json`,
            data: fullAppState,
            size: size,
        };

        const updatedBackups = [newBackup, ...localBackups];
        setLocalBackups(updatedBackups);
        saveBackupsToLocal(updatedBackups);
        addNotification({type: 'success', message: 'Local backup generated!'});
    };

    const handleDownloadBackup = (backup: LocalBackup) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", backup.name);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
    
    const handleDeleteBackup = () => {
        if (backupToDelete) {
            const updatedBackups = localBackups.filter(b => b.id !== backupToDelete.id);
            setLocalBackups(updatedBackups);
            saveBackupsToLocal(updatedBackups);
            setBackupToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card title="Local Backups">
                <p className="text-stone-400 text-sm mb-4">Generate backups of your entire game state. They will be listed here for you to download or delete. These backups are stored in your browser's local storage.</p>
                <div className="text-right mb-4">
                    <Button onClick={handleGenerateBackup}>Generate New Backup</Button>
                </div>
                {localBackups.length > 0 ? (
                    <div className="space-y-2 border-t border-stone-700 pt-4">
                        {localBackups.map(backup => (
                            <div key={backup.id} className="flex justify-between items-center p-3 bg-stone-900/50 rounded-md">
                                <div>
                                    <p className="font-semibold text-stone-200">{backup.name}</p>
                                    <p className="text-xs text-stone-400">
                                        {backup.timestamp.toLocaleString()} ({formatBytes(backup.size)})
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleDownloadBackup(backup)}>Download</Button>
                                    <Button className="!bg-red-600 hover:!bg-red-500 text-sm py-1 px-3" onClick={() => setBackupToDelete(backup)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-stone-400 py-4">No local backups generated yet.</p>}
            </Card>

            <Card title="Import / Restore from File">
                <p className="text-stone-400 text-sm mb-4">Select a Blueprint or full backup `.json` file. The app will automatically detect which it is and guide you through the next steps.</p>
                <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".json,application/json"
                        className="hidden"
                    />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Select File</Button>
                    <p className="text-xs text-amber-400 font-semibold mt-4">Restoring from a full backup will overwrite all current data.</p>
                </div>
            </Card>

            {blueprintToPreview && (
                <BlueprintPreviewDialog
                    blueprint={blueprintToPreview}
                    initialResolutions={initialResolutions}
                    onClose={() => setBlueprintToPreview(null)}
                    onConfirm={importBlueprint}
                />
            )}
            
            <ConfirmDialog
                isOpen={!!fileToRestore}
                onClose={() => setFileToRestore(null)}
                onConfirm={() => {
                    if (fileToRestore) restoreFromBackup(fileToRestore);
                    setFileToRestore(null);
                }}
                title="Confirm Full Restore"
                message="Are you sure you want to restore from this backup file? All current game data will be permanently overwritten. This action cannot be undone."
            />
            
            <ConfirmDialog
                isOpen={!!backupToDelete}
                onClose={() => setBackupToDelete(null)}
                onConfirm={handleDeleteBackup}
                title="Delete Local Backup"
                message={`Are you sure you want to delete the backup file "${backupToDelete?.name}"? This only removes it from this list, not from your computer if you have downloaded it.`}
            />
        </div>
    );
};

export default BackupAndImportPage;
