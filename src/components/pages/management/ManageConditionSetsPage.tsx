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
    const [setForGlobalConfirmation, setSetForGlobalConfirmation] = useState<ConditionSet | null>(null);

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

    const handleGlobalToggle = (set: ConditionSet, enabled: boolean) => {
        if (enabled && set.logic === ConditionSetLogic.ANY) {
            setSetForGlobalConfirmation(set);
        } else {
            const newSet = { ...set, isGlobal: enabled };
            const newSets = conditionSets.map(cs => cs.id === newSet.id ? newSet : cs);
            updateSettings({ ...settings, conditionSets: newSets });
        }
    };
    
    const handleConfirmGlobalToggle = () => {
        if (!setForGlobalConfirmation) return;
        const newSet = { ...setForGlobalConfirmation, isGlobal: true, logic: ConditionSetLogic.ALL };
        const newSets = conditionSets.map(cs => cs.id === newSet.id ? newSet : cs);
        updateSettings({ ...settings, conditionSets: newSets });
        setSetForGlobalConfirmation(null);
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
                                 <ToggleSwitch
                                    label="Apply Globally"
                                    enabled={!!set.isGlobal}
                                    setEnabled={(enabled) => handleGlobalToggle(set, enabled)}
                                />
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

            <ConfirmDialog
                isOpen={!!setForGlobalConfirmation}
                onClose={() => setSetForGlobalConfirmation(null)}
                onConfirm={handleConfirmGlobalToggle}
                title="Switch to 'ALL' (AND) Logic?"
                message="Globally applied sets must use 'ALL' (AND) logic for safety. To apply this set globally, its logic will be automatically switched from 'ANY' (OR). Do you want to proceed?"
            />
        </div>
    );
};

export default ManageConditionSetsPage;