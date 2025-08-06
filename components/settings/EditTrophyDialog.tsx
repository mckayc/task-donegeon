import React, { useState, useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Trophy, TrophyRequirement, TrophyRequirementType, QuestType } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import ToggleSwitch from '@/components/ui/toggle-switch';
import EmojiPicker from '@/components/ui/emoji-picker';
import ImageSelectionDialog from '@/components/ui/image-selection-dialog';
import DynamicIcon from '@/components/ui/dynamic-icon';
import { X } from 'lucide-react';

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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                <Select onValueChange={(value: string) => handleRequirementChange(index, 'value', value)} defaultValue={req.value}>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={QuestType.Duty}>Duty</SelectItem>
                        <SelectItem value={QuestType.Venture}>Venture</SelectItem>
                    </SelectContent>
                </Select>
            );
        case TrophyRequirementType.AchieveRank:
             return (
                <Select onValueChange={(value: string) => handleRequirementChange(index, 'value', value)} defaultValue={req.value}>
                    <SelectTrigger><SelectValue placeholder="Select rank..." /></SelectTrigger>
                    <SelectContent>
                        {[...ranks].sort((a,b) => a.xpThreshold - b.xpThreshold).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            );
        case TrophyRequirementType.CompleteQuestTag:
            return (
                <Input
                    type="text"
                    list="tags-datalist"
                    placeholder="Enter tag"
                    value={req.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRequirementChange(index, 'value', e.target.value)}
                    required
                />
            );
        default:
            return <Input type="text" placeholder="Value" value={req.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRequirementChange(index, 'value', e.target.value)} required />;
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
             {mode === 'ai-creation' && <DialogDescription>Review and adjust the AI-generated details below.</DialogDescription>}
          </DialogHeader>
          <form id="trophy-form" onSubmit={handleSubmit} className="space-y-4 py-4 overflow-y-auto pr-6">
            <div className="space-y-2">
                <Label htmlFor="trophy-name">Name</Label>
                <Input id="trophy-name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="trophy-desc">Description</Label>
                <Textarea id="trophy-desc" name="description" value={formData.description} onChange={handleChange} />
            </div>
            {/* ... Icon selection logic ... */}
            <ToggleSwitch enabled={!formData.isManual} setEnabled={(val) => setFormData(p => ({...p, isManual: !val}))} label="Automatic Awarding" />
            
            {!formData.isManual && (
                <div className="p-4 bg-background rounded-lg border space-y-3">
                    <h4 className="font-semibold text-foreground">Requirements</h4>
                    {formData.requirements.map((req, i) => (
                        <div key={i} className="p-2 border rounded-md space-y-2">
                           <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRequirement(i)}><X className="w-4 h-4 text-red-400"/></Button></div>
                           <div className="grid grid-cols-2 gap-4">
                                <Select value={req.type} onValueChange={(v: string) => handleRequirementChange(i, 'type', v)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{Object.values(TrophyRequirementType).map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                                </Select>
                                {renderRequirementValueInput(req, i)}
                           </div>
                           <Input type="number" min="1" value={req.count} onChange={(e) => handleRequirementChange(i, 'count', e.target.value)} placeholder="Count" />
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRequirement}>Add Requirement</Button>
                </div>
            )}
          </form>
          <DialogFooter>
             {mode === 'ai-creation' ? (
                 <div className="w-full flex justify-between items-center">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" onClick={onTryAgain} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Try Again'}
                        </Button>
                        <Button type="submit" form="trophy-form">Create Trophy</Button>
                    </div>
                </div>
            ) : (
                 <>
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="trophy-form">{onSave ? 'Save Changes' : (trophy ? 'Save Changes' : 'Create Trophy')}</Button>
                 </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isGalleryOpen && (
        <ImageSelectionDialog 
          onSelect={(url) => {
            setFormData(p => ({...p, imageUrl: url}));
            setIsGalleryOpen(false);
          }}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
      <datalist id="tags-datalist">
        {allTags.map(tag => <option key={tag} value={tag} />)}
      </datalist>
    </>
  );
};

export default EditTrophyDialog;
