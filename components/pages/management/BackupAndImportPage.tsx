import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Blueprint, ImportResolution } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ConfirmDialog from '../../ui/confirm-dialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ImportPanel from '../../sharing/ImportPanel';
import RestorePanel from '../../sharing/RestorePanel';
import BackupPanel from '../../sharing/BackupPanel';

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint, addNotification } = useAppDispatch();
    const appState = useAppState();
    
    const [blueprintToImport, setBlueprintToImport] = useState<Blueprint | null>(null);
    const [importResolutions, setImportResolutions] = useState<ImportResolution[]>([]);
    const [confirmation, setConfirmation] = useState<{ action: string, title: string, message: string, data?: any } | null>(null);

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