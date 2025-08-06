
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoaderCircle, Download, Trash2, Upload } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface ServerBackup {
    filename: string;
    createdAt: string;
    size: number;
    isAuto: boolean;
}

const DataManagementPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [backupToDelete, setBackupToDelete] = useState<ServerBackup | null>(null);

    const fetchBackups = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/backups');
            if (response.ok) {
                const data = await response.json();
                setServerBackups(data);
            } else {
                console.error('Failed to fetch backup list.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);
    
    const handleGenerateBackup = async () => {
        // This is a placeholder for a full state backup. In a real app, you'd gather all serializable state.
        const backupData = { message: "This is a placeholder for a full state backup." }; 
        try {
            const response = await fetch('/api/backups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData),
            });
            if (response.ok) {
                fetchBackups();
            } else {
                throw new Error('Server failed to create backup.');
            }
        } catch(e) {
            console.error(e);
        }
    };
    
    const handleDeleteBackup = async () => {
        if (backupToDelete) {
            try {
                const response = await fetch(`/api/backups/${encodeURIComponent(backupToDelete.filename)}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchBackups();
                } else {
                    throw new Error('Server failed to delete backup.');
                }
            } catch(e) {
                 console.error(e);
            } finally {
                setBackupToDelete(null);
            }
        }
    };
    
    const manualBackups = serverBackups.filter(b => !b.isAuto);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <h1 className="text-3xl font-bold text-donegeon-accent mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
                Data Management
            </h1>

            <Card>
                <CardHeader><CardTitle>Server Backups</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-donegeon-text/80 mb-4">Manage backups stored directly on the server. It's recommended to download important backups for safekeeping.</p>
                    <div className="text-right mb-4">
                        <Button onClick={handleGenerateBackup}>Generate New Manual Backup</Button>
                    </div>
                    {isLoading ? <div className="flex justify-center"><LoaderCircle className="animate-spin h-8 w-8" /></div> : manualBackups.length > 0 ? (
                        <div className="space-y-2">
                            {manualBackups.map(backup => (
                                <div key={backup.filename} className="flex justify-between items-center p-3 bg-donegeon-brown/50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-donegeon-text">{backup.filename}</p>
                                        <p className="text-xs text-donegeon-text/70">{new Date(backup.createdAt).toLocaleString()} ({formatBytes(backup.size)})</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`/api/backups/${encodeURIComponent(backup.filename)}`} download>
                                            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Download</Button>
                                        </a>
                                        <Button variant="outline" size="sm" className="border-donegeon-red text-donegeon-red hover:bg-donegeon-red/20" onClick={() => setBackupToDelete(backup)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center text-donegeon-text/70 py-4">No manual backups found on the server.</p>}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader><CardTitle>Import / Restore from File</CardTitle></CardHeader>
                 <CardContent>
                    <p className="text-sm text-donegeon-text/80 mb-4">Select a Blueprint or full backup <code>.json</code> file to import or restore data.</p>
                    <div className="p-8 border-2 border-dashed border-donegeon-gray rounded-lg text-center">
                        <input type="file" ref={fileInputRef} accept=".json,application/json" className="hidden" />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Select File</Button>
                        <p className="text-xs text-donegeon-orange font-semibold mt-4">Restoring from a full backup will overwrite all current data.</p>
                    </div>
                 </CardContent>
            </Card>
            
            <ConfirmDialog
                isOpen={!!backupToDelete}
                onClose={() => setBackupToDelete(null)}
                onConfirm={handleDeleteBackup}
                title="Delete Server Backup"
                message={`Are you sure you want to delete the backup file "${backupToDelete?.filename}" from the server? This action is permanent.`}
            />
        </div>
    );
};

export default DataManagementPage;
