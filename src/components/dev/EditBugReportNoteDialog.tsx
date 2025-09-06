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
    // FIX: Replaced direct calls to missing SystemDispatch methods with a single call to the `updateSettings` action, which correctly handles saving the `bugReportNotes` array to the settings object.
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
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-medieval text-emerald-400 mb-6">{noteToEdit ? 'Edit Note' : 'Create New Note'}</h2>
                <form id="bug-note-form" onSubmit={handleSubmit} className="space-y-4">
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
                        rows={10}
                        placeholder="Enter the reusable text or prompt instructions here."
                    />
                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="bug-note-form">{noteToEdit ? 'Save Changes' : 'Create Note'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditBugReportNoteDialog;
