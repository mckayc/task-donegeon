import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Card from '../../user-interface/Card';
import { BackupInfo, BackupSchedule } from '../../../types';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import Button from '../../user-interface/Button';
import ToggleSwitch from '../../user-interface/ToggleSwitch';
import EditBackupScheduleDialog from '../../admin/EditBackupScheduleDialog';
import Input from '../../user-interface/Input';
import { DatabaseIcon } from '../../user-interface/Icons';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';

const BackupListItem: React.FC<{ 
    backup: BackupInfo; 
    onDelete: (filename: string) => void;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ backup, onDelete, isSelected, onToggle }) => {
    const { parsed, filename, size, createdAt } = backup;
    
    let displayType = 'Manual';
    if (parsed?.type.startsWith('auto-')) {
        const scheduleName = parsed.type.substring(5).replace(/-/g, ' ');
        displayType = `Auto: ${scheduleName}`;
    }

    const format = parsed?.format || (filename.endsWith('.sqlite') ? 'sqlite' : 'json');
    const colorClass = format === 'sqlite' ? 'text-green-400 border-green-700' : 'text-sky-400 border-sky-700';
    const icon = format === 'sqlite' ? '🗃️' : '{ }';

    return (
        <div className="bg-stone-900/50 p-3 rounded-lg flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 flex-grow">
                 <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
                />
                <div className={`w-10 h-10 rounded-md flex items-center justify-center text-xl font-mono border ${colorClass} bg-black/20 flex-shrink-0`}>
                    {icon}
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold text-stone-200 truncate" title={filename}>{filename}</p>
                    <p className="text-xs text-stone-400">
                        {parsed ? (
                            <>
                                {new Date(parsed.date).toLocaleString()} - v{parsed.version} - <span className="capitalize">{displayType}</span>
                            </>
                        ) : (
                            <>
                                {new Date(createdAt).toLocaleString()} - <span className="text-amber-400">Old Format</span>
                            </>
                        )}
                         - {(size / 1024 / 1024).toFixed(2)} MB
                    </p>
                </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <a href={`/api/backups/download/${filename}`} download>
                    <Button size="sm" variant="secondary">Download</Button>
                </a>
                <Button size="sm" variant="destructive" onClick={() => onDelete(filename)}>Delete</Button>
            </div>
        </div>
    );
};

const BackupList: React.FC<{ 
    backupsToList: BackupInfo[]; 
    onDelete: (filename: string) => void;
    onRefetch: () => void;
}> = ({ backupsToList, onDelete, onRefetch }) => {
    const backupFilenames = useMemo(() => backupsToList.map(b => b.filename), [backupsToList]);
    const [selectedBackups, setSelectedBackups] = useState<string[]>([]);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const { addNotification } = useNotificationsDispatch();
    
    const handleCheckboxClick = useShiftSelect(backupFilenames, selectedBackups, setSelectedBackups);

    useEffect(() => {
        setSelectedBackups([]);
    }, [backupsToList]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedBackups(e.target.checked ? backupFilenames : []);
    };
    
    const handleBulkDelete = async () => {
        try {
            const response = await fetch('/api/backups/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filenames: selectedBackups })
            });
            if (!response.ok) throw new Error('Failed to delete backups.');
            addNotification({ type: 'info', message: `${selectedBackups.length} backups deleted.` });
            onRefetch();
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : 'Deletion failed.' });
        } finally {
            setConfirmBulkDelete(false);
            setSelectedBackups([]);
        }
    };
    
    return (
        <div className="space-y-3">
             {selectedBackups.length > 0 && (
                <div className="p-2 bg-stone-900/50 rounded-lg flex items-center gap-4">
                    <span className="text-sm font-semibold text-stone-300">{selectedBackups.length} selected</span>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmBulkDelete(true)}>Delete Selected</Button>
                </div>
            )}
            <div className="flex items-center gap-3 p-2 border-b border-stone-700/60">
                <input
                    type="checkbox"
                    checked={selectedBackups.length === backupFilenames.length && backupFilenames.length > 0}
                    onChange={handleSelectAll}
                    disabled={backupFilenames.length === 0}
                    className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                />
                <label className="font-semibold text-stone-400 text-sm">Select All</label>
            </div>
            {backupsToList.map(backup => (
                <BackupListItem 
                    key={backup.filename} 
                    backup={backup} 
                    onDelete={onDelete} 
                    isSelected={selectedBackups.includes(backup.filename)}
                    onToggle={(e) => handleCheckboxClick(e, backup.filename)}
                />
            ))}
            <ConfirmDialog
                isOpen={confirmBulkDelete}
                onClose={() => setConfirmBulkDelete(false)}
                onConfirm={handleBulkDelete}
                title="Confirm Bulk Delete"
                message={`Are you sure you want to permanently delete ${selectedBackups.length} backup files? This cannot be undone.`}
            />
        </div>
    );
};

