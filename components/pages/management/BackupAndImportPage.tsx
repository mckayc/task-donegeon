import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Card from '../../user-interface/Card';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, BackupInfo, BackupSchedule } from '../../../types';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import Button from '../../user-interface/Button';
import ToggleSwitch from '../../user-interface/ToggleSwitch';
import EditBackupScheduleDialog from '../../admin/EditBackupScheduleDialog';
import Input from '../../user-interface/Input';

interface BackupListProps {
    backupsToList: BackupInfo[];
    onDelete: (filename: string) => void;
}

const BackupList: React.FC<BackupListProps> = ({ backupsToList, onDelete }) => (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {backupsToList.map(backup => (
            <div key={backup.filename} className="bg-stone-900/50 p-3 rounded-lg flex justify-between items-center">
                <div>
                    <p className="font-semibold text-stone-200">{backup.filename}</p>
                    <p className="text-xs text-stone-400">
                        {new Date(backup.createdAt).toLocaleString()} - {(backup.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                </div>
                <div className="flex gap-2">
                    <a href={`/api/backups/download/${backup.filename}`} download>
                        <Button size="sm" variant="secondary">Download</Button>
                    </a>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(backup.filename)}>Delete</Button>
                </div>
            </div>
        ))}
    </div>
);


const BackupAndImportPage: React.FC = () => {
    const { settings } = useAppState();
    const { updateSettings } = useAppDispatch();
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState<'json' | 'sqlite' | false>(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const { addNotification } = useNotificationsDispatch();

    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<BackupSchedule | null>(null);

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

    const handleCreateBackup = async (type: 'json' | 'sqlite') => {
        setIsCreating(type);
        try {
            await apiRequest('POST', `/api/backups/create-${type}`);
            addNotification({ type: 'success', message: `Manual ${type.toUpperCase()} backup created successfully.` });
            fetchBackups();
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : `Failed to create ${type} backup.` });
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            await apiRequest('DELETE', `/api/backups/${confirmDelete}`);
            addNotification({ type: 'info', message: 'Backup deleted.' });
            fetchBackups();
        } catch(e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Deletion failed.' });
        }
        setConfirmDelete(null);
    };
    
    const handleRestore = async () => {
        if (!fileToRestore) return;
        
        setIsRestoring(true);
        const formData = new FormData();
        formData.append('backupFile', fileToRestore);

        try {
            const response = await fetch('/api/backups/restore-upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Restore failed.');
            }
            addNotification({ type: 'success', message: result.message });
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Restore failed.' });
            setIsRestoring(false);
        }
    };

    const handleSaveSchedule = (scheduleData: Omit<BackupSchedule, 'id'>) => {
        const updatedSchedules = [...settings.automatedBackups.schedules];
        if (editingSchedule) {
            const index = updatedSchedules.findIndex(s => s.id === editingSchedule.id);
            if (index !== -1) {
                updatedSchedules[index] = { ...editingSchedule, ...scheduleData };
            }
        } else {
            updatedSchedules.push({ ...scheduleData, id: `schedule-${Date.now()}` });
        }
        updateSettings({ automatedBackups: { ...settings.automatedBackups, schedules: updatedSchedules } });
        setIsScheduleDialogOpen(false);
        setEditingSchedule(null);
    };

    const handleDeleteSchedule = () => {
        if (!deletingSchedule) return;
        const updatedSchedules = settings.automatedBackups.schedules.filter(s => s.id !== deletingSchedule.id);
        updateSettings({ automatedBackups: { ...settings.automatedBackups, schedules: updatedSchedules } });
        setDeletingSchedule(null);
    };
    
    const { manualBackups, automatedBackups } = useMemo(() => {
        const manual: BackupInfo[] = [];
        const automated: BackupInfo[] = [];
        backups.forEach(b => {
            if (b.filename.startsWith('backup-manual-')) {
                manual.push(b);
            } else if (b.filename.startsWith('backup-auto-')) {
                automated.push(b);
            }
        });
        return { manualBackups: manual, automatedBackups: automated };
    }, [backups]);
    
    return (
        <div className="space-y-8">
            <Card title="Manual Backups">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-stone-400 text-sm max-w-md">
                            Create an instant backup of all application data.
                            <br/><strong className="text-stone-300">JSON:</strong> Portable & human-readable.
                            <br/><strong className="text-stone-300">SQLite:</strong> A direct, fast copy of the database file.
                        </p>
                        <div className="flex gap-2">
                             <Button onClick={() => handleCreateBackup('sqlite')} disabled={!!isCreating}>
                                {isCreating === 'sqlite' ? 'Creating...' : 'Create SQLite Backup'}
                            </Button>
                            <Button onClick={() => handleCreateBackup('json')} disabled={!!isCreating}>
                                {isCreating === 'json' ? 'Creating...' : 'Create JSON Backup'}
                            </Button>
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <p className="text-stone-400 text-center">Loading backups...</p>
                    ) : manualBackups.length > 0 ? (
                        <BackupList backupsToList={manualBackups} onDelete={setConfirmDelete} />
                    ) : (
                         <p className="text-stone-400 text-center py-4">No manual backups found.</p>
                    )}
                </div>
            </Card>

            <Card title="Restore from Backup">
                <p className="text-stone-400 text-sm mb-4">
                    Select a `.json` or `.sqlite` backup file from your computer to restore from.
                    <br/><strong className="text-amber-400">Warning:</strong> This will overwrite ALL current data in the application.
                </p>
                <div className="flex items-center gap-4 p-4 bg-stone-900/40 rounded-lg">
                     <Input
                        type="file"
                        accept=".json,.sqlite"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileToRestore(e.target.files ? e.target.files[0] : null)}
                        className="flex-grow"
                        disabled={isRestoring}
                    />
                    <Button onClick={handleRestore} disabled={!fileToRestore || isRestoring} variant="destructive">
                        {isRestoring ? 'Restoring...' : 'Restore'}
                    </Button>
                </div>
                 {fileToRestore && <p className="text-sm mt-2 text-stone-300">Selected: {fileToRestore.name}</p>}
            </Card>

            <Card title="Automated Backups">
                <div className="space-y-4">
                    <ToggleSwitch 
                        enabled={settings.automatedBackups.enabled} 
                        setEnabled={(val) => updateSettings({ automatedBackups: { ...settings.automatedBackups, enabled: val }})} 
                        label="Enable Automated Server Backups" 
                    />

                    {settings.automatedBackups.enabled && (
                        <div className="pt-4 border-t border-stone-700/60 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-stone-200">Backup Schedules</h4>
                                <Button size="sm" onClick={() => { setEditingSchedule(null); setIsScheduleDialogOpen(true); }}>Add Schedule</Button>
                            </div>
                             {settings.automatedBackups.schedules.length > 0 ? (
                                <div className="space-y-3">
                                    {settings.automatedBackups.schedules.map(schedule => (
                                        <div key={schedule.id} className="bg-stone-900/50 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-stone-200">Every {schedule.frequency} {schedule.unit}</p>
                                                <p className="text-xs text-stone-400">Keeps the last {schedule.maxBackups} backups</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => { setEditingSchedule(schedule); setIsScheduleDialogOpen(true); }}>Edit</Button>
                                                <Button size="sm" variant="destructive" onClick={() => setDeletingSchedule(schedule)}>Delete</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : <p className="text-stone-400 text-center py-4">No schedules configured.</p>}
                             
                             <div className="pt-4 border-t border-stone-700/60">
                                <h4 className="font-semibold text-stone-200 mb-2">Generated Backup Files</h4>
                                {isLoading ? (
                                    <p className="text-stone-400 text-center">Loading backups...</p>
                                ) : automatedBackups.length > 0 ? (
                                    <BackupList backupsToList={automatedBackups} onDelete={setConfirmDelete} />
                                ) : (
                                    <p className="text-stone-400 text-center py-4">No automated backups have been generated yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
            
            {isScheduleDialogOpen && (
                <EditBackupScheduleDialog
                    scheduleToEdit={editingSchedule}
                    onClose={() => setIsScheduleDialogOpen(false)}
                    onSave={handleSaveSchedule}
                />
            )}

            <ConfirmDialog
                isOpen={!!deletingSchedule}
                onClose={() => setDeletingSchedule(null)}
                onConfirm={handleDeleteSchedule}
                title="Delete Schedule"
                message="Are you sure you want to delete this automated backup schedule?"
            />

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to permanently delete "${confirmDelete}"?`}
            />
        </div>
    );
};

export default BackupAndImportPage;