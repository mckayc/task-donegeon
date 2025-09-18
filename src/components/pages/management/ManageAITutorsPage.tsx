import React, { useState } from 'react';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
// FIX: Import `AITutor` type correctly to resolve module not found error.
import { AITutor } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import EditAITutorDialog from '../../tutors/EditAITutorDialog';

const ManageAITutorsPage: React.FC = () => {
    // FIX: Access `aiTutors` from system state, which was previously missing.
    const { settings, aiTutors } = useSystemState();
    // FIX: Access `deleteAITutors` from system dispatch, which was previously missing.
    const { deleteAITutors } = useSystemDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTutor, setEditingTutor] = useState<AITutor | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreate = () => {
        setEditingTutor(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (tutor: AITutor) => {
        setEditingTutor(tutor);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteAITutors([deletingId]);
        }
        setDeletingId(null);
    };

    return (
        <div className="space-y-6">
            <Card
                title="Manage AI Tutors"
                headerAction={<Button onClick={handleCreate} size="sm">Create New Tutor</Button>}
            >
                <p className="text-stone-400 mb-4 -mt-2">Create and manage AI personas that can be assigned to quests for interactive learning sessions.</p>
                <div className="space-y-3">
                    {aiTutors.map(tutor => (
                        <div key={tutor.id} className="bg-stone-900/50 p-4 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{tutor.icon}</div>
                                <div>
                                    <h4 className="font-bold text-lg text-stone-100">{tutor.name}</h4>
                                    <p className="text-sm text-stone-400">{tutor.subject} - {tutor.style}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => handleEdit(tutor)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => setDeletingId(tutor.id)}>Delete</Button>
                            </div>
                        </div>
                    ))}
                    {aiTutors.length === 0 && (
                        <p className="text-center text-stone-500 py-8">No AI Tutors created yet.</p>
                    )}
                </div>
            </Card>

            {isDialogOpen && (
                <EditAITutorDialog
                    tutorToEdit={editingTutor}
                    onClose={() => setIsDialogOpen(false)}
                />
            )}
            
            <ConfirmDialog
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete AI Tutor"
                message={`Are you sure you want to delete this tutor? It will be removed from any quests it's assigned to.`}
            />
        </div>
    );
};

export default ManageAITutorsPage;
