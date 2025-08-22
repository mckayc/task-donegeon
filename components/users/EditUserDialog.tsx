import React, { useState } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Role, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { SparklesIcon } from '../user-interface/Icons';
import { GenerateContentResponse } from '@google/genai';
import { useSystemState } from '../../context/SystemContext';
import { logger } from '../../utils/logger';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose, onUserUpdated }) => {
  const { users: allUsers, currentUser } = useAuthState();
  const { updateUser } = useAuthDispatch();
  const { addNotification } = useNotificationsDispatch();
  const { isAiConfigured } = useSystemState();
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
    password: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestGameName = async () => {
    setIsSuggesting(true);
    const { firstName, lastName, birthday, adminNotes } = formData;
    const prompt = `Based on the following user details, suggest a creative, fantasy-themed adjective for a game name. The format will be "${firstName} the [Adjective]". Details: First Name: ${firstName}, Last Name: ${lastName}, Birthday: ${birthday}, Admin Notes about user: ${adminNotes}. Return ONLY the suggested adjective as a single string, without any quotation marks or extra text.`;
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', prompt })
      });
      if (!response.ok) throw new Error('Failed to get suggestion from AI.');
      const result: GenerateContentResponse = await response.json();
      const suggestedAdjective = (result.text || '').trim().replace(/"/g, '');
      if (suggestedAdjective) {
        const suggestedName = `${firstName} the ${suggestedAdjective}`;
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
    logger.log('[EditUserDialog] Submitting user update.', { userId: user.id, gameName: formData.gameName });

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        addNotification({ type: 'error', message: 'PIN must be 4-10 numbers.'});
        return;
    }

    if (formData.password) {
        if (formData.password.length < 6) {
            addNotification({ type: 'error', message: 'New password must be at least 6 characters long.' });
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            addNotification({ type: 'error', message: "Passwords do not match." });
            return;
        }
    }

    const payload: Partial<User> = {};
    
    const fieldsToCompare: (keyof typeof formData)[] = [
        'firstName', 'lastName', 'username', 'email', 'gameName', 'birthday',
        'role', 'aboutMe', 'adminNotes', 'pin'
    ];
    
    fieldsToCompare.forEach(key => {
        const formValue = formData[key];
        const userValue = user[key as keyof User] || ''; // Handle optional fields
        if (formValue !== userValue) {
            (payload as any)[key] = formValue;
        }
    });

    if (formData.password) {
        payload.password = formData.password;
    }

    if (Object.keys(payload).length === 0) {
        addNotification({ type: 'info', message: 'No changes were made.' });
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
  const canHavePassword = user.role === Role.DonegeonMaster || user.role === Role.Gatekeeper;

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
          {canHavePassword && (
              <div className="pt-4 border-t border-stone-700/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="New Password (optional)" name="password" type="password" value={formData.password} onChange={handleChange} />
                  <Input label="Confirm New Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={!formData.password} />
                </div>
                <p className="text-xs text-stone-400 mt-1">Leave blank to keep the current password.</p>
              </div>
          )}
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