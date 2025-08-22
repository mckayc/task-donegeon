import React, { useState, useEffect } from 'react';
import { useAuthState } from '../../context/AuthContext';
import { Rotation, Quest, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface EditRotationDialogProps {
    rotationToEdit: Rotation | null;
    onClose: () => void;
}

const WEEKDAYS = [
    { label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 },
    { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 }
];

const EditRotationDialog: React.FC<EditRotationDialogProps> = ({ rotationToEdit, onClose }) => {
    const { addRotation, updateRotation } = useQuestsDispatch();
    const { quests } = useQuestsState();
    const { users } = useAuthState();

    const [formData, setFormData] = useState<Omit<Rotation, 'id' | 'createdAt' | 'updatedAt' | 'lastAssignmentDate' | 'lastUserIndex' | 'lastQuestIndex'>>({
        name: '',
        description: '',
        questIds: [],
        userIds: [],
        activeDays: [1, 2, 3, 4, 5], // Default to weekdays
        frequency: 'DAILY',
    });

    useEffect(() => {
        if (rotationToEdit) {
            setFormData({
                name: rotationToEdit.name,
                description: rotationToEdit.description,
                questIds: rotationToEdit.questIds,
                userIds: rotationToEdit.userIds,
                activeDays: rotationToEdit.activeDays,
                frequency: rotationToEdit.frequency,
            });
        }
    }, [rotationToEdit]);

    const handleToggleSelection = (type: 'questIds' | 'userIds', id: string) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].includes(id)
                ? prev[type].filter(currentId => currentId !== id)
                : [...prev[type], id]
        }));
    };

    const handleToggleDay = (dayValue: number) => {
         setFormData(prev => ({
            ...prev,
            activeDays: prev.activeDays.includes(dayValue)
                ? prev.activeDays.filter(d => d !== dayValue)
                : [...prev.activeDays, dayValue].sort()
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            lastAssignmentDate: null,
            lastUserIndex: -1,
            lastQuestIndex: -1,
        };

        if (rotationToEdit) {
            updateRotation({ ...rotationToEdit, ...finalData });
        } else {
            addRotation(finalData);
        }
        onClose();
    };

    const dialogTitle = rotationToEdit ? 'Edit Rotation' : 'Create New Rotation';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="rotation-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <Input label="Rotation Name" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <Input as="textarea" label="Description" value={formData.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, description: e.target.value }))} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-stone-300 mb-1">Quests to Rotate</h3>
                            <div className="p-2 border border-stone-600 rounded-md h-48 overflow-y-auto">
                                {quests.map(quest => (
                                    <label key={quest.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-stone-700/50">
                                        <input type="checkbox" checked={formData.questIds.includes(quest.id)} onChange={() => handleToggleSelection('questIds', quest.id)} />
                                        <span>{quest.icon} {quest.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-stone-300 mb-1">Users in Rotation</h3>
                            <div className="p-2 border border-stone-600 rounded-md h-48 overflow-y-auto">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-stone-700/50">
                                        <input type="checkbox" checked={formData.userIds.includes(user.id)} onChange={() => handleToggleSelection('userIds', user.id)} />
                                        <span>{user.gameName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <Input as="select" label="Frequency" value={formData.frequency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({ ...p, frequency: e.target.value as 'DAILY' | 'WEEKLY' }))}>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                    </Input>
                    
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Active on Days</label>
                        <div className="flex justify-center gap-1">
                            {WEEKDAYS.map(day => (
                                <button key={day.value} type="button" onClick={() => handleToggleDay(day.value)} className={`w-10 h-10 rounded-full font-bold transition-colors ${formData.activeDays.includes(day.value) ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-auto">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="rotation-form">{rotationToEdit ? 'Save Changes' : 'Create Rotation'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditRotationDialog;