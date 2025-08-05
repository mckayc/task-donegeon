
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from './UserFormFields';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose }) => {
  const { users } = useAppState();
  const { updateUser } = useAppDispatch();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    gameName: user.gameName,
    birthday: user.birthday,
    role: user.role,
    pin: user.pin || '',
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

    if (users.some(u => u.id !== user.id && u.username.toLowerCase() === formData.username.toLowerCase())) {
        setError("Username is already taken by another user.");
        return;
    }
    if (users.some(u => u.id !== user.id && u.email.toLowerCase() === formData.email.toLowerCase())) {
        setError("Email is already in use by another user.");
        return;
    }

    const { birthday, ...payload } = formData;
    const updatedPayload = {
      ...payload,
      role: formData.role as Role,
      pin: formData.pin || undefined,
    };
    
    updateUser(user.id, updatedPayload);
    onClose();
  };

  const canChangeRole = user.role !== Role.DonegeonMaster;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Edit {user.gameName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <UserFormFields formData={formData} handleChange={handleChange} isEditMode={true} />
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
              {canChangeRole && <option value={Role.Explorer}>Explorer</option>}
              {canChangeRole && <option value={Role.Gatekeeper}>Gatekeeper</option>}
              {!canChangeRole && <option value={Role.DonegeonMaster}>Donegeon Master</option>}
            </select>
            {!canChangeRole && <p className="text-xs text-stone-400 mt-1">The Donegeon Master's role cannot be changed.</p>}
          </div>
          <div>
            <Input label="PIN (4-10 digits, optional)" id="edit-pin" name="pin" type="text" value={formData.pin} onChange={handleChange} />
            <p className="text-xs text-stone-400 mt-1">A PIN is an easy way for kids to switch profiles securely.</p>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserDialog;
