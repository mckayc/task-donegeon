import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { Role } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';

interface AddUserDialogProps {
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose, onUserAdded }) => {
  const { settings } = useAppState();
  const { users } = useAuthState();
  const { addUser } = useAuthDispatch();
  const { addNotification } = useNotificationsDispatch();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    gameName: '',
    birthday: '',
    role: Role.Explorer,
    pin: '',
    password: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isPasswordRequired = formData.role === Role.DonegeonMaster;

  useEffect(() => {
    if (isPasswordRequired) {
      setShowPasswordFields(true);
    } else {
      setShowPasswordFields(false);
    }
  }, [isPasswordRequired]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        addNotification({ type: 'error', message: 'PIN must be 4-10 numbers.' });
        return;
    }

    if (isPasswordRequired || formData.password) {
        if (formData.password.length < 6) {
            addNotification({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }
    }

    const newUserPayload = {
        ...formData,
        role: formData.role as Role,
        password: formData.password || undefined,
    };
    
    setIsSaving(true);
    const createdUser = await addUser(newUserPayload);
    setIsSaving(false);

    if (createdUser) {
        onUserAdded();
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-accent mb-6">Add New {settings.terminology.group} Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <UserFormFields formData={formData} handleChange={handleChange} />
           
          { (showPasswordFields) ? (
            <div>
              <Input 
                label={`Password ${isPasswordRequired ? '(min 6 characters)' : '(optional, min 6 characters)'}`} 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                required={isPasswordRequired} 
              />
            </div>
          ) : (
            <div className="text-center py-2">
                <button type="button" onClick={() => setShowPasswordFields(true)} className="text-sm font-semibold text-accent hover:opacity-80">
                    + Add optional password
                </button>
            </div>
          )}

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-stone-300 mb-1">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition">
              <option value={Role.Explorer}>{settings.terminology.user}</option>
              <option value={Role.Gatekeeper}>{settings.terminology.moderator}</option>
              <option value={Role.DonegeonMaster}>{settings.terminology.admin}</option>
            </select>
          </div>
          <div>
            <Input 
                label={`PIN (4-10 digits${!settings.security.requirePinForUsers ? ', optional' : ''})`}
                id="pin" 
                name="pin" 
                type="password" 
                value={formData.pin} 
                onChange={handleChange} 
                required={settings.security.requirePinForUsers} 
            />
            <p className="text-xs text-stone-400 mt-1">An easy way for users to switch profiles securely. Can be disabled in Settings.</p>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Member'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserDialog;