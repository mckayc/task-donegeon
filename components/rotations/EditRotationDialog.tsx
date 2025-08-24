
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from '../../context/AuthContext';
import { Rotation, Quest, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import RotationQuestCard from './RotationQuestCard';
import ToggleSwitch from '../user-interface/ToggleSwitch';

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

    const [formData, setFormData] = useState<Omit<Rotation, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: '',
        questIds: [],
        userIds: [],
        activeDays: [1, 2, 3, 4, 5], // Default to weekdays
        frequency: 'DAILY',
        lastAssignmentDate: null,
        lastUserIndex: -1,
        lastQuestStartIndex: -1,
        questsPerUser: 1,
        isActive: true,
        startDate: null,
        endDate: null,
    });
    
    const [questSearchTerm, setQuestSearchTerm] = useState('');
    const [useStartDate, setUseStartDate] = useState(!!rotationToEdit?.startDate);
    const [useEndDate, setUseEndDate] = useState(!!rotationToEdit?.endDate);

    useEffect(() => {
        if (rotationToEdit) {
            setFormData({
                name: rotationToEdit.name,
                description: rotationToEdit.description,
                questIds: rotationToEdit.questIds,
                userIds: rotationToEdit.userIds,
                activeDays: rotationToEdit.activeDays.map(Number),
                frequency: rotationToEdit.frequency,
                lastAssignmentDate: rotationToEdit.lastAssignmentDate,
                lastUserIndex: rotationToEdit.lastUserIndex,
                lastQuestStartIndex: rotationToEdit.lastQuestStartIndex,
                questsPerUser: rotationToEdit.questsPerUser || 1,
                isActive: rotationToEdit.isActive,
                startDate: rotationToEdit.startDate,
                endDate: rotationToEdit.endDate,
            });
            setUseStartDate(!!rotationToEdit.startDate);
            setUseEndDate(!!rotationToEdit.endDate);
        }
    }, [rotationToEdit]);
    
     useEffect(() => {
        if (!useStartDate) {
            setFormData(p => ({ ...p, startDate: null }));
        }
    }, [useStartDate]);

    useEffect(() => {
        if (!useEndDate) {
            setFormData(p => ({ ...p, endDate: null }));
        }
    }, [useEndDate]);

    const filteredQuests = useMemo(() => {
        return quests.filter(q => q.title.toLowerCase().includes(questSearchTerm.toLowerCase()));
    }, [quests, questSearchTerm]);

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
        const finalData = { ...formData };

        if (rotationToEdit) {
            updateRotation({ ...rotationToEdit, ...finalData });
        } else {
            addRotation(finalData);
        }
        onClose();
    };
    
    const rotationPreview = useMemo(() => {
        const selectedQuests = quests.filter(q => formData.questIds.includes(q.id));
        const selectedUsers = users.filter(u => formData.userIds.includes(u.id));

        if (selectedQuests.length === 0 || selectedUsers.length === 0) return [];
        
        const { questsPerUser, lastUserIndex, lastQuestStartIndex } = formData;
        const numUsers = selectedUsers.length;
        const numQuests = selectedQuests.length;

        const questsToAssignTotal = Math.min(numUsers * questsPerUser, numQuests);
        
        const startUserIndex = (lastUserIndex + 1) % numUsers;
        const startQuestIndex = (lastQuestStartIndex + 1) % numQuests;
        
        const results = [];
        for (let i = 0; i < questsToAssignTotal; i++) {
            const user = selectedUsers[(startUserIndex + i) % numUsers];
            const quest = selectedQuests[(startQuestIndex + i) % numQuests];
            results.push({
                turn: i + 1,
                userName: user.gameName,
                questTitle: quest.title,
                questIcon: quest.icon,
            });
        }
        return results;
    }, [formData, quests, users]);

    const dialogTitle = rotationToEdit ? 'Edit Rotation' : 'Create New Rotation';
    const isSaveDisabled = formData.questIds.length === 0;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-7xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="rotation-form" onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden">
                    {/* Left Column: Configuration */}
                    <div className="space-y-4 overflow-y-auto pr-2 flex flex-col">
                        <Input label="Rotation Name" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))} required />
                        <Input as="textarea" label="Description" value={formData.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, description: e.target.value }))} />
                        
                        <div className="flex-grow flex flex-col min-h-0">
                            <h3 className="text-sm font-medium text-stone-300 mb-1">Quests to Rotate ({formData.questIds.length} selected)</h3>
                            <Input placeholder="Search quests..." value={questSearchTerm} onChange={e => setQuestSearchTerm(e.target.value)} className="mb-2"/>
                            <div className="p-2 border border-stone-600 rounded-md flex-grow overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-2">
                                {filteredQuests.map(quest => (
                                    <RotationQuestCard
                                        key={quest.id}
                                        quest={quest}
                                        isSelected={formData.questIds.includes(quest.id)}
                                        onToggle={() => handleToggleSelection('questIds', quest.id)}
                                    />
                                ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-stone-300 mb-1">Users in Rotation ({formData.userIds.length} selected)</h3>
                            <div className="p-2 border border-stone-600 rounded-md h-40 overflow-y-auto">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-stone-700/50 cursor-pointer">
                                        <input type="checkbox" checked={formData.userIds.includes(user.id)} onChange={() => handleToggleSelection('userIds', user.id)} />
                                        <span>{user.gameName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Scheduling & Preview */}
                    <div className="space-y-4 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <Input as="select" label="Frequency" value={formData.frequency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({ ...p, frequency: e.target.value as 'DAILY' | 'WEEKLY' }))}>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                            </Input>
                            <Input
                                label="Max Quests Per User Per Run"
                                type="number"
                                min="1"
                                value={formData.questsPerUser}
                                onChange={e => setFormData(p => ({...p, questsPerUser: parseInt(e.target.value) || 1}))}
                            />
                        </div>
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

                         <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-semibold text-stone-200 mb-2">Schedule Window (Optional)</h3>
                            <div className="space-y-4">
                                <ToggleSwitch label="Set a Start Date" enabled={useStartDate} setEnabled={setUseStartDate} />
                                {useStartDate && (
                                    <Input label="Start Date" type="date" value={formData.startDate || ''} onChange={e => setFormData(p => ({...p, startDate: e.target.value}))} />
                                )}
                                <ToggleSwitch label="Set an End Date" enabled={useEndDate} setEnabled={setUseEndDate} />
                                {useEndDate && (
                                    <Input label="End Date" type="date" value={formData.endDate || ''} onChange={e => setFormData(p => ({...p, endDate: e.target.value}))} />
                                )}
                            </div>
                        </div>

                         <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-semibold text-stone-200 mb-2">Start Rotation From</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input as="select" label="Last User Assigned" value={formData.lastUserIndex} onChange={e => setFormData(p => ({...p, lastUserIndex: parseInt(e.target.value)}))}>
                                    <option value={-1}>No one (start at first user)</option>
                                    {users.filter(u => formData.userIds.includes(u.id)).map((u, i) => <option key={u.id} value={i}>{u.gameName}</option>)}
                                </Input>
                                <Input as="select" label="Last Quest Assigned" value={formData.lastQuestStartIndex} onChange={e => setFormData(p => ({...p, lastQuestStartIndex: parseInt(e.target.value)}))}>
                                     <option value={-1}>No quest (start at first quest)</option>
                                    {quests.filter(q => formData.questIds.includes(q.id)).map((q, i) => <option key={q.id} value={i}>{q.title}</option>)}
                                </Input>
                            </div>
                            <p className="text-xs text-stone-400 mt-2">The rotation will begin with the *next* user and quest in the sequence.</p>
                        </div>
                        
                         <div className="p-4 bg-stone-900/50 rounded-lg">
                            <h3 className="font-semibold text-stone-200 mb-2">Assignment Preview</h3>
                             <p className="text-xs text-stone-400 mb-3">This shows the order of assignments for the next run.</p>
                             <div className="h-48 overflow-y-auto pr-2 space-y-2">
                                {rotationPreview.map(item => (
                                    <div key={item.turn} className="flex items-center gap-2 text-sm p-1 bg-stone-800/60 rounded">
                                        <span className="font-bold text-stone-500 w-6 text-right">{item.turn}.</span>
                                        <span className="text-emerald-300 flex-1 truncate">{item.userName}</span>
                                        <span className="text-stone-300 flex-1 truncate">{item.questIcon} {item.questTitle}</span>
                                    </div>
                                ))}
                                {rotationPreview.length === 0 && <p className="text-center text-stone-500 pt-16">Select quests and users to see a preview.</p>}
                            </div>
                        </div>

                    </div>

                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-auto">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="rotation-form" disabled={isSaveDisabled}>{rotationToEdit ? 'Save Changes' : 'Create Rotation'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditRotationDialog;