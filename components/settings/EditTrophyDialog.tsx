import React, { useState, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Trophy, TrophyRequirement, TrophyRequirementType, QuestType } from '../../types';
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
  const { ranks, allTags } = useAppState();
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
    // Reset value if type changes
    if (field === 'type') {
        newRequirements[index].value = '';
    }
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  }

  const handleAddRequirement = () => {
    setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, { type: TrophyRequirementType.CompleteQuestType, value: QuestType.Duty, count: 1}]
    }));
  }
  
  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
        ...prev,
        requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    
    if (onSave) {
      onSave(payload);
      onClose();
      return;
    }
    
    if (trophy && mode === 'edit') {
      updateTrophy({ ...trophy, ...payload });
    } else {
      addTrophy(payload);
    }
    onClose();
  };

  const dialogTitle = trophy ? 'Edit Trophy' : 'Create New Trophy';

  const renderRequirementValueInput = (req: TrophyRequirement, index: number) => {
    switch (req.type) {
        case TrophyRequirementType.CompleteQuestType:
            return (
                <select value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                    <option value={QuestType.Duty}>Duty</option>
                    <option value={QuestType.Venture}>Venture</option>
                </select>
            );
        case TrophyRequirementType.AchieveRank:
             return (
                <select value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                     <option value="" disabled>Select a Rank</option>
                    {[...ranks].sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            );
        case TrophyRequirementType.CompleteQuestTag:
            return (
                <Input
                    type="text"
                    list="tags-datalist"
                    placeholder="Enter tag"
                    value={req.value}
                    onChange={e => handleRequirementChange(index, 'value', e.target.value)}
                    required
                />
            );
        default:
            return <Input type="text" placeholder="Value" value={req.value} onChange={e => handleRequirementChange(index, 'value', e.target.value)} required />;
    }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Trophy Name" 
            id="name"
            name="name"
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
           <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-300 mb-1">Description</label>
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"/>
          </div>
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

        <div className="p-4 bg-stone-900/50 rounded-lg">
            <ToggleSwitch enabled={!formData.isManual} setEnabled={(val) => setFormData(p => ({ ...p, isManual: !val }))} label="Automatic Award" />
            {!formData.isManual && (
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-stone-400">Define the requirements for this trophy to be awarded automatically.</p>
                    {formData.requirements.map((req, index) => (
                        <div key={index} className="p-3 bg-stone-800/50 rounded-md space-y-2">
                             <div className="flex justify-end">
                                <button type="button" onClick={() => handleRemoveRequirement(index)} className="text-red-400 hover:text-red-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <select value={req.type} onChange={e => handleRequirementChange(index, 'type', e.target.value as TrophyRequirementType)} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md">
                                    <option value={TrophyRequirementType.CompleteQuestType}>Complete Quest Type</option>
                                    <option value={TrophyRequirementType.CompleteQuestTag}>Complete Quest w/ Tag</option>
                                    <option value={TrophyRequirementType.AchieveRank}>Achieve Rank</option>
                                </select>
                                {renderRequirementValueInput(req, index)}
                                <Input type="number" value={req.count} min="1" onChange={e => handleRequirementChange(index, 'count', e.target.value)} />
                            </div>
                        </div>
                    ))}
                    <datalist id="tags-datalist">
                        {allTags.map(tag => <option key={tag} value={tag} />)}
                    </datalist>
                    <Button type="button" variant="secondary" onClick={handleAddRequirement} className="text-sm py-1 px-3">+ Add Requirement</Button>
                </div>
            )}
        </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            {mode === 'ai-creation' ? (
                 <div className="w-full flex justify-between items-center">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="secondary" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit">Create Trophy</Button>
                    </div>
                </div>
            ) : (
                 <>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">{onSave ? 'Save Changes' : (trophy ? 'Save Changes' : 'Create Trophy')}</Button>
                 </>
            )}
          </div>
        </form>
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