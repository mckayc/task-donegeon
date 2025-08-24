import React, { useState, useMemo } from 'react';
import { QuestGroup } from 'types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditQuestGroupDialog from '../../quests/EditQuestGroupDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import AssignQuestGroupDialog from '../../quests/AssignQuestGroupDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import { useQuestsState } from '../../../context/QuestsContext';
import QuestGroupTable from '../../quest-groups/QuestGroupTable';

const ManageQuestGroupsPage: React.FC = () => {
    const { settings } = useSystemState();
    const { questGroups } = useQuestsState();
    const { deleteSelectedAssets } = useSystemDispatch();
    
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
                <QuestGroupTable
                    questGroups={questGroups}
                    selectedGroups={selectedGroups}
                    setSelectedGroups={setSelectedGroups}
                    onEdit={handleEdit}
                    onAssign={handleAssign}
                    onDeleteRequest={(ids) => setDeletingIds(ids)}
                    onCreate={handleCreate}
                />
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