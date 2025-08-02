import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { QuestGroup } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EllipsisVerticalIcon, QuestsIcon } from '@/components/ui/icons';
import EmptyState from '../ui/EmptyState';
import EditQuestGroupDialog from '../quests/EditQuestGroupDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import AssignQuestGroupDialog from '../quests/AssignQuestGroupDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ManageQuestGroupsPage: React.FC = () => {
    const { questGroups, settings } = useAppState();
    const { deleteQuestGroup } = useAppDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<QuestGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<QuestGroup | null>(null);
    const [assigningGroup, setAssigningGroup] = useState<QuestGroup | null>(null);

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
        if (deletingGroup) {
            deleteQuestGroup(deletingGroup.id);
        }
        setDeletingGroup(null);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Quest Groups</CardTitle>
                    <Button onClick={handleCreate} size="sm">Create New Group</Button>
                </CardHeader>
                <CardContent>
                {questGroups.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questGroups.map(group => (
                                    <tr key={group.id} className="border-b last:border-b-0">
                                        <td className="p-4 font-bold">{group.icon} {group.name}</td>
                                        <td className="p-4 text-muted-foreground">{group.description}</td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleAssign(group)}>Assign to Users</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(group)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setDeletingGroup(group)} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
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
                </CardContent>
            </Card>

            {isDialogOpen && <EditQuestGroupDialog groupToEdit={editingGroup} onClose={() => setIsDialogOpen(false)} />}
            {assigningGroup && <AssignQuestGroupDialog group={assigningGroup} onClose={() => setAssigningGroup(null)} />}
            
            <ConfirmDialog
                isOpen={!!deletingGroup}
                onClose={() => setDeletingGroup(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Quest Group"
                message={`Are you sure you want to delete the group "${deletingGroup?.name}"? Quests in this group will become uncategorized. This action cannot be undone.`}
            />
        </div>
    );
};

export default ManageQuestGroupsPage;