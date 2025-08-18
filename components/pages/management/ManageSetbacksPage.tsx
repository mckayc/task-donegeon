
import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { SetbackDefinition, User } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EmptyState from '../../user-interface/EmptyState';
import EditSetbackDialog from '../../admin/EditSetbackDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import ApplySetbackDialog from '../../admin/ApplySetbackDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { PencilIcon, TrashIcon, CheckBadgeIcon } from '../../user-interface/Icons';
import Avatar from '../../user-interface/Avatar';
import { useAuthState } from '../../../context/AuthContext';

const ManageSetbacksPage: React.FC = () => {
    const { settings, setbackDefinitions, appliedSetbacks } = useData();
    const { users } = useAuthState();
    const { deleteSelectedAssets } = useActionsDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [editingSetback, setEditingSetback] = useState<SetbackDefinition | null>(null);
    const [applyingSetback, setApplyingSetback] = useState<SetbackDefinition | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedSetbacks, setSelectedSetbacks] = useState<string[]>([]);

    const setbackIds = useMemo(() => setbackDefinitions.map(s => s.id), [setbackDefinitions]);
    const handleCheckboxClick = useShiftSelect(setbackIds, selectedSetbacks, setSelectedSetbacks);

    const activeSetbacks = useMemo(() => {
        const now = new Date();
        return appliedSetbacks
            .filter(s => s.expiresAt && new Date(s.expiresAt) > now)
            .map(s => {
                const user = users.find(u => u.id === s.userId);
                const definition = setbackDefinitions.find(d => d.id === s.setbackDefinitionId);
                const appliedBy = users.find(u => u.id === s.appliedById);
                return { ...s, user, definition, appliedBy };
            })
            .filter(s => s.user && s.definition && s.appliedBy) as (typeof appliedSetbacks[0] & { user: User, definition: SetbackDefinition, appliedBy: User })[];
    }, [appliedSetbacks, users, setbackDefinitions]);

    const handleCreate = () => {
        setEditingSetback(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (setback: SetbackDefinition) => {
        setEditingSetback(setback);
        setIsDialogOpen(true);
    };

    const handleApply = (setback: SetbackDefinition) => {
        setApplyingSetback(setback);
        setIsApplyDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ setbackDefinitions: deletingIds });
        }
        setDeletingIds([]);
        setSelectedSetbacks(prev => prev.filter(id => !deletingIds.includes(id)));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedSetbacks(e.target.checked ? setbackIds : []);
    };

    return (
        <div className="space-y-6">
            <Card
                title={`${settings.terminology.link_manage_setbacks} Definitions`}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Setback</Button>}
            >
                {selectedSetbacks.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedSetbacks.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleApply(setbackDefinitions.find(s => s.id === selectedSetbacks[0])!)} disabled={selectedSetbacks.length !== 1}>Apply</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedSetbacks)}>Delete</Button>
                    </div>
                )}
                {setbackDefinitions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedSetbacks.length === setbackIds.length && setbackIds.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                    </th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {setbackDefinitions.map(setback => (
                                    <tr key={setback.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4">
                                            <input type="checkbox" checked={selectedSetbacks.includes(setback.id)} onChange={(e) => handleCheckboxClick(e, setback.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-4 font-bold">
                                            {setback.icon} {setback.name}
                                        </td>
                                        <td className="p-4 text-stone-400">{setback.description}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" title="Apply Setback" onClick={() => handleApply(setback)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <CheckBadgeIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(setback)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeletingIds([setback.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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
                        title="No Setback Definitions Created Yet"
                        message="Create setback templates to apply consequences like deducting rewards or closing markets."
                        actionButton={<Button onClick={handleCreate}>Create Setback</Button>}
                    />
                )}
            </Card>
            
            <Card title="Active Setbacks">
                {activeSetbacks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">Setback</th>
                                    <th className="p-4 font-semibold">Reason</th>
                                    <th className="p-4 font-semibold">Applied By</th>
                                    <th className="p-4 font-semibold">Expires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeSetbacks.map(setback => (
                                    <tr key={setback.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-semibold text-stone-200 flex items-center gap-2">
                                            <Avatar user={setback.user} className="w-8 h-8 rounded-full" />
                                            {setback.user.gameName}
                                        </td>
                                        <td className="p-4 text-stone-300">{setback.definition.name}</td>
                                        <td className="p-4 text-stone-400 italic">"{setback.reason}"</td>
                                        <td className="p-4 text-stone-300">{setback.appliedBy.gameName}</td>
                                        <td className="p-4 text-amber-300">{new Date(setback.expiresAt!).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-stone-400 text-center py-4">No setbacks are currently active on any users.</p>
                )}
            </Card>

            {isDialogOpen && <EditSetbackDialog setbackToEdit={editingSetback} onClose={() => setIsDialogOpen(false)} />}
            {isApplyDialogOpen && applyingSetback && <ApplySetbackDialog setback={applyingSetback} onClose={() => setIsApplyDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Definitions' : 'Definition'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} setback definitions` : `the definition for "${setbackDefinitions.find(s=>s.id === deletingIds[0])?.name}"`}? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageSetbacksPage;
