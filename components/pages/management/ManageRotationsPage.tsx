import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { Rotation, SystemNotificationType } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import EmptyState from '../../user-interface/EmptyState';
import EditRotationDialog from '../../rotations/EditRotationDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { toYMD } from '../../../utils/quests';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';

const ManageRotationsPage: React.FC = () => {
    const { settings, rotations, quests } = useData();
    const { deleteSelectedAssets, updateQuest, updateRotation, addSystemNotification } = useActionsDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
    const [deletingRotation, setDeletingRotation] = useState<Rotation | null>(null);
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
        setEditingRotation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rotation: Rotation) => {
        setEditingRotation(rotation);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingRotation) {
            deleteSelectedAssets({ rotations: [deletingRotation.id] });
        }
        setDeletingRotation(null);
    };

    const handleRunRotation = (rotationId: string) => {
        const rotation = rotations.find(r => r.id === rotationId);
        if (!rotation || rotation.questIds.length === 0 || rotation.userIds.length === 0) {
            addNotification({ type: 'error', message: 'Rotation is not configured with quests and users.' });
            return;
        }

        const nextUserIndex = (rotation.lastUserIndex + 1) % rotation.userIds.length;
        const nextQuestIndex = (rotation.lastQuestIndex + 1) % rotation.questIds.length;
        
        const userIdToAssign = rotation.userIds[nextUserIndex];
        const questIdToAssign = rotation.questIds[nextQuestIndex];
        const questToAssign = quests.find(q => q.id === questIdToAssign);

        if (!questToAssign) {
            addNotification({ type: 'error', message: `Quest with ID ${questIdToAssign} not found in rotation.` });
            return;
        }

        updateQuest({ ...questToAssign, assignedUserIds: [userIdToAssign] });
        addSystemNotification({
            type: SystemNotificationType.QuestAssigned,
            message: `You have been assigned a new quest: "${questToAssign.title}"`,
            recipientUserIds: [userIdToAssign],
            link: 'Quests',
            guildId: questToAssign.guildId
        });
        
        updateRotation({
            ...rotation,
            lastUserIndex: nextUserIndex,
            lastQuestIndex: nextQuestIndex,
            lastAssignmentDate: toYMD(new Date()),
        });
        
        addNotification({ type: 'success', message: `Assigned "${questToAssign.title}" to the next user.` });
    };

    return (
        <div className="space-y-6">
            <Card
                title={settings.terminology.link_manage_rotations}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Rotation</Button>}
            >
                {rotations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Frequency</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rotations.map(rotation => (
                                    <tr key={rotation.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4 font-bold">{rotation.name}</td>
                                        <td className="p-4 text-stone-400">{rotation.description}</td>
                                        <td className="p-4 text-stone-300 capitalize">{rotation.frequency.toLowerCase()}</td>
                                        <td className="p-4 relative">
                                            <Button variant="secondary" size="sm" onClick={() => handleRunRotation(rotation.id)}>Run Now</Button>
                                            <button onClick={() => setOpenDropdownId(openDropdownId === rotation.id ? null : rotation.id)} className="p-2 rounded-full hover:bg-stone-700/50 ml-2">
                                                <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                            </button>
                                            {openDropdownId === rotation.id && (
                                                <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(rotation); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                    <button onClick={() => { setDeletingRotation(rotation); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                        Icon={() => <span className="text-4xl">🔄</span>}
                        title="No Rotations Created Yet"
                        message="Create a rotation to automatically assign a pool of quests to a group of users on a schedule."
                        actionButton={<Button onClick={handleCreate}>Create Rotation</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditRotationDialog rotationToEdit={editingRotation} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={!!deletingRotation}
                onClose={() => setDeletingRotation(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Rotation"
                message={`Are you sure you want to delete the rotation "${deletingRotation?.name}"? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageRotationsPage;