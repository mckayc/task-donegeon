
import React, { useState, useEffect } from 'react';
import { BackupSchedule } from '../../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';

interface EditBackupScheduleDialogProps {
    scheduleToEdit: BackupSchedule | null;
    onClose: () => void;
    onSave: (schedule: Omit<BackupSchedule, 'id'>) => void;
}

const EditBackupScheduleDialog: React.FC<EditBackupScheduleDialogProps> = ({ scheduleToEdit, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        frequency: 24,
        unit: 'hours' as 'hours' | 'days' | 'weeks',
        maxBackups: 7,
    });

    useEffect(() => {
        if (scheduleToEdit) {
            setFormData({
                frequency: scheduleToEdit.frequency,
                unit: scheduleToEdit.unit,
                maxBackups: scheduleToEdit.maxBackups,
            });
        }
    }, [scheduleToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const dialogTitle = scheduleToEdit ? 'Edit Schedule' : 'New Backup Schedule';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-end gap-2">
                        <Input
                            label="Frequency"
                            type="number"
                            min="1"
                            value={formData.frequency}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, frequency: parseInt(e.target.value) || 1 }))}
                            required
                            className="flex-grow"
                        />
                         <Input
                            as="select"
                            label=""
                            value={formData.unit}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({ ...p, unit: e.target.value as any }))}
                            className="w-32"
                         >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                         </Input>
                    </div>
                     <Input
                        label="Max Backups to Keep"
                        type="number"
                        min="1"
                        value={formData.maxBackups}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, maxBackups: parseInt(e.target.value) || 1 }))}
                        required
                    />
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{scheduleToEdit ? 'Save Changes' : 'Add Schedule'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBackupScheduleDialog;
