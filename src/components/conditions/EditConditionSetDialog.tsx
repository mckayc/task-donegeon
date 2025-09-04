import React, { useState, useEffect } from 'react';
import { Condition, ConditionSet, ConditionSetLogic, ConditionType, Role, QuestCompletionStatus } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useQuestsState } from '../../context/QuestsContext';
import { useProgressionState } from '../../context/ProgressionContext';
import { PlusIcon, TrashIcon } from '../user-interface/Icons';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useAuthState } from '../../context/AuthContext';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import ExemptionSelectorDialog from './ExemptionSelectorDialog';

interface EditConditionSetDialogProps {
  conditionSet: ConditionSet | null;
  onClose: () => void;
  onSave: (conditionSet: ConditionSet) => void;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_OPTIONS: { value: QuestCompletionStatus, label: string }[] = [
    { value: QuestCompletionStatus.Approved, label: 'Completed (Approved)' },
    { value: QuestCompletionStatus.Pending, label: 'Pending Approval' },
    { value: QuestCompletionStatus.Rejected, label: 'Incomplete (Rejected)' },
];


const ConditionEditor: React.FC<{
    condition: Condition;
    onUpdate: (updatedCondition: Condition) => void;
    onRemove: () => void;
}> = ({ condition, onUpdate, onRemove }) => {
    const { ranks, trophies } = useProgressionState();
    const { quests, questGroups } = useQuestsState();
    const { gameAssets } = useEconomyState();
    const { guilds } = useCommunityState();

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
            case ConditionType.TimeOfDay:
                newCondition = { type: newType, start: '09:00', end: '17:00', id: condition.id };
                break;
            case ConditionType.QuestCompleted:
                newCondition = { type: newType, questId: quests[0]?.id || '', requiredStatuses: [QuestCompletionStatus.Approved], id: condition.id };
                break;
            case ConditionType.QuestGroupCompleted:
                newCondition = { type: newType, questGroupId: questGroups[0]?.id || '', requiredStatuses: [QuestCompletionStatus.Approved], id: condition.id };
                break;
            case ConditionType.TrophyAwarded:
                newCondition = { type: newType, trophyId: trophies[0]?.id || '', id: condition.id };
                break;
            case ConditionType.UserHasItem:
                newCondition = { type: newType, assetId: gameAssets[0]?.id || '', id: condition.id };
                break;
            case ConditionType.UserDoesNotHaveItem:
                newCondition = { type: newType, assetId: gameAssets[0]?.id || '', id: condition.id };
                break;
            case ConditionType.UserIsMemberOfGuild:
                newCondition = { type: newType, guildId: guilds[0]?.id || '', id: condition.id };
                break;
            case ConditionType.UserHasRole:
                newCondition = { type: newType, role: Role.Explorer, id: condition.id };
                break;
            default: return;
        }
        onUpdate(newCondition);
    };
    
    const handleStatusToggle = (status: QuestCompletionStatus) => {
        if ('requiredStatuses' in condition) {
            const currentStatuses = condition.requiredStatuses || [];
            const newStatuses = currentStatuses.includes(status)
                ? currentStatuses.filter(s => s !== status)
                : [...currentStatuses, status];
            // Ensure at least one status is selected, default to Approved if empty
            onUpdate({ ...condition, requiredStatuses: newStatuses.length > 0 ? newStatuses : [QuestCompletionStatus.Approved] });
        }
    };

    return (
        <div className="p-3 bg-stone-800/50 rounded-md space-y-2">
            <div className="flex justify-between items-center">
                <Input as="select" label="Condition Type" value={condition.type} onChange={handleTypeChange}>
                    <option value={ConditionType.MinRank}>Minimum Rank</option>
                    <option value={ConditionType.DayOfWeek}>Day of Week</option>
                    <option value={ConditionType.DateRange}>Date Range</option>
                    <option value={ConditionType.TimeOfDay}>Time of Day</option>
                    <option value={ConditionType.QuestCompleted}>Quest Completed</option>
                    <option value={ConditionType.QuestGroupCompleted}>Quest Group Completed</option>
                    <option value={ConditionType.TrophyAwarded}>Trophy Awarded</option>
                    <option value={ConditionType.UserHasItem}>User Has Item</option>
                    <option value={ConditionType.UserDoesNotHaveItem}>User Does Not Have Item</option>
                    <option value={ConditionType.UserIsMemberOfGuild}>User is Member of Guild</option>
                    <option value={ConditionType.UserHasRole}>User Has Role</option>
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
            {condition.type === ConditionType.TimeOfDay && (
                <div className="grid grid-cols-2 gap-3">
                    <Input type="time" label="Start Time" value={condition.start} onChange={e => onUpdate({ ...condition, start: e.target.value })} />
                    <Input type="time" label="End Time" value={condition.end} onChange={e => onUpdate({ ...condition, end: e.target.value })} />
                </div>
            )}
            {condition.type === ConditionType.QuestGroupCompleted && (
                <Input as="select" label="Quest Group" value={condition.questGroupId} onChange={e => onUpdate({ ...condition, questGroupId: e.target.value })}>
                    {questGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Input>
            )}
            {condition.type === ConditionType.TrophyAwarded && (
                <Input as="select" label="Trophy" value={condition.trophyId} onChange={e => onUpdate({ ...condition, trophyId: e.target.value })}>
                    {trophies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Input>
            )}
            {(condition.type === ConditionType.UserHasItem || condition.type === ConditionType.UserDoesNotHaveItem) && (
                <Input as="select" label="Item" value={condition.assetId} onChange={e => onUpdate({ ...condition, assetId: e.target.value })}>
                    {gameAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Input>
            )}
            {condition.type === ConditionType.UserIsMemberOfGuild && (
                 <Input as="select" label="Guild" value={condition.guildId} onChange={e => onUpdate({ ...condition, guildId: e.target.value })}>
                    {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Input>
            )}
            {condition.type === ConditionType.UserHasRole && (
                <Input as="select" label="Role" value={condition.role} onChange={e => onUpdate({ ...condition, role: e.target.value as Role })}>
                    <option value={Role.Explorer}>Explorer</option>
                    <option value={Role.Gatekeeper}>Gatekeeper</option>
                    <option value={Role.DonegeonMaster}>Donegeon Master</option>
                </Input>
            )}
            {(condition.type === ConditionType.QuestCompleted || condition.type === ConditionType.QuestGroupCompleted) && (
                <div className="mt-2 space-y-2">
                    <label className="block text-sm font-medium text-stone-300">Required Status(es)</label>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map(opt => (
                            <label key={opt.value} className="flex items-center gap-1.5 text-xs px-2 py-1 bg-stone-700 rounded-md cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={condition.requiredStatuses?.includes(opt.value)}
                                    onChange={() => handleStatusToggle(opt.value)}
                                    className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-stone-500">The condition passes if the quest has any selected status. At least one must be selected.</p>
                </div>
            )}
        </div>
    );
};

const EditConditionSetDialog: React.FC<EditConditionSetDialogProps> = ({ conditionSet, onClose, onSave }) => {
    const { users } = useAuthState();
    const { quests, questGroups } = useQuestsState();
    const { markets } = useEconomyState();
    const [formData, setFormData] = useState<ConditionSet>(() => {
        if (conditionSet) return JSON.parse(JSON.stringify(conditionSet));
        return {
            id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: '',
            description: '',
            logic: ConditionSetLogic.ALL,
            conditions: [],
            assignedUserIds: [],
            isGlobal: false,
            exemptQuestIds: [],
            exemptMarketIds: [],
        };
    });
    const [limitToUsers, setLimitToUsers] = useState(!!(conditionSet?.assignedUserIds && conditionSet.assignedUserIds.length > 0));
    const [isExemptionSelectorOpen, setIsExemptionSelectorOpen] = useState(false);

    useEffect(() => {
        if (!formData.isGlobal) return;

        const autoExemptedQuestIds = new Set<string>(formData.exemptQuestIds || []);
        let changed = false;

        formData.conditions.forEach(condition => {
            if (condition.type === ConditionType.QuestCompleted) {
                if (!autoExemptedQuestIds.has(condition.questId)) {
                    autoExemptedQuestIds.add(condition.questId);
                    changed = true;
                }
            } else if (condition.type === ConditionType.QuestGroupCompleted) {
                const questsInGroup = quests.filter(q => q.groupIds?.includes(condition.questGroupId));
                questsInGroup.forEach(q => {
                    if (!autoExemptedQuestIds.has(q.id)) {
                        autoExemptedQuestIds.add(q.id);
                        changed = true;
                    }
                });
            }
        });

        if (changed) {
            setFormData(p => ({ ...p, exemptQuestIds: Array.from(autoExemptedQuestIds) }));
        }
    }, [formData.isGlobal, formData.conditions, quests, formData.exemptQuestIds]);


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

    const handleExemptionSave = (questIds: string[], marketIds: string[]) => {
        setFormData(p => ({ ...p, exemptQuestIds: questIds, exemptMarketIds: marketIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPayload = {
            ...formData,
            assignedUserIds: limitToUsers ? formData.assignedUserIds : undefined,
            logic: formData.isGlobal ? ConditionSetLogic.ALL : formData.logic,
            exemptQuestIds: formData.exemptQuestIds || [],
            exemptMarketIds: formData.exemptMarketIds || [],
        };
        onSave(finalPayload);
    };

    const dialogTitle = conditionSet ? 'Edit Condition Set' : 'Create New Condition Set';

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-0 max-w-2xl w-full max-h-[90vh] flex flex-col">
                    <div className="p-8 border-b border-stone-700/60 flex-shrink-0">
                        <h2 className="text-3xl font-medieval text-emerald-400">{dialogTitle}</h2>
                    </div>

                    <form id="condition-set-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                        <Input label="Set Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                        <Input as="textarea" label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
                        
                        <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                            <h3 className="font-semibold text-stone-200">User Assignment</h3>
                            <ToggleSwitch
                                enabled={limitToUsers}
                                setEnabled={setLimitToUsers}
                                label="Limit this set to specific users"
                            />
                            {limitToUsers && (
                                <UserMultiSelect
                                    allUsers={users}
                                    selectedUserIds={formData.assignedUserIds || []}
                                    onSelectionChange={(ids) => setFormData(p => ({...p, assignedUserIds: ids}))}
                                    label="Applicable Users"
                                />
                            )}
                        </div>

                        <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                            <h3 className="font-semibold text-stone-200">Conditions Logic</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Input as="select" label="Logic Type" value={formData.logic} onChange={e => setFormData(p => ({...p, logic: e.target.value as ConditionSetLogic}))} disabled={!!formData.isGlobal}>
                                        <option value={ConditionSetLogic.ALL}>All conditions must be met (AND)</option>
                                        <option value={ConditionSetLogic.ANY}>Any condition can be met (OR)</option>
                                    </Input>
                                    {formData.isGlobal && <p className="text-xs text-stone-400 mt-1">Global sets must use 'ALL' logic.</p>}
                                </div>
                                <div className="pt-7">
                                    <ToggleSwitch
                                        enabled={!!formData.isGlobal}
                                        setEnabled={(enabled) => setFormData(p => ({ ...p, isGlobal: enabled }))}
                                        label="Apply Globally"
                                    />
                                </div>
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
                        
                        {formData.isGlobal && (
                             <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                                <h3 className="font-semibold text-stone-200">Exempted Assets</h3>
                                <p className="text-xs text-stone-400">
                                    Assets listed here will NOT be affected by this global condition set. Quests used as part of a condition are automatically exempted to prevent deadlocks.
                                </p>
                                <Button type="button" variant="secondary" onClick={() => setIsExemptionSelectorOpen(true)}>Manage Exemptions</Button>
                            </div>
                        )}
                    </form>

                    <div className="p-6 border-t border-stone-700/60 mt-auto flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="condition-set-form">{conditionSet ? 'Save Changes' : 'Create Set'}</Button>
                    </div>
                </div>
            </div>
            {isExemptionSelectorOpen && (
                <ExemptionSelectorDialog
                    initialQuestIds={formData.exemptQuestIds || []}
                    initialMarketIds={formData.exemptMarketIds || []}
                    onSave={handleExemptionSave}
                    onClose={() => setIsExemptionSelectorOpen(false)}
                />
            )}
        </>
    );
};

export default EditConditionSetDialog;