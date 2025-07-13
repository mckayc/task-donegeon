
import React, { useState, useCallback, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Blueprint, IAppData, ImportResolution } from '../../../types';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

const BackupAndImportPage: React.FC = () => {
    const appState = useAppState();
    const { restoreFromBackup, importBlueprint, addNotification } = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [blueprintToPreview, setBlueprintToPreview] = useState<Blueprint | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                // Simple check to differentiate full backup from blueprint
                if (parsed.users && parsed.settings) { // Likely a full backup
                    setFileToRestore(parsed);
                } else if (parsed.name && parsed.assets) { // Likely a blueprint
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
        event.target.value = ''; // Reset input
    };
    
    const handleBackup = () => {
        const {
            isAppUnlocked, isFirstRun, notifications, isSwitchingUser, targetedUserForLogin,
            activePage, activeMarketId, allTags,
            ...dataToBackup
        } = appState;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `donegeon_backup_${timestamp}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6">
            <Card title="Backup & Restore">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Section */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-lg text-stone-200">Full Data Backup</h4>
                        <p className="text-stone-400 text-sm">
                            Create a complete backup of your entire game state. This file will contain all users, quests, settings, and history. Keep it in a safe place.
                        </p>
                        <Button onClick={handleBackup}>Download Backup File</Button>
                    </div>

                    {/* Import/Restore Section */}
                     <div className="space-y-3">
                        <h4 className="font-bold text-lg text-stone-200">Import or Restore</h4>
                        <p className="text-stone-400 text-sm">
                            Select a Blueprint or full backup `.json` file. The app will automatically detect which it is.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".json,application/json"
                            className="hidden"
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                           Select File
                        </Button>
                         <p className="text-xs text-amber-400 font-semibold">
                            Restoring from a full backup will overwrite all current data.
                        </p>
                    </div>
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
        </div>
    );
};

export default BackupAndImportPage;
