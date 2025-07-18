

import React, { useState, useEffect } from 'react';
import { useAuthState, useGameDataState, useSettingsState, useAppDispatch } from '../../context/AppContext';
import { Quest, QuestType, RewardItem, RewardCategory, QuestAvailability } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import RewardInputGroup from '../forms/RewardInputGroup';
import EmojiPicker from '../ui/EmojiPicker';
import TagInput from '../ui/TagInput';

interface QuestDialogProps {
  questToEdit?: Quest;
  initialData?: { title: string, description: string, type?: QuestType };
  onClose: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DUTY_AVAILABILITIES = [QuestAvailability.Daily, QuestAvailability.Weekly, QuestAvailability.Monthly];
const VENTURE_AVAILABILITIES = [QuestAvailability.Frequency, QuestAvailability.Unlimited];


const CreateQuestDialog: React.FC<QuestDialogProps> = ({ questToEdit, initialData, onClose }) => {
  const { users } = useAuthState();
  const { guilds, rewardTypes, allTags } = useGameDataState();
  const { settings } = useSettingsState();
  const { addQuest, updateQuest } = useAppDispatch();

  const getInitialFormData = () => {
      if (questToEdit) {
        return {
          title: questToEdit.title,
          description: questToEdit.description,
          type: questToEdit.type,
          icon: questToEdit.icon || '📝',
          rewards: [...questToEdit.rewards],
          lateSetbacks: questToEdit.lateSetbacks ? [...questToEdit.lateSetbacks] : [],
          incompleteSetbacks: questToEdit.incompleteSetbacks ? [...questToEdit.incompleteSetbacks] : [],
          isActive: questToEdit.isActive,
          isOptional: questToEdit.isOptional || false,
          requiresApproval: questToEdit.requiresApproval,
          availabilityType: questToEdit.availabilityType,
          availabilityCount: questToEdit.availabilityCount || 1,
          weeklyRecurrenceDays: questToEdit.weeklyRecurrenceDays || [],
          monthlyRecurrenceDays: questToEdit.monthlyRecurrenceDays || [],
          assignedUserIds: [...questToEdit.assignedUserIds],
          guildId: questToEdit.guildId || '',
          tags: questToEdit.tags || [],
          lateDateTime: questToEdit.lateDateTime ? questToEdit.lateDateTime.slice(0, 16) : '',
          incompleteDateTime: questToEdit.incompleteDateTime ? questToEdit.incompleteDateTime.slice(0, 16) : '',
          lateTime: questToEdit.lateTime || '',
          incompleteTime: questToEdit.incompleteTime || '',
          hasDeadlines: !!(questToEdit.lateDateTime || questToEdit.incompleteDateTime || questToEdit.lateTime || questToEdit.incompleteTime),
        };
      }
      // New quest
      return {
        title: initialData?.title || '',
        description: initialData?.description || '',
        type: initialData?.type || QuestType.Duty,
        icon: '📝',
        rewards: [] as RewardItem[],
        lateSetbacks: [] as RewardItem[],
        incompleteSetbacks: [] as RewardItem[],
        isActive: settings.questDefaults.isActive,
        requiresApproval: settings.questDefaults.requiresApproval,
        isOptional: settings.questDefaults.isOptional,
        availabilityType: QuestAvailability.Daily,
        availabilityCount: 1,
        weeklyRecurrenceDays: [] as number[],
        monthlyRecurrenceDays: [] as number[],
        assignedUserIds: [] as string[],
        guildId: '',
        tags: [] as string[],
        lateDateTime: '',
        incompleteDateTime: '',
        lateTime: '',
        incompleteTime: '',
        hasDeadlines: false,
      };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [error, setError] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (!formData.hasDeadlines) {
      setFormData(p => ({
        ...p,
        lateDateTime: '',
        incompleteDateTime: '',
        lateTime: '',
        incompleteTime: '',
        lateSetbacks: [],
        incompleteSetbacks: [],
      }));
    }
  }, [formData.hasDeadlines]);

  useEffect(() => {
    const newType = formData.type;
    const currentAvail = formData.availabilityType;

    if (!questToEdit && newType === QuestType.Venture) setFormData(p => ({...p, requiresApproval: true}));

    if (newType === QuestType.Duty && !DUTY_AVAILABILITIES.includes(currentAvail)) {
        setFormData(p => ({...p, availabilityType: QuestAvailability.Daily}));
    } else if (newType === QuestType.Venture && !VENTURE_AVAILABILITIES.includes(currentAvail)) {
        setFormData(p => ({...p, availabilityType: QuestAvailability.Frequency}));
    }

  }, [formData.type, questToEdit]);
  
