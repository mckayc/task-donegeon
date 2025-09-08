import React, { useState, useMemo } from 'react';
import { ConditionSet, ConditionSetLogic } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import EditConditionSetDialog from '../../conditions/EditConditionSetDialog';
import ToggleSwitch from '../../user-interface/ToggleSwitch';

const ManageConditionSetsPage: React.FC = () => {
    const { settings } = useSystemState();
    const { updateSettings } = useSystemDispatch();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSet, setEditingSet] = useState<ConditionSet | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const conditionSets = settings.conditionSets || [];

    const handleCreate = () => {
        setEditingSet(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (conditionSet: ConditionSet) => {
        setEditingSet(conditionSet);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (id: string) => {
        setDeletingId(id);
    };

    const handleConfirmDelete = () => {
        if (deletingId) {
            const newSets = conditionSets.filter(cs => cs.id !== deletingId);
            updateSettings({ ...settings, conditionSets: newSets });
        }
        setDeletingId(null);
    };

    const handleSave = (set: ConditionSet) => {
        const newSets = [...conditionSets];
        const existingIndex = newSets.findIndex(cs => cs.id === set.id);
        if (existingIndex > -1) {
            newSets[existingIndex] = set;
        } else {
            newSets.push(set);
        }
        updateSettings({ ...settings, conditionSets: newSets });
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <Card
                title="Manage Condition Sets"
                headerAction={<Button onClick={handleCreate} size="sm">Create New Set</Button>}
            >
                <div className="space-y-4">
                    {conditionSets.map(set => (
                        <div key={set.id} className="bg-stone-900/40 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg text-stone-100">{set.name}</h4>
                                <p className="text-sm text-stone-400">{set.description}</p>
                                <p className="text-xs text-stone-500 mt-1">
                                    Logic: {set.isGlobal ? `ALL (Forced)` : set.logic} | Conditions: {set.conditions.length}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                 <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-stone-300">Global:</span>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${set.isGlobal ? 'bg-purple-500/20 text-purple-300' : 'bg-stone-500/20 text-stone-300'}`}>
                                        {set.isGlobal ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => handleEdit(set)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(set.id)}>Delete</Button>
                            </div>
                        </div>
                    ))}
                </div>
                {conditionSets.length === 0 && (
                    <p className="text-center text-stone-400 py-8">
                        No Condition Sets created yet. Create one to define reusable rules for your assets.
                    </p>
                )}
            </Card>

            {isDialogOpen && (
                <EditConditionSetDialog
                    conditionSet={editingSet}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSave}
                />
            )}
            
            <ConfirmDialog
                isOpen={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Condition Set"
                message={`Are you sure you want to delete this condition set? Any assets using it will become inaccessible until they are updated.`}
            />
        </div>
    );
};

export default ManageConditionSetsPage;