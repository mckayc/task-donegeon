import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from './UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface AddUserDialogProps {
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose, onUserAdded }) => {
  const { addUser } = useAppDispatch();
  const { users } = useAppState();
  const { addNotification } = useNotificationsDispatch();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    gameName: '',
    email: '',
    birthday: '',
    role: Role.Explorer,
    password: '',
    confirmPassword: '',
    pin: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
