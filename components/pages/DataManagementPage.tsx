
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { IAppData, Blueprint, ImportResolution, AppSettings } from '../../types';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Card from '../ui/Card';
import BlueprintPreviewDialog from '../sharing/BlueprintPreviewDialog';
import ExportPanel from '../sharing/ExportPanel';
import ImportPanel from '../sharing/ImportPanel';
import BackupPanel from '../sharing/BackupPanel';
import RestorePanel from '../sharing/RestorePanel';
import { analyzeBlueprintForConflicts } from '../../utils/sharing';

const DataManagementPage: React.FC = () => {
    const { addNotification, importBlueprint, restoreFromBackup, clearAllHistory, resetAllPlayerData, deleteAllCustomContent, ...appData } = useAppDispatch();
    const appState = useAppState();

    const [activeTab, setActiveTab] = useState<'sharing' | 'deletion'>('sharing');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    
    const [previewingBlueprint, setPreviewingBlueprint] = useState<{ blueprint: Blueprint; resolutions: ImportResolution[] } | null>(null);
    const [backupToRestore, setBackupToRestore] = useState<IAppData | null>(null);

    const handleActionConfirm = (action: () => void, title: string, message: string) => {
        setConfirmAction(() => action);
        setConfirmTitle(title);
        setConfirmMessage(message);
        setIsConfirmOpen(true);
    };

    const executeConfirmedAction = () => {
        if (confirmAction) {
            confirmAction();
        }
        setIsConfirmOpen(false);
        setConfirmAction(null);
    };
    
    const handleBlueprintFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const blueprint = JSON.parse(text) as Blueprint;
                    // Add validation here later
                    const resolutions = analyzeBlueprintForConflicts(blueprint, appState);
                    setPreviewingBlueprint({ blueprint, resolutions });
                }
            } catch (err) {
                addNotification({ type: 'error', message: 'Failed to parse Blueprint file. Is it valid JSON?' });
            }
        };
        reader.readAsText(file);
    };

    const handleRestoreFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const backup = JSON.parse(text) as IAppData;
                    if (backup.users && backup.quests && backup.settings) {
                        setBackupToRestore(backup);
                        handleActionConfirm(
                            () => handleConfirmRestore(backup),
                            'Restore from Backup',
                            'Are you sure you want to restore from this backup file? This will overwrite ALL current data in your game. This action cannot be undone.'
                        );
                    } else {
                         addNotification({ type: 'error', message: 'Invalid backup file format.' });
                    }
                }
            } catch (err) {
                 addNotification({ type: 'error', message: 'Failed to parse backup file.' });
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmRestore = (backupData: IAppData | null) => {
        if (backupData) {
            restoreFromBackup(backupData);
        }
        setBackupToRestore(null);
    };

    const handleConfirmImport = (blueprint: Blueprint, resolutions: ImportResolution[]) => {
        importBlueprint(blueprint, resolutions);
        setPreviewingBlueprint(null);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-medieval text-stone-100">Data Management</h1>
            <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('sharing')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sharing' ? 'border-accent text-accent-light' : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-300'}`}
                        >
                            Backup & Sharing
                        </button>
                        <button
                            onClick={() => setActiveTab('deletion')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'deletion' ? 'border-accent text-red-400' : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-300'}`}
                        >
                            Bulk Deletion (Danger Zone)
                        </button>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'sharing' && (
                        <div className="space-y-6">
                            <ExportPanel />
                            <div className="my-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}></div>
                            <ImportPanel onFileSelect={handleBlueprintFileSelect} />
                            <div className="my-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}></div>
                            <BackupPanel />
                            <div className="my-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}></div>
                            <RestorePanel onFileSelect={handleRestoreFileSelect} />
                        </div>
                    )}
                    {activeTab === 'deletion' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Card className="border-red-500/30 bg-red-900/10">
                                <h3 className="text-xl font-bold text-red-300">Clear All History</h3>
                                <p className="text-red-200/80 mt-2 text-sm">Permanently deletes all quest completions, purchase requests, system logs, and admin adjustments. Player and content data will be preserved.</p>
                                <div className="text-right mt-4">
                                    <Button onClick={() => handleActionConfirm(clearAllHistory, 'Clear All History', 'Are you sure you want to delete all historical records? This cannot be undone.')} className="!bg-red-600 hover:!bg-red-500">
                                        Clear History
                                    </Button>
                                </div>
                            </Card>
                             <Card className="border-red-500/30 bg-red-900/10">
                                <h3 className="text-xl font-bold text-red-300">Reset All Player Data</h3>
                                <p className="text-red-200/80 mt-2 text-sm">Resets all player wallets, XP, and earned trophies to zero. User accounts and game content will remain. This is useful for starting a new "season".</p>
                                <div className="text-right mt-4">
                                    <Button onClick={() => handleActionConfirm(resetAllPlayerData, 'Reset All Player Data', 'Are you sure you want to reset all player data? This cannot be undone.')} className="!bg-red-600 hover:!bg-red-500">
                                        Reset Players
                                    </Button>
                                </div>
                            </Card>
                             <Card className="border-red-500/30 bg-red-900/10 md:col-span-2">
                                <h3 className="text-xl font-bold text-red-300">Delete All Custom Content</h3>
                                <p className="text-red-200/80 mt-2 text-sm">Permanently deletes ALL custom-created content: Quests, Markets, Trophies, Ranks (except the first), non-core Rewards, and non-default Guilds. User accounts and history will be preserved.</p>
                                <div className="text-right mt-4">
                                    <Button onClick={() => handleActionConfirm(deleteAllCustomContent, 'Delete All Custom Content', 'Are you sure you want to delete ALL custom content? This is extremely destructive and cannot be undone.')} className="!bg-red-600 hover:!bg-red-500">
                                        Delete Content
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {previewingBlueprint && (
                <BlueprintPreviewDialog
                    blueprint={previewingBlueprint.blueprint}
                    initialResolutions={previewingBlueprint.resolutions}
                    onClose={() => setPreviewingBlueprint(null)}
                    onConfirm={handleConfirmImport}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeConfirmedAction}
                title={confirmTitle}
                message={confirmMessage}
            />
        </div>
    );
};

export default DataManagementPage;