  const handleUserAssignmentChange = (userId: string) => {
    setFormData(prev => ({...prev, assignedUserIds: prev.assignedUserIds.includes(userId) ? prev.assignedUserIds.filter(id => id !== userId) : [...prev.assignedUserIds, userId]}));
  };

  const handleRewardChange = (category: 'rewards' | 'lateSetbacks' | 'incompleteSetbacks') => (index: number, field: keyof RewardItem, value: string | number) => {
    const newItems = [...formData[category]];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Math.max(1, Number(value)) : value };
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleAddRewardForCategory = (category: 'rewards' | 'lateSetbacks' | 'incompleteSetbacks') => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    setFormData(prev => ({ ...prev, [category]: [...prev[category], { rewardTypeId: defaultReward.id, amount: 1 }] }));
  };
  
  const handleRemoveReward = (category: 'rewards' | 'lateSetbacks' | 'incompleteSetbacks') => (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== indexToRemove) }));
  };

  const handleWeeklyDayToggle = (dayIndex: number) => {
    setFormData(prev => ({ ...prev, weeklyRecurrenceDays: prev.weeklyRecurrenceDays.includes(dayIndex) ? prev.weeklyRecurrenceDays.filter(d => d !== dayIndex) : [...prev.weeklyRecurrenceDays, dayIndex].sort() }));
  };

  const handleMonthlyDayToggle = (day: number) => {
    setFormData(prev => ({ ...prev, monthlyRecurrenceDays: prev.monthlyRecurrenceDays.includes(day) ? prev.monthlyRecurrenceDays.filter(d => d !== day) : [...prev.monthlyRecurrenceDays, day].sort((a,b)=>a-b) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required.');
        return;
    }
    setError('');

    const finalQuestData = {
        ...formData,
        lateDateTime: formData.hasDeadlines && formData.type === QuestType.Venture && formData.lateDateTime ? new Date(formData.lateDateTime).toISOString() : undefined,
        incompleteDateTime: formData.hasDeadlines && formData.type === QuestType.Venture && formData.incompleteDateTime ? new Date(formData.incompleteDateTime).toISOString() : undefined,
        lateTime: formData.hasDeadlines && formData.type === QuestType.Duty && formData.lateTime ? formData.lateTime : undefined,
        incompleteTime: formData.hasDeadlines && formData.type === QuestType.Duty && formData.incompleteTime ? formData.incompleteTime : undefined,
        
        guildId: formData.guildId || undefined,
        availabilityCount: formData.availabilityType === QuestAvailability.Frequency ? formData.availabilityCount : null,
        weeklyRecurrenceDays: formData.availabilityType === QuestAvailability.Weekly ? formData.weeklyRecurrenceDays : [],
        monthlyRecurrenceDays: formData.availabilityType === QuestAvailability.Monthly ? formData.monthlyRecurrenceDays : [],
        rewards: formData.rewards.filter(r => r.rewardTypeId && r.amount > 0),
        lateSetbacks: formData.lateSetbacks.filter(s => s.rewardTypeId && s.amount > 0),
        incompleteSetbacks: formData.incompleteSetbacks.filter(s => s.rewardTypeId && s.amount > 0),
    };

    // Remove UI-only state before submitting
    const { hasDeadlines, ...questPayload } = finalQuestData;

    if (questToEdit) {
        updateQuest({ ...questToEdit, ...questPayload });
    } else {
        addQuest(questPayload as Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>);
    }
    onClose();
  };
  
  const dialogTitle = questToEdit ? `Edit ${settings.terminology.task}` : `Create New ${settings.terminology.task}`;
  const submitButtonText = questToEdit ? 'Save Changes' : `Create ${settings.terminology.task}`;
  const currentAvailabilityOptions = formData.type === QuestType.Duty ? DUTY_AVAILABILITIES : VENTURE_AVAILABILITIES;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-accent">{dialogTitle}</h2>
        </div>
        
        <form id="quest-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center gap-4 flex-wrap">
             <ToggleSwitch enabled={formData.isActive} setEnabled={(val) => setFormData(p => ({...p, isActive: val}))} label="Status: Active" />
             <ToggleSwitch enabled={formData.isOptional} setEnabled={(val) => setFormData(p => ({...p, isOptional: val}))} label={`${settings.terminology.task} is Optional`} />
          </div>

          <div className="flex gap-4 items-end">
            <div className="relative">
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                className="w-16 h-11 text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center justify-center text-2xl"
              >
                {formData.icon}
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
            <div className="flex-grow">
              <Input label={`${settings.terminology.task} Title`} id="title" name="title" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Tags</label>
            <TagInput 
              selectedTags={formData.tags}
              onTagsChange={(newTags) => setFormData(p => ({ ...p, tags: newTags}))}
              allTags={allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="p-4 bg-stone-900/50 rounded-lg">
            <h3 className="font-semibold text-stone-200 mb-2">Scope</h3>
            <select name="guildId" value={formData.guildId} onChange={(e) => setFormData(p => ({...p, guildId: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                <option value="">Personal (Available to individuals)</option>
                {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-stone-300 mb-1">{settings.terminology.task} Type</label>
            <select id="type" name="type" value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value as QuestType}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
              <option value={QuestType.Duty}>{settings.terminology.recurringTask} (Recurring Task)</option>
              <option value={QuestType.Venture}>{settings.terminology.singleTask} (One-time Chore)</option>
            </select>
          </div>
          
           <div className="flex justify-between items-center">
             <h3 className="font-semibold text-lg text-stone-200">Approval</h3>
            <ToggleSwitch enabled={formData.requiresApproval} setEnabled={(val) => setFormData(p => ({...p, requiresApproval: val}))} label="Requires Approval" />
          </div>

          <div className="p-4 bg-stone-900/50 rounded-lg">
             <h3 className="font-semibold text-stone-200 mb-3">Availability</h3>
             <div className="flex space-x-4 flex-wrap gap-2">
                 {currentAvailabilityOptions.map(availType => (
                     <div key={availType} className="flex items-center">
                         <input type="radio" id={availType} name="availabilityType" value={availType} checked={formData.availabilityType === availType} onChange={(e) => setFormData(p => ({...p, availabilityType: e.target.value as QuestAvailability}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500" />
                         <label htmlFor={availType} className="ml-2 capitalize">{availType}</label>
                     </div>
                 ))}
             </div>
             {formData.availabilityType === QuestAvailability.Weekly && formData.type === QuestType.Duty && (
                <div className="mt-3">
                    <p className="text-sm text-stone-300 mb-2">Repeat on these days:</p>
                    <div className="flex flex-wrap gap-2">{WEEKDAYS.map((day, index) => (<button type="button" key={day} onClick={() => handleWeeklyDayToggle(index)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${formData.weeklyRecurrenceDays.includes(index) ? 'btn-primary' : 'bg-stone-700 hover:bg-stone-600'}`}>{day}</button>))}</div>
                </div>
             )}
              {formData.availabilityType === QuestAvailability.Monthly && formData.type === QuestType.Duty && (
                <div className="mt-3">
                    <p className="text-sm text-stone-300 mb-2">Repeat on these dates:</p>
                    <div className="grid grid-cols-7 gap-1">{Array.from({length: 31}, (_, i) => i + 1).map(day => (<button type="button" key={day} onClick={() => handleMonthlyDayToggle(day)} className={`h-9 w-9 flex items-center justify-center rounded-md text-sm font-semibold transition-colors ${formData.monthlyRecurrenceDays.includes(day) ? 'btn-primary' : 'bg-stone-700 hover:bg-stone-600'}`}>{day}</button>))}</div>
                </div>
             )}
             {formData.availabilityType === QuestAvailability.Frequency && formData.type === QuestType.Venture && (
                <div className="mt-3"><Input label="Number of completions available" type="number" min="1" value={formData.availabilityCount || 1} onChange={(e) => setFormData(p => ({...p, availabilityCount: parseInt(e.target.value)}))} /></div>
             )}
          </div>

          <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-stone-200">Deadlines & Time-based {settings.terminology.negativePoints}</h3>
              <ToggleSwitch enabled={formData.hasDeadlines} setEnabled={(val) => setFormData(p => ({...p, hasDeadlines: val}))} label="Enable" />
            </div>
            
            {formData.hasDeadlines && (
              <>
                <p className="text-sm text-stone-400 -mt-2">Set specific times for when a {settings.terminology.task.toLowerCase()} becomes late or incomplete, and assign {settings.terminology.negativePoints.toLowerCase()} for each.</p>
                 {formData.type === QuestType.Venture ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Becomes LATE at" type="datetime-local" value={formData.lateDateTime} onChange={e => setFormData(p => ({...p, lateDateTime: e.target.value}))} />
                        <Input label="Becomes INCOMPLETE at" type="datetime-local" value={formData.incompleteDateTime} onChange={e => setFormData(p => ({...p, incompleteDateTime: e.target.value}))} />
                    </div>
                ) : ( // Duty
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Becomes LATE at (Daily Time)" type="time" value={formData.lateTime} onChange={e => setFormData(p => ({...p