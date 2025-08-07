import React, { useState, useEffect } from 'react';
import { QuestGroup } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAppDispatch } from '../../context/AppContext';
import EmojiPicker from '../ui/EmojiPicker';

interface EditQuestGroupDialogProps {
    groupToEdit: QuestGroup | null;
    onClose: () => void;
}

const EditQuestGroupDialog: React.FC<EditQuestGroupDialogProps> = ({ groupToEdit, onClose }) => {
    const { addQuestGroup, updateQuestGroup } = useAppDispatch();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '📂',
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        if (groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                description: groupToEdit.description,
                icon: groupToEdit.icon,
            });
        }
    }, [groupToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupToEdit) {
            updateQuestGroup({ ...groupToEdit, ...formData });
        } else {
            addQuestGroup(formData);
        }
        onClose();
    };

    const dialogTitle = groupToEdit ? 'Edit Quest Group' : 'Create New Quest Group';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Group Name"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        required
                    />
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                            className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                                className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2"
                            >
                                <span className="text-2xl">{formData.icon}</span>
                                <span className="text-stone-300">Click to change</span>
                            </button>
                            {isEmojiPickerOpen && (
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        setFormData(p => ({ ...p, icon: emoji }));
                                        setIsEmojiPickerOpen(false);
                                    }}
                                    onClose={() => setIsEmojiPickerOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{groupToEdit ? 'Save Changes' : 'Create Group'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditQuestGroupDialog;