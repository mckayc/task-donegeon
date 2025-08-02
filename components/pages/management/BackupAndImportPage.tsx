import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, Blueprint, ImportResolution, AutomatedBackupProfile, AutomatedBackups } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ConfirmDialog from '../../ui/ConfirmDialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ServerBackup {
    filename: string;
    createdAt: string;
    size: number;
    isAuto: boolean;
}

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint, restoreDefaultObjects, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, updateSettings, addNotification, reinitializeApp } = useAppDispatch();
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
            (newProfiles[index] as any)[field] = value;
            return { ...prev, profiles: newProfiles };
        });
    };

    const handleSaveAutoBackups = () => {
        updateSettings({ automatedBackups: automatedBackupsForm });
        addNotification({type: 'success', message: 'Automated backup settings saved!'});
    };
    
    const handleFileSelect = (file: File, type: 'restore' | 'import') => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                if (type === 'restore') {
                    if (data.users && data.settings) {
                        setFileToRestore(file);
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
    
    const handleServerRestore = async (filename: string) => {
        setConfirmation({
            action: 'restore_server',
            title: 'Confirm Server Restore',
            message: `Are you sure you want to restore from backup "${filename}"? This will overwrite ALL current data.`,
            data: filename
        });
    };

    const handleConfirm = async () => {
        if (!confirmation) return;

        try {
            switch (confirmation.action) {
                case 'restore_local':
                    await restoreFromBackup(confirmation.data);
                    addNotification({ type: 'success', message: 'Data restored successfully!' });
                    break;
                case 'restore_server':
                     const response = await fetch('/api/backups/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: confirmation.data })
                     });
                     if (!response.ok) throw new Error('Server failed to restore backup.');
                     addNotification({ type: 'success', message: 'Server is restoring backup. App will reload.' });
                     setTimeout(() => window.location.reload(), 3000);
                    break;
                case 'import':
                    await importBlueprint(confirmation.data.blueprint, confirmation.data.resolutions);
                    addNotification({ type: 'success', message: 'Blueprint imported successfully!' });
                    break;
                 case 'clear_history':
                    await clearAllHistory();
                    addNotification({ type: 'success', message: 'All history has been cleared.' });
                    break;
                 case 'reset_player_data':
                    await resetAllPlayerData();
                    addNotification({ type: 'success', message: 'Player data has been reset.' });
                    break;
                 case 'factory_reset':
                    await deleteAllCustomContent();
                    addNotification({ type: 'success', message: 'All custom content has been deleted. Starting over...' });
                    setTimeout(() => window.location.reload(), 3000);
                    break;
                 case 'reinitialize':
                    await reinitializeApp();
                    break;
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
                <CardHeader><CardTitle>Backup & Restore</CardTitle></CardHeader>
                <CardContent>
                    {/* Panel content will go here */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Dangerous Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {/* Panel content will go here */}
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