export const BackupAndImportPage: React.FC = () => {
    const { settings } = useSystemState();
    const { updateSettings } = useSystemDispatch();
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const { addNotification } = useNotificationsDispatch();

    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<BackupSchedule | null>(null);
    const [manualBackupType, setManualBackupType] = useState<'json' | 'sqlite' | 'both'>('json');
    const [activeTab, setActiveTab] = useState<'manual' | 'automated'>('manual');
    
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

    const handleCreateBackup = async (type: 'json' | 'sqlite' | 'both') => {
        setIsCreating(true);
        try {
            if (type === 'json' || type === 'both') await apiRequest('POST', `/api/backups/create-json`);
            if (type === 'sqlite' || type === 'both') await apiRequest('POST', `/api/backups/create-sqlite`);
            
            addNotification({ type: 'success', message: `Manual backup created successfully.` });
            fetchBackups();
        } catch (e) {
            addNotification({ type: 'error', message: e instanceof Error ? e.message : `Failed to create backup.` });
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
                updatedSchedules[index] = { ...updatedSchedules[index], ...scheduleData };
            }
        } else {
            updatedSchedules.push({ ...scheduleData, id: `schedule-${Date.now()}` });
        }
        updateSettings({ ...settings, automatedBackups: { ...settings.automatedBackups, schedules: updatedSchedules } });
        setEditingSchedule(null);
        setIsScheduleDialogOpen(false);
    };

    const handleDeleteSchedule = () => {
        if (!deletingSchedule) return;
        const updatedSchedules = settings.automatedBackups.schedules.filter(s => s.id !== deletingSchedule.id);
        updateSettings({ ...settings, automatedBackups: { ...settings.automatedBackups, schedules: updatedSchedules } });
        setDeletingSchedule(null);
    };

    const { manualBackups, automatedBackups } = useMemo(() => {
        const manual: BackupInfo[] = [];
        const automated: BackupInfo[] = [];
        backups.forEach(b => {
            if (b.parsed?.type === 'manual' || (!b.parsed && !b.filename.includes('auto'))) {
                manual.push(b);
            } else {
                automated.push(b);
            }
        });
        return { manualBackups: manual, automatedBackups: automated };
    }, [backups]);
    
    return (
        <div className="space-y-8">
            <Card title="Backup & Restore Controls" titleIcon={<DatabaseIcon className="w-6 h-6" />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Actions */}
                    <div className="space-y-6">
                        <div className="p-4 bg-stone-900/40 rounded-lg">
                            <h4 className="font-semibold text-stone-200 mb-2">Manual Backup</h4>
                            <div className="flex items-end gap-2">
                                <Input
                                    as="select"
                                    label="Backup Format"
                                    value={manualBackupType}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setManualBackupType(e.target.value as any)}
                                    className="flex-grow"
                                >
                                    <option value="json">JSON</option>
                                    <option value="sqlite">SQLite</option>
                                    <option value="both">Both</option>
                                </Input>
                                <Button onClick={() => handleCreateBackup(manualBackupType)} disabled={isCreating}>
                                    {isCreating ? 'Creating...' : 'Create Now'}
                                </Button>
                            </div>
                        </div>
                         <div className="p-4 bg-red-900/20 border border-red-700/60 rounded-lg">
                            <h4 className="font-semibold text-red-300 mb-2">Restore from Backup</h4>
                            <p className="text-sm text-stone-300 mb-3">This will <strong className="text-amber-400">overwrite all current data</strong> in the application.</p>
                            <div className="flex items-center gap-2">
                                <Input type="file" accept=".json,.sqlite" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileToRestore(e.target.files ? e.target.files[0] : null)} className="flex-grow" disabled={isRestoring}/>
                                <Button onClick={handleRestore} disabled={!fileToRestore || isRestoring} variant="destructive">
                                    {isRestoring ? 'Restoring...' : 'Restore'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Right Column: Automated */}
                    <Card>
                        <ToggleSwitch 
                            enabled={settings.automatedBackups.enabled}
                            setEnabled={(val) => updateSettings({ ...settings, automatedBackups: { ...settings.automatedBackups, enabled: val } })}
                            label="Enable Automated Backups"
                        />
                        {settings.automatedBackups.enabled && (
                            <div className="mt-4 pt-4 border-t border-stone-700/60 space-y-4">
                                <Input
                                    as="select"
                                    label="Backup Format"
                                    value={settings.automatedBackups.format}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ ...settings, automatedBackups: { ...settings.automatedBackups, format: e.target.value as any }})}
                                >
                                    <option value="json">JSON (data only)</option>
                                    <option value="sqlite">SQLite (full database)</option>
                                    <option value="both">Both</option>
                                </Input>

                                <div>
                                    <h5 className="font-semibold text-stone-300 mb-2">Schedules</h5>
                                    <div className="space-y-2">
                                        {settings.automatedBackups.schedules.map(schedule => (
                                            <div key={schedule.id} className="bg-stone-800/50 p-2 rounded-md flex justify-between items-center">
                                                <p className="text-sm text-stone-300">
                                                    Every {schedule.frequency} {schedule.unit}, keeping the last {schedule.maxBackups}.
                                                    {schedule.lastBackupTimestamp && (
                                                        <span className="block text-xs text-stone-500">
                                                            Last run: {new Date(schedule.lastBackupTimestamp).toLocaleString()}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => { setEditingSchedule(schedule); setIsScheduleDialogOpen(true); }}>Edit</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => setDeletingSchedule(schedule)}>Delete</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button size="sm" onClick={() => { setEditingSchedule(null); setIsScheduleDialogOpen(true); }} className="mt-3">Add Schedule</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </Card>
            
             <Card>
                 <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('manual')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'manual' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                            Manual ({manualBackups.length})
                        