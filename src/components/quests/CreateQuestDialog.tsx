
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemState } from '../../context/SystemContext';
import { Quest, QuestType, QuestKind, Checkpoint, QuestMediaType } from '../quests/types';
import { RewardCategory } from '../users/types';
import { RewardItem } from '../users/types';
import { Role } from '../users/types';
import { BugReport } from '../dev/types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import RewardInputGroup from '../forms/RewardInputGroup';
import EmojiPicker from '../user-interface/EmojiPicker';
import TagInput from '../user-interface/TagInput';
import ImageSelectionDialog from '../user-interface/ImageSelectionDialog';
import DynamicIcon from '../user-interface/DynamicIcon';
import { useAuthState } from '../../context/AuthContext';
import { bugLogger } from '../../utils/bugLogger';
import QuestScheduling from '../forms/QuestScheduling';
import EditJourneyDialog from './EditJourneyDialog';
import { useQuestsState, useQuestsDispatch } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import NumberInput from '../user-interface/NumberInput';
import MediaBrowserDialog from '../video/MediaBrowserDialog';

type QuestFormData = Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'> & { id?: string };

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

const CreateQuestDialog: React.FC<QuestDialogProps> = ({ questToEdit, initialData, onClose, mode = (questToEdit ? 'edit' : 'create'), onTryAgain, isGenerating, onSave, initialDataFromBug }) => {
  const { settings } = useSystemState();
  const { guilds } = useCommunityState();
  const { allTags, questGroups } = useQuestsState();
  const { rewardTypes } = useEconomyState();
  const { users } = useAuthState();
  const { addQuest, updateQuest, addQuestGroup } = useQuestsDispatch();
  const hasLoggedOpen = useRef(false);
  const allConditionSets = settings.conditionSets || [];

  const getInitialFormData = useCallback((): QuestFormData => {
    // Base structure for a new quest
    const baseData: QuestFormData = {
        title: '', description: '',
        type: QuestType.Duty,
        kind: QuestKind.Personal,
        mediaType: undefined,
        aiTutorSessionMinutes: undefined,
        videoUrl: '',
        // FIX: Replaced 'pdfUrl' with 'epubUrl' to match the Quest data model.
        epubUrl: '',
        iconType: 'emoji' as 'emoji' | 'image',
        icon: '📝', imageUrl: '',
        rewards: [] as RewardItem[], lateSetbacks: [] as RewardItem[], incompleteSetbacks: [] as RewardItem[],
        isActive: settings.questDefaults.isActive,
        requiresApproval: settings.questDefaults.requiresApproval,
        isOptional: settings.questDefaults.isOptional,
        assignedUserIds: users.map(u => u.id),
        guildId: '', groupIds: [], tags: [],
        startDateTime: null, endDateTime: null, allDay: true, rrule: 'FREQ=DAILY',
        startTime: null, endTime: null, 
        dailyCompletionsLimit: 1, totalCompletionsLimit: 0,
        todoUserIds: [],
        checkpoints: [],
        checkpointCompletionTimestamps: {},
        requiresClaim: false,
        claimLimit: 1,
        pendingClaims: [],
        approvedClaims: [],
        conditionSetIds: undefined,
    };

    // Mode: Edit
    if (mode === 'edit' && questToEdit) {
      return {
        ...questToEdit,
        startDateTime: questToEdit.startDateTime || null,
        endDateTime: questToEdit.endDateTime || null,
        allDay: questToEdit.allDay ?? true,
        rrule: questToEdit.rrule || null,
        startTime: questToEdit.startTime || null,
        endTime: questToEdit.endTime || null,
        dailyCompletionsLimit: questToEdit.dailyCompletionsLimit ?? 1,
        totalCompletionsLimit: questToEdit.totalCompletionsLimit ?? 0,
        conditionSetIds: questToEdit.conditionSetIds || undefined,
      };
    }

    // Mode: AI Creation
    if (mode === 'ai-creation' && initialData) {
        const suggestedRewardItems: RewardItem[] = initialData?.suggestedRewards
          ?.map((reward: { rewardTypeName: string; amount: number; }) => {
              const foundType = rewardTypes.find(rt => rt.name.toLowerCase() === reward.rewardTypeName.toLowerCase().replace(' xp', ''));
              if (foundType) return { rewardTypeId: foundType.id, amount: reward.amount };
              return null;
          }).filter((r: RewardItem | null): r is RewardItem => r !== null) || [];
        
        const suggestedCheckpoints: Checkpoint[] = initialData?.checkpoints
          ?.map((cp: { description: string; suggestedRewards?: { rewardTypeName: string; amount: number; }[] }) => {
              const checkpointRewards: RewardItem[] = cp.suggestedRewards
                ?.map(reward => {
                    const foundType = rewardTypes.find(rt => rt.name.toLowerCase() === reward.rewardTypeName.toLowerCase().replace(' xp', ''));
                    if (foundType) return { rewardTypeId: foundType.id, amount: reward.amount };
                    return null;
                }).filter((r): r is RewardItem => r !== null) || [];
              
              return {
                  id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  description: cp.description,
                  rewards: checkpointRewards,
              };
          }) || [];

        const isCreatingNewAIGroup = initialData?.isNewGroup && !!initialData.groupName;
        const suggestedGroupId = !isCreatingNewAIGroup && initialData?.groupName
          ? questGroups.find(g => g.name.toLowerCase() === initialData.groupName?.toLowerCase())?.id || ''
          : '';

        const suggestedType = initialData.type || (initialData.checkpoints ? QuestType.Journey : QuestType.Venture);

        return {
            ...baseData,
            title: initialData.title || '',
            description: initialData.description || '',
            icon: initialData.icon || '📝',
            tags: initialData.tags || [],
            rewards: suggestedRewardItems,
            checkpoints: suggestedCheckpoints,
            groupIds: suggestedGroupId ? [suggestedGroupId] : [],
            type: suggestedType,
            rrule: suggestedType === QuestType.Duty ? 'FREQ=DAILY' : null,
        };
    }
    
    // Mode: From Bug Report
    if (initialDataFromBug) {
      const admins = users.filter(u => u.role === Role.DonegeonMaster);
      const formattedLogs = initialDataFromBug.logs.map(log => 
        `[${new Date(log.timestamp).toLocaleString()}] [${log.type}] ${log.message}` +
        (log.element ? `\n  Element: <${log.element.tag} id="${log.element.id || ''}" class="${log.element.classes || ''}">` : '')
      ).join('\n');
      const description = `From bug report #${initialDataFromBug.id.substring(0, 8)}: ${initialDataFromBug.title}\n\n--- BUG LOG ---\n${formattedLogs}`;
      
      return {
        ...baseData,
        title: `Fix Bug: ${initialDataFromBug.title}`,
        description,
        icon: '🐞',
        rewards: [{ rewardTypeId: 'core-diligence', amount: 50 }],
        requiresApproval: true,
        assignedUserIds: admins.map(a => a.id),
        tags: ['bugfix', 'development'],
        startDateTime: new Date().toISOString(),
        type: QuestType.Venture,
      };
    }

    // Default: Create
    return baseData;
  }, [questToEdit, initialData, initialDataFromBug, mode, rewardTypes, questGroups, settings.questDefaults, users]);

  const [formData, setFormData] = useState<QuestFormData>(getInitialFormData());
  const [error, setError] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(initialData?.isNewGroup && !!initialData.groupName);
  const [newGroupName, setNewGroupName] = useState(initialData?.isNewGroup ? initialData.groupName || '' : '');
  const [isJourneyEditorOpen, setIsJourneyEditorOpen] = useState(false);
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
  
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
    setFormData(getInitialFormData());
    setIsCreatingNewGroup(initialData?.isNewGroup && !!initialData.groupName);
    setNewGroupName(initialData?.isNewGroup ? initialData.groupName || '' : '');
  }, [initialData, initialDataFromBug, questToEdit, getInitialFormData]);


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
    const newItems = [...(formData[category] || [])];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Math.max(1, parseInt(String(value)) || 1) : value };
    setFormData(prev => ({ ...prev, [category]: newItems }));
  };
  
  const handleAddRewardForCategory = (category: 'rewards' | 'lateSetbacks' | 'incompleteSetbacks') => (rewardCat: RewardCategory) => {
    const defaultReward = rewardTypes.find(rt => rt.category === rewardCat);
    if (!defaultReward) return;
    setFormData(prev => ({ ...prev, [category]: [...(prev[category] || []), { rewardTypeId: defaultReward.id, amount: 1 }] }));
  };
  
  const handleRemoveReward = (category: 'rewards' | 'lateSetbacks' | 'incompleteSetbacks') => (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, [category]: (prev[category] || []).filter((_, i) => i !== indexToRemove) }));
  };
  
  const handleScheduleChange = (scheduleUpdate: Partial<QuestFormData>) => {
    setFormData(prev => ({ ...prev, ...scheduleUpdate }));
  };

  const handleConditionSetToggle = (setId: string) => {
    setFormData(prev => {
        const currentIds = prev.conditionSetIds || [];
        const newSetIds = currentIds.includes(setId)
            ? currentIds.filter(id => id !== setId)
            : [...currentIds, setId];
        return { ...prev, conditionSetIds: newSetIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
        setError('Title is required.');
        return;
    }
    setError('');

    if (bugLogger.isRecording()) {
      bugLogger.add({ type: 'ACTION', message: `Submitted '${dialogTitle}' form.` });
    }
    
    let finalGroupIds = formData.groupIds || [];
    if (isCreatingNewGroup && newGroupName.trim()) {
        const newGroup = await addQuestGroup({ name: newGroupName.trim(), description: '', icon: '📂' });
        if (newGroup?.id) {
            finalGroupIds = [...finalGroupIds, newGroup.id];
        }
    }

    const questPayload: Omit<Quest, 'id' | 'claimedByUserIds' | 'dismissals'> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        kind: formData.kind,
        mediaType: formData.mediaType || undefined,
        aiTutorSessionMinutes: formData.mediaType === QuestMediaType.AITeacher ? formData.aiTutorSessionMinutes : undefined,
        videoUrl: formData.mediaType === QuestMediaType.Video ? formData.videoUrl : null,
        // FIX: Replaced 'pdfUrl' with 'epubUrl' and 'QuestMediaType.PDF' with 'QuestMediaType.EPUB'.
        epubUrl: formData.mediaType === QuestMediaType.EPUB ? formData.epubUrl : null,
        iconType: formData.iconType,
        icon: formData.icon,
        imageUrl: formData.imageUrl || undefined,
        tags: formData.tags,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        allDay: formData.allDay,
        rrule: formData.rrule,
        startTime: formData.startTime,
        endTime: formData.endTime,
        dailyCompletionsLimit: formData.dailyCompletionsLimit,
        totalCompletionsLimit: formData.totalCompletionsLimit,
        rewards: (formData.rewards || []).filter(r => r.rewardTypeId && r.amount > 0),
        lateSetbacks: (formData.lateSetbacks || []).filter(s => s.rewardTypeId && s.amount > 0),
        incompleteSetbacks: (formData.incompleteSetbacks || []).filter(s => s.rewardTypeId && s.amount > 0),
        isActive: formData.isActive,
        isOptional: formData.isOptional,
        assignedUserIds: formData.assignedUserIds,
        guildId: formData.guildId || undefined,
        groupIds: finalGroupIds.length > 0 ? finalGroupIds : undefined,
        requiresApproval: formData.requiresApproval,
        todoUserIds: formData.todoUserIds,
        checkpoints: formData.type === QuestType.Journey ? (formData.checkpoints || []) : undefined,
        checkpointCompletionTimestamps: formData.type === QuestType.Journey ? (formData.checkpointCompletionTimestamps || {}) : undefined,
        requiresClaim: formData.type === QuestType.Duty ? false : formData.requiresClaim,
        claimLimit: formData.type === QuestType.Duty ? 1 : formData.claimLimit,
        pendingClaims: formData.pendingClaims || [],
        approvedClaims: formData.approvedClaims || [],
        conditionSetIds: formData.conditionSetIds?.length ? formData.conditionSetIds : undefined,
    };

    if (onSave) {
        onSave(questPayload);
    } else if (mode === 'edit' && questToEdit) {
        await updateQuest({ ...questToEdit, ...questPayload });
        onClose();
    } else {
        await addQuest(questPayload);
        onClose();
    }
  };
  
  const handleGroupToggle = (groupId: string) => {
    setFormData(p => {
        const newGroupIds = p.groupIds?.includes(groupId)
            ? p.groupIds.filter(id => id !== groupId)
            : [...(p.groupIds || []), groupId];
        return { ...p, groupIds: newGroupIds };
    });
  };

  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKind = e.target.value as QuestKind;
    const isPersonalScope = newKind === QuestKind.Personal || newKind === QuestKind.Redemption;
    
    setFormData(p => ({
      ...p,
      kind: newKind,
      guildId: isPersonalScope ? '' : p.guildId,
    }));
  };

  const handleMediaSelect = (path: string) => {
      if (formData.mediaType === QuestMediaType.Video) {
          setFormData(p => ({...p, videoUrl: path}));
      // FIX: Replaced 'QuestMediaType.PDF' with 'QuestMediaType.EPUB' and updated 'pdfUrl' to 'epubUrl'.
      } else if (formData.mediaType === QuestMediaType.EPUB) {
          setFormData(p => ({...p, epubUrl: path}));
      }
      setIsMediaBrowserOpen(false);
  };

  const hasDeadlines = !!(formData.endTime || formData.endDateTime);

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
             <ToggleSwitch enabled={formData.isActive} setEnabled={(val: boolean) => setFormData(p => ({...p, isActive: val}))} label="Status: Active" />
             <ToggleSwitch enabled={formData.isOptional} setEnabled={(val: boolean) => setFormData(p => ({...p, isOptional: val}))} label={`${settings.terminology.task} is Optional`} />
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-grow">
              <Input label={`${settings.terminology.task} Title`} id="title" name="title" value={formData.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, title: e.target.value}))} required />
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
                {isEmojiPickerOpen && <EmojiPicker onSelect={(emoji: string) => { setFormData(p => ({ ...p, icon: emoji })); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
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
            <textarea id="description" name="description" rows={initialDataFromBug ? 8 : 3} value={formData.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md font-mono text-xs"/>
             {formData.mediaType === QuestMediaType.AIStory && (
              <p className="text-xs text-stone-400 mt-1">The quest title and description will be used to generate the AI story.</p>
            )}
          </div>
           <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Tags</label>
            <TagInput 
              selectedTags={formData.tags}
              onTagsChange={(newTags: string[]) => setFormData(p => ({ ...p, tags: newTags}))}
              allTags={allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="p-4 bg-stone-900/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input as="select" label="Quest Kind" name="kind" value={formData.kind} onChange={handleKindChange}>
                <option value={QuestKind.Personal}>Personal</option>
                <option value={QuestKind.Guild}>Guild</option>
                <option value={QuestKind.GuildCollaborative}>Guild Collaborative</option>
                <option value={QuestKind.Redemption}>Redemption</option>
            </Input>
            <div>
              <h3 className="font-semibold text-stone-200 mb-1">Scope</h3>
              <select name="guildId" value={formData.guildId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({...p, guildId: e.target.value}))} 
                disabled={formData.kind === QuestKind.Personal || formData.kind === QuestKind.Redemption}
                className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">Personal Scope</option>
                  {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input as="select" label="Interactive Media" name="mediaType" value={formData.mediaType || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({...p, mediaType: (e.target.value as QuestMediaType) || undefined}))}>
                  <option value="">None</option>
                  <option value={QuestMediaType.AITeacher}>AI Teacher</option>
                  <option value={QuestMediaType.AIStory}>AI Story</option>
                  <option value={QuestMediaType.Video}>Video</option>
                  {/* FIX: Replaced 'QuestMediaType.PDF' with 'QuestMediaType.EPUB'. */}
                  <option value={QuestMediaType.EPUB}>EPUB</option>
              </Input>
              {formData.mediaType === QuestMediaType.AITeacher && (
                <NumberInput 
                    label="AI Tutor Session (Minutes)"
                    value={formData.aiTutorSessionMinutes || 0}
                    onChange={newVal => setFormData(p => ({...p, aiTutorSessionMinutes: newVal > 0 ? newVal : undefined}))}
                    min={0}
                />
              )}
            </div>
             {formData.mediaType === QuestMediaType.Video && (
                <div className="p-4 bg-stone-900/50 rounded-lg space-y-2">
                    <div className="flex items-end gap-2">
                        <Input 
                            label="Video URL or Path" 
                            name="videoUrl" 
                            value={formData.videoUrl || ''} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, videoUrl: e.target.value}))} 
                            placeholder="e.g., YouTube URL or /media/my-video.mp4"
                            className="flex-grow"
                        />
                         <Button type="button" variant="secondary" onClick={() => setIsMediaBrowserOpen(true)}>Browse Library</Button>
                    </div>
                     <p className="text-xs text-stone-400">Enter a URL for a YouTube video or a local path to a video file in your media library (e.g., <code>/media/filename.mp4</code>).</p>
                </div>
            )}
             {/* FIX: Replaced 'QuestMediaType.PDF' with 'QuestMediaType.EPUB' and updated all related properties and labels. */}
             {formData.mediaType === QuestMediaType.EPUB && (
                <div className="p-4 bg-stone-900/50 rounded-lg space-y-2">
                    <div className="flex items-end gap-2">
                        <Input 
                            label="EPUB File Path" 
                            name="epubUrl" 
                            value={formData.epubUrl || ''} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, epubUrl: e.target.value}))} 
                            placeholder="e.g., /media/document.epub"
                            className="flex-grow"
                        />
                         <Button type="button" variant="secondary" onClick={() => setIsMediaBrowserOpen(true)}>Browse Library</Button>
                    </div>
                     <p className="text-xs text-stone-400">Select an EPUB file from your media library.</p>
                </div>
            )}
           <div>
                <h3 className="font-semibold text-stone-200 mb-1">Quest Groups</h3>
                <div className="p-2 border border-stone-600 rounded-md max-h-40 overflow-y-auto space-y-2">
                    {questGroups.map(g => (
                        <label key={g.id} className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-stone-700/50">
                            <input
                                type="checkbox"
                                checked={formData.groupIds?.includes(g.id)}
                                onChange={() => handleGroupToggle(g.id)}
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"
                            />
                            <span>{g.icon} {g.name}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-2">
                    <ToggleSwitch
                        enabled={isCreatingNewGroup}
                        setEnabled={setIsCreatingNewGroup}
                        label="Create New Group"
                    />
                    {isCreatingNewGroup && (
                        <Input
                            label="New Group Name"
                            value={newGroupName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)}
                            className="mt-2"
                            autoFocus
                        />
                    )}
                </div>
            </div>

          <QuestScheduling value={formData} onChange={handleScheduleChange} />

          {formData.type === QuestType.Journey && (
            <div className="pt-4 border-t border-stone-700/60">
                <h3 className="font-semibold text-lg text-stone-200 mb-2">Journey Checkpoints</h3>
                <p className="text-sm text-stone-400 mb-3">
                    A Journey is a multi-step quest. Manage its checkpoints here.
                </p>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsJourneyEditorOpen(true)}
                    className="w-full"
                >
                    Manage Checkpoints ({formData.checkpoints?.length || 0})
                </Button>
            </div>
          )}
          
           <div className="flex justify-between items-center">
             <h3 className="font-semibold text-lg text-stone-200">Approval</h3>
            <ToggleSwitch enabled={formData.requiresApproval} setEnabled={(val: boolean) => setFormData(p => ({...p, requiresApproval: val}))} label="Requires Approval" />
          </div>
          
          {(formData.type === QuestType.Venture || formData.type === QuestType.Journey) && (
              <div className="pt-4 border-t border-stone-700/60">
                <h3 className="font-semibold text-lg text-stone-200 mb-2">Claiming</h3>
                 <ToggleSwitch enabled={formData.requiresClaim ?? false} setEnabled={(val: boolean) => setFormData(p => ({...p, requiresClaim: val}))} label="Requires Claim Before Starting" />
                 {formData.requiresClaim && (
                      <div className="pl-6 mt-2">
                         <Input label="Claim Limit" type="number" min="1" value={formData.claimLimit ?? 1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({...p, claimLimit: parseInt(e.target.value) || 1}))} />
                      </div>
                 )}
              </div>
          )}

           <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg text-stone-200">Conditionally Active</h3>
                <ToggleSwitch 
                    enabled={formData.conditionSetIds !== undefined} 
                    setEnabled={(val: boolean) => setFormData(p => ({...p, conditionSetIds: val ? (p.conditionSetIds || []) : undefined}))} 
                    label="Enable Conditions" 
                />
                 {formData.conditionSetIds !== undefined && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {allConditionSets.map(set => (
                          <label key={set.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                              <input 
                                  type="checkbox"
                                  checked={formData.conditionSetIds?.includes(set.id)}
                                  onChange={() => handleConditionSetToggle(set.id)}
                                  className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                              <div>
                                  <span className="text-sm font-semibold text-stone-200">{set.name}</span>
                                  <p className="text-xs text-stone-400">{set.description}</p>
                              </div>
                          </label>
                      ))}
                      {allConditionSets.length === 0 && (
                          <p className="text-xs text-stone-500 text-center">No Condition Sets have been created yet. You can create them in Settings.</p>
                      )}
                  </div>
                )}
            </div>

          {hasDeadlines && (
            <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg text-stone-200">Time-based {settings.terminology.negativePoints}</h3>
              <p className="text-sm text-stone-400 -mt-2">Assign {settings.terminology.negativePoints.toLowerCase()} for being late or incomplete.</p>
              <RewardInputGroup category='lateSetbacks' items={formData.lateSetbacks} onChange={handleRewardChange('lateSetbacks')} onAdd={handleAddRewardForCategory('lateSetbacks')} onRemove={handleRemoveReward('lateSetbacks')} />
              <RewardInputGroup category='incompleteSetbacks' items={formData.incompleteSetbacks} onChange={handleRewardChange('incompleteSetbacks')} onAdd={handleAddRewardForCategory('incompleteSetbacks')} onRemove={handleRemoveReward('incompleteSetbacks')} />
            </div>
          )}

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
                        {onTryAgain && (
                            <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                                {isGenerating ? 'Generating...' : 'Try Again'}
                            </Button>
                        )}
                        <Button type="submit" form="quest-form">Create Quest</Button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="quest-form">{mode === 'edit' ? 'Save Changes' : `Create ${settings.terminology.task}`}</Button>
                </div>
            )}
        </div>
      </div>
    </div>
    {isGalleryOpen && (
      <ImageSelectionDialog 
        onSelect={(url: string) => {
          setFormData(p => ({...p, imageUrl: url}));
          setIsGalleryOpen(false);
        }}
        onClose={() => setIsGalleryOpen(false)}
      />
    )}
    {isJourneyEditorOpen && (
        <EditJourneyDialog
            questTitle={formData.title || 'New Journey'}
            initialCheckpoints={formData.checkpoints || []}
            onSave={(updatedCheckpoints: Checkpoint[]) => {
                setFormData(p => ({ ...p, checkpoints: updatedCheckpoints }));
                setIsJourneyEditorOpen(false);
            }}
            onClose={() => setIsJourneyEditorOpen(false)}
        />
    )}
    {isMediaBrowserOpen && (
        <MediaBrowserDialog
            onSelect={handleMediaSelect}
            onClose={() => setIsMediaBrowserOpen(false)}
        />
    )}
    </>
  );
};

export default CreateQuestDialog;
