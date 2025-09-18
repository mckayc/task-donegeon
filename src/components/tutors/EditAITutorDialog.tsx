import React, { useState, useEffect } from 'react';
import { AITutor, AITutorStyle } from './types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import EmojiPicker from '../user-interface/EmojiPicker';
import NumberInput from '../user-interface/NumberInput';
import { useSystemDispatch } from '../../context/SystemContext';
import { PlusIcon, TrashIcon } from '../user-interface/Icons';

interface EditAITutorDialogProps {
  tutorToEdit: AITutor | null;
  onClose: () => void;
}

const EditAITutorDialog: React.FC<EditAITutorDialogProps> = ({ tutorToEdit, onClose }) => {
  // FIX: Access `addAITutor` and `updateAITutor` from system dispatch.
  const { addAITutor, updateAITutor } = useSystemDispatch();
  const [formData, setFormData] = useState({
    name: '',
    icon: '🤖',
    subject: '',
    targetAgeGroup: '',
    sessionMinutes: 15,
    style: AITutorStyle.EncouragingCoach,
    customPersona: '',
    sampleQuestions: [''],
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (tutorToEdit) {
      setFormData({
        name: tutorToEdit.name,
        icon: tutorToEdit.icon,
        subject: tutorToEdit.subject,
        targetAgeGroup: tutorToEdit.targetAgeGroup,
        sessionMinutes: tutorToEdit.sessionMinutes,
        style: tutorToEdit.style,
        customPersona: tutorToEdit.customPersona || '',
        sampleQuestions: tutorToEdit.sampleQuestions.length > 0 ? tutorToEdit.sampleQuestions : [''],
      });
    }
  }, [tutorToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };
  
  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...formData.sampleQuestions];
    newQuestions[index] = value;
    setFormData(p => ({ ...p, sampleQuestions: newQuestions }));
  };

  const addQuestion = () => {
    setFormData(p => ({ ...p, sampleQuestions: [...p.sampleQuestions, ''] }));
  };

  const removeQuestion = (index: number) => {
    if (formData.sampleQuestions.length <= 1) {
        setFormData(p => ({...p, sampleQuestions: ['']}));
    } else {
        setFormData(p => ({ ...p, sampleQuestions: p.sampleQuestions.filter((_, i) => i !== index) }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        customPersona: formData.style === AITutorStyle.Custom ? formData.customPersona : undefined,
        sampleQuestions: formData.sampleQuestions.map(q => q.trim()).filter(q => q),
    };
    if (tutorToEdit) {
      updateAITutor({ ...tutorToEdit, ...finalData });
    } else {
      addAITutor(finalData);
    }
    onClose();
  };

  const dialogTitle = tutorToEdit ? `Edit ${tutorToEdit.name}` : 'Create New AI Tutor';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form id="tutor-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
            <div className="flex items-end gap-4">
                <div className="relative">
                    <label className="block text-sm font-medium text-stone-300 mb-1">Icon</label>
                    <button type="button" onClick={() => setIsEmojiPickerOpen(p => !p)} className="w-16 h-11 text-2xl p-1 rounded-md bg-stone-700 hover:bg-stone-600 flex items-center justify-center">
                        {formData.icon}
                    </button>
                    {isEmojiPickerOpen && <EmojiPicker onSelect={emoji => { setFormData(p => ({...p, icon: emoji})); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />}
                </div>
                <Input label="Tutor Name" name="name" value={formData.name} onChange={handleChange} required className="flex-grow"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g., Math, History" required />
                <Input label="Target Age Group" name="targetAgeGroup" value={formData.targetAgeGroup} onChange={handleChange} placeholder="e.g., 5-7 years old"/>
            </div>
            
            <div className="p-4 bg-stone-900/50 rounded-lg space-y-4">
                <NumberInput 
                    label="Tutor Session Time (Minutes)"
                    value={formData.sessionMinutes}
                    onChange={(val) => setFormData(p => ({ ...p, sessionMinutes: val }))}
                    min={1}
                />
                <Input as="select" label="Tutor Style" name="style" value={formData.style} onChange={handleChange}>
                    {Object.values(AITutorStyle).map(style => <option key={style} value={style}>{style}</option>)}
                </Input>
                {formData.style === AITutorStyle.Custom && (
                    <Input as="textarea" label="Custom Persona" name="customPersona" value={formData.customPersona} onChange={handleChange} placeholder="Describe the tutor's personality, e.g., 'Acts like a funny pirate captain who loves astronomy.'" rows={3} />
                )}
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-700/60">
                 <h3 className="font-semibold text-stone-200">Sample Questions</h3>
                 <p className="text-xs text-stone-400 -mt-2 mb-2">Provide a few sample questions the AI can use as a baseline for generating more.</p>
                {formData.sampleQuestions.map((q, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input value={q} onChange={(e) => handleQuestionChange(index, e.target.value)} placeholder={`Question ${index + 1}`} className="flex-grow" />
                        <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => removeQuestion(index)}>
                            <TrashIcon className="w-4 h-4"/>
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={addQuestion} className="w-full justify-center">
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Question
                </Button>
            </div>
          
        </form>
        <div className="flex justify-end space-x-4 pt-4 mt-auto">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="tutor-form">{tutorToEdit ? 'Save Changes' : 'Create Tutor'}</Button>
        </div>
      </div>
    </div>
  );
};

export default EditAITutorDialog;