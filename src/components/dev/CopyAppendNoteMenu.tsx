import React, { useRef, useEffect } from 'react';
import { BugReportNote } from '../../types';

interface CopyAppendNoteMenuProps {
    notes: BugReportNote[];
    onSelectNote: (note: BugReportNote) => void;
    onClose: () => void;
}

const CopyAppendNoteMenu: React.FC<CopyAppendNoteMenuProps> = ({ notes, onSelectNote, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    return (
        <div ref={menuRef} className="absolute bottom-full mb-2 right-0 w-64 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
            <div className="p-2 text-xs text-stone-400 font-semibold uppercase border-b border-stone-700/60">Select a Note to Append</div>
            <div className="max-h-48 overflow-y-auto">
                {notes.length > 0 ? (
                    notes.map(note => (
                        <button
                            key={note.id}
                            onClick={() => onSelectNote(note)}
                            className="w-full text-left block px-3 py-2 text-sm text-stone-300 hover:bg-stone-700/50"
                        >
                            {note.title}
                        </button>
                    ))
                ) : (
                    <p className="p-3 text-sm text-stone-500">No notes available. Add some in the "Notes" tab.</p>
                )}
            </div>
        </div>
    );
};

export default CopyAppendNoteMenu;
