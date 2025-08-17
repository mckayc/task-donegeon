import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataProvider';
import { useActionsDispatch } from '../../context/ActionsContext';
import { QuestGroup } from '../../types';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import { QuestsIcon } from '../user-interface/Icons';
import EmptyState from '../user-interface/EmptyState';
import EditQuestGroupDialog from '../quests/EditQuestGroupDialog';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import AssignQuestGroupDialog from '../quests/AssignQuestGroupDialog';
import { useShiftSelect } from '../../hooks/useShiftSelect';

const ManageQuestGroupsPage: React.FC = () => {
    const { settings, questGroups } = useData();
    const { deleteSelectedAssets } = useActionsDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<QuestGroup | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [assigningGroup, setAssigningGroup] = useState<QuestGroup | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    const groupIds = useMemo(() => questGroups.map(g => g.id), [questGroups]);
    const handleCheckboxClick = useShiftSelect(groupIds, selectedGroups, setSelectedGroups);

    const handleCreate = () => {
        setEditingGroup(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (group: QuestGroup) => {
        setEditingGroup(group);
        setIsDialogOpen(true);
    };

    const handleAssign = (group: QuestGroup) => {
        setAssigningGroup(group);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ questGroups: deletingIds });
        }
        setDeletingIds([]);
        setSelectedGroups(prev => prev.filter(id => !deletingIds.includes(id)));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedGroups(e.target.checked ? groupIds : []);
    };

    return (
        <div className="space-y-6">
            <Card
                title={settings.terminology.link_manage_quest_groups}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Group</Button>}
            >
                 {selectedGroups.length > 0 && (
                    <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedGroups.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleAssign(questGroups.find(g => g.id === selectedGroups[0])!)} disabled={selectedGroups.length !== 1}>Assign</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(questGroups.find(g => g.id === selectedGroups[0])!)} disabled={selectedGroups.length !== 1}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedGroups)}>Delete</Button>
                    </div>
                )}
                {questGroups.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedGroups.length === groupIds.length && groupIds.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                    </th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questGroups.map(group => (
                                    <tr key={group.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4">
                                            <input type="checkbox" checked={selectedGroups.includes(group.id)} onChange={(e) => handleCheckboxClick(e, group.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-4 font-bold">
                                            <button onClick={() => handleEdit(group)} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-2">
                                                {group.icon} {group.name}
                                            </button>
                                        </td>
                                        <td className="p-4 text-stone-400">{group.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        Icon={QuestsIcon}
                        title="No Quest Groups Created Yet"
                        message="Create groups to organize your quests and assign them to users in bulk."
                        actionButton={<Button onClick={handleCreate}>Create Quest Group</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditQuestGroupDialog groupToEdit={editingGroup} onClose={() => setIsDialogOpen(false)} />}
            {assigningGroup && <AssignQuestGroupDialog group={assigningGroup} onClose={() => setAssigningGroup(null)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Groups' : 'Group'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} groups` : `the group`}? Quests in the group(s) will become uncategorized. This action cannot be undone.`}
            />
        </div>
    );
};

export default ManageQuestGroupsPage;
