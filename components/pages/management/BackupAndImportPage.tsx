import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Card from '../../user-interface/Card';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { IAppData, BackupInfo, BackupSchedule } from '../../../types';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import Button from '../../user-interface/Button';
import ToggleSwitch from '../../user-interface/ToggleSwitch';
import EditBackupScheduleDialog from '../../admin/EditBackupScheduleDialog';
import Input from '../../user-interface/Input';
import { DatabaseIcon } from '../../user-interface/Icons';

const BackupListItem: React.FC<{ backup: BackupInfo; onDelete: (filename: string) => void; }> = ({ backup, onDelete }) => {
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

const BackupList: React.FC<{ backupsToList: BackupInfo[]; onDelete: (filename: string) => void; }> = ({ backupsToList, onDelete }) => (
    <div className="space-y-3">
        {backupsToList.map(backup => (
            <BackupListItem key={backup.filename} backup={backup} onDelete={onDelete} />
        ))}
    </div>
);

const BackupAndImportPage: React.FC = () => {
    const { settings } = useAppState();
    const { updateSettings } = useAppDispatch();
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
    const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'automated'>('manual');
    const backupMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (backupMenuRef.current && !backupMenuRef.current.contains(event.target as Node)) {
                setIsBackupMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        setIsBackupMenuOpen(false);
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
            if (b.parsed?.type === 'manual' || (!b.parsed && b.filename.startsWith('backup-manual-'))) {
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
                             <div ref={backupMenuRef} className="relative inline-block text-left">
                                <div>
                                    <Button onClick={() => setIsBackupMenuOpen(!isBackupMenuOpen)} disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create Backup'}
                                    </Button>
                                </div>
                                {isBackupMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-stone-700 ring-1 ring-black ring-opacity-5 z-10">
                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                            <a href="#" onClick={() => handleCreateBackup('json')} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-600" role="menuitem">
                                                JSON Backup <span className="block text-xs text-stone-400">Portable & human-readable</span>
                                            </a>
                                            <a href="#" onClick={() => handleCreateBackup('sqlite')} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-600" role="menuitem">
                                                SQLite Backup <span className="block text-xs text-stone-400">Direct database copy</span>
                                            </a>
                                             <a href="#" onClick={() => handleCreateBackup('both')} className="block px-4 py-2 text-sm text-stone-200 hover:bg-stone-600" role="menuitem">
                                                Create Both
                                            </a>
                                        </div>
                                    </div>
                                )}
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
                    <div className="p-4 bg-stone-900/40 rounded-lg">
                        <ToggleSwitch 
                            enabled={settings.automatedBackups.enabled} 
                            setEnabled={(val) => updateSettings({ automatedBackups: { ...settings.automatedBackups, enabled: val }})} 
                            label="Enable Automated Server Backups" 
                        />
                         {settings.automatedBackups.enabled && (
                            <div className="mt-4 pt-4 border-t border-stone-700/60 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-stone-200">Schedules</h4>
                                    <Button size="sm" onClick={() => { setEditingSchedule(null); setIsScheduleDialogOpen(true); }}>Add Schedule</Button>
                                </div>
                                {settings.automatedBackups.schedules.length > 0 ? (
                                    settings.automatedBackups.schedules.map(schedule => (
                                        <div key={schedule.id} className="bg-stone-900/50 p-2 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-stone-200">Every {schedule.frequency} {schedule.unit}</p>
                                                <p className="text-xs text-stone-400">Keeps the last {schedule.maxBackups}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="secondary" onClick={() => { setEditingSchedule(schedule); setIsScheduleDialogOpen(true); }}>Edit</Button>
                                                <Button size="sm" variant="destructive" onClick={() => setDeletingSchedule(schedule)}>Del</Button>
                                            </div>
                                        </div>
                                    ))
                                ) : <p className="text-stone-400 text-sm italic">No schedules configured.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                 <div className="border-b border-stone-700 mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('manual')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'manual' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Manual Backups ({manualBackups.length})</button>
                        <button onClick={() => setActiveTab('automated')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'automated' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Automated Backups ({automatedBackups.length})</button>
                    </nav>
                </div>
                {isLoading ? (
                    <p className="text-stone-400 text-center">Loading backups...</p>
                ) : (
                    activeTab === 'manual' ? 
                        manualBackups.length > 0 ? <BackupList backupsToList={manualBackups} onDelete={setConfirmDelete} /> : <p className="text-stone-400 text-center py-4">No manual backups found.</p>
                        :
                        automatedBackups.length > 0 ? <BackupList backupsToList={automatedBackups} onDelete={setConfirmDelete} /> : <p className="text-stone-400 text-center py-4">No automated backups have been generated yet.</p>
                )}
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