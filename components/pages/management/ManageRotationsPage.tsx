import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataProvider';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { Rotation, SystemNotificationType } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EmptyState from '../../user-interface/EmptyState';
import EditRotationDialog from '../../rotations/EditRotationDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { toYMD } from '../../../utils/quests';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { PencilIcon, PlayIcon, TrashIcon } from '../../user-interface/Icons';

const ManageRotationsPage: React.FC = () => {
    const { settings, rotations, quests } = useData();
    const { deleteSelectedAssets, updateQuest, updateRotation, addSystemNotification } = useActionsDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedRotations, setSelectedRotations] = useState<string[]>([]);

    const rotationIds = useMemo(() => rotations.map(r => r.id), [rotations]);
    const handleCheckboxClick = useShiftSelect(rotationIds, selectedRotations, setSelectedRotations);

    const handleCreate = () => {
        setEditingRotation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rotation: Rotation) => {
        setEditingRotation(rotation);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ rotations: deletingIds });
        }
        setDeletingIds([]);
        setSelectedRotations(prev => prev.filter(id => !deletingIds.includes(id)));
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRotations(e.target.checked ? rotationIds : []);
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
                 {selectedRotations.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedRotations.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => handleRunRotation(selectedRotations[0])} disabled={selectedRotations.length !== 1}>Run Now</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedRotations)}>Delete</Button>
                    </div>
                )}
                {rotations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedRotations.length === rotationIds.length && rotationIds.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Description</th>
                                    <th className="p-4 font-semibold">Frequency</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rotations.map(rotation => (
                                    <tr key={rotation.id} className="border-b border-stone-700/40 last:border-b-0">
                                         <td className="p-4">
                                            <input type="checkbox" checked={selectedRotations.includes(rotation.id)} onChange={(e) => handleCheckboxClick(e, rotation.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                                        </td>
                                        <td className="p-4 font-bold">
                                             {rotation.name}
                                        </td>
                                        <td className="p-4 text-stone-400">{rotation.description}</td>
                                        <td className="p-4 text-stone-300 capitalize">{rotation.frequency.toLowerCase()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" title="Run Now" onClick={() => handleRunRotation(rotation.id)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <PlayIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(rotation)} className="h-8 w-8 text-stone-400 hover:text-white">
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeletingIds([rotation.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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
                        Icon={() => <span className="text-4xl">🔄</span>}
                        title="No Rotations Created Yet"
                        message="Create a rotation to automatically assign a pool of quests to a group of users on a schedule."
                        actionButton={<Button onClick={handleCreate}>Create Rotation</Button>}
                    />
                )}
            </Card>

            {isDialogOpen && <EditRotationDialog rotationToEdit={editingRotation} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Rotations' : 'Rotation'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} rotations` : `this rotation`}? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageRotationsPage;