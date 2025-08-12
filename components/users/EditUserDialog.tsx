import React, { useState } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { Role, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose, onUserUpdated }) => {
  const { users: allUsers, currentUser } = useAuthState();
  const { updateUser } = useAuthDispatch();
  const { addNotification } = useNotificationsDispatch();
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
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserDialog;
