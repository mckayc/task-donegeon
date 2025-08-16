import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { SetbackDefinition } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import EmptyState from '../../user-interface/EmptyState';
import EditSetbackDialog from '../../admin/EditSetbackDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';

const ManageSetbacksPage: React.FC = () => {
    const { settings, setbackDefinitions } = useAppState();
    const { deleteSelectedAssets } = useAppDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSetback, setEditingSetback] = useState<SetbackDefinition | null>(null);
    const [deletingSetback, setDeletingSetback] = useState<SetbackDefinition | null>(null);
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
        setEditingSetback(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (setback: SetbackDefinition) => {
        setEditingSetback(setback);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingSetback) {
            deleteSelectedAssets({ setbackDefinitions: [deletingSetback.id] });
        }
        setDeletingSetback(null);
    };

    return (
        <div className="space-y-6">
            <Card
                title="Manage Setback Definitions"
                headerAction={<Button onClick={handleCreate} size="sm">Create New Setback</Button>}
            >
                {setbackDefinitions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {setbackDefinitions.map(setback => (
                                    <tr key={setback.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{setback.icon} {setback.name}</td>
                                        <td className="p-4 text-stone-400">{setback.description}</td>
                                        <td className="p-4 relative">
                                            <Button variant="secondary" size="sm" disabled>Apply</Button>
                                            <button onClick={() => setOpenDropdownId(openDropdownId === setback.id ? null : setback.id)} className="p-2 rounded-full hover:bg-stone-700/50 ml-2">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === setback.id && (
                                                <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(setback); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { setDeletingSetback(setback); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                        Icon={() => <span className="text-4xl">⚖️</span>}
                        title="No Setback Definitions Created Yet"
                        message="Create setback templates to apply consequences like deducting rewards or closing markets."
                        actionButton={<Button onClick={handleCreate}>Create Setback</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditSetbackDialog setbackToEdit={editingSetback} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={!!deletingSetback}
                onClose={() => setDeletingSetback(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Setback Definition"
                message={`Are you sure you want to delete the definition for "${deletingSetback?.name}"? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageSetbacksPage;