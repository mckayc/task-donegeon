import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { QuestGroup } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { EllipsisVerticalIcon, QuestsIcon } from '../ui/Icons';
import EmptyState from '../ui/EmptyState';
import EditQuestGroupDialog from '../quests/EditQuestGroupDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import AssignQuestGroupDialog from '../quests/AssignQuestGroupDialog';

const ManageQuestGroupsPage: React.FC = () => {
    const { questGroups, settings } = useAppState();
    const { deleteQuestGroup } = useAppDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<QuestGroup | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<QuestGroup | null>(null);
    const [assigningGroup, setAssigningGroup] = useState<QuestGroup | null>(null);
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
            <Card
                title="All Quest Groups"
                headerAction={<Button onClick={handleCreate} size="sm">Create New Group</Button>}
            >
                {questGroups.length > 0 ? (
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
                                {questGroups.map(group => (
                                    <tr key={group.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{group.icon} {group.name}</td>
                                        <td className="p-4 text-stone-400">{group.description}</td>
                                        <td className="p-4 relative">
                                            <button onClick={() => setOpenDropdownId(openDropdownId === group.id ? null : group.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === group.id && (
                                                <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleAssign(group); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Assign</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(group); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { setDeletingGroup(group); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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