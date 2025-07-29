import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role } from '../../frontendTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from './UserFormFields';

interface AddUserDialogProps {
  onClose: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose }) => {
  const { users, settings } = useAppState();
  const { addUser } = useAppDispatch();
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
  const [error, setError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isPasswordRequired = formData.role === Role.DonegeonMaster;

  useEffect(() => {
    if (isPasswordRequired) {
      setShowPasswordFields(true);
    } else {
      // If user switches away from DM, hide the optional password field again for a cleaner form
      setShowPasswordFields(false);
    }
  }, [isPasswordRequired]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isPinRequired = settings.security.requirePinForUsers;
    if (isPinRequired && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        setError('PIN must be 4-10 numbers.');
        return;
    }

    if (isPasswordRequired || formData.password) {
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
    }

    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        setError("Username is already taken.");
        return;
    }
    if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
        setError("Email is already in use.");
        return;
    }

    const newUserPayload = {
        ...formData,
        role: formData.role as Role,
        pin: formData.pin, // PIN can be an empty string if not required
        password: formData.password || undefined,
    };

    addUser(newUserPayload);
    onClose();
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
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserDialog;