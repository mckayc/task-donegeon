import React, { useState, useMemo } from 'react';
import { useSystemState, useSystemDispatch } from '../../context/SystemContext';
import { BugReportNote } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EditBugReportNoteDialog from './EditBugReportNoteDialog';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';

const BugReportNoteManager: React.FC = () => {
    const { settings } = useSystemState();
    // FIX: Replaced direct calls to missing SystemDispatch methods with a single call to the `updateSettings` action, which correctly handles saving the `bugReportNotes` array to the settings object.
    const { updateSettings } = useSystemDispatch();
    const [editingNote, setEditingNote] = useState<BugReportNote | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deletingNote, setDeletingNote] = useState<BugReportNote | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const notes = settings.bugReportNotes || [];

    const filteredNotes = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return notes;
        }
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        return notes.filter(note => 
            note.title.toLowerCase().includes(lowercasedTerm) || 
            note.content.toLowerCase().includes(lowercasedTerm)
        );
    }, [notes, debouncedSearchTerm]);

    const handleEdit = (note: BugReportNote) => {
        setEditingNote(note);
        setIsCreateOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (deletingNote) {
            const newNotes = (settings.bugReportNotes || []).filter(n => n.id !== deletingNote.id);
            updateSettings({ ...settings, bugReportNotes: newNotes });
        }
        setDeletingNote(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input 
                    placeholder="Search notes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
                <Button onClick={() => { setEditingNote(null); setIsCreateOpen(true); }}>
                    Create New Note
                </Button>
            </div>
            <div className="space-y-3">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                        <details key={note.id} className="bg-stone-900/50 rounded-lg overflow-hidden">
                            <summary className="p-4 flex justify-between items-center cursor-pointer hover:bg-stone-700/30">
                                <span className="font-semibold text-stone-200">{note.title}</span>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); handleEdit(note); }}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={(e) => { e.preventDefault(); setDeletingNote(note); }}>Delete</Button>
                                </div>
                            </summary>
                            <div className="p-4 border-t border-stone-700/60 bg-black/20">
                                <pre className="text-sm text-stone-300 whitespace-pre-wrap font-sans">{note.content}</pre>
                            </div>
                        </details>
                    ))
                ) : (
                    <p className="text-center text-stone-400 py-8">
                        {notes.length === 0 ? 'No notes created yet.' : 'No notes match your search.'}
                    </p>
                )}
            </div>

            {(isCreateOpen || editingNote) && (
                <EditBugReportNoteDialog 
                    noteToEdit={editingNote} 
                    onClose={() => { setIsCreateOpen(false); setEditingNote(null); }}
                />
            )}

            <ConfirmDialog 
                isOpen={!!deletingNote}
                onClose={() => setDeletingNote(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Note"
                message={`Are you sure you want to delete the note "${deletingNote?.title}"? This cannot be undone.`}
            />
        </div>
    );
};

export default BugReportNoteManager;
