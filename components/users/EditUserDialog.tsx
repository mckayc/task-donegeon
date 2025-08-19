import React, { useState } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Role, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useData } from '../../context/DataProvider';
import { SparklesIcon } from '../user-interface/Icons';
import { GenerateContentResponse } from '@google/genai';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose, onUserUpdated }) => {
  const { users: allUsers, currentUser } = useAuthState();
  const { updateUser } = useAuthDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { isAiConfigured } = useData();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    gameName: user.gameName,
    birthday: user.birthday,
    role: user.role,
    aboutMe: user.aboutMe || '',
    adminNotes: user.adminNotes || '',
    pin: user.pin || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestGameName = async () => {
    setIsSuggesting(true);
    const { firstName, lastName, birthday, adminNotes } = formData;
    const prompt = `Based on the following user details, suggest a single, creative, fantasy-themed game name. The name should be cool and inspiring. Details: First Name: ${firstName}, Last Name: ${lastName}, Birthday: ${birthday}, Admin Notes about user: ${adminNotes}. Return ONLY the suggested name as a single string, without any quotation marks or extra text.`;
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt })
      });
      if (!response.ok) throw new Error('Failed to get suggestion from AI.');
      const result: GenerateContentResponse = await response.json();
      const suggestedName = result.text.trim().replace(/"/g, '');
      if (suggestedName) {
        setFormData(p => ({ ...p, gameName: suggestedName }));
      }
    } catch (error) {
      addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Could not generate name.' });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        addNotification({ type: 'error', message: 'PIN must be 4-10 numbers.'});
        return;
    }

    const payload: Partial<User> = {};
    Object.keys(formData).forEach(key => {
        const typedKey = key as keyof typeof formData;
        // Compare with the original user object to find changes
        if (formData[typedKey] !== (user as any)[typedKey]) {
            (payload as any)[typedKey] = formData[typedKey];
        }
    });

    if (Object.keys(payload).length === 0) {
        onClose();
        return;
    }
    
    setIsSaving(true);
    await updateUser(user.id, payload);
    setIsSaving(false);
    onUserUpdated();
    onClose();
  };

  const donegeonMasters = allUsers.filter(u => u.role === Role.DonegeonMaster);
  const isLastDonegeonMaster = user.role === Role.DonegeonMaster && donegeonMasters.length === 1;
  const canChangeRole = currentUser?.role === Role.DonegeonMaster && !isLastDonegeonMaster;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Edit {user.gameName}</h2>
        <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <UserFormFields formData={formData} handleChange={handleChange} isEditMode={true} />
          <Input as="textarea" label="Admin Notes (Private)" name="adminNotes" value={formData.adminNotes} onChange={handleChange} />
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-stone-300 mb-1">Role</label>
            <select 
                id="edit-role" 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md disabled:opacity-50"
                disabled={!canChangeRole}
            >
              <option value={Role.Explorer}>Explorer</option>
              <option value={Role.Gatekeeper}>Gatekeeper</option>
              <option value={Role.DonegeonMaster}>Donegeon Master</option>
            </select>
            {!canChangeRole && <p className="text-xs text-stone-400 mt-1">The last Donegeon Master's role cannot be changed.</p>}
          </div>
          <div>
            <Input label="PIN (4-10 digits, optional)" id="edit-pin" name="pin" type="password" value={formData.pin} onChange={handleChange} />
            <p className="text-xs text-stone-400 mt-1">A PIN is an easy way for kids to switch profiles securely.</p>
          </div>
          <div className="pt-4 border-t border-stone-700/60">
            <label htmlFor="gameName" className="block text-sm font-medium text-stone-300 mb-1">Game Name (Nickname)</label>
            <div className="flex items-center gap-2">
              <Input id="gameName" name="gameName" value={formData.gameName} onChange={handleChange} required className="flex-grow" />
              {isAiConfigured && (
                <Button type="button" variant="secondary" onClick={handleSuggestGameName} disabled={isSuggesting} className="h-10 px-3">
                  <SparklesIcon className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </form>
         <div className="flex justify-end space-x-4 pt-4 mt-auto">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="edit-user-form" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserDialog;