import React, { useState, useMemo } from 'react';
import { ModifierDefinition, User } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditSetbackDialog from '../../admin/EditSetbackDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import ApplySetbackDialog from '../../admin/ApplySetbackDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import Avatar from '../../user-interface/Avatar';
import { useAuthState } from '../../../context/AuthContext';
import ModifierTable from '../../modifiers/ModifierTable';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';

const ManageSetbacksPage: React.FC = () => {
    const { settings, modifierDefinitions, appliedModifiers } = useSystemState();
    const { users } = useAuthState();
    const { deleteSelectedAssets } = useSystemDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [editingModifier, setEditingModifier] = useState<ModifierDefinition | null>(null);
    const [applyingModifier, setApplyingModifier] = useState<ModifierDefinition | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

    const modifierIds = useMemo(() => modifierDefinitions.map(s => s.id), [modifierDefinitions]);
    const handleCheckboxClick = useShiftSelect(modifierIds, selectedModifiers, setSelectedModifiers);

    const activeModifiers = useMemo(() => {
        const now = new Date();
        return appliedModifiers
            .filter(m => m.status === 'Active' && (!m.expiresAt || new Date(m.expiresAt) > now))
            .map(m => {
                const user = users.find(u => u.id === m.userId);
                const definition = modifierDefinitions.find(d => d.id === m.modifierDefinitionId);
                const appliedBy = users.find(u => u.id === m.appliedById);
                return { ...m, user, definition, appliedBy };
            })
            .filter(s => s.user && s.definition && s.appliedBy) as (typeof appliedModifiers[0] & { user: User, definition: ModifierDefinition, appliedBy: User })[];
    }, [appliedModifiers, users, modifierDefinitions]);

    const handleCreate = () => {
        setEditingModifier(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (modifier: ModifierDefinition) => {
        setEditingModifier(modifier);
        setIsDialogOpen(true);
    };

    const handleApply = (modifier: ModifierDefinition) => {
        setApplyingModifier(modifier);
        setIsApplyDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ modifierDefinitions: deletingIds });
        }
        setDeletingIds([]);
        setSelectedModifiers(prev => prev.filter(id => !deletingIds.includes(id)));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedModifiers(e.target.checked ? modifierIds : []);
    };

    return (
        <div className="space-y-6">
            <Card
                title={`${settings.terminology.link_triumphs_trials} Definitions`}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Triumph/Trial</Button>}
            >
                {selectedModifiers.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedModifiers.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleApply(modifierDefinitions.find(s => s.id === selectedModifiers[0])!)} disabled={selectedModifiers.length !== 1}>Apply</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedModifiers)}>Delete</Button>
                    </div>
                )}
                <ModifierTable
                    modifiers={modifierDefinitions}
                    selectedModifiers={selectedModifiers}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleCheckboxClick}
                    onApply={handleApply}
                    onEdit={handleEdit}
                    onDeleteRequest={(ids) => setDeletingIds(ids)}
                    onCreate={handleCreate}
                />
            </Card>
            
            <Card title="Active Modifiers">
                {activeModifiers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">Modifier</th>
                                    <th className="p-4 font-semibold">Reason</th>
                                    <th className="p-4 font-semibold">Applied By</th>
                                    <th className="p-4 font-semibold">Expires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeModifiers.map(modifier => (
                                    <tr key={modifier.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-semibold text-stone-200 flex items-center gap-2">
                                            <Avatar user={modifier.user} className="w-8 h-8 rounded-full" />
                                            {modifier.user.gameName}
                                        </td>
                                        <td className="p-4 text-stone-300">{modifier.definition.name}</td>
                                        <td className="p-4 text-stone-400 italic">"{modifier.reason}"</td>
                                        <td className="p-4 text-stone-300">{modifier.appliedBy.gameName}</td>
                                        <td className="p-4 text-amber-300">{modifier.expiresAt ? new Date(modifier.expiresAt).toLocaleString() : 'Never'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-4">No modifiers are currently active on any users.</p>
                )}
            </Card>

            {isDialogOpen && <EditSetbackDialog setbackToEdit={editingModifier} onClose={() => setIsDialogOpen(false)} />}
            {isApplyDialogOpen && applyingModifier && <ApplySetbackDialog setback={applyingModifier} onClose={() => setIsApplyDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Definitions' : 'Definition'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} definitions` : `the definition for "${modifierDefinitions.find(s=>s.id === deletingIds[0])?.name}"`}? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageSetbacksPage;