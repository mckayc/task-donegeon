import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, Blueprint, ImportResolution } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import Input from '../../ui/Input';
import ToggleSwitch from '../../ui/ToggleSwitch';

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint, restoreDefaultObjects, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, updateSettings, addNotification } = useAppDispatch();
    const appState = useAppState();
    const { settings } = appState;
    
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [blueprintToImport, setBlueprintToImport] = useState<Blueprint | null>(null);
    const [importResolutions, setImportResolutions] = useState<ImportResolution[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: 'restore' | 'restore-defaults' | 'clear-history' | 'reset-players' | 'factory-reset', title: string, message: string } | null>(null);
    const [autoBackupSettings, setAutoBackupSettings] = useState(settings.automatedBackups);

    const handleRestoreFileSelect = (file: File) => {
        setFileToRestore(file);
        setConfirmation({
            action: 'restore',
            title: 'Confirm Restore from Backup',
            message: 'Are you sure you want to restore from this backup? This will overwrite ALL current data in the application.'
        });
    };

    const handleConfirmRestore = () => {
        if (!fileToRestore) return;
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
        setConfirmation(null);
        setFileToRestore(null);
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

    const handleActionConfirm = () => {
        if (!confirmation) return;
        switch (confirmation.action) {
            case 'restore': handleConfirmRestore(); break;
            case 'restore-defaults': restoreDefaultObjects('trophies'); break;
            case 'clear-history': clearAllHistory(); break;
            case 'reset-players': resetAllPlayerData(); break;
            case 'factory-reset': deleteAllCustomContent(); break;
        }
        setConfirmation(null);
    };
    
    const handleSaveAutoBackupSettings = () => {
        updateSettings({ automatedBackups: autoBackupSettings });
        addNotification({type: 'success', message: 'Automatic backup settings saved.'});
    };
    
    return (
        <div className="space-y-6">
            <Card title="Backups">
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-stone-200">Manual Backup</h4>
                        <p className="text-sm text-stone-400 mb-3">Create a complete backup of your entire game state. This file will contain all users, quests, settings, and history. Keep it in a safe place.</p>
                        <Button onClick={() => addNotification({type: 'info', message: 'Server-side backups are coming soon!'})}>Create Manual Backup</Button>
                    </div>
                    <div className="pt-4 border-t border-stone-700/60">
                        <h4 className="font-semibold text-stone-200">Automatic Backups</h4>
                         <div className="space-y-4 mt-3">
                            <ToggleSwitch enabled={autoBackupSettings.enabled} setEnabled={(val) => setAutoBackupSettings(p => ({...p, enabled: val}))} label="Enable Automated Backups" />
                            <div className={`grid grid-cols-2 gap-4 ${!autoBackupSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Input label="Frequency (hours)" type="number" min="1" value={autoBackupSettings.frequencyHours} onChange={e => setAutoBackupSettings(p => ({...p, frequencyHours: parseInt(e.target.value) || 24}))} />
                                <Input label="Backups to Keep" type="number" min="1" value={autoBackupSettings.maxBackups} onChange={e => setAutoBackupSettings(p => ({...p, maxBackups: parseInt(e.target.value) || 7}))} />
                            </div>
                            <div className="text-right">
                                <Button onClick={handleSaveAutoBackupSettings} variant="secondary">Save Settings</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Import Data">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-stone-200">Restore from Backup</h4>
                        <p className="text-sm text-stone-400 mb-3">Restore your game state from a full backup file. <strong className="text-amber-400">WARNING:</strong> This will overwrite all current data.</p>
                        <input type="file" id="restore-file-input" className="hidden" accept=".json" onChange={e => e.target.files && handleRestoreFileSelect(e.target.files[0])} />
                        <Button onClick={() => document.getElementById('restore-file-input')?.click()} className="!bg-amber-600 hover:!bg-amber-500">Select Backup File</Button>
                    </div>
                     <div>
                        <h4 className="font-semibold text-stone-200">Import Blueprint</h4>
                        <p className="text-sm text-stone-400 mb-3">Load a Blueprint `.json` file to add new content to your game. This will not overwrite existing data.</p>
                        <input type="file" id="import-file-input" className="hidden" accept=".json" onChange={e => e.target.files && handleBlueprintFileSelect(e.target.files[0])} />
                        <Button onClick={() => document.getElementById('import-file-input')?.click()}>Select Blueprint File</Button>
                    </div>
                </div>
            </Card>

             <Card title="Data Resets">
                 <div className="p-4 bg-red-900/30 border border-red-700/60 rounded-lg space-y-4">
                    <h4 className="font-bold text-red-300">Danger Zone</h4>
                     <p className="text-sm text-red-200/80">These actions are permanent and can result in data loss. Use with extreme caution.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setConfirmation({ action: 'restore-defaults', title: 'Restore Defaults', message: 'Are you sure? This will add any missing default items like trophies back into the game.'})}>Restore Defaults</Button>
                        <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setConfirmation({ action: 'clear-history', title: 'Clear History', message: 'Are you sure? This deletes all completions, purchases, and logs, but keeps users and content.'})}>Clear History</Button>
                        <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setConfirmation({ action: 'reset-players', title: 'Reset Player Data', message: 'Are you sure? This wipes all player progress (currency, XP, items) but keeps user accounts.'})}>Reset Players</Button>
                        <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setConfirmation({ action: 'factory-reset', title: 'Factory Reset', message: 'Are you sure? This deletes ALL user-created content (quests, items, etc.). It cannot be undone.'})}>Factory Reset</Button>
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