import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, Blueprint, ImportResolution } from '../../../types';
import { analyzeBlueprintForConflicts } from '../../../utils/sharing';
import BackupPanel from '../../sharing/BackupPanel';
import RestorePanel from '../../sharing/RestorePanel';
import ImportPanel from '../../sharing/ImportPanel';
import ConfirmDialog from '../../ui/ConfirmDialog';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';

const BackupAndImportPage: React.FC = () => {
    const { restoreFromBackup, importBlueprint } = useAppDispatch();
    const appState = useAppState();
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    
    const [blueprintToImport, setBlueprintToImport] = useState<Blueprint | null>(null);
    const [importResolutions, setImportResolutions] = useState<ImportResolution[]>([]);

    const handleRestoreFileSelect = (file: File) => {
        setFileToRestore(file);
        setIsRestoreConfirmOpen(true);
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
                console.error("Failed to parse backup file", err);
            }
        };
        reader.readAsText(fileToRestore);
        setIsRestoreConfirmOpen(false);
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
                   console.error("Invalid blueprint file format.");
                }
            } catch (err) {
                 console.error("Failed to read or parse the blueprint file.");
            }
        };
        reader.readAsText(file);
    };
    
    const handleConfirmImport = (blueprint: Blueprint, resolutions: ImportResolution[]) => {
        importBlueprint(blueprint, resolutions);
        setBlueprintToImport(null);
    };

    return (
        <div className="space-y-6">
            <BackupPanel />
            <RestorePanel onFileSelect={handleRestoreFileSelect} />
            <ImportPanel onFileSelect={handleBlueprintFileSelect} />

            <ConfirmDialog
                isOpen={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={handleConfirmRestore}
                title="Confirm Restore"
                message="Are you sure you want to restore from this backup? This will overwrite ALL current data in the application."
            />
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