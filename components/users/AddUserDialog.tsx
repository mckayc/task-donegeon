
import React, { useState } from 'react';
import { useAuth, useAuthDispatch } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Role } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from './UserFormFields';

interface AddUserDialogProps {
  onClose: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose }) => {
  const { users } = useAuth();
  const { settings } = useSettings();
  const { addUser } = useAuthDispatch();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        setError('PIN must be 4-10 numbers.');
        return;
    }
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
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
        pin: formData.pin || undefined,
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
           <div>
            <Input label="Password (min 6 characters)" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-stone-300 mb-1">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition">
              <option value={Role.Explorer}>{settings.terminology.user}</option>
              <option value={Role.Gatekeeper}>{settings.terminology.moderator}</option>
            </select>
          </div>
          <div>
            <Input label="PIN (4-10 digits, optional)" id="pin" name="pin" type="text" value={formData.pin} onChange={handleChange} />
            <p className="text-xs text-stone-400 mt-1">A PIN is an easy way for kids to switch profiles securely.</p>
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
