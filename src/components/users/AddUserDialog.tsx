import React, { useState } from 'react';
import { useAuthDispatch, useAuthState } from '../../context/AuthContext';
import { Role } from '../users/types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { SparklesIcon } from '../user-interface/Icons';
import { GenerateContentResponse } from '@google/genai';
import { useSystemState } from '../../context/SystemContext';
import { logger } from '../../utils/logger';

interface AddUserDialogProps {
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose, onUserAdded }) => {
  const { addUser } = useAuthDispatch();
  const { users } = useAuthState();
  const { addNotification } = useNotificationsDispatch();
  const { isAiConfigured } = useSystemState();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    gameName: '',
    email: '',
    birthday: '',
    role: Role.Explorer,
    aboutMe: '',
    adminNotes: '',
    password: '',
    confirmPassword: '',
    pin: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestGameName = async () => {
    setIsSuggesting(true);
    logger.log('[AddUserDialog] Requesting AI game name suggestion');
    const { firstName, lastName, birthday, adminNotes } = formData;
    if (!firstName.trim()) {
        addNotification({ type: 'error', message: 'Please enter a first name before suggesting a game name.' });
        setIsSuggesting(false);
        return;
    }
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
        logger.log('[AddUserDialog] AI suggestion received', { suggestedName });
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
    logger.log('[AddUserDialog] Attempting to add new user', { username: formData.username, role: formData.role });
    
    if (formData.password && formData.password !== formData.confirmPassword) {
        addNotification({ type: 'error', message: "Passwords do not match." });
        return;
    }
    if (formData.password && formData.password.length < 6) {
        addNotification({ type: 'error', message: "Password must be at least 6 characters long." });
        return;
    }
    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        addNotification({ type: 'error', message: 'PIN must be 4-10 numbers.' });
        return;
    }
    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        addNotification({ type: 'error', message: "Username is already taken." });
        return;
    }
    if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
        addNotification({ type: 'error', message: "Email is already in use." });
        return;
    }

    setIsSaving(true);

    const { confirmPassword, ...newUserPayload } = formData;
    const result = await addUser({
        ...newUserPayload,
        password: newUserPayload.password || undefined
    });
    
    setIsSaving(false);

    if (result) {
        addNotification({ type: 'success', message: `User "${result.gameName}" created successfully.` });
        onUserAdded();
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Add New Member</h2>
        <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
          <UserFormFields formData={formData} handleChange={handleChange} />
          <Input as="textarea" label="Admin Notes (Private)" name="adminNotes" value={formData.adminNotes} onChange={handleChange} placeholder="Notes for AI personalization..." />
          <Input as="select" label="Role" name="role" value={formData.role} onChange={handleChange}>
              <option value={Role.Explorer}>Explorer</option>
              <option value={Role.Gatekeeper}>Gatekeeper</option>
              <option value={Role.DonegeonMaster}>Donegeon Master</option>
          </Input>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Password (optional)" name="password" type="password" value={formData.password} onChange={handleChange} />
            <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={!formData.password} />
          </div>
          <Input label="PIN (optional, 4-10 digits)" name="pin" type="password" value={formData.pin} onChange={handleChange} />
          
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
            <Button type="submit" form="add-user-form" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add Member'}</Button>
        </div>
      </div>
    </div>
  );
};

export default AddUserDialog;