import React, { useState, useCallback, useEffect } from 'react';
import Card from '../../user-interface/Card';
import { useAppDispatch, useAppState } from '../../../context/AppContext';
import { IAppData, BackupInfo, BackupSchedule } from '../../../types';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import Button from '../../user-interface/Button';
import ToggleSwitch from '../../user-interface/ToggleSwitch';
import EditBackupScheduleDialog from '../../admin/EditBackupScheduleDialog';

const BackupAndImportPage: React.FC = () => {
    const { settings } = useAppState();
    const { updateSettings } = useAppDispatch();
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'restore' | 'delete', filename: string } | null>(null);
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

    return (
        <div className="space-y-8">
            <Card title="Manual Backups & Restore">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-stone-400 text-sm">Create an instant backup of all application data, or manage existing server backups.</p>
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
                </div>
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

export default BackupAndImportPage;