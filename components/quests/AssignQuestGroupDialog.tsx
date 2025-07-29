import React, { useState } from 'react';
import { QuestGroup } from '../../frontendTypes';
import Button from '../ui/Button';
import { useAppDispatch, useAppState } from '../../context/AppContext';

interface AssignQuestGroupDialogProps {
    group: QuestGroup;
    onClose: () => void;
}

const AssignQuestGroupDialog: React.FC<AssignQuestGroupDialogProps> = ({ group, onClose }) => {
    const { users } = useAppState();
    const { assignQuestGroupToUsers, addNotification } = useAppDispatch();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => users.map(u => u.id));

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map(u => u.id));
        }
    };
    
    const handleSubmit = () => {
        if (selectedUserIds.length > 0) {
            assignQuestGroupToUsers(group.id, selectedUserIds);
            addNotification({ type: 'success', message: `Assigned "${group.name}" quests to ${selectedUserIds.length} user(s).` });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[80vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400">Assign "{group.name}"</h2>
                <p className="text-stone-400 mb-6">Assign all quests in this group to selected users.</p>

                <div className="border-y border-stone-700/60 py-2 flex justify-between items-center mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedUserIds.length === users.length}
                            onChange={handleSelectAll}
                            className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                        />
                         <span className="font-semibold text-stone-200">Select / Deselect All</span>
                    </label>
                </div>

                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {users.map(user => (
                        <label key={user.id} className="flex items-center p-3 rounded-md hover:bg-stone-700/50 cursor-pointer border border-transparent has-[:checked]:bg-stone-700/60 has-[:checked]:border-stone-600/80 transition-colors">
                            <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => handleToggleUser(user.id)}
                                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                            />
                            <div className="ml-3">
                                <span className="font-semibold text-stone-200">{user.gameName}</span>
                                <span className="text-sm text-stone-400 ml-2">({user.role})</span>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={selectedUserIds.length === 0}>
                        Assign to {selectedUserIds.length} User(s)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssignQuestGroupDialog;
