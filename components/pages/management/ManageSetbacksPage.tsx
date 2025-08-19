import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { ModifierDefinition, User } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EmptyState from '../../user-interface/EmptyState';
import EditSetbackDialog from '../../admin/EditSetbackDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import ApplySetbackDialog from '../../admin/ApplySetbackDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { PencilIcon, CheckBadgeIcon, TrashIcon } from '../../user-interface/Icons';
import Avatar from '../../user-interface/Avatar';
import { useAuthState } from '../../../context/AuthContext';

const ManageSetbacksPage: React.FC = () => {
    const { settings, modifierDefinitions, appliedModifiers } = useData();
    const { users } = useAuthState();
    const { deleteSelectedAssets } = useActionsDispatch();
    
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
                {modifierDefinitions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedModifiers.length === modifierIds.length && modifierIds.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                    </th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modifierDefinitions.map(modifier => (
                                    <tr key={modifier.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4">
                                            <input type="checkbox" checked={selectedModifiers.includes(modifier.id)} onChange={(e) => handleCheckboxClick(e, modifier.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-4 font-bold">
                                            {modifier.icon} {modifier.name}
                                        </td>
                                        <td className="p-4 text-stone-400">{modifier.description}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" title="Apply Modifier" onClick={() => handleApply(modifier)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <CheckBadgeIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(modifier)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeletingIds([modifier.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={() => <span className="text-4xl">⚖️</span>}
                        title="No Triumph/Trial Definitions Created Yet"
                        message="Create templates to apply positive or negative effects like deducting rewards or closing markets."
                        actionButton={<Button onClick={handleCreate}>Create Triumph/Trial</Button>}
                    />
                )}
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