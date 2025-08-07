
import React, { useState, useCallback } from 'react';
import Card from '../../ui/Card';
import BackupPanel from '../../sharing/BackupPanel';
import RestorePanel from '../../sharing/RestorePanel';
import ImportPanel from '../../sharing/ImportPanel';
import { useAppDispatch } from '../../../context/AppContext';
import { useEconomyDispatch } from '../../../context/EconomyContext';
import { IAppData, AssetPack, ImportResolution } from '../../../types';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import { useAppState } from '../../../context/AppContext';
import { useAuthState } from '../../../context/AuthContext';
import { useEconomyState } from '../../../context/EconomyContext';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';

const BackupAndImportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('backup');
    const appState = useAppState();
    const authState = useAuthState();
    const economyState = useEconomyState();

    const { restoreFromBackup } = useAppDispatch();
    const { importAssetPack } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [assetPackToPreview, setAssetPackToPreview] = useState<AssetPack | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);

    const handleFileSelect = (file: File, type: 'restore' | 'import') => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (type === 'restore') {
                    // Basic validation for a backup file
                    if (json.users && json.settings) {
                        setFileToRestore(json);
                    } else {
                        addNotification({ type: 'error', message: 'This does not appear to be a valid backup file.' });
                    }
                } else { // import
                    // Basic validation for an asset pack
                    if (json.manifest && json.assets) {
                        const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState };
                        const conflictResolutions = analyzeAssetPackForConflicts(json, fullCurrentData);
                        setInitialResolutions(conflictResolutions);
                        setAssetPackToPreview(json);
                    } else {
                        addNotification({ type: 'error', message: 'This does not appear to be a valid asset pack file.' });
                    }
                }
            } catch (error) {
                addNotification({ type: 'error', message: 'Failed to read or parse the file.' });
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = (pack: AssetPack, resolutions: ImportResolution[]) => {
        const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState };
        importAssetPack(pack, resolutions, fullCurrentData);
        setAssetPackToPreview(null);
        setInitialResolutions([]);
    };

    return (
        <div>
            <Card>
                <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('backup')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'backup' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Backup</button>
                        <button onClick={() => setActiveTab('restore')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'restore' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Restore</button>
                        <button onClick={() => setActiveTab('import')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'import' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Import Blueprint</button>
                    </nav>
                </div>

                {activeTab === 'backup' && <BackupPanel />}
                {activeTab === 'restore' && <RestorePanel onFileSelect={(file) => handleFileSelect(file, 'restore')} />}
                {activeTab === 'import' && <ImportPanel onFileSelect={(file) => handleFileSelect(file, 'import')} />}
            </Card>

            {assetPackToPreview && (
                <BlueprintPreviewDialog
                    blueprint={assetPackToPreview}
                    initialResolutions={initialResolutions}
                    onClose={() => setAssetPackToPreview(null)}
                    onConfirm={handleConfirmImport}
                />
            )}

            <ConfirmDialog
                isOpen={!!fileToRestore}
                onClose={() => setFileToRestore(null)}
                onConfirm={() => {
                    if (fileToRestore) restoreFromBackup(fileToRestore);
                    setFileToRestore(null);
                }}
                title="Confirm Restore"
                message="Are you sure you want to restore from this backup? All current data will be overwritten. This action cannot be undone."
            />
        </div>
    );
};

export default BackupAndImportPage;
