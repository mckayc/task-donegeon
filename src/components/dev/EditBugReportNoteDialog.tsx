import React, { useState } from 'react';
import { BugReportNote } from '../../types';
import { useSystemDispatch, useSystemState } from '../../context/SystemContext';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';

interface EditBugReportNoteDialogProps {
  noteToEdit: BugReportNote | null;
  onClose: () => void;
}

const EditBugReportNoteDialog: React.FC<EditBugReportNoteDialogProps> = ({ noteToEdit, onClose }) => {
    const { updateSettings } = useSystemDispatch();
    const { settings } = useSystemState();
    const [title, setTitle] = useState(noteToEdit?.title || '');
    const [content, setContent] = useState(noteToEdit?.content || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        let newNotes: BugReportNote[];

        if (noteToEdit) {
            newNotes = (settings.bugReportNotes || []).map(n => n.id === noteToEdit.id ? { ...noteToEdit, title, content } : n);
        } else {
            const newNote = { id: `note-${Date.now()}`, title, content };
            newNotes = [...(settings.bugReportNotes || []), newNote];
        }

        updateSettings({ ...settings, bugReportNotes: newNotes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-emerald-400">{noteToEdit ? 'Edit Note' : 'Create New Note'}</h2>
                </div>
                <form id="bug-note-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto">
                    <Input
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />
                    <Input
                        as="textarea"
                        label="Content / AI Instructions"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={15}
                        placeholder="Enter the reusable text or prompt instructions here."
                    />
                </form>
                <div className="p-6 mt-auto border-t border-stone-700/60 flex justify-end space-x-4 flex-shrink-0">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="bug-note-form">{noteToEdit ? 'Save Changes' : 'Create Note'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditBugReportNoteDialog;