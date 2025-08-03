import React, { useState, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Blueprint, ImportResolution, AutomatedBackupProfile } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ConfirmDialog from '../../ui/confirm-dialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ImportPanel from '../../sharing/ImportPanel';
import RestorePanel from '../../sharing/RestorePanel';
import BackupPanel from '../../sharing/BackupPanel';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint, addNotification, reinitializeApp, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, updateSettings } = useAppDispatch();
    const appState = useAppState();
    
    const [blueprintToImport, setBlueprintToImport] = useState<Blueprint | null>(null);
    const [importResolutions, setImportResolutions] = useState<ImportResolution[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: string, title: string, message: string, data?: any } | null>(null);
    const [backupProfiles, setBackupProfiles] = useState<[AutomatedBackupProfile, AutomatedBackupProfile, AutomatedBackupProfile]>(() => JSON.parse(JSON.stringify(appState.settings.automatedBackups.profiles)));

     const handleBackupProfileChange = (index: number, field: keyof AutomatedBackupProfile, value: string | boolean | number) => {
        const newProfiles = [...backupProfiles] as [AutomatedBackupProfile, AutomatedBackupProfile, AutomatedBackupProfile];
        (newProfiles[index] as any)[field] = value;
        setBackupProfiles(newProfiles);
        // Also update the main settings state immediately
        updateSettings({ automatedBackups: { profiles: newProfiles }});
    };

    const handleFileSelect = (file: File, type: 'restore' | 'import') => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                if (type === 'restore') {
                    if (data.users && data.settings) {
                        setConfirmation({
                            action: 'restore_local',
                            title: 'Confirm Restore',
                            message: 'Are you sure you want to restore from this file? This will overwrite ALL current data.',
                            data: data
                        });
                    } else {
                        addNotification({ type: 'error', message: 'This does not appear to be a valid backup file.' });
                    }
                } else { // import
                    if (data.name && data.assets) {
                         const resolutions = analyzeBlueprintForConflicts(data, appState);
                         setBlueprintToImport(data);
                         setImportResolutions(resolutions);
                    } else {
                         addNotification({ type: 'error', message: 'This does not appear to be a valid Blueprint file.' });
                    }
                }
            } catch (err) {
                addNotification({ type: 'error', message: 'Failed to read or parse the selected file.' });
            }
        };
        reader.readAsText(file);
    };

    const handleConfirm = async () => {
        if (!confirmation) return;
        try {
            switch (confirmation.action) {
                case 'restore_local':
                    await restoreFromBackup(confirmation.data);
                    addNotification({ type: 'success', message: 'Data restored successfully!' });
                    break;
                case 'import':
                    await importBlueprint(confirmation.data.blueprint, confirmation.data.resolutions);
                    addNotification({ type: 'success', message: 'Blueprint imported successfully!' });
                    break;
                case 'reinitialize': await reinitializeApp(); break;
                case 'clear_history': await clearAllHistory(); addNotification({ type: 'success', message: 'All history has been cleared.' }); break;
                case 'reset_player_data': await resetAllPlayerData(); addNotification({ type: 'success', message: 'Player data has been reset.' }); break;
                case 'factory_reset': await deleteAllCustomContent(); addNotification({ type: 'success', message: 'All custom content deleted. App will reload.' }); setTimeout(() => window.location.reload(), 3000); break;
            }
        } catch (err) {
             const message = err instanceof Error ? err.message : 'An unknown error occurred.';
             addNotification({ type: 'error', message: `Operation failed: ${message}` });
        } finally {
            setConfirmation(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Manual Backup & Restore</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BackupPanel />
                    <RestorePanel onFileSelect={(file) => handleFileSelect(file, 'restore')} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Import Blueprint</CardTitle></CardHeader>
                <CardContent>
                    <ImportPanel onFileSelect={(file) => handleFileSelect(file, 'import')} />
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Automated Backups</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {backupProfiles.map((profile, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-background/50 flex flex-wrap gap-4 items-center">
                            <ToggleSwitch enabled={profile.enabled} setEnabled={(val) => handleBackupProfileChange(index, 'enabled', val)} label={`Profile ${index+1}`} />
                            <div className="flex-grow grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Frequency</Label>
                                    <Select value={profile.frequency} onValueChange={(val) => handleBackupProfileChange(index, 'frequency', val)} disabled={!profile.enabled}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Keep how many?</Label>
                                    <Input type="number" value={profile.keep} onChange={(e) => handleBackupProfileChange(index, 'keep', parseInt(e.target.value))} disabled={!profile.enabled}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <p className="text-sm text-muted-foreground">These are destructive actions that cannot be undone. Please be certain before proceeding.</p>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border border-destructive rounded-lg flex flex-wrap gap-4 items-center justify-center">
                        <Button variant="destructive" onClick={() => setConfirmation({ action: 'clear_history', title: 'Clear All History', message: 'This will delete all quest completions, purchases, adjustments, and logs. User and quest definitions will remain. Are you sure?' })}>Clear All History</Button>
                        <Button variant="destructive" onClick={() => setConfirmation({ action: 'reset_player_data', title: 'Reset All Player Data', message: 'This will reset all user balances, owned items, and trophies to zero, but will not delete history. Are you sure?' })}>Reset Player Data</Button>
                        <Button variant="destructive" onClick={() => setConfirmation({ action: 'factory_reset', title: 'Factory Reset', message: 'This will delete all custom content (quests, items, etc.), reset all players, and clear all history, keeping only user accounts. Are you sure?' })}>Factory Reset</Button>
                        <Button variant="destructive" onClick={() => setConfirmation({ action: 'reinitialize', title: 'Re-initialize Application', message: 'This will delete EVERYTHING, including all user accounts, and restart the first-run wizard. THIS IS A COMPLETE WIPE. Are you sure?' })}>Re-initialize App</Button>
                    </div>
                </CardContent>
            </Card>

            {confirmation && (
                <ConfirmDialog
                    isOpen={!!confirmation}
                    onClose={() => setConfirmation(null)}
                    onConfirm={handleConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}

            {blueprintToImport && (
                <BlueprintPreviewDialog
                    blueprint={blueprintToImport}
                    initialResolutions={importResolutions}
                    onClose={() => setBlueprintToImport(null)}
                    onConfirm={(bp, res) => {
                        setConfirmation({
                            action: 'import',
                            title: 'Confirm Import',
                            message: 'Are you sure you want to add the selected items to your game?',
                            data: { blueprint: bp, resolutions: res }
                        });
                        setBlueprintToImport(null);
                    }}
                />
            )}
        </div>
    );
};

export default BackupAndImportPage;