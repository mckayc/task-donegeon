import React, { useState, useCallback, useRef } from 'react';
import Card from '../../ui/Card';
import BackupPanel from '../../sharing/BackupPanel';
import RestorePanel from '../../sharing/RestorePanel';
import ImportPanel from '../../sharing/ImportPanel';
import { useAppDispatch } from '../../../context/AppContext';
import { IAppData, AssetPack, ImportResolution, BugReport } from '../../../types';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import { useAppState } from '../../../context/AppContext';
import { useAuthState } from '../../../context/AuthContext';
import { useEconomyState, useEconomyDispatch } from '../../../context/EconomyContext';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import Button from '../../ui/Button';

const BugBackupPanel: React.FC = () => {
    const { bugReports } = useAppState();

    const handleBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bugReports, null, 2));
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `donegeon_bug_reports_backup_${timestamp}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6">
             <div>
                <h4 className="font-bold text-lg text-stone-200">Export Bug Reports</h4>
                <p className="text-stone-400 text-sm mb-3">
                    Create a backup file containing all current bug reports.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                <Button onClick={handleBackup}>
                    Download Bug Reports Backup
                </Button>
            </div>
        </div>
    );
};

const BugRestorePanel: React.FC<{ onFileSelect: (file: File) => void }> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileSelect(event.target.files[0]);
            event.target.value = ''; 
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
             <div>
                <h4 className="font-bold text-lg text-stone-200">Import Bug Reports</h4>
                <p className="text-stone-400 text-sm mb-3">
                    Restore bug reports from a backup file.
                    <span className="font-bold text-amber-400"> WARNING:</span> This will replace all current bug reports. This action is irreversible.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-amber-800/50 bg-amber-900/20 rounded-lg text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                />
                <Button onClick={handleButtonClick} className="!bg-amber-600 hover:!bg-amber-500">
                    Select Bug Reports File
                </Button>
            </div>
        </div>
    );
};


const BackupAndImportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('backup');
    const appState = useAppState();
    const authState = useAuthState();
    const economyState = useEconomyState();

    const { restoreFromBackup, importBugReports } = useAppDispatch();
    const { importAssetPack } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [assetPackToPreview, setAssetPackToPreview] = useState<AssetPack | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);
    const [bugReportsToRestore, setBugReportsToRestore] = useState<BugReport[] | null>(null);

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

    const handleBugFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (Array.isArray(json) && (json.length === 0 || (json[0].id && json[0].title && json[0].logs))) {
                    setBugReportsToRestore(json);
                } else {
                    addNotification({ type: 'error', message: 'This does not appear to be a valid bug reports backup file.' });
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

            <Card title="Bug Report Data" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BugBackupPanel />
                    <BugRestorePanel onFileSelect={handleBugFileSelect} />
                </div>
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
            
            <ConfirmDialog
                isOpen={!!bugReportsToRestore}
                onClose={() => setBugReportsToRestore(null)}
                onConfirm={() => {
                    if (bugReportsToRestore) importBugReports(bugReportsToRestore);
                    setBugReportsToRestore(null);
                }}
                title="Confirm Bug Report Import"
                message="Are you sure you want to import these bug reports? All existing bug reports will be replaced. This action cannot be undone."
            />
        </div>
    );
};

export default BackupAndImportPage;
