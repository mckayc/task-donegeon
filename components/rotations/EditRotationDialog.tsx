import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAuthState } from '../../context/AuthContext';
import { Rotation, Quest, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';

interface EditRotationDialogProps {
    rotationToEdit: Rotation | null;
    onClose: () => void;
}

const WEEKDAYS = [
    { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }
];

const EditRotationDialog: React.FC<EditRotationDialogProps> = ({ rotationToEdit, onClose }) => {
    const { addRotation, updateRotation } = useAppDispatch();
    const { quests } = useAppState();
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
        
        const payload = {
            ...formData,
            // These are managed by the backend, but we need to initialize them.
            lastAssignmentDate: null,
            lastUserIndex: -1,
            lastQuestIndex: -1,
        };

        if (rotationToEdit) {
            updateRotation({ ...rotationToEdit, ...payload });
        } else {
            addRotation(payload);
        }
        onClose();
    };

    const dialogTitle = rotationToEdit ? 'Edit Rotation' : 'Create New Rotation';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="rotation-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <Input label="Rotation Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                    <Input as="textarea" label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                    
                     <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-stone-200">Schedule</h3>
                        <p className="text-sm text-stone-400 -mt-2">Select which days this rotation is active. This will override any schedule on the individual quests.</p>
                        <div className="flex justify-center gap-2">
                            {WEEKDAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => handleToggleDay(day.value)}
                                    className={`w-10 h-10 rounded-full font-bold transition-colors ${formData.activeDays.includes(day.value) ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}
                                >
                                    {day.label.charAt(0)}
                                </button>
                            ))}
                        </div>
                        <Input as="select" label="Rotation Frequency" value={formData.frequency} onChange={e => setFormData(p => ({...p, frequency: e.target.value as 'DAILY' | 'WEEKLY'}))}>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                        </Input>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-semibold text-stone-200 mb-2">Quests in Rotation ({formData.questIds.length})</h3>
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                                {quests.map(quest => (
                                    <label key={quest.id} className="flex items-center p-2 rounded-md hover:bg-stone-800/50 cursor-pointer">
                                        <input type="checkbox" checked={formData.questIds.includes(quest.id)} onChange={() => handleToggleSelection('questIds', quest.id)} className="h-4 w-4 rounded text-emerald-600" />
                                        <span className="ml-2 text-stone-300 truncate">{quest.icon} {quest.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-semibold text-stone-200 mb-2">Users in Rotation ({formData.userIds.length})</h3>
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center p-2 rounded-md hover:bg-stone-800/50 cursor-pointer">
                                        <input type="checkbox" checked={formData.userIds.includes(user.id)} onChange={() => handleToggleSelection('userIds', user.id)} className="h-4 w-4 rounded text-emerald-600" />
                                        <span className="ml-2 text-stone-300 truncate">{user.gameName}</span>
                                    </label>
                                ))}
                            </div>
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