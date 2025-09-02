import React, { useState, useMemo, useRef, useEffect } from 'react';
import { QuestGroup } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditQuestGroupDialog from '../../quests/EditQuestGroupDialog';
import { useCommunityDispatch, useCommunityState } from '../../../context/CommunityContext';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import AssignQuestGroupDialog from '../../quests/AssignQuestGroupDialog';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import { useQuestsState } from '../../../context/QuestsContext';
import QuestGroupTable from '../../quest-groups/QuestGroupTable';
import { useUIState } from '../../../context/UIContext';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';

const QuestGroupCard: React.FC<{
    group: QuestGroup;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (group: QuestGroup) => void;
    onAssign: (group: QuestGroup) => void;
    onDeleteRequest: (groupId: string) => void;
}> = ({ group, isSelected, onToggle, onEdit, onAssign, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { quests } = useQuestsState();
    // FIX: Property 'groupId' does not exist on type 'Quest'. Did you mean 'groupIds'?
    const questCount = useMemo(() => quests.filter(q => q.groupIds?.includes(group.id)).length, [quests, group.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4 border border-stone-700">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="text-2xl flex-shrink-0">{group.icon}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{group.name}</p>
                <p className="text-sm text-stone-400">{questCount} quest(s)</p>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onAssign(group); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Assign</button>
                        <button onClick={() => { onEdit(group); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onDeleteRequest(group.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageQuestGroupsPage: React.FC = () => {
    const { settings } = useSystemState();
    const { questGroups } = useQuestsState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { isMobileView } = useUIState();
    
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
                {isMobileView ? (
                    <div className="space-y-3">
                        {questGroups.map(group => (
                            <QuestGroupCard
                                key={group.id}
                                group={group}
                                isSelected={selectedGroups.includes(group.id)}
                                onToggle={(e) => handleCheckboxClick(e, group.id)}
                                onEdit={handleEdit}
                                onAssign={handleAssign}
                                onDeleteRequest={(id) => setDeletingIds([id])}
                            />
                        ))}
                    </div>
                ) : (
                    <QuestGroupTable
                        questGroups={questGroups}
                        selectedGroups={selectedGroups}
                        setSelectedGroups={setSelectedGroups}
                        onEdit={handleEdit}
                        onAssign={handleAssign}
                        onDeleteRequest={(ids) => setDeletingIds(ids)}
                        onCreate={handleCreate}
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