import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, Blueprint, ImportResolution, AutomatedBackupProfile, AutomatedBackups } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import Input from '../../ui/Input';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface ServerBackup {
    filename: string;
    createdAt: string;
    size: number;
    isAuto: boolean;
}

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint, restoreDefaultObjects, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, updateSettings, addNotification } = useAppDispatch();
    const appState = useAppState();
    const { settings } = appState;
    
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [blueprintToImport, setBlueprintToImport] = useState<Blueprint | null>(null);
    const [importResolutions, setImportResolutions] = useState<ImportResolution[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: string, title: string, message: string, data?: any } | null>(null);
    
    const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [automatedBackupsForm, setAutomatedBackupsForm] = useState<AutomatedBackups>(() => JSON.parse(JSON.stringify(settings.automatedBackups)));

    const fetchServerBackups = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/backups');
            if (response.ok) {
                const data = await response.json();
                setServerBackups(data);
            } else {
                addNotification({ type: 'error', message: 'Failed to fetch server backups.' });
            }
        } catch (e) {
            addNotification({ type: 'error', message: 'Error connecting to server for backups.' });
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        fetchServerBackups();
    }, [fetchServerBackups]);

    const handleBackupProfileChange = (index: number, field: keyof AutomatedBackupProfile, value: string | boolean | number) => {
        setAutomatedBackupsForm(prev => {
            const newProfiles = [...prev.profiles] as [AutomatedBackupProfile, AutomatedBackupProfile, AutomatedBackupProfile];
            newProfiles[index] = { ...newProfiles[index], [field]: value };
            return { ...prev, profiles: newProfiles };
        });
    };

    const handleSaveAutomatedBackups = () => {
        updateSettings({ automatedBackups: automatedBackupsForm });
        addNotification({ type: 'success', message: 'Automated backup settings saved.' });
    };


    const handleRestoreFileSelect = (file: File) => {
        setFileToRestore(file);
        setConfirmation({
            action: 'restore-local',
            title: 'Confirm Restore from Local Backup',
            message: 'Are you sure you want to restore from this local backup file? This will overwrite ALL current data in the application.'
        });
    };
    
    const handleBlueprintFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const blueprint = JSON.parse(content) as Blueprint;
                if (blueprint.name && blueprint.assets) {
                    const resolutions = analyzeBlueprintForConflicts(blueprint, appState);
                    setBlueprintToImport(blueprint);
                    setImportResolutions(resolutions);
                } else {
                   addNotification({type: 'error', message: 'Invalid blueprint file format.'});
                }
            } catch (err) {
                 addNotification({type: 'error', message: `Failed to read or parse blueprint file: ${err instanceof Error ? err.message : 'Unknown error'}`});
            }
        };
        reader.readAsText(file);
    };
    
    const handleConfirmImport = (blueprint: Blueprint, resolutions: ImportResolution[]) => {
        importBlueprint(blueprint, resolutions);
        setBlueprintToImport(null);
    };

    const handleActionConfirm = async () => {
        if (!confirmation) return;
        switch (confirmation.action) {
            case 'restore-local':
                if (fileToRestore) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const content = e.target?.result as string;
                            const data = JSON.parse(content) as IAppData;
                            restoreFromBackup(data);
                        } catch (err) {
                            addNotification({type: 'error', message: `Failed to parse backup file: ${err instanceof Error ? err.message : 'Unknown error'}`});
                        }
                    };
                    reader.readAsText(fileToRestore);
                    setFileToRestore(null);
                }
                break;
            case 'restore-server':
                try {
                    const res = await fetch(`/api/backups/restore/${confirmation.data.filename}`, { method: 'POST' });
                    const data = await res.json();
                    if (res.ok) {
                        addNotification({ type: 'success', message: data.message });
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        throw new Error(data.error);
                    }
                } catch(e) {
                    addNotification({ type: 'error', message: `Restore failed: ${e instanceof Error ? e.message : 'Unknown'}` });
                }
                break;
            case 'delete-server-backup':
                 try {
                    const res = await fetch(`/api/backups/${confirmation.data.filename}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) {
                        addNotification({ type: 'success', message: data.message });
                        fetchServerBackups();
                    } else {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    addNotification({ type: 'error', message: `Delete failed: ${e instanceof Error ? e.message : 'Unknown'}` });
                }
                break;
            case 'restore-defaults': restoreDefaultObjects('trophies'); break;
            case 'clear-history': clearAllHistory(); break;
            case 'reset-players': resetAllPlayerData(); break;
            case 'factory-reset': deleteAllCustomContent(); break;
        }
        setConfirmation(null);
    };
    
    const handleCreateServerBackup = async () => {
        addNotification({ type: 'info', message: 'Creating server-side backup...' });
        try {
            const response = await fetch('/api/backups/create', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                addNotification({ type: 'success', message: data.message });
                fetchServerBackups(); // Refresh the list
            } else {
                throw new Error(data.error || 'Failed to create backup.');
            }
        } catch (err) {
            addNotification({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
        }
    }
    
    return (
        <div className="space-y-6">
            <Card title="Backup & Restore">
                 <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-stone-200">Manual Server Backup</h4>
                        <p className="text-sm text-stone-400 mb-3">Create a secure backup of your entire game state directly on the server. This is the recommended method for reliability.</p>
                        <Button onClick={handleCreateServerBackup}>Create Manual Backup</Button>
                    </div>
                    <div>
                        <h4 className="font-semibold text-stone-200">Restore from Local File</h4>
                        <p className="text-sm text-stone-400 mb-3">Restore your game from a `.json` backup file on your computer. <strong className="text-amber-400">This will overwrite all current data.</strong></p>
                        <input type="file" id="restore-file-input" className="hidden" accept=".json" onChange={e => e.target.files && handleRestoreFileSelect(e.target.files[0])} />
                        <Button onClick={() => document.getElementById('restore-file-input')?.click()} className="!bg-amber-600 hover:!bg-amber-500">Select Local Backup</Button>
                    </div>
                </div>
            </Card>

            <Card title="Manage Server Backups">
                {isLoading ? (
                    <p className="text-stone-400">Loading backups...</p>
                ) : serverBackups.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {serverBackups.map(backup => (
                            <div key={backup.filename} className="bg-stone-900/40 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-stone-200">{backup.filename}</p>
                                    <p className="text-xs text-stone-400">
                                        {new Date(backup.createdAt).toLocaleString()} - {(backup.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <a href={`/api/backups/${backup.filename}`} download><Button variant="secondary" size="sm">Download</Button></a>
                                    <Button variant="secondary" size="sm" onClick={() => setConfirmation({action: 'restore-server', title: 'Confirm Restore', message: `This will overwrite all current data with the contents of ${backup.filename}.`, data: backup })}>Restore</Button>
                                    <Button variant="secondary" size="sm" className="!bg-red-900/50 hover:!bg-red-800/60" onClick={() => setConfirmation({action: 'delete-server-backup', title: 'Confirm Delete', message: `Are you sure you want to permanently delete ${backup.filename}?`, data: backup })}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-4">No server-side backups found. Click "Create Manual Backup" to make one.</p>
                )}
            </Card>

            <Card title="Automated Server Backups">
                <p className="text-sm text-stone-400 mb-4">Configure automatic backups to the server's file system. This is highly recommended for Docker/self-hosted instances.</p>
                <div className="space-y-4">
                    {automatedBackupsForm.profiles.map((profile, index) => (
                        <div key={index} className="p-4 bg-stone-900/40 rounded-lg border border-stone-700/60">
                             <ToggleSwitch
                                enabled={profile.enabled}
                                setEnabled={(val) => handleBackupProfileChange(index, 'enabled', val)}
                                label={`Profile ${index + 1}: Enabled`}
                            />
                            <div className={`grid grid-cols-2 gap-4 mt-4 ${!profile.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Input
                                    as="select"
                                    label="Frequency"
                                    value={profile.frequency}
                                    onChange={e => handleBackupProfileChange(index, 'frequency', e.target.value)}
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Input>
                                <Input
                                    label="Keep (number of backups)"
                                    type="number"
                                    min="1"
                                    value={profile.keep}
                                    onChange={e => handleBackupProfileChange(index, 'keep', parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-right mt-6">
                    <Button onClick={handleSaveAutomatedBackups}>Save Automated Backup Settings</Button>
                </div>
            </Card>

            <Card title="Import Content">
                 <div>
                    <h4 className="font-semibold text-stone-200">Import Blueprint</h4>
                    <p className="text-sm text-stone-400 mb-3">Load a Blueprint `.json` file to add new content (quests, items, etc.) to your game. This will not overwrite existing data.</p>
                    <input type="file" id="import-file-input" className="hidden" accept=".json" onChange={e => e.target.files && handleBlueprintFileSelect(e.target.files[0])} />
                    <Button onClick={() => document.getElementById('import-file-input')?.click()}>Select Blueprint File</Button>
                </div>
            </Card>

             <Card title="Data Resets">
                 <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg space-y-6">
                    <h4 className="font-bold text-red-300">Danger Zone</h4>
                     <p className="text-sm text-red-200/80">These actions are permanent and can result in data loss. Use with extreme caution.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-8">
                        <div>
                            <Button className="!bg-red-700 hover:!bg-red-600 w-full" onClick={() => setConfirmation({ action: 'restore-defaults', title: 'Restore Defaults', message: 'Are you sure? This will add any missing default items like trophies back into the game.'})}>Restore Default Objects</Button>
                            <p className="text-xs text-red-200/70 mt-2">Adds any missing default items (like the initial set of Trophies) back into the game without affecting your existing custom content. Useful after an update.</p>
                        </div>
                        <div>
                            <Button className="!bg-red-700 hover:!bg-red-600 w-full" onClick={() => setConfirmation({ action: 'clear-history', title: 'Clear History', message: 'Are you sure? This deletes all completions, purchases, and logs, but keeps users and content.'})}>Clear All History</Button>
                            <p className="text-xs text-red-200/70 mt-2">Deletes all quest completions, purchase requests, and system logs. This does NOT delete users, quests, items, or other created content.</p>
                        </div>
                        <div>
                            <Button className="!bg-red-700 hover:!bg-red-600 w-full" onClick={() => setConfirmation({ action: 'reset-players', title: 'Reset Player Data', message: 'Are you sure? This wipes all player progress (currency, XP, items) but keeps user accounts.'})}>Reset All Player Data</Button>
                            <p className="text-xs text-red-200/70 mt-2">Wipes all player progress, including currency, XP, owned items, and trophies. User accounts themselves are NOT deleted.</p>
                        </div>
                        <div>
                            <Button className="!bg-red-700 hover:!bg-red-600 w-full" onClick={() => setConfirmation({ action: 'factory-reset', title: 'Factory Reset', message: 'Are you sure? This deletes ALL user-created content (quests, items, etc.). It cannot be undone.'})}>Factory Reset Content</Button>
                            <p className="text-xs text-red-200/70 mt-2">Deletes ALL user-created content (quests, items, markets, trophies, rewards, etc.) but keeps user accounts. This is irreversible.</p>
                        </div>
                    </div>
                </div>
             </Card>

            {confirmation && (
                <ConfirmDialog
                    isOpen={!!confirmation}
                    onClose={() => setConfirmation(null)}
                    onConfirm={handleActionConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}
            {blueprintToImport && (
                <BlueprintPreviewDialog
                    blueprint={blueprintToImport}
                    initialResolutions={importResolutions}
                    onClose={() => setBlueprintToImport(null)}
                    onConfirm={handleConfirmImport}
                />
            )}
        </div>
    );
};

export default BackupAndImportPage;