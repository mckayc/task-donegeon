


import React, { useState, useEffect, useMemo } from 'react';
import { QuestGroup, Quest } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useQuestsDispatch, useQuestsState } from '../../context/QuestsContext';
import EmojiPicker from '../user-interface/EmojiPicker';
// FIX: Removed unused and non-existent ChevronRightIcon import.


interface EditQuestGroupDialogProps {
    groupToEdit: QuestGroup | null;
    onClose: () => void;
}

const QuestAssignmentItem: React.FC<{ quest: Quest, onClick: () => void }> = ({ quest, onClick }) => (
    <button type="button" onClick={onClick} className="w-full text-left p-2 rounded-md hover:bg-stone-700/50 flex items-center gap-2">
        <span className="text-xl">{quest.icon}</span>
        <span className="text-sm text-stone-300 truncate">{quest.title}</span>
    </button>
);

const EditQuestGroupDialog: React.FC<EditQuestGroupDialogProps> = ({ groupToEdit, onClose }) => {
    const { addQuestGroup, updateQuestGroup } = useQuestsDispatch();
    const { quests: allQuests } = useQuestsState();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '📂',
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [assignedQuestIds, setAssignedQuestIds] = useState<string[]>([]);
    const [questSearch, setQuestSearch] = useState('');
    const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
    const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);

    useEffect(() => {
        if (groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                description: groupToEdit.description,
                icon: groupToEdit.icon,
            });
            setAssignedQuestIds(allQuests.filter(q => q.groupIds?.includes(groupToEdit.id)).map(q => q.id));
        }
    }, [groupToEdit, allQuests]);

    const { availableQuests, assignedQuests } = useMemo(() => {
        const assigned = new Set(assignedQuestIds);
        const available = allQuests.filter(q => 
            !assigned.has(q.id) &&
            q.title.toLowerCase().includes(questSearch.toLowerCase())
        );
        return {
            availableQuests: available,
            assignedQuests: allQuests.filter(q => assigned.has(q.id)),
        };
    }, [assignedQuestIds, allQuests, questSearch]);

    const handleTransfer = (ids: string[], direction: 'assign' | 'unassign') => {
        if (direction === 'assign') {
            setAssignedQuestIds(prev => [...new Set([...prev, ...ids])]);
            setSelectedAvailable([]);
        } else {
            setAssignedQuestIds(prev => prev.filter(id => !ids.includes(id)));
            setSelectedAssigned([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPayload = { ...formData, questIds: assignedQuestIds };
        if (groupToEdit) {
            updateQuestGroup({ ...groupToEdit, ...finalPayload });
        } else {
            addQuestGroup(finalPayload);
        }
        onClose();
    };

    const dialogTitle = groupToEdit ? 'Edit Quest Group' : 'Create New Quest Group';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-0 max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                </div>
                <form id="quest-group-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Group Name"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                        />
                         <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                                    className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2 h-10"
                                >
                                    <span className="text-2xl">{formData.icon}</span>
                                    <span className="text-stone-300">Click to change</span>
                                </button>
                                {isEmojiPickerOpen && (
                                    <EmojiPicker
                                        onSelect={(emoji: string) => {
                                            setFormData(p => ({ ...p, icon: emoji }));
                                            setIsEmojiPickerOpen(false);
                                        }}
                                        onClose={() => setIsEmojiPickerOpen(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <Input as="textarea"
                        label="Description"
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    />

                    <div className="pt-6 border-t border-stone-700/60">
                        <h3 className="text-lg font-bold text-stone-200 mb-4">Assign Quests</h3>
                        <div className="grid grid-cols-2 gap-4 items-stretch" style={{height: '300px'}}>
                            {/* Available Quests Panel */}
                            <div className="flex flex-col border border-stone-700/80 rounded-lg p-3">
                                <h4 className="font-semibold text-stone-300 mb-2">Available Quests</h4>
                                <Input placeholder="Search..." value={questSearch} onChange={e => setQuestSearch(e.target.value)} className="mb-2"/>
                                <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                                    {availableQuests.map(quest => (
                                        <QuestAssignmentItem key={quest.id} quest={quest} onClick={() => handleTransfer([quest.id], 'assign')} />
                                    ))}
                                </div>
                            </div>
                            
                            {/* Assigned Quests Panel */}
                            <div className="flex flex-col border border-stone-700/80 rounded-lg p-3">
                                <h4 className="font-semibold text-stone-300 mb-2">Quests in this Group</h4>
                                <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                                    {assignedQuests.map(quest => (
                                        <QuestAssignmentItem key={quest.id} quest={quest} onClick={() => handleTransfer([quest.id], 'unassign')} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                <div className="p-6 mt-auto border-t border-stone-700/60 flex-shrink-0 flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="quest-group-form">{groupToEdit ? 'Save Changes' : 'Create Group'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditQuestGroupDialog;