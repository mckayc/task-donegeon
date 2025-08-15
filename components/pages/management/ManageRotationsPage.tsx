import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { Rotation } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import EmptyState from '../../user-interface/EmptyState';
import EditRotationDialog from '../../rotations/EditRotationDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';

const ManageRotationsPage: React.FC = () => {
    const { settings, rotations } = useAppState();
    const { deleteRotation } = useAppDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
    const [deletingRotation, setDeletingRotation] = useState<Rotation | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreate = () => {
        setEditingRotation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rotation: Rotation) => {
        setEditingRotation(rotation);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingRotation) {
            deleteRotation(deletingRotation.id);
        }
        setDeletingRotation(null);
    };

    return (
        <div className="space-y-6">
            <Card
                title="Manage Rotations"
                headerAction={<Button onClick={handleCreate} size="sm">Create New Rotation</Button>}
            >
                {rotations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Frequency</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rotations.map(rotation => (
                                    <tr key={rotation.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{rotation.name}</td>
                                        <td className="p-4 text-stone-400">{rotation.description}</td>
                                        <td className="p-4 text-stone-300 capitalize">{rotation.frequency.toLowerCase()}</td>
                                        <td className="p-4 relative">
                                            <button onClick={() => setOpenDropdownId(openDropdownId === rotation.id ? null : rotation.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === rotation.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(rotation); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { setDeletingRotation(rotation); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={() => <span className="text-4xl">🔄</span>}
                        title="No Rotations Created Yet"
                        message="Create a rotation to automatically assign a pool of quests to a group of users on a schedule."
                        actionButton={<Button onClick={handleCreate}>Create Rotation</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditRotationDialog rotationToEdit={editingRotation} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={!!deletingRotation}
                onClose={() => setDeletingRotation(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Rotation"
                message={`Are you sure you want to delete the rotation "${deletingRotation?.name}"? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageRotationsPage;