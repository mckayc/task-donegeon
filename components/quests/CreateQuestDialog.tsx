import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { Quest, QuestType, RewardItem, RewardCategory, QuestAvailability, BugReport, Role } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import RewardInputGroup from '../forms/RewardInputGroup';
import EmojiPicker from '../ui/EmojiPicker';
import TagInput from '../ui/TagInput';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';
import { useAuthState } from '../../context/AuthContext';
import { useEconomyState } from '../../context/EconomyContext';
import { bugLogger } from '../../utils/bugLogger';
import { useQuestState, useQuestDispatch } from '../../context/QuestContext';

interface QuestDialogProps {
  questToEdit?: Quest;
  initialData?: any; // Loosened type to accept raw AI data
  onClose: () => void;
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
  initialDataFromBug?: BugReport;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DUTY_AVAILABILITIES = [QuestAvailability.Daily, QuestAvailability.Weekly, QuestAvailability.Monthly];
const VENTURE_AVAILABILITIES = [QuestAvailability.Frequency, QuestAvailability.Unlimited];


const CreateQuestDialog: React.FC<QuestDialogProps> = ({ questToEdit, initialData, onClose, mode = (questToEdit ? 'edit' : 'create'), onTryAgain, isGenerating, onSave, initialDataFromBug }) => {
  const { guilds, settings } = useAppState();
  const { allTags, questGroups } = useQuestState();
  const { users } = useAuthState();
  const { rewardTypes } = useEconomyState();
  const { addQuest, updateQuest, addQuestGroup } = useQuestDispatch();
  const hasLoggedOpen = useRef(false);

  const getInitialFormData = useCallback(() => {
      if (mode === 'edit' && questToEdit) {
        return {
          title: questToEdit.title,
          description: questToEdit.description,
          type: questToEdit.type,
          iconType: questToEdit.iconType || 'emoji',
          icon: questToEdit.icon || '📝',
          imageUrl: questToEdit.imageUrl || '',
          rewards: [...(questToEdit.rewards || [])],
          lateSetbacks: questToEdit.lateSetbacks ? [...questToEdit.lateSetbacks] : [],
          incompleteSetbacks: questToEdit.incompleteSetbacks ? [...questToEdit.incompleteSetbacks] : [],
          isActive: questToEdit.isActive,
          isOptional: questToEdit.isOptional || false,
          requiresApproval: questToEdit.requiresApproval,
          availabilityType: questToEdit.availabilityType,
          availabilityCount: questToEdit.availabilityCount || 1,
          weeklyRecurrenceDays: questToEdit.weeklyRecurrenceDays || [],
          monthlyRecurrenceDays: questToEdit.monthlyRecurrenceDays || [],
          assignedUserIds: [...(questToEdit.assignedUserIds || [])],
          guildId: questToEdit.guildId || '',
          groupId: questToEdit.groupId || '',
          tags: questToEdit.tags || [],
          lateDateTime: questToEdit.lateDateTime ? questToEdit.lateDateTime.slice(0, 16) : '',
          incompleteDateTime: questToEdit.incompleteDateTime ? questToEdit.incompleteDateTime.slice(0, 16) : '',
          lateTime: questToEdit.lateTime || '',
          incompleteTime: questToEdit.incompleteTime || '',
          hasDeadlines: !!(questToEdit.lateDateTime || questToEdit.incompleteDateTime || questToEdit.lateTime || questToEdit.incompleteTime),
        };
      }
      
      const admins = users.filter(u => u.role === Role.DonegeonMaster);

      if (initialDataFromBug) {
        const formattedLogs = initialDataFromBug.logs.map(log => 
          `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${log.message}` +
          (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
        ).join('\n');

        const description = `From bug report #${initialDataFromBug.id.substring(0, 8)}: ${initialDataFromBug.title}\n\n--- BUG LOG ---\n${formattedLogs}`;
        
        return {
          title: `Fix Bug: ${initialDataFromBug.title}`,
          description,
          type: QuestType.Venture,
          iconType: 'emoji' as 'emoji' | 'image',
          icon: '🐞',
          imageUrl: '',
          rewards: [{ rewardTypeId: 'core-diligence', amount: 50 }], // Default reward
          lateSetbacks: [] as RewardItem[],
          incompleteSetbacks: [] as RewardItem[],
          isActive: true,
          requiresApproval: true,
          isOptional: false,
          availabilityType: QuestAvailability.Unlimited,
          availabilityCount: 1,
          weeklyRecurrenceDays: [] as number[],
          monthlyRecurrenceDays: [] as number[],
          assignedUserIds: admins.map(a => a.id), // Assign to all admins by default
          guildId: '',
          groupId: '',
          tags: ['bugfix', 'development'],
          lateDateTime: '',
          incompleteDateTime: '',
          lateTime: '',
          incompleteTime: '',
          hasDeadlines: false,
        };
      }


      // Map AI suggested rewards to actual reward items
      const suggestedRewardItems: RewardItem[] = initialData?.suggestedRewards
        ?.map((reward: { rewardTypeName: string; amount: number; }) => {
            const foundType = rewardTypes.find(rt => rt.name.toLowerCase() === reward.rewardTypeName.toLowerCase().replace(' xp', ''));
            if (foundType) {
                return { rewardTypeId: foundType.id, amount: reward.amount };
            }
            return null;
        })
        .filter((r: RewardItem | null): r is RewardItem => r !== null) || [];
      
      const isCreatingNewAIGroup = initialData?.isNewGroup && !!initialData.groupName;
      const suggestedGroupId = !isCreatingNewAIGroup && initialData?.groupName
        ? questGroups.find(g => g.name.toLowerCase() === initialData.groupName?.toLowerCase())?.id || ''
        : '';

      // New quest or AI creation
      return {
        title: initialData?.title || '',
        description: initialData?.description || '',
        type: initialData?.type || QuestType.Duty,
        iconType: 'emoji' as 'emoji' | 'image',
        icon: initialData?.icon || '📝',
        imageUrl: '',
        rewards: suggestedRewardItems,
        lateSetbacks: [] as RewardItem[],
        incompleteSetbacks: [] as RewardItem[],
        isActive: settings.questDefaults.isActive,
        requiresApproval: settings.questDefaults.requiresApproval,
        isOptional: settings.questDefaults.isOptional,
        availabilityType: (initialData?.type === QuestType.Venture) ? QuestAvailability.Unlimited : QuestAvailability.Daily,
        availabilityCount: 1,
        weeklyRecurrenceDays: [] as number[],
        monthlyRecurrenceDays: [] as number[],
        assignedUserIds: users.map(u => u.id),
        guildId: '',
        groupId: suggestedGroupId,
        tags: initialData?.tags || [],
        lateDateTime: initialData?.lateDateTime || '',
        incompleteDateTime: initialData?.incompleteDateTime || '',
        lateTime: initialData?.lateTime || '',
        incompleteTime: initialData?.incompleteTime || '',
        hasDeadlines: initialData?.hasDeadlines || false,
      };
  }, [questToEdit, initialData, initialDataFromBug, mode, rewardTypes, questGroups, settings.questDefaults, users]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [error, setError] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(initialData?.isNewGroup && !!initialData.groupName);
  const [newGroupName, setNewGroupName] = useState(initialData?.isNewGroup ? initialData.groupName || '' : '');
  
  const userList = initialDataFromBug ? users.filter(u => u.role === Role.DonegeonMaster) : users;

  const dialogTitle = initialDataFromBug ? 'Convert Bug to Quest' : (mode === 'edit' ? `Edit ${settings.terminology.task}` : `Create New ${settings.terminology.task}`);
  
  useEffect(() => {
    if (bugLogger.isRecording() && !hasLoggedOpen.current) {
        let logMessage = `Opened '${dialogTitle}' dialog.`;
        if (mode === 'edit' && questToEdit) {
          logMessage += ` for quest "${questToEdit.title}".`;
        } else if (initialDataFromBug) {
          logMessage += ` from bug report "${initialDataFromBug.title}".`;
        }
        bugLogger.add({ type: 'ACTION', message: logMessage });
        hasLoggedOpen.current = true;
    }
  }, [dialogTitle, mode, questToEdit, initialDataFromBug]);

  useEffect(() => {
    // This effect ensures the form updates when a new AI suggestion or bug report is passed in.
    // It should NOT re-run on background data syncs, which was causing user input to be wiped.
    // We only care about the identity of the initial data props changing.
    setFormData(getInitialFormData());
    setIsCreatingNewGroup(initialData?.isNewGroup && !!initialData.groupName);
    setNewGroupName(initialData?.isNewGroup ? initialData.groupName || '' : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, initialDataFromBug, questToEdit]);


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
        setFormData(p => ({...p, availabilityType: QuestAvailability.Unlimited}));
    }

  }, [formData.type, questToEdit]);
  
  const handleUserAssignmentChange = (userId: string) => {
    setFormData(prev => ({...prev, assignedUserIds: prev.assignedUserIds.includes(userId) ? prev.assignedUserIds.filter(id => id !== userId) : [...prev.assignedUserIds, userId]}));
  };
  
  const handleAssignAll = () => {
    setFormData(prev => ({ ...prev, assignedUserIds: userList.map(u => u.id) }));
  };

  const handleUnassignAll = () => {
    setFormData(prev => ({ ...prev, assignedUserIds: [] }));
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
    setFormData(prev => ({ ...prev, weeklyRecurrenceDays: prev.weeklyRecurrenceDays.includes(dayIndex) ? prev.weeklyRecurrenceDays.filter((d: number) => d !== dayIndex) : [...prev.weeklyRecurrenceDays, dayIndex].sort((a, b) => a - b) }));
  };

  const handleMonthlyDayToggle = (day: number) => {
    setFormData(prev => ({ ...prev, monthlyRecurrenceDays: prev.monthlyRecurrenceDays.includes(day) ? prev.monthlyRecurrenceDays.filter((d: number) => d !== day) : [...prev.monthlyRecurrenceDays, day].sort((a: number, b: number)=>a-b) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required.');
        return;
    }
    setError('');

    if (bugLogger.isRecording()) {
      bugLogger.add({ type: 'ACTION', message: `Submitted '${dialogTitle}' form.` });
    }

    let finalGroupId = formData.groupId;
    if (isCreatingNewGroup && newGroupName.trim()) {
        const newGroup = addQuestGroup({ name: newGroupName.trim(), description: '', icon: '📂' });
        finalGroupId = newGroup.id;
    }

    const finalQuestData = {
        ...formData,
        groupId: finalGroupId || undefined,
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

    if (onSave) {
        onSave(questPayload);
        onClose();
        return;
    }

    if (mode === 'edit' && questToEdit) {
        updateQuest({ ...questToEdit, ...questPayload });
    } else {
        addQuest(questPayload as Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'>);
    }
    onClose();
  };
  
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = e.target;
      if (value === '--new--') {
          setIsCreatingNewGroup(true);
          setFormData(p => ({...p, groupId: ''}));
      } else {
          setIsCreatingNewGroup(false);
          setFormData(p => ({...p, groupId: value}));
      }
  };

  const currentAvailabilityOptions = formData.type === QuestType.Duty ? DUTY_AVAILABILITIES : VENTURE_AVAILABILITIES;

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-accent">{dialogTitle}</h2>
            {mode === 'ai-creation' && <p className="text-stone-400 mt-1">Review and adjust the AI-generated details below.</p>}
        </div>
        
        <form id="quest-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center gap-4 flex-wrap">
             <ToggleSwitch enabled={formData.isActive} setEnabled={(val) => setFormData(p => ({...p, isActive: val}))} label="Status: Active" />
             <ToggleSwitch enabled={formData.isOptional} setEnabled={(val) => setFormData(p => ({...p, isOptional: val}))} label={`${settings.terminology.task} is Optional`} />
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-grow">
              <Input label={`${settings.terminology.task} Title`} id="title" name="title" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} required />
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Icon Type</label>
            <div className="flex gap-4 p-2 bg-stone-700/50 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500"/>
                    <span>Emoji</span>
                </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" />
                    <span>Image</span>
                </label>
            </div>
          </div>
          {formData.iconType === 'emoji' ? (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon (Emoji)</label>
              <div className="relative">
                <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2">
                  <span className="text-2xl">{formData.icon}</span> <span className="text-stone-300">Click to change</span>
                </button>
                {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji) => { setFormData(p => ({ ...p, icon: emoji })); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
              </div>
            </div>
          ) : (
             <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Image Icon</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <DynamicIcon iconType={formData.iconType} icon={formData.icon} imageUrl={formData.imageUrl} className="w-full h-full text-4xl" altText="Selected icon" />
                </div>
                <Button type="button" variant="secondary" onClick={() => setIsGalleryOpen(true)}>Select Image</Button>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
            <textarea id="description" name="description" rows={initialDataFromBug ? 8 : 3} value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md font-mono text-xs"/>
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

          <div className="p-4 bg-stone-900/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-stone-200 mb-2">Scope</h3>
              <select name="guildId" value={formData.guildId} onChange={(e) => setFormData(p => ({...p, guildId: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                  <option value="">Personal (Available to individuals)</option>
                  {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
                <h3 className="font-semibold text-stone-200 mb-2">Quest Group</h3>
                 <select name="groupId" value={isCreatingNewGroup ? '--new--' : formData.groupId} onChange={handleGroupChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                    <option value="">Uncategorized</option>
                    {questGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    <option value="--new--">Create New Group...</option>
                </select>
                 {isCreatingNewGroup && (
                    <Input
                        label="New Group Name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="mt-2"
                        autoFocus
                    />
                )}
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-stone-300 mb-1">{settings.terminology.task} Type</label>
            <select id="type" name="type" value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value as QuestType}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md" disabled={!!initialDataFromBug}>
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
                        <Input label="Becomes LATE at (Daily Time)" type="time" value={formData.lateTime} onChange={e => setFormData(p => ({...p, lateTime: e.target.value}))} />
                        <Input label="Becomes INCOMPLETE at (Daily Time)" type="time" value={formData.incompleteTime} onChange={e => setFormData(p => ({...p, incompleteTime: e.target.value}))} />
                    </div>
                )}
                <RewardInputGroup category='lateSetbacks' items={formData.lateSetbacks} onChange={handleRewardChange('lateSetbacks')} onAdd={handleAddRewardForCategory('lateSetbacks')} onRemove={handleRemoveReward('lateSetbacks')} />
                <RewardInputGroup category='incompleteSetbacks' items={formData.incompleteSetbacks} onChange={handleRewardChange('incompleteSetbacks')} onAdd={handleAddRewardForCategory('incompleteSetbacks')} onRemove={handleRemoveReward('incompleteSetbacks')} />
              </>
            )}
          </div>

          <RewardInputGroup category='rewards' items={formData.rewards} onChange={handleRewardChange('rewards')} onAdd={handleAddRewardForCategory('rewards')} onRemove={handleRemoveReward('rewards')} />

          <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-stone-200 mb-2">Individual User Assignment</h3>
              <p className="text-sm text-stone-400 mb-3">{initialDataFromBug ? `This quest can only be assigned to ${settings.terminology.admin}s.` : `Select the users who will be assigned this quest. Note: Assigning a Quest Group will override this.`}</p>
              <div className="flex justify-end gap-2 mb-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleAssignAll}>Assign All</Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleUnassignAll}>Unassign All</Button>
              </div>
              <fieldset className="disabled:opacity-50">
                <div className="space-y-2 max-h-40 overflow-y-auto border border-stone-700 p-2 rounded-md">
                    {userList.map(user => (
                        <div key={user.id} className="flex items-center">
                            <input type="checkbox" id={`user-${user.id}`} name={`user-${user.id}`} checked={formData.assignedUserIds.includes(user.id)} onChange={() => handleUserAssignmentChange(user.id)} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 rounded focus:ring-emerald-500" />
                            <label htmlFor={`user-${user.id}`} className="ml-3 text-stone-300">{user.gameName} ({user.role})</label>
                        </div>
                    ))}
                </div>
              </fieldset>
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-stone-700/60">
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            {mode === 'ai-creation' ? (
                <div className="flex justify-between items-center">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit" form="quest-form">Create Quest</Button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="quest-form">{onSave ? 'Save Changes' : (mode === 'edit' ? 'Save Changes' : `Create ${settings.terminology.task}`)}</Button>
                </div>
            )}
        </div>
      </div>
    </div>
    {isGalleryOpen && (
      <ImageSelectionDialog 
        onSelect={(url) => {
          setFormData(p => ({...p, imageUrl: url}));
          setIsGalleryOpen(false);
        }}
        onClose={() => setIsGalleryOpen(false)}
      />
    )}
    </>
  );
};

export default CreateQuestDialog;
