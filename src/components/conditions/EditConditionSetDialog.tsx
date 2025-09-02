

import React, { useState, useEffect } from 'react';
// Fix: Import Role from the main types file, not the local one.
import { Condition, ConditionSet, ConditionSetLogic, ConditionType, Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useQuestsState } from '../../context/QuestsContext';
// Fix: Removed unused and misspelled import.
import { useProgressionState } from '../../context/ProgressionContext';
import { PlusIcon, TrashIcon } from '../user-interface/Icons';

interface EditConditionSetDialogProps {
  conditionSet: ConditionSet | null;
  onClose: () => void;
  onSave: (conditionSet: ConditionSet) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ConditionEditor: React.FC<{
    condition: Condition;
    onUpdate: (updatedCondition: Condition) => void;
    onRemove: () => void;
}> = ({ condition, onUpdate, onRemove }) => {
    const { ranks } = useProgressionState();
    const { quests } = useQuestsState();

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as ConditionType;
        let newCondition: Condition;
        switch (newType) {
            case ConditionType.MinRank:
                newCondition = { type: newType, rankId: ranks[0]?.id || '', id: condition.id };
                break;
            case ConditionType.DayOfWeek:
                newCondition = { type: newType, days: [], id: condition.id };
                break;
            case ConditionType.DateRange:
                newCondition = { type: newType, start: '', end: '', id: condition.id };
                break;
            case ConditionType.QuestCompleted:
                newCondition = { type: newType, questId: quests[0]?.id || '', id: condition.id };
                break;
            default: return;
        }
        onUpdate(newCondition);
    };

    return (
        <div className="p-3 bg-stone-800/50 rounded-md space-y-2">
            <div className="flex justify-between items-center">
                <Input as="select" label="Condition Type" value={condition.type} onChange={handleTypeChange}>
                    <option value={ConditionType.MinRank}>Minimum Rank</option>
                    <option value={ConditionType.DayOfWeek}>Day of Week</option>
                    <option value={ConditionType.DateRange}>Date Range</option>
                    <option value={ConditionType.QuestCompleted}>Quest Completed</option>
                </Input>
                <button type="button" onClick={onRemove} className="mt-7 ml-2 text-red-400 hover:text-red-300">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {condition.type === ConditionType.MinRank && (
                <Input as="select" label="Rank" value={condition.rankId} onChange={e => onUpdate({ ...condition, rankId: e.target.value })}>
                    {ranks.sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Input>
            )}
            {condition.type === ConditionType.QuestCompleted && (
                <Input as="select" label="Quest" value={condition.questId} onChange={e => onUpdate({ ...condition, questId: e.target.value })}>
                    {quests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </Input>
            )}
             {condition.type === ConditionType.DateRange && (
                <div className="grid grid-cols-2 gap-3">
                    <Input type="date" label="Start Date" value={condition.start} onChange={e => onUpdate({ ...condition, start: e.target.value })} />
                    <Input type="date" label="End Date" value={condition.end} onChange={e => onUpdate({ ...condition, end: e.target.value })} />
                </div>
            )}
             {condition.type === ConditionType.DayOfWeek && (
                <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Days</label>
                    <div className="flex gap-2 flex-wrap">
                        {WEEKDAYS.map((day, dayIndex) => (
                            <label key={day} className="flex items-center gap-1.5 text-xs px-2 py-1 bg-stone-700 rounded-md cursor-pointer">
                                <input type="checkbox" checked={condition.days.includes(dayIndex)} onChange={e => {
                                    const newDays = e.target.checked
                                        ? [...condition.days, dayIndex]
                                        : condition.days.filter(d => d !== dayIndex);
                                    onUpdate({ ...condition, days: newDays });
                                }} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"/>
                                {day}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const EditConditionSetDialog: React.FC<EditConditionSetDialogProps> = ({ conditionSet, onClose, onSave }) => {
    const [formData, setFormData] = useState<ConditionSet>(() => {
        if (conditionSet) return JSON.parse(JSON.stringify(conditionSet));
        return {
            id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: '',
            description: '',
            logic: ConditionSetLogic.ALL,
            conditions: [],
        };
    });

    const addCondition = () => {
        const newCondition: Condition = { id: `cond-${Date.now()}`, type: ConditionType.MinRank, rankId: '' };
        setFormData(p => ({ ...p, conditions: [...p.conditions, newCondition] }));
    };

    const updateCondition = (index: number, updatedCondition: Condition) => {
        const newConditions = [...formData.conditions];
        newConditions[index] = updatedCondition;
        setFormData(p => ({ ...p, conditions: newConditions }));
    };

    const removeCondition = (index: number) => {
        setFormData(p => ({ ...p, conditions: p.conditions.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const dialogTitle = conditionSet ? 'Edit Condition Set' : 'Create New Condition Set';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-0 max-w-2xl w-full max-h-[90vh] flex flex-col">
                 <div className="p-8 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-3xl font-medieval text-emerald-400">{dialogTitle}</h2>
                </div>

                <form id="condition-set-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <Input label="Set Name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
                    <Input as="textarea" label="Description" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2} />
                    
                    <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                        <h3 className="font-semibold text-stone-200">Conditions Logic</h3>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="logic" checked={formData.logic === ConditionSetLogic.ALL} onChange={() => setFormData(p => ({ ...p, logic: ConditionSetLogic.ALL }))} />
                                <span>All conditions must be met (AND)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="logic" checked={formData.logic === ConditionSetLogic.ANY} onChange={() => setFormData(p => ({ ...p, logic: ConditionSetLogic.ANY }))} />
                                <span>Any condition can be met (OR)</span>
                            </label>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-stone-700/60">
                            {formData.conditions.map((condition, index) => (
                                <ConditionEditor
                                    key={condition.id}
                                    condition={condition}
                                    onUpdate={(updated) => updateCondition(index, updated)}
                                    onRemove={() => removeCondition(index)}
                                />
                            ))}
                        </div>
                        <Button type="button" variant="secondary" onClick={addCondition}>
                            <PlusIcon className="w-4 h-4 mr-2"/> Add Condition
                        </Button>
                    </div>
                </form>

                <div className="p-6 border-t border-stone-700/60 mt-auto flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="condition-set-form">{conditionSet ? 'Save Changes' : 'Create Set'}</Button>
                </div>
            </div>
        </div>
    );
};

export default EditConditionSetDialog;
