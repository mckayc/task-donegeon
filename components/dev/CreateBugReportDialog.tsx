import React, { useState } from 'react';
import { BugReport, BugReportType, BugReportStatus } from '../../types';
import { useActionsDispatch } from '../../context/ActionsContext';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface CreateBugReportDialogProps {
  onClose: () => void;
}

const CreateBugReportDialog: React.FC<CreateBugReportDialogProps> = ({ onClose }) => {
    const { addBugReport } = useActionsDispatch();
    const { addNotification } = useNotificationsDispatch();
    const [title, setTitle] = useState('');
    const [reportType, setReportType] = useState<BugReportType>(BugReportType.Bug);
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            addNotification({ type: 'error', message: 'Title and description are required.' });
            return;
        }

        const newReport: Partial<BugReport> = {
            title,
            status: 'Open',
            tags: [reportType],
            createdAt: new Date().toISOString(),
            logs: [{
                type: 'NOTE' as const,
                message: description,
                timestamp: new Date().toISOString(),
            }],
        };
        
        await addBugReport(newReport);
        addNotification({ type: 'success', message: 'New issue created successfully.' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Create New Issue</h2>
                <form id="create-bug-form" onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="Title" 
                        value={title} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        required 
                    />
                    <Input 
                        as="select"
                        label="Report Type"
                        value={reportType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportType(e.target.value as BugReportType)}
                    >
                        {Object.values(BugReportType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Input>
                    <Input
                        as="textarea"
                        label="Description / Initial Log"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        rows={5}
                        required
                        placeholder="Provide a detailed description of the bug or feature request."
                    />
                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="create-bug-form">Create Issue</Button>
                </div>
            </div>
        </div>
    );
};

export default CreateBugReportDialog;