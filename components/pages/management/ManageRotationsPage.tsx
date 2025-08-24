

import React, { useState, useMemo } from 'react';
import { Rotation } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRotationDialog from '../../rotations/EditRotationDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import RotationTable from '../../rotations/RotationTable';
import { useQuestsState, useQuestsDispatch } from '../../../context/QuestsContext';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';

const ManageRotationsPage: React.FC = () => {
    const { settings } = useSystemState();
    const { rotations } = useQuestsState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { runRotation, updateRotation } = useQuestsDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedRotations, setSelectedRotations] = useState<string[]>([]);

    const rotationIds = useMemo(() => rotations.map(r => r.id), [rotations]);
    const handleCheckboxClick = useShiftSelect(rotationIds, selectedRotations, setSelectedRotations);

    const handleCreate = () => {
        setEditingRotation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rotation: Rotation) => {
        setEditingRotation(rotation);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ rotations: deletingIds });
        }
        setDeletingIds([]);
        setSelectedRotations(prev => prev.filter(id => !deletingIds.includes(id)));
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRotations(e.target.checked ? rotationIds : []);
    };
    
    const handleStatusChange = (rotation: Rotation, isActive: boolean) => {
        updateRotation({ ...rotation, isActive });
    };

    return (
        <div className="space-y-6">
            <Card
                title={settings.terminology.link_manage_rotations}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Rotation</Button>}
            >
                 {selectedRotations.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedRotations.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(rotations.find(r => r.id === selectedRotations[0])!)} disabled={selectedRotations.length !== 1}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedRotations)}>Delete</Button>
                    </div>
                )}
                <RotationTable
                    rotations={rotations}
                    selectedRotations={selectedRotations}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleCheckboxClick}
                    onEdit={handleEdit}
                    onStatusChange={handleStatusChange}
                    onDeleteRequest={(ids) => setDeletingIds(ids)}
                    terminology={settings.terminology}
                    onCreate={handleCreate}
                />
            </Card>

            {isDialogOpen && <EditRotationDialog rotationToEdit={editingRotation} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Rotations' : 'Rotation'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} rotations` : `this rotation`}? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageRotationsPage;