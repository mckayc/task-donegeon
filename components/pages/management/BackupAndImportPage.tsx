
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Card from '../../ui/Card';
import ImportPanel from '../../sharing/ImportPanel';
import ExportPanel from '../../sharing/ExportPanel';
import { useAppDispatch } from '../../../context/AppContext';
import { IAppData, AssetPack, ImportResolution, BugReport, BackupInfo } from '../../../types';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import { useAppState } from '../../../context/AppContext';
import { useAuthState } from '../../../context/AuthContext';
import { useEconomyState, useEconomyDispatch } from '../../../context/EconomyContext';
import { useQuestState } from '../../../context/QuestContext';
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

const ServerBackupPanel: React.FC = () => {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete', filename: string } | null>(null);
    const { addNotification } = useNotificationsDispatch();

    const apiRequest = useCallback(async (method: string, path: string, body?: any) => {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(path, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        return response.status === 204 ? null : await response.json();
    }, []);

    const fetchBackups = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('GET', '/api/backups');
            setBackups(data);
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Failed to fetch backups.' });
        } finally {
            setIsLoading(false);
        }
    }, [apiRequest, addNotification]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            await apiRequest('POST', '/api/backups/create');
            addNotification({ type: 'success', message: 'Manual backup created successfully.' });
            fetchBackups();
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Failed to create backup.' });
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleConfirm = async () => {
        if (!confirmAction) return;
        
        try {
            if (confirmAction.type === 'restore') {
                await apiRequest('POST', `/api/backups/restore/${confirmAction.filename}`);
                addNotification({ type: 'success', message: 'Restore successful! App will reload.' });
                setTimeout(() => window.location.reload(), 1500);
            } else if (confirmAction.type === 'delete') {
                await apiRequest('DELETE', `/api/backups/${confirmAction.filename}`);
                addNotification({ type: 'info', message: 'Backup deleted.' });
                fetchBackups();
            }
        } catch(e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Action failed.' });
        }
        
        setConfirmAction(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-lg text-stone-200">Server Backups</h4>
                    <p className="text-stone-400 text-sm">Manage backups stored directly on the server.</p>
                </div>
                <Button onClick={handleCreateBackup} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Manual Backup'}
                </Button>
            </div>
            
            {isLoading ? (
                <p className="text-stone-400 text-center">Loading backups...</p>
            ) : backups.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {backups.map(backup => (
                        <div key={backup.filename} className="bg-stone-900/50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-stone-200">{backup.filename}</p>
                                <p className="text-xs text-stone-400">
                                    {new Date(backup.createdAt).toLocaleString()} - {(backup.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setConfirmAction({ type: 'restore', filename: backup.filename })}>Restore</Button>
                                <a href={`/api/backups/download/${backup.filename}`} download>
                                    <Button size="sm" variant="secondary">Download</Button>
                                </a>
                                <Button size="sm" variant="destructive" onClick={() => setConfirmAction({ type: 'delete', filename: backup.filename })}>Delete</Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-stone-400 text-center py-4">No server backups found.</p>
            )}

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={`Confirm ${confirmAction?.type === 'restore' ? 'Restore' : 'Deletion'}`}
                message={
                    confirmAction?.type === 'restore'
                    ? `Are you sure? This will overwrite ALL current data with the contents of "${confirmAction.filename}". This action is irreversible.`
                    : `Are you sure you want to permanently delete "${confirmAction?.filename}"?`
                }
            />
        </div>
    );
};

const BackupAndImportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('server');
    const appState = useAppState();
    const authState = useAuthState();
    const economyState = useEconomyState();
    const questState = useQuestState();

    const { restoreFromBackup, importBugReports } = useAppDispatch();
    const { importAssetPack } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [assetPackToPreview, setAssetPackToPreview] = useState<AssetPack | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);
    const [fileToRestore, setFileToRestore] = useState<IAppData | null>(null);
    const [bugReportsToRestore, setBugReportsToRestore] = useState<BugReport[] | null>(null);

    const handleFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (json.manifest && json.assets) {
                    const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState, ...questState };
                    const conflictResolutions = analyzeAssetPackForConflicts(json, fullCurrentData);
                    setInitialResolutions(conflictResolutions);
                    setAssetPackToPreview(json);
                } else {
                    addNotification({ type: 'error', message: 'This does not appear to be a valid asset pack file.' });
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
        const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState, ...questState };
        importAssetPack(pack, resolutions, fullCurrentData);
        setAssetPackToPreview(null);
        setInitialResolutions([]);
    };

    return (
        <div>
            <Card>
                <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('server')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'server' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Server Backups</button>
                        <button onClick={() => setActiveTab('export')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'export' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Export Blueprint</button>
                        <button onClick={() => setActiveTab('import')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'import' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Import Blueprint</button>
                    </nav>
                </div>

                {activeTab === 'server' && <ServerBackupPanel />}
                {activeTab === 'export' && <ExportPanel />}
                {activeTab === 'import' && <ImportPanel onFileSelect={handleFileSelect} />}
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
