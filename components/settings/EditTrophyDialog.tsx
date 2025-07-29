import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Trophy, TrophyRequirement, TrophyRequirementType, QuestType, RewardTypeDefinition } from '../../frontendTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import EmojiPicker from '../ui/EmojiPicker';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';
import DynamicIcon from '../ui/DynamicIcon';

interface EditTrophyDialogProps {
  trophy: Trophy | null;
  initialData?: { name: string; description: string; icon: string; };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'ai-creation';
  onTryAgain?: () => void;
  isGenerating?: boolean;
  onSave?: (updatedData: any) => void;
}

const EditTrophyDialog: React.FC<EditTrophyDialogProps> = ({ trophy, initialData, onClose, mode = (trophy ? 'edit' : 'create'), onTryAgain, isGenerating, onSave }) => {
  const { ranks, allTags, rewardTypes } = useAppState();
  const { addTrophy, updateTrophy } = useAppDispatch();

  const getInitialFormData = useCallback(() => {
    const data = trophy || initialData;
    if (mode !== 'create' && data) {
      const d = data as Partial<Trophy> & { name: string; description: string; icon: string; };
      return {
        name: d.name,
        description: d.description,
        iconType: d.iconType || 'emoji' as 'emoji' | 'image',
        icon: d.icon,
        imageUrl: d.imageUrl || '',
        isManual: typeof d.isManual === 'boolean' ? d.isManual : true,
        requirements: [...(d.requirements || [])]
      };
    }
    // For create or ai-creation
    return {
      name: initialData?.name || '',
      description: initialData?.description || '',
      iconType: 'emoji' as 'emoji' | 'image',
      icon: initialData?.icon || '🏆',
      imageUrl: '',
      isManual: true,
      requirements: [] as TrophyRequirement[]
    };
  }, [trophy, initialData, mode]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [initialData, getInitialFormData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequirementChange = (index: number, field: keyof TrophyRequirement, value: any) => {
    const newRequirements = [...formData.requirements];
    if (field === 'count') {
        newRequirements[index] = { ...newRequirements[index], [field]: Math.max(1, parseInt(value)) };
    } else {
        newRequirements[index] = { ...newRequirements[index], [field]: value };
    }
    // Reset value if type changes to prevent invalid states
    if (field === 'type') {
        const newType = value as TrophyRequirementType;
        let defaultValue = '';
        if (newType === TrophyRequirementType.CompleteQuestType) defaultValue = QuestType.Duty;
        if (newType === TrophyRequirementType.AchieveRank) defaultValue = ranks[0]?.id || '';
        if (newType === TrophyRequirementType.EarnTotalReward) defaultValue = rewardTypes.find(rt => rt.isCore)?.id || '';
        newRequirements[index].value = defaultValue;
    }
    setFormData(p => ({ ...p, requirements: newRequirements }));
  };
  
  const addRequirement = () => {
    const newRequirement: TrophyRequirement = { type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1 };
    setFormData(p => ({ ...p, requirements: [...p.requirements, newRequirement] }));
  };
  
  const removeRequirement = (index: number) => {
    setFormData(p => ({ ...p, requirements: p.requirements.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
        name: formData.name,
        description: formData.description,
        iconType: formData.iconType,
        icon: formData.icon,
        imageUrl: formData.imageUrl,
        isManual: formData.isManual,
        requirements: formData.isManual ? [] : formData.requirements.filter(r => r.value && r.count > 0)
    };
    
    if (onSave) {
        onSave(payload);
        onClose();
        return;
    }

    if (trophy && mode === 'edit') {
        updateTrophy({ ...trophy, ...payload });
    } else {
        addTrophy(payload as Omit<Trophy, 'id'>);
    }
    onClose();
  };
  
  const renderRequirementValueInput = (req: TrophyRequirement, index: number) => {
    switch (req.type) {
        case TrophyRequirementType.CompleteQuestType:
            return <Input as="select" label="Quest Type" value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)}>
                <option value={QuestType.Duty}>Duty</option>
                <option value={QuestType.Venture}>Venture</option>
            </Input>;
        case TrophyRequirementType.AchieveRank:
            return <Input as="select" label="Rank" value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)}>
                {ranks.sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Input>;
        case TrophyRequirementType.CompleteQuestTag:
            return <Input label="Tag" value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)} placeholder="Enter tag..." />;
        case TrophyRequirementType.EarnTotalReward:
             return <Input as="select" label="Reward Type" value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)}>
                {rewardTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </Input>;
        default: return null;
    }
  };

  const dialogTitle = mode === 'edit' ? 'Edit Trophy' : 'Create New Trophy';

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-emerald-400">{dialogTitle}</h2>
            {mode === 'ai-creation' && <p className="text-stone-400 mt-1">Review and adjust the AI-generated details below.</p>}
        </div>
        
        <form id="trophy-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
          <Input label="Trophy Name" name="name" value={formData.name} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Icon Type</label>
            <div className="flex gap-4 p-2 bg-stone-700/50 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="emoji" name="iconType" checked={formData.iconType === 'emoji'} onChange={() => setFormData(p => ({...p, iconType: 'emoji'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500"/> <span>Emoji</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="image" name="iconType" checked={formData.iconType === 'image'} onChange={() => setFormData(p => ({...p, iconType: 'image'}))} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500" /> <span>Image</span></label>
            </div>
          </div>
          {formData.iconType === 'emoji' ? (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Icon (Emoji)</label>
              <div className="relative">
                <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} className="w-full text-left px-4 py-2 bg-stone-700 border border-stone-600 rounded-md flex items-center gap-2">
                    <span className="text-2xl">{formData.icon}</span><span className="text-stone-300">Click to change</span>
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
              <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="How is this trophy earned?"
                  className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
          </div>
          
          <ToggleSwitch enabled={formData.isManual} setEnabled={val => setFormData(p => ({ ...p, isManual: val }))} label="Manual Award Only" />
          
          {!formData.isManual && (
              <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                  <h4 className="font-semibold text-stone-200">Automatic Award Requirements</h4>
                  {formData.requirements.map((req, index) => (
                      <div key={index} className="p-3 bg-stone-800/50 rounded-md space-y-2 border border-stone-700/60">
                          <div className="flex justify-end">
                            <button type="button" onClick={() => removeRequirement(index)} className="text-red-400 hover:text-red-300">&times;</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input as="select" label="Requirement Type" value={req.type} onChange={e => handleRequirementChange(index, 'type', e.target.value)}>
                                {Object.entries(TrophyRequirementType).map(([key, value]) => <option key={key} value={value}>{key.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                            </Input>
                            {renderRequirementValueInput(req, index)}
                          </div>
                          <Input label="Required Count" type="number" min="1" value={req.count} onChange={e => handleRequirementChange(index, 'count', e.target.value)} />
                      </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={addRequirement} className="text-sm py-1 px-2">+ Add Requirement</Button>
              </div>
          )}
        </form>
        
        <div className="p-6 border-t border-stone-700/60">
            {mode === 'ai-creation' ? (
                <div className="flex justify-between items-center">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit" form="trophy-form">Create Trophy</Button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="trophy-form">{onSave ? 'Save Changes' : (trophy ? 'Save Changes' : 'Create Trophy')}</Button>
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

export default EditTrophyDialog